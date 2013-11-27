/* robot.js */
define([],
function () {
	function Robot() {
		/* Properties */
		var _domElem = document.createElement('div');
		_domElem.classList.add('sim-robot');

		var _position = {
			x: 0,
			y: 0
		};

		//Sensors need to provide correct interface
		var _sensors = [];

		/* Accessors/Setters */
		this.getDomElement = function () {
			return _domElem;
		};

		this.getPosition = function () {
			return _position;
		};

		this.setPosition = function (position) {
			_position = position;
		};

		this.setPositionXY = function (posX, posY) {
			_position = {
				x: posX,
				y: posY
			};
		};
	};

	return Robot;
});