/* Simulator Object 

This represents a Simulation instance that includes a reference to a field, 
and a robot. This will be the interface by which the outside world starts 
and stops the robot.

*/
define(['ast/compiler', 'linklibs/core', 'linklibs/math',
	'sensors/rangefinder', 'sensors/gyro'],
function(Compiler, CoreLib, MathLib, RangeFinder, Gyro) {

	function Simulation(programAST) {

		var _programAST = programAST;
		var _program;

		// HACK ALERT
		// For this demo, we really just have the one sensor
		// the frontRangefinder

		var sensorImpls = {
			rangeFinder: function() {
				// TODO Pick up the reading from the analog input and return it
				return 0.5;
			}
		};


		//==== End sensor set up ====

		//Store the last timestamp we got (for use during ticks);
		var _lastTime;

		var _isRunning = false;
		var _timerToken;

		var _eventHandlers = {};

		Object.defineProperty(this, "isRunning", {
			get: function() {
				return _isRunning;
			}
		});

		//==== Built in functions for the robot program
		function _printImplementation(str) {
			_fireEvent('simulationOutput', {
				type: 'output',
				message: str
			});
		}

		function _robotSetSpeedImplementation(lSpeed, rSpeed) {
			// TODO This is where we signal the calling
			console.log("Set Speed!");
		}

		var builtInFunctions = [
			{
				name: 'print',
				retType: 'void',
				parameters: [{
					varType: 'string',
					name: 'str'
				}],
				implementation: _printImplementation
			},
			{
				name: 'Robot~drive',
				retType: 'void',
				parameters: [{
					varType: 'double',
					name: 'lSpeed'
				},{
					varType: 'double',
					name: 'rSpeed'
				},],
				implementation: _robotSetSpeedImplementation
			},
			
		];

		var sensorLibs = [];

		//Link in the sensor functions
		//Sensors are accessed via Robot.<sensorname>.getValue()
		for (var sensorName in sensorImpls) {
			sensorLibs.push({
				name: 'Robot~' + sensorName + '~getValue',
				retType: 'double',
				parameters: [],
				implementation: sensorImpls[sensorName]
			});
		}

		//Link in libraries
		builtInFunctions = builtInFunctions.concat(CoreLib);
		builtInFunctions = builtInFunctions.concat(MathLib);

		//==== Startup routines ====
		// set up the event handler for the robot


		//This is the function that does the actual timing stuff
		function _doTimerTick() {
			var currTime = (new Date()).getTime();
			var deltaTime = currTime - _lastTime;

			//Execute codeblock
			if (_program && _program.hasNextStatement()) {
				_program.executeNextBlock();
			}
			else {
				_fireEvent('simulationComplete', {
					message: 'Program has terminated'
				});
				_stopSimulation();
				return;
			}

			_lastTime = currTime;
		}

		function _stopSimulation() {
			if (_timerToken) {
				clearInterval(_timerToken);
				_timerToken = null;
				_isRunning = false;
				_fireEvent('runStateChanged', false);

				// TODO Send STOP command to motors
			}
		}

		this.start = function() {
			if (!_program) {
				_fireEvent('simulationError', {
					message: 'No program has been loaded'
				});
				return;
			}

			if (!_isRunning) {
				_lastTime = (new Date()).getTime();
				_timerToken = setInterval(_doTimerTick, 10);
				_isRunning = true;
				_fireEvent('runStateChanged', true);
			}
		};

		this.stop = _stopSimulation;

		this.loadProgramAST = function(ast) {
			//This will load and compile
			_programAST = ast;

			_program = Compiler.compile(ast, builtInFunctions.concat(sensorLibs));
		}

		this.reset = function() {
			if (_program) {
				_program.reset();
			}
		};

		this.addEventHandler = function (event, callback) {
			var handlers = _eventHandlers[event];
			if (!handlers) {
				handlers = [];
				_eventHandlers[event] = handlers;
			}

			handlers.push(callback);
		};

		function _fireEvent (event, data) {
			var handlers = _eventHandlers[event];
			if (handlers) {
				for (var i = 0, len = handlers.length; i < len; i++) {
					var callback = handlers[i];
					callback(data);
				}
			}
		}
	}

	return Simulation;
});