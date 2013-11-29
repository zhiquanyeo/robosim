/* robot.js */
define([],
function () {

	function _redraw(elem, visualPositionInfo) {
		var top = (visualPositionInfo.y - (visualPositionInfo.height / 2)) + 'px';
		var left = (visualPositionInfo.x - (visualPositionInfo.width / 2)) + 'px';
		
		elem.style.webkitTransform = "translate(" + left + ", " + top + ") rotate(" + visualPositionInfo.bearing + "deg)";

		elem.style.width = visualPositionInfo.width + 'px';
		elem.style.height = visualPositionInfo.height + 'px';
	}

	function Robot(size) {
		/* Properties */
		var _domElem = document.createElement('div');
		_domElem.classList.add('sim-robot');

		var _position = {
			x: 0,
			y: 0
		};

		var _size = size;
		if (!size) {
			console.warn('Must provide size. defaulting to 5x5');
			_size = {
				width: 5,
				height: 5
			};
		}

		var _speed = 0; //in logical units
		var _rotationalSpeed = 0; //in degrees per second

		var _bearing = 0; //in degrees
		

		//Sensors need to provide correct interface
		var _sensors = [];

		var _playingField = null;

		//Event listeners
		var _eventHandlers = {};

		Object.defineProperty(this, 'position', {
			get: function () {
				return _position;
			},
			set: function (pos) {
				_position = pos;
				if (_playingField !== null) {
					var pxTopOffset = _playingField.logicalToPixelOffset(this.position.y);
					var pxLeftOffset = _playingField.logicalToPixelOffset(this.position.x);
					var pxWidth = _playingField.logicalToPixelOffset(this.size.width);
					var pxHeight = _playingField.logicalToPixelOffset(this.size.height);

					_redraw(_domElem, {
						x: pxLeftOffset,
						y: pxTopOffset,
						width: pxWidth,
						height: pxHeight,
						bearing: _bearing
					});
				}
			}
		});

		Object.defineProperty(this, 'size', {
			get: function() {
				return _size;
			}
		});

		Object.defineProperty(this, 'speed', {
			get: function() {
				return _speed;
			},
			set: function(speed) {
				_speed = speed;
			}
		});

		Object.defineProperty(this, 'rotationalSpeed', {
			get: function() {
				return _rotationalSpeed;
			},
			set: function(rotSpeed) {
				_rotationalSpeed = rotSpeed;
			}
		});

		Object.defineProperty(this, 'domElement', {
			get: function() {
				return _domElem;
			}
		});

		//This should only be used by sensors!
		Object.defineProperty(this, 'bearing', {
			get: function() {
				return _bearing;
			}
		});

		/* Accessors/Setters */

		//Sensor Related functionality
		this.addSensor = function (sensor, mountPoint) {
			//We need to configure the sensor and attach it to the robot
			var config = {
				mountPoint: mountPoint,
			};

			if (_playingField) {
				config.fieldDimensions = _playingField.dimensions;
				config.playingField = _playingField;
			}

			sensor.attachToRobot(this);
			sensor.configure(config);
		}.bind(this);
		
		//Field related functionality
		this.registerWithField = function (field) {
			_playingField = field;

			if (field) {
				var pxTopOffset = field.logicalToPixelOffset(this.position.y);
				var pxLeftOffset = field.logicalToPixelOffset(this.position.x);
				var pxWidth = field.logicalToPixelOffset(this.size.width);
				var pxHeight = field.logicalToPixelOffset(this.size.height);

				_redraw(_domElem, {
					x: pxLeftOffset,
					y: pxTopOffset,
					width: pxWidth,
					height: pxHeight,
					bearing: _bearing
				});
			}
		};

		//Convenience function
		this.setPositionXY = function (posX, posY) {
			this.position = {
				x: posX,
				y: posY
			};
		}.bind(this);

		this.processTick = function(timeDelta) {
			//timeDelta is how much time has elapsed between calls to tick (in ms)
			var timeInSec = timeDelta / 1000;

			//Adjust bearing
			var currBearing = _bearing;
			var newBearing = currBearing + (this.rotationalSpeed * timeInSec);
			if (newBearing >= 360) {
				newBearing -= 360;
			}
			else if (newBearing < 0) {
				newBearing += 360;
			}

			_bearing = newBearing;

			var currPos = this.position;
			var distToMove = this.speed * timeInSec;

			var hDist = Math.sin(_bearing/180 * Math.PI) * distToMove;
			var vDist = Math.cos(_bearing/180 * Math.PI) * distToMove;

			this.position = {
				x: this.position.x + hDist,
				y: this.position.y - vDist
			};

		}.bind(this);

		this.forceRedraw = function() {
			var pxTopOffset = _playingField.logicalToPixelOffset(this.position.y);
			var pxLeftOffset = _playingField.logicalToPixelOffset(this.position.x);
			var pxWidth = _playingField.logicalToPixelOffset(this.size.width);
			var pxHeight = _playingField.logicalToPixelOffset(this.size.height);

			_redraw(_domElem, {
				x: pxLeftOffset,
				y: pxTopOffset,
				width: pxWidth,
				height: pxHeight,
				bearing: _bearing
			});
		}.bind(this);

		//Event handlers
		this.addEventHandler = function(event, callback) {
			var handlers = _eventHandlers[event];
			if (!handlers) {
				handlers = [];
				_eventHandlers[event] = handlers;
			}

			handlers.push(callback);
		};

		// Utility function to fire the event
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

	Robot.prototype.SensorMountPoint = {
		CHASSIS: 0,
		FRONT: 1,
		RIGHT: 2,
		BACK: 3,
		LEFT: 4
	};

	return Robot;
});