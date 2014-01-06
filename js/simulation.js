/* Simulator Object 

This represents a Simulation instance that includes a reference to a field, 
and a robot. This will be the interface by which the outside world starts 
and stops the robot.

*/
define(['ast/compiler'],
function(Compiler) {

	function Simulation(field, robot, programAST) {

		var _playingField = field;
		var _robot = robot;
		var _programAST = programAST;
		var _program;

		if (!field || !robot) {
			console.error("Must specify Field and Robot!");
			return;
		}

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

		function _robotSetSpeedImplementation(speed) {
			_robot.speed = speed;
		}

		function _robotSetRotationImpl(rotSpeed) {
			_robot.rotationalSpeed = rotSpeed;
		}

		function _getTimeImpl() {
			return (new Date()).getTime();
		}

		function _getFrontDistance() {
			var sensor = _robot.getSensor(0);
			return sensor.getValue();
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
				name: 'getTime',
				retType: 'int',
				parameters: [],
				implementation: _getTimeImpl
			},
			{
				name: 'Robot~setSpeed',
				retType: 'void',
				parameters: [{
					varType: 'double',
					name: 'speed'
				}],
				implementation: _robotSetSpeedImplementation
			},
			{
				name: 'Robot~setTurnSpeed',
				retType: 'void',
				parameters: [{
					varType: 'double',
					name: 'rotSpeed'
				}],
				implementation: _robotSetRotationImpl
			},
			{
				name: 'Robot~getFrontDistance',
				retType: 'double',
				parameters: [],
				implementation: _getFrontDistance
			}
		];

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

			_robot.processTick(deltaTime);

			_lastTime = currTime;
		}

		function _stopSimulation() {
			if (_timerToken) {
				clearInterval(_timerToken);
				_timerToken = null;
				_isRunning = false;
				_fireEvent('runStateChanged', false);
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

			_program = Compiler.compile(ast, builtInFunctions);
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