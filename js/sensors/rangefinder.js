define([],
function() {
	/*
	All sensors MUST implement the following interface

	attachToRobot(robot)
	configure(<json object>) - configure the sensor (config details depend on sensor)
	getValue() - return a number representing whatever value the sensor is reporting
	getDescription() - return a description of the sensor
	reset() - resets the sensor

	*/
	function RangeFinder(minRange, maxRange) {

		var _robot;

		var _mountPoint;
		var _fieldDimensions;
		var _field;

		//TODO we might want to do something with the range stuff
		var _minRange = 0;
		var _maxRange = 25;

		var _visualElem = document.createElement('div');
		_visualElem.classList.add('sim-sensor-line');
		_visualElem.style.webkitTransformOrigin = "bottom";

		var _showVisual = false;

		var _lastDistance = 0;

		this._redraw = function() {
			if(_mountPoint===undefined || !_robot) {
				console.warn('Sensor not configured.');
				return;
			}
			var width = _robot.domElement.clientWidth;
			var height = _robot.domElement.clientHeight;
			var xCord = 0;
			var yCord = height;
			var rotation = 0;

			if (_mountPoint == _robot.SensorMountPoint.RIGHT) {
				xCord += width;
				yCord -= height/2;
				rotation = 90;
			}
			else if (_mountPoint == _robot.SensorMountPoint.BACK) {
				xCord += width/2;
				yCord -= height;
				rotation = 180;
			}
			else if (_mountPoint == _robot.SensorMountPoint.LEFT) {
				yCord -= height/2;
				rotation = -90;
			} else {
				xCord += width/2;
			}

			_visualElem.style.bottom = yCord + 'px';
			_visualElem.style.left = xCord + 'px';
			_visualElem.style.webkitTransform = "rotate("+rotation+"deg)";
		}
		//Redraw visuals
		this.forceRedraw = function () {
			if(!_robot && !_showVisual) {
				return;
			}
			this._redraw();

		};

		//Interface requirements
		this.attachToRobot = function (robot) {
			_robot = robot;

			_robot.domElement.appendChild(_visualElem);
			this._redraw();
		};

		this.configure = function (config) {
			if (!_robot) {
				console.warn('Sensor not connected to robot');
				return;
			}
			if (config.fieldDimensions) {
				_fieldDimensions = config.fieldDimensions;
			}
			if (config.mountPoint) {
				_mountPoint = config.mountPoint;
				if (_mountPoint == _robot.SensorMountPoint.CHASSIS) {
					console.warn('Illegal mount point for RangeFinder. Adding to the front instead');
					_mountPoint = robot.SensorMountPoint.FRONT;
				}
			}
			if (config.playingField) {
				_field = config.playingField;
			}

			if (config.showVisual !== undefined) {
				_showVisual = config.showVisual;
			}
		};

		this.getValue = function () {
			if (!_robot) {
				console.warn('Sensor not connected to robot');
				return parseFloat('NaN');
			}

			var pos = _robot.position;
			var size = _robot.size;
			var xCord = 0;
			var yCord = 0;
			var bearingRad = _robot.bearing/ 180 * Math.PI;
			var angleToUse = _robot.bearing;
			if (_mountPoint == _robot.SensorMountPoint.RIGHT) {
				angleToUse += 90;
				xCord += size.width;
				yCord += size.height/2;
			}
			else if (_mountPoint == _robot.SensorMountPoint.BACK) {
				angleToUse += 180;
				xCord += size.width/2;
				yCord -= size.height;
			}
			else if (_mountPoint == _robot.SensorMountPoint.LEFT) {
				angleToUse += 270;
				yCord -= size.height/2;
			} else {
				xCord += size.width/2;
			}

			if (angleToUse >= 360) {
				angleToUse -= 360;
			}

			//rotate position around bearing
			pos.x += xCord * Math.cos(bearingRad) - yCord*Math.sin(bearingRad);
			pos.y += xCord * Math.sin(bearingRad) + yCord*Math.cos(bearingRad);

			var angleRad;
			var offset;
			var distance;

			//calculate the point at which we cross the borders
			if (angleToUse >= 0 && angleToUse < 90) {
				angleRad = angleToUse / 180 * Math.PI;
				//Top-Right
				//Check the point crossing the top edge first
				offset = pos.y * Math.tan(angleRad);
				if (pos.x + offset <= _fieldDimensions.width) {
					//we are good
					distance = pos.y / Math.cos(angleRad);
				}
				else {
					//check the point crossing the right edge
					offset = (_fieldDimensions.width - pos.x) / Math.tan(angleRad);
					distance = (_fieldDimensions.width - pos.x) / Math.sin(angleRad);
				}
			}
			else if (angleToUse >= 90 && angleToUse < 180) {
				//Bottom-Right
				angleRad = (angleToUse - 90) / 180 * Math.PI;

				//Check the point crossing the right edge first
				offset = (_fieldDimensions.width - pos.x) * Math.tan(angleRad);
				if (pos.y + offset <= _fieldDimensions.height) {
					distance = (_fieldDimensions.width - pos.x) / Math.cos(angleRad);
				}
				else {
					//Cross bottom edge
					offset = (_fieldDimensions.height - pos.y) / Math.tan(angleRad);
					distance = (_fieldDimensions.height - pos.y) / Math.sin(angleRad);
				}
			}
			else if (angleToUse >= 180 && angleToUse < 270) {
				//Bottom-Left
				angleRad = (angleToUse - 180) / 180 * Math.PI;

				//Check bottom crossing
				offset = (_fieldDimensions.height - pos.y) * Math.tan(angleRad);
				if (pos.x - offset >= 0) {
					distance = (_fieldDimensions.height - pos.y) / Math.cos(angleRad);
				}
				else {
					distance = pos.x / Math.sin(angleRad);
				}
			}
			else {
				//Top-Left
				angleRad = (angleToUse - 270) / 180 * Math.PI;

				//Check left edge crossing
				offset = pos.x * Math.tan(angleRad);
				if (offset <= pos.y) {
					distance = pos.x / Math.cos(angleRad);
				}
				else {
					distance = pos.y / Math.sin(angleRad);
				}
			}

			if (distance) {
				if (_showVisual) {
					_visualElem.style.height = _field.logicalToPixelOffset(distance) + 'px';
				}

				_lastDistance = distance;
			}
			return distance;
		};

		this.getDescription = function() {
			return "Linear Rangefinder";
		};

		this.reset = function() {

		};
	}

	return RangeFinder;
});