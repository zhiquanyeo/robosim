/* robot.js */
define([],
function () {

	function _redraw(elem, visualPositionInfo) {
		elem.style.top = (visualPositionInfo.y - (visualPositionInfo.height / 2)) + 'px';
		elem.style.left = (visualPositionInfo.x - (visualPositionInfo.width / 2)) + 'px';
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
						height: pxHeight
					});
				}
			}
		});

		Object.defineProperty(this, 'size', {
			get: function() {
				return _size;
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
					height: pxHeight
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

		this.forceRedraw = function() {
			var pxTopOffset = _playingField.logicalToPixelOffset(this.position.y);
			var pxLeftOffset = _playingField.logicalToPixelOffset(this.position.x);
			var pxWidth = _playingField.logicalToPixelOffset(this.size.width);
			var pxHeight = _playingField.logicalToPixelOffset(this.size.height);

			_redraw(_domElem, {
				x: pxLeftOffset,
				y: pxTopOffset,
				width: pxWidth,
				height: pxHeight
			});
		}.bind(this);
	}

	return Robot;
});