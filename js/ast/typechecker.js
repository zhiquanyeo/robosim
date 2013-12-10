define([],
function() {
	function TypeError(message) {
		this.message = message;
	}

	function typeCheck (type, value) {
		switch (type) {
			case "int": {
				console.log("type checking int");
				if (value.nodeType && value.nodeType == "Literal") {
					console.log("type checking Literal");
					return typeCheckInitializer (type, value);
				}

				//Otherwise uh... execute
			}


		}
	}

	function typeCheckInitializer (type, initializer) {
		//initializer 'value' function returns {type, value}
		switch (initializer.type) {
			case "NumericLiteral":
				return true; //NumericLiterals can be used anywhere

			case "StringLiteral":
				return (type === "string");

			case "BooleanLiteral":
				return true;
		}
	}

	return {
		typeCheck: typeCheck,

		typeCheckInitializer: typeCheckInitializer,

		coerceValue: function (value, type) {
			switch (type) {
				case "int":
					if (typeof value == "boolean") {
						if (value) {
							return 1;
						}
						return 0;
					}
					return parseInt(value, 10);
				case "double":
					if (typeof value == "boolean") {
						if (value) {
							return 1;
						}
						return 0;
					}
					return parseFloat(value, 10);
				case "string":
					return "" + value + "";
				case "boolean":
					var val = parseInt(value, 10);
					if (isNaN(val)) {
						throw new TypeError("Could not coerce '" + value + "' to boolean");
					}
					return (val !== 0);
			}
			
		}
	};
});