define(['./typechecker'],
function(TypeChecker) {
	//Errors
	function CompilerError(message, loc) {
		this.message = message;
		this.loc = loc;
		this.errorType = "CompilerError";
	}

	//The Program object
	function Program() {
		var _pc = 0; //Program Counter
		var _sp = 0;

		var stack = [];
		var heap = [];


	}

	function _fetchFromContext(ident, context, loc) {
		var ctx = context;
		var retVal;
		var found = false;
		while (ctx) {
			if (ctx[ident] !== undefined) {
				retVal = ctx[ident].value;
				found = true;
				break;
			}
			ctx = ctx.__parentContext;
		}

		if (!found) {
			throw new CompilerError("'" + ident + "' has not been declared", loc);
		}
		return retVal;
	}

	function _getValue(node, context) {
		if (node.nodeType === "Identifier") {
			return _fetchFromContext(node.label, context, node.loc);
		}
		return node.execute(context);
	}

	function _generateMemMap(astNode, heap) {
		var memMap = [];
		var context = {};


	}

	function _generateFunctionMemMap(functionDeclaration, heap) {
		//Store arguments
		for (var i = 0, len = functionDeclaration.parameters.length; i < len; i++) {
			console.log('parameter ' + i, functionDeclaration.parameters[i]);
			//each parameter is a VariableDeclaration

		}
	}

	function _compile(progAst) {
		//We need a setup() routine, and a loop() routine to exist
		var _memoryMap = [];
		var _heap = {};

		var _data = {}; //Data segment, all global variables

		var _functions = {};

		//we need to first insert all the function declarations
		//First pass:
		for (var i = 0, len = progAst.statements.length; i < len; i++) {
			var progStatement = progAst.statements[i];
			if (progStatement.nodeType === "FunctionDeclaration") {
				_functions[progStatement.name] = {
					returnType: progStatement.type,
					parameters: progStatement.parameters
				};

				var functionMap = _generateFunctionMemMap(progStatement, _heap);
			}
			else if (progStatement.nodeType === "VariableDeclaration") {
				//Store variables in the data segment

				//Parse the declarators
				for (var varIdx = 0, varLen = progStatement.declarators.length; varIdx < varLen; varIdx++) {
					var declarator = progStatement.declarators[varIdx];
					//check if this already exists in _data
					if (_data[declarator.name] !== undefined) {
						throw new CompilerError("'" + declarator.name + "' has already been declared", declarator.loc);
					}

					var variable = {
						type: "variable",
						varType: progStatement.type,
						isArray: progStatement.isArray,
					};

					if (declarator.initializer !== undefined) {
						var initializer = declarator.initializer;

						var value = _getValue(initializer, _data);
						if (progStatement.isArray) {
							if (value.length !== undefined) {
								var arrayValues = value;
								var tempArray = [];
								for (var valIdx = 0, valLen = value.length; valIdx < valLen; valIdx++) {
									var tmpVal = _getValue(arrayValues[valIdx], _data);

									if (TypeChecker.typeCheck(progStatement.type, tmpVal)) {
										tmpVal = TypeChecker.coerceValue(progStatement.type, tmpVal);
									}
									else {
										throw new CompilerError("Cannot assign value of type " + (typeof value) + " to array variable of type " + progStatement.type, initializer.loc);
									}
									tempArray.push(tmpVal);
								}
								variable.value = tempArray;
							}
							else {
								throw new CompilerError("Attempting to assign non array value to array type", initializer.loc);
							}
						}
						else {
							if (TypeChecker.typeCheck(progStatement.type, value)) {
								value = TypeChecker.coerceValue(progStatement.type, value);
							}
							else {
								throw new CompilerError("Cannot assign value of type " + (typeof value) + " to variable of type " + progStatement.type, initializer.loc);
							}
							variable.value = value;
						}
					}
					else {
						//Sensible defaults
						switch(progStatement.type) {
							case "int":
							case "double":
								variable.value = 0;
								break;
							case "boolean":
								variable.value = false;
								break;
							case "string":
								variable.value = "";
								break;
						}
					}

					_data[declarator.name] = variable;
				}
			}
		}
	}

	return {
		compile: _compile,
	};
});