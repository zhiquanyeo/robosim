define([],
function() {
	function TypeError(message) {
		this.message = message;
	}

	function isCoercableType(refType, testType) {
		switch (refType) {
			case "int":
			case "double":
			case "bool":
				return (testType === "int" || testType == "double" || testType == "bool");
			case "string":
				return true;
		}
	}

	//'value' will always be a simple type (number, string, boolean)
	function typeCheck (type, value) {
		switch (type) {
			case "int": //We accept number
			case "double":
				return (typeof value === "number");

			case "bool": //we accept boolean, and number
				return (typeof value === "boolean" || typeof value === "number");

			case "string": //we'll take ANYTHING
				return true;
		}
	}

	//coerce value to a given type
	function coerceValue(type, value) {
		switch (type) {
			case "int":
				if (typeof value === "boolean") {
					return value ? 1 : 0;
				}
				return parseInt(value, 10);

			case "double":
				if (typeof value === "boolean") {
					return value ? 1 : 0;
				}
				return parseFloat(value, 10);

			case "string":
				return "" + value + "";

			case "bool":
				if (typeof value === "boolean")
					return value;
				var val = parseInt(value, 10);
				if (isNaN(val)) return false;
				return (val !== 0);
		}
	}

	function greatestCommonType (valueArray) {
		var hasInt = false, hasDouble = false, hasBoolean = false, hasString = false;
		for (var i = 0, len = valueArray.length; i < len; i++) {
			var val = valueArray[i];

			if (typeof val === "number") {
				//we need to differentiate
				var intVal = parseInt(val, 10);
				var floatVal = parseFloat(val);

				if (intVal == floatVal) {
					hasInt = true;
				}
				else {
					hasDouble = true;
				}
			}
			else if (typeof val === "string")
				hasString = true;
			else if (typeof val === "boolean")
				hasBoolean = true;
		}

		//return self type if all are the same type
		if (hasInt && !hasDouble && !hasString && !hasBoolean)
			return "int";
		if (hasDouble && !hasInt && !hasString && !hasBoolean)
			return "double";
		if (hasBoolean && !hasInt && !hasString && !hasDouble)
			return "bool";
		if (hasString && !hasInt && !hasDouble && !hasBoolean)
			return "string";

		if (hasDouble && !hasString) // we can convert bool/int/double -> double
			return "double";
		if (hasInt && !hasDouble && !hasString) //we can convert bool/int -> int
			return "int";
		if (hasBoolean && !hasString) // we can convert int/double/bool -> bool
			return "bool";
		if (hasString)
			return "string";
		else
			return null;

	}

	return {
		typeCheck: typeCheck,
		coerceValue: coerceValue,
		greatestCommonType: greatestCommonType,
		isCoercableType: isCoercableType,
	};
});