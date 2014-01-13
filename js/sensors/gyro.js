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
						
						var currBearing = _robot.bearing;
						//we must assume that we will be turning less than 360/sec
						//if lastBearing in right half, and currBearing in left
						//then we are turning to the left

						//If lastBearing in left half and currBearing in right,
						//then we are turning to the right
						if (_lastBearing >= 0 && _lastBearing < 180 &&
							currBearing >= 180 && currBearing < 360) {
							_lastBearing += 360; //just add one more circle to this
						}
						else if (_lastBearing >= 180 && _lastBearing < 360 &&
							currBearing >= 0 && currBearing < 180) {
							currBearing += 360;
						}

						var turnDelta = currBearing - _lastBearing;
						var degPerSecond = turnDelta / timeDelta;
						_lastBearing = _robot.bearing;

						_currRate = degPerSecond;
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

		this.reset = function() {
			_lastBearing = 0;
			if (_robot) {
				_lastBearing = _robot.bearing;
			}
		};
	}

	Gyro.prototype.Units = {
		DEGREES: 0,
		RADIANS: 1
	};

	return Gyro;
});