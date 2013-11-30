define([],
function() {
	/*
	All sensors MUST implement the following interface
	
	attachToRobot(robot)
	configure(<json object>) - configure the sensor (config details depend on sensor)
	getValue() - return a number representing whatever value the sensor is reporting
	getDescription() - return a description of the sensor

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

		var _showVisual = false;

		var _lastDistance = 0;

		//Redraw visuals
		this.forceRedraw = function () {
			if (_robot && _showVisual) {
				_visualElem.style.bottom = (_robot.domElement.clientHeight / 2) + 'px';
				_visualElem.style.left = (_robot.domElement.clientWidth / 2) + 'px';
			}
		};

		//Interface requirements
		this.attachToRobot = function (robot) {
			_robot = robot;

			_robot.domElement.appendChild(_visualElem);
			_visualElem.style.bottom = (_robot.domElement.clientHeight / 2) + 'px';
			_visualElem.style.left = (_robot.domElement.clientWidth / 2) + 'px';
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

			var angleToUse = _robot.bearing;
			if (_mountPoint == _robot.SensorMountPoint.RIGHT) {
				angleToUse += 90;
			}
			else if (_mountPoint == _robot.SensorMountPoint.BACK) {
				angleToUse += 180;
			}
			else if (_mountPoint == _robot.SensorMountPoint.LEFT) {
				angleToUse += 270;
			}

			if (angleToUse >= 360) {
				angleToUse -= 360;
			}

			var pos = _robot.position;

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
				if (_showVisual)
					_visualElem.style.height = _field.logicalToPixelOffset(distance) + 'px';
				
				_lastDistance = distance;
			}
			return distance;
		};

		this.getDescription = function() {
			return "Linear Rangefinder";
		};
	}

	return RangeFinder;
});