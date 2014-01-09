/* robot.js */
define([],
function () {
	//TODO These Geom routines could go into a utility
	function _getBoundingBox (position, dimensions, angle) {
		//position.x/y, dimensions.width/height, angle in deg
		var angleRad = angle / 180 * Math.PI;
		var halfWidth = dimensions.width / 2;
		var halfHeight = dimensions.height / 2;

		var topLeft = {x: position.x - halfWidth, y: position.y - halfHeight};
		var topRight = {x: position.x + halfWidth, y: position.y - halfHeight};
		var bottomLeft = {x: position.x - halfWidth, y: position.y + halfHeight};
		var bottomRight = {x: position.x + halfWidth, y: position.y + halfHeight};

		var transTL = _translatePoint(topLeft, position, angleRad);
		var transTR = _translatePoint(topRight, position, angleRad);
		var transBL = _translatePoint(bottomLeft, position, angleRad);
		var transBR = _translatePoint(bottomRight, position, angleRad);

		var minMaxPoints = _findMinMaxPoints([transTL, transTR, transBL, transBR]);

		//Return topLeft corner, and width+height, and an array of points
		var boundingBox = {
			x: minMaxPoints.minX,
			y: minMaxPoints.minY,
			width: minMaxPoints.maxX - minMaxPoints.minX,
			height: minMaxPoints.maxY - minMaxPoints.minY,
			points: {
				topLeft: {
					x: minMaxPoints.minX,
					y: minMaxPoints.minY
				},
				topRight: {
					x: minMaxPoints.maxX,
					y: minMaxPoints.minY
				},
				bottomLeft: {
					x: minMaxPoints.minX,
					y: minMaxPoints.maxY
				},
				bottomRight: {
					x: minMaxPoints.maxX,
					y: minMaxPoints.maxY
				}
			}
		};

		return boundingBox;
	}

	function _translatePoint (point, rotPoint, angleRad) {
		var transX = rotPoint.x + ((point.x - rotPoint.x) * Math.cos(angleRad)) +
						((point.y - rotPoint.y) * Math.sin(angleRad));
		var transY = rotPoint.y - ((point.x - rotPoint.x) * Math.sin(angleRad)) +
						((point.y - rotPoint.y) * Math.cos(angleRad));
		return {
			x: transX,
			y: transY
		};
	}

	function _findMinMaxPoints (pointArray) {
		var minX = Number.POSITIVE_INFINITY;
		var minY = Number.POSITIVE_INFINITY;
		var maxX = Number.NEGATIVE_INFINITY;
		var maxY = Number.NEGATIVE_INFINITY;

		var idxMinX, idxMinY, idxMaxX, idxMaxY;

		for (var i = 0, len = pointArray.length; i < len; i++) {
			var currPoint = pointArray[i];
			if (currPoint.x < minX)
				minX = currPoint.x;
			if (currPoint.x > maxX)
				maxX = currPoint.x;
			if (currPoint.y < minY)
				minY = currPoint.y;
			if (currPoint.y > maxY)
				maxY = currPoint.y;
		}

		var retValue = {
			minX: minX,
			maxX: maxX,
			minY: minY,
			maxY: maxY
		};
		return retValue;
	}

	function _redraw(elem, visualPositionInfo) {
		var top = (visualPositionInfo.y - (visualPositionInfo.height / 2)) + 'px';
		var left = (visualPositionInfo.x - (visualPositionInfo.width / 2)) + 'px';
		
		elem.style.webkitTransform = "translate(" + left + ", " + top + ") rotate(" + visualPositionInfo.bearing + "deg)";

		elem.style.width = visualPositionInfo.width + 'px';
		elem.style.height = visualPositionInfo.height + 'px';
	}

	function _redrawBoundingBox (elem, positionInfo) {
		//x, y, width, height
		var top = (positionInfo.y) + 'px';
		var left = (positionInfo.x) + 'px';

		elem.style.webkitTransform = "translate(" + left + ", " + top + ")";
		
		elem.style.width = positionInfo.width + 'px';
		elem.style.height = positionInfo.height + 'px';
	}

	function Robot(size) {
		/* Properties */
		var _domElem = document.createElement('div');
		_domElem.classList.add('sim-robot');

		//Bounding box
		var _boundingBoxElem = document.createElement('div');
		_boundingBoxElem.classList.add('sim-robot-bounding-box');
		//hidden by default
		_boundingBoxElem.style.display = "none";
		var _showBoundingBox = false;

		var _boundingBox;

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

		// Collision event fired (we really only want to fire this once)
		var _collisionEventFired = false;

		//list of tick callbacks
		var _tickCallbacks = [];

		Object.defineProperty(this, 'position', {
			get: function () {
				return _position;
			},
			set: function (pos) {
				_position = pos;
				if (_playingField !== null) {
					//generate bounding box and do collision detection with the walls
					_boundingBox = _getBoundingBox(this.position, this.size, _bearing);
					if (_boundingBox.x < 0 || _boundingBox.y < 0 ||
						_boundingBox.x + _boundingBox.width > _playingField.dimensions.width ||
						_boundingBox.y + _boundingBox.height > _playingField.dimensions.height) {
						//collision!
						this.rotationalSpeed = 0;
						this.speed = 0;

						if (!_collisionEventFired) {
							_fireEvent('collision');
							_collisionEventFired = true;
						}

						//TODO: We might need to set a limit so that our bounding
						//box does not exceed field bounds
					}
					else {
						//We passed the collision detection
						//Set the eventFired flag to false
						_collisionEventFired = false;
					}

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

					var bbPxTop = _playingField.logicalToPixelOffset(_boundingBox.y);
					var bbPxLeft = _playingField.logicalToPixelOffset(_boundingBox.x);
					var bbPxWidth = _playingField.logicalToPixelOffset(_boundingBox.width);
					var bbPxHeight = _playingField.logicalToPixelOffset(_boundingBox.height);

					_redrawBoundingBox(_boundingBoxElem, {
						x: bbPxLeft,
						y: bbPxTop,
						width: bbPxWidth,
						height: bbPxHeight
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
			},
			set: function(brg) {
				_bearing = brg;
				if (_playingField) {
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

		//Bounding box display
		Object.defineProperty(this, 'showBoundingBox', {
			get: function() {
				return _showBoundingBox;
			},
			set: function(val) {
				if (val) {
					_showBoundingBox = true;
					_boundingBoxElem.style.display = null;

					if (_playingField) {
						_boundingBox = _getBoundingBox(this.position, this.size, _bearing);

						var bbPxTop = _playingField.logicalToPixelOffset(_boundingBox.x);
						var bbPxLeft = _playingField.logicalToPixelOffset(_boundingBox.y);
						var bbPxWidth = _playingField.logicalToPixelOffset(_boundingBox.width);
						var bbPxHeight = _playingField.logicalToPixelOffset(_boundingBox.height);

						_redrawBoundingBox(_boundingBoxElem, {
							x: bbPxLeft,
							y: bbPxTop,
							width: bbPxWidth,
							height: bbPxHeight
						});
					}
				}
				else {
					_showBoundingBox = false;
					_boundingBoxElem.style.display = "none";
				}
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

			_sensors.push(sensor);

			return _sensors.length - 1;

		}.bind(this);

		this.getSensor = function (index) {
			return _sensors[index];
		};
		
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

				_boundingBox = _getBoundingBox(this.position, this.size, _bearing);

				var bbPxTop = _playingField.logicalToPixelOffset(_boundingBox.x);
				var bbPxLeft = _playingField.logicalToPixelOffset(_boundingBox.y);
				var bbPxWidth = _playingField.logicalToPixelOffset(_boundingBox.width);
				var bbPxHeight = _playingField.logicalToPixelOffset(_boundingBox.height);

				_redrawBoundingBox(_boundingBoxElem, {
					x: bbPxLeft,
					y: bbPxTop,
					width: bbPxWidth,
					height: bbPxHeight
				});

				var sensorConfig = {
					fieldDimensions: _playingField.dimensions,
					playingField: _playingField
				};

				//We should also trigger a re-registration of sensors
				for (var i = 0, len = _sensors.length; i < len; i++) {
					var sensor = _sensors[i];
					sensor.attachToRobot(this);

					//reconfigure the playing field and dimensions
					sensor.configure(sensorConfig);

					if (sensor.forceRedraw) {
						setTimeout(sensor.forceRedraw, 0);
					}
				}

				//Set up the bounding box visual
				//TODO This really should be another 'object' type for the field
				field.simFieldDomElement.appendChild(_boundingBoxElem);
			}
		}.bind(this);

		//Convenience function
		this.setPositionXY = function (posX, posY) {
			this.position = {
				x: posX,
				y: posY
			};
		}.bind(this);

		//For use with sensors that are time based (gyro etc)
		//This allows them to register themselves with the robot Tick, 
		//so they can update themselves
		this.registerWithTick = function (callback) {
			_tickCallbacks.push(callback);
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

			//Send a message to all tick handlers with timeDelta
			for (var i = 0, len = _tickCallbacks.length; i < len; i++) {
				var tickCallback = _tickCallbacks[i];
				tickCallback(timeDelta);
			}
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

			_boundingBox = _getBoundingBox(this.position, this.size, _bearing);
			var bbPxTop = _playingField.logicalToPixelOffset(_boundingBox.x);
			var bbPxLeft = _playingField.logicalToPixelOffset(_boundingBox.y);
			var bbPxWidth = _playingField.logicalToPixelOffset(_boundingBox.width);
			var bbPxHeight = _playingField.logicalToPixelOffset(_boundingBox.height);

			_redrawBoundingBox(_boundingBoxElem, {
				x: bbPxLeft,
				y: bbPxTop,
				width: bbPxWidth,
				height: bbPxHeight
			});

			//Redraw sensor visuals if necessary
			for (var i = 0, len = _sensors.length; i < len; i++) {
				var sensor = _sensors[i];
				if (sensor.forceRedraw) {
					sensor.forceRedraw();
				}
			}
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