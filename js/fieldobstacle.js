define([],
function() {

	function _redraw(elem, visualPositionInfo) {
		var top = (visualPositionInfo.y - (visualPositionInfo.height / 2)) + 'px';
		var left = (visualPositionInfo.x - (visualPositionInfo.width / 2)) + 'px';

		elem.style.webkitTransform = "translate(" + left + ", " + top + ") rotate(" + visualPositionInfo.bearing + "deg)";

		elem.style.width = visualPositionInfo.width + 'px';
		elem.style.height = visualPositionInfo.height + 'px';
	}
	
	function FieldObstacle(position, size, angle, color) {
		var _domElement = document.createElement('div');
		_domElement.classList.add('sim-obstacle');

		var _playingField;

		if (!color) {
			color = this.ObstacleColor.GRAY;
		}

		switch (color) {
			case this.ObstacleColor.GRAY:
				_domElement.classList.add('color-GRAY');
				break;
			case this.ObstacleColor.RED:
				_domElement.classList.add('color-RED');
				break;
			case this.ObstacleColor.GREEN:
				_domElement.classList.add('color-GREEN');
				break;
			case this.ObstacleColor.BLUE:
				_domElement.classList.add('color-BLUE');
				break;
			default:
				_domElement.classList.add('color-GRAY');
		}

		var _position = position;
		if (_position === undefined) {
			console.warn('Must provide position. Defaulting to 50, 50');
			_position = {
				x: 50,
				y: 50
			}
		}

		var _size = size;
		if (_size === undefined) {
			console.warn('Must provide size. Defaulting to 5x5');
			_size = {
				width: 5,
				height: 5
			}
		}

		var _angle = angle;
		if (!_angle) {
			_angle = 0;
		}

		Object.defineProperty(this, 'domElement', {
			get: function() {
				return _domElement;
			}
		});

		this.registerWithField = function(field) {
			_playingField = field;

			if (field) {
				//TODO registration with the field
				var pxTopOffset = field.logicalToPixelOffset(_position.y);
				var pxLeftOffset = field.logicalToPixelOffset(_position.x);
				var pxWidth = field.logicalToPixelOffset(_size.width);
				var pxHeight = field.logicalToPixelOffset(_size.height);

				_redraw(_domElement, {
					x: pxLeftOffset,
					y: pxTopOffset,
					width: pxWidth,
					height: pxHeight,
					bearing: _angle
				});
			}
		};

		this.forceRedraw = function() {
			if (_playingField) {
				//TODO registration with the field
				var pxTopOffset = _playingField.logicalToPixelOffset(_position.y);
				var pxLeftOffset = _playingField.logicalToPixelOffset(_position.x);
				var pxWidth = _playingField.logicalToPixelOffset(_size.width);
				var pxHeight = _playingField.logicalToPixelOffset(_size.height);

				_redraw(_domElement, {
					x: pxLeftOffset,
					y: pxTopOffset,
					width: pxWidth,
					height: pxHeight,
					bearing: _angle
				});
			}
		};
	};

	FieldObstacle.prototype.ObstacleColor = {
		GRAY: 0,
		RED: 1,
		GREEN: 2,
		BLUE: 3,
	}

	FieldObstacle.ObstacleColor = {
		GRAY: 0,
		RED: 1,
		GREEN: 2,
		BLUE: 3,
	}

	return FieldObstacle;
});