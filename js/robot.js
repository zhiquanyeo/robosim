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

		/* Accessors/Setters */
		
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

			var hDist = Math.sin(_bearing/360 * 2 * Math.PI) * distToMove;
			var vDist = Math.cos(_bearing/360 * 2 * Math.PI) * distToMove;

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
	}

	return Robot;
});