/* field.js */
define([],
function () {
	var _bufferSpace = 10;

	function _calculateDimensions(containingElement, dimensions) {
		var containHeight = containingElement.clientHeight;
		var containWidth = containingElement.clientWidth;

		var returnObj = {
			containerWidth: containWidth,
			containerHeight: containHeight,
		};

		var currWidth, currHeight, targetWidth, targetHeight, scale;
		if (dimensions.width > dimensions.height) {
			currWidth = containWidth - (2 * _bufferSpace);
			targetHeight = containHeight - (2 * _bufferSpace);
			scale = currWidth / dimensions.width;
			currHeight = scale * dimensions.height;

			if (currHeight > targetHeight) {
				currHeight = targetHeight;
				scale = currHeight / dimensions.height;
				currWidth = dimensions.width * scale;
			}
		}
		else {
			currHeight = containHeight - (2 * _bufferSpace);
			targetWidth = containWidth - (2 * _bufferSpace);
			scale = currHeight / dimensions.height;
			currWidth = scale * dimensions.width;
			
			if (currWidth > targetWidth) {
				currWidth = targetWidth;
				scale = currWidth / dimensions.width;
				currHeight = dimensions.height * scale;
			}
		}
		
		returnObj.scaleFactor = scale;
		returnObj.fieldWidth = currWidth;
		returnObj.fieldHeight = currHeight;

		return returnObj;
	}

	function _doFieldResize (fieldContainer, simFieldElem, fieldDimensions) {
		var dimensions = _calculateDimensions(fieldContainer, fieldDimensions);
		simFieldElem.style.width = dimensions.fieldWidth + 'px';
		simFieldElem.style.height = dimensions.fieldHeight + 'px';
		simFieldElem.style.top = ((dimensions.containerHeight - dimensions.fieldHeight) / 2) + 'px';
		simFieldElem.style.left = ((dimensions.containerWidth - dimensions.fieldWidth) / 2) + 'px';
	}
	
	function Field(fieldDomElement, fieldDimensions, fieldUnits) {
		/* properties */
		var _fieldDimensions = {
			width: 100,
			height: 100
		};

		var _fieldUnits = this.FieldUnits.FEET;

		//This is the containing DIV
		var _fieldDomElement = fieldDomElement;

		// This is the actual field where the robot will be
		var _simFieldDomElement = document.createElement('div');
		_simFieldDomElement.classList.add('sim-field');
		_fieldDomElement.appendChild(_simFieldDomElement);

		//The properties
		Object.defineProperty(this, 'units', {
			set: function(units) {
				_fieldUnits = units;
			},
			get: function() {
				return _fieldUnits;
			}
		});

		Object.defineProperty(this, 'domElement', {
			get: function() {
				return _fieldDomElement;
			}
		});

		Object.defineProperty(this, 'dimensions', {
			get: function() {
				return _fieldDimensions;
			},
			set: function (dimensions) {
				_fieldDimensions = dimensions;
				_doFieldResize(_fieldDomElement, _simFieldDomElement, _fieldDimensions);

			}
		});

		//Constructor type stuff
		if (fieldDimensions !== undefined) {
			this.fieldDimensions = fieldDimensions;
		}
		else {
			this.fieldDimensions = {
				width: 100,
				height: 100
			};
		}

		if (fieldUnits !== undefined) {
			this.fieldUnits = fieldUnits;
		}

		/* Accessors/Setters */
		

		this.getFieldDimensionsPixels = function () {
			return {
				width: _simFieldDomElement.clientWidth,
				height: _simFieldDomElement.clientHeight
			};
		};

		//TODO must maintain scaling!

		this.forceRedraw = function () {
			_doFieldResize(_fieldDomElement, _simFieldDomElement, _fieldDimensions);
		};

		this.debugDump = function() {
			var unitString = "";
			switch (_fieldUnits) {
				case this.FieldUnits.FEET:
					unitString = "ft";
					break;
				case this.FieldUnits.METRES:
					unitString = "m";
					break;
			}

			console.log('========== Field Information ==========');
			console.log('Dimensions (W x H): ' + _fieldDimensions.width + unitString + ' x ' + _fieldDimensions.height + unitString);
			console.log('On-Screen Dimensions in Pixels (W x H): ' + _simFieldDomElement.style.width + ' x ' + _simFieldDomElement.style.height);
			console.log('Pixels per ' + unitString + ': ' + (_simFieldDomElement.clientWidth / _fieldDimensions.width) + 'px/' + unitString);
		};
	}

	//Constants/Enums
	Field.prototype.FieldUnits = {
		FEET: 0,
		METRES: 1
	};

	return Field;
});