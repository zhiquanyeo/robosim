define([],
function() {
	/*
	All sensors MUST implement the following interface

	attachToRobot(robot)
	configure(<json>) - configure the sensor (config details depend on sensor)
	getValue() - return a number representing the sensor value
	getDescription() - return a description of the sensor
	*/

	function Gyro() {
		var _robot;

		var _units = 0; // radians per second or degrees per second (the default)

		//We use this to calculate degrees per second
		var _lastBearing = 0;

		//Current rate of turn, as updated via tick handler
		var _currRate = 0;

		var _hasRegisteredWithTick = false;

		//=== Interface Requirements
		this.attachToRobot = function (robot) {
			_robot = robot;
			if (_robot) {
				if (!_hasRegisteredWithTick) {
					_hasRegisteredWithTick = true;
					_robot.registerWithTick(function(timeDelta) {
						timeDelta /= 1000; //convert to seconds
						var turnDelta = _robot.bearing - _lastBearing;
						var degPerSecond = turnDelta / timeDelta;
						_lastBearing = _robot.bearing;
					});
				}
			}
		};

		this.configure = function (config) {
			if (!_robot) {
				console.warn('Sensor not connected to robot');
				return;
			}
			if (config.units !== undefined) {
				_units = config.units;
			}
		};

		this.getValue = function() {
			if (_units == 1) {
				//convert to radians
				return _currRate * Math.PI / 180;
			}
			return _currRate;
		};

		this.getDescription = function() {
			return 'Gyro';
		}
	}

	Gyro.prototype.Units = {
		DEGREES: 0,
		RADIANS: 1
	};

	return Gyro;
});