/* Simulator Object 

This represents a Simulation instance that includes a reference to a field, 
and a robot. This will be the interface by which the outside world starts 
and stops the robot.

*/
define(['ast/compiler', 'linklibs/core', 'linklibs/math',
	'sensors/rangefinder', 'sensors/gyro'],
function(Compiler, CoreLib, MathLib, RangeFinder, Gyro) {

	function Simulation(field, robot, sensors, programAST) {

		var _playingField = field;
		var _robot = robot;
		var _programAST = programAST;
		var _program;

		if (!field || !robot) {
			console.error("Must specify Field and Robot!");
			return;
		}

		var sensorImpls = {};

		function generateSensorImp(sensorIdx) {
			function _sensorImpl() {
				var sensor = _robot.getSensor(sensorIdx);
				return sensor.getValue();
			}

			return _sensorImpl;
		}

		//==== Set up the sensors that we need ====
		for (var i = 0, len = sensors.length; i < len; i++) {
			var sensor = sensors[i];
			//add the sensor to the robot
			var realSensor;
			if (sensor.type === 'RangeFinder') {
				realSensor = new RangeFinder();
			}
			else if (sensor.type === 'Gyro') {
				realSensor = new Gyro();
			}

			if (realSensor) {
				sensor.realSensor = realSensor;
				robot.addSensor(realSensor, sensor.position);
				sensorImpls[sensor.name] = generateSensorImp(i);
			}
		}

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
			_robot.leftSpeed = lSpeed;
			_robot.rightSpeed = rSpeed;
		}


		function _networkTableImplementation(varName, value) {
			_fireEvent('networkTableValueUpdated', {
				varName: varName,
				value: value
			});
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
			{
				name: 'Robot~networkTable~putValue',
				retType: 'void',
				parameters: [{
					varType: 'string',
					name: 'varName'
				}, {
					varType: 'string',
					name: 'value'
				}],
				implementation: _networkTableImplementation
			}
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

		//Any additional sensor implementations
		for (var i = 0, len = sensors.length; i < len; i++) {
			var sensor = sensors[i];
			if (sensor.realSensor && sensor.realSensor.additionalMethods) {
				for (var j = 0; j < sensor.realSensor.additionalMethods.length; j++) {
					var addlMethod = sensor.realSensor.additionalMethods[j];
					sensorLibs.push({
						name: 'Robot~' + sensor.name + '~' + addlMethod.name,
						retType: addlMethod.retType,
						parameters: addlMethod.parameters,
						implementation: addlMethod.implementation
					});
				}
			}
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

		this.updateRobotSensors = function(sensors) {
			_robot.removeAllSensors();
			sensorImpls = {};

			sensorLibs = [];

			for (var i = 0, len = sensors.length; i < len; i++) {
				var sensor = sensors[i];
				//add the sensor to the robot
				var realSensor;
				if (sensor.type === 'RangeFinder') {
					realSensor = new RangeFinder();
				}
				else if (sensor.type === 'Gyro') {
					realSensor = new Gyro();
				}

				if (realSensor) {
					sensor.realSensor = realSensor;
					robot.addSensor(realSensor, sensor.position);
					sensorImpls[sensor.name] = generateSensorImp(i);
				}
			}

			for (var sensorName in sensorImpls) {
				sensorLibs.push({
					name: 'Robot~' + sensorName + '~getValue',
					retType: 'double',
					parameters: [],
					implementation: sensorImpls[sensorName]
				});
			}

			//Any additional sensor implementations
			for (var i = 0, len = sensors.length; i < len; i++) {
				var sensor = sensors[i];
				if (sensor.realSensor && sensor.realSensor.additionalMethods) {
					for (var j = 0; j < sensor.realSensor.additionalMethods.length; j++) {
						var addlMethod = sensor.realSensor.additionalMethods[j];
						sensorLibs.push({
							name: 'Robot~' + sensor.name + '~' + addlMethod.name,
							retType: addlMethod.retType,
							parameters: addlMethod.parameters,
							implementation: addlMethod.implementation
						});
					}
				}
			}
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