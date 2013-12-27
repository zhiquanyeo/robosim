define(['./typechecker', './ast'],
function(TypeChecker, AST) {
	//Errors
	function CompilerError(message, loc) {
		this.message = message;
		this.loc = loc;
		this.errorType = "CompilerError";
	}

	//The Program. Self contained execution unit, including program counter
	function Program() {
		var _pc = 0; //program counter;
		var _sp = 0; //Stack Pointer
		var _bp = 0; //Base pointer

		var registers = {
			'R0': null,
			'R1': null,
			'R2': null,
			'R3': null,
			'R4': null,
			'R5': null,
			'R6': null,
			'R7': null,
			'RAX': null, //Used for storing return values
		};

		var _stack = [];

		var _progmem = [];
	}

	//Instructions
	function ADDInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'ADD';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "ADD " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
		}.bind(this);
	}

	function SUBInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'SUB';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "SUB " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function MULInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'MUL';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "MUL " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function DIVInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'DIV';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "DIV " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function ANDInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'AND';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "AND " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function ORInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'OR';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "OR " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function XORInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'XOR';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "XOR " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function INCInstruction(dest, executionUnit, comment) {
		this.destination = dest;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'INC';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "SUB " + this.destination;
		}.bind(this);
	}

	function DECInstruction(dest, executionUnit, comment) {
		this.destination = dest;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'DEC';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "DEC " + this.destination;
		}.bind(this);
	}

	function RJMPInstruction(k, executionUnit, comment) {
		var _offset = k;

		Object.defineProperty(this, 'offset', {
			get: function() {
				return _offset;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'RJMP';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "RJMP " + this.destination;
		}.bind(this);
	}

	function JMPInstruction(k, executionUnit, comment) {
		var _offset = k;

		Object.defineProperty(this, 'offset', {
			get: function() {
				return _offset;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'JMP';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "JMP " + this.destination;
		}.bind(this);
	}

	function CALLInstruction(k, executionUnit, comment) {
		var _offset = k;

		Object.defineProperty(this, 'offset', {
			get: function() {
				return _offset;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'CALL';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "CALL " + this.destination;
		}.bind(this);
	}

	function RETInstruction(executionUnit, comment) {
		Object.defineProperty(this, 'type', {
			get: function() {
				return 'RET';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "RET";
		};
	}

	//Compare
	function CPInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'CP';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "CP " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function MOVInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'MOV';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "MOV " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
		}.bind(this);
	}

	function LDIInstruction(dest, value, executionUnit, comment) {
		this.destination = dest;
		var _value = value;

		Object.defineProperty(this, 'value', {
			get: function() {
				return _value;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'LDI';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "LDI " + this.destination + ", " + this.value;
		}.bind(this);
	}

	function PUSHInstruction(src, executionUnit, comment) {
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'PUSH';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "PUSH " + _generateTargetString(this.source);
		}.bind(this);
	}

	function POPInstruction(dest, executionUnit, comment) {
		this.destination = dest;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'POP';
			},
			enumerable: true,
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "POP " + _generateTargetString(this.destination);
		}.bind(this);
	}

	function NOPInstruction(executionUnit, comment) {
		Object.defineProperty(this, 'type', {
			get: function() {
				return 'NOP';
			},
			enumerable: true
		});

		//For debugging purposes
		var _executionUnit = executionUnit;
		var _comment = comment;
		Object.defineProperty(this, 'executionUnit', {
			get: function() {
				return _executionUnit;
			},
			enumerable: true,
		});

		Object.defineProperty(this, 'comment', {
			get: function() {
				return _comment;
			},
			enumerable: true,
		});

		this.toString = function() {
			return "NOP";
		};
	}

	//==================== COMPILATION RELATED FUNCTIONS ===========================
	
	//Get raw context value
	function _getRawFromContext(identifier, context, loc) {
		var ctx = context;
		while (ctx) {
			if (ctx[identifier] !== undefined) {
				return ctx[identifier];
			}
			ctx = ctx.__parentContext;
		}
		throw new CompilerError("'" + identifier + "' has not been declared", loc);
	}
	//Helper function to get value from context
	function _getValueFromContext(identifier, context, loc) {
		return (_getRawFromContext(identifier, context, loc)).value;
	}

	//Fetch value from context, and determine if we can evaluate this or not
	function _evaluate(node, context, noCall) {
		//If it's an identifier, then we just fetch from context
		if (node.nodeType === "Identifier") {
			return _getValueFromContext(node.label, context, node.loc);
		}
		else if (node.nodeType === "Literal") {
			return node.value;
		}
		else if (node.nodeType === "BinaryExpression") {
			//TODO: implement this
		}
		else if (node.nodeType === "CallExpression") {
			//if the noCall flag is set (as it should when processing top level directives)
			//then throw a compiler error
			if (noCall) {
				throw new CompilerError("Function call expressions not allowed at this location", node.loc);
			}
			//Look up the address in context
			var fn = _getRawFromContext(node.callee.label, context, node.loc);
			if (fn && fn.type === "function") {
				//TODO implement
				//Check that we have the same number of parameters, and that they typecheck
				var valArg = [];
				for (var i = 0, len = node.args.length; i < len; i++) {
					var arg = node.args[i];
					
					//Evaluate the argument
					var value = _evaluate(arg);
					//Special cases for object return value
					if (value === undefined) {
						throw new CompilerError("Could not process argument #" + i + " to function '" + node.callee.label + "'", node.loc);
					}
					valArg.push(value);
				}

				if (valArg.length !== fn.parameters.length) {
					throw new CompilerError("Incorrect number of parameters passed to function '" + node.callee.label + "'. Expected " + fn.paramaters.length + ", got " + valArg.length, node.loc);
				}

				//Grab the list of parameters. stored in this format:
				// {
				//	varType:
				//	name: 
				// }	
				
				var fnParamList = [];
				for (var i = 0, len = fn.parameters.length; i < len; i++) {
					var param = fn.parameters[i];
					var arg = valArg[i];
					if (!arg.type) {
						//it's a raw value, type check it
						if (!TypeChecker.typeCheck(param.varType, arg))
							throw new CompilerError("Attempting to pass argument of type " + (typeof arg) + " into slot with type " + param.varType, node.loc);
					}
					else {
						//get the return value
						var fnCall = _getRawFromContext(arg.callee, context, node.loc);
						if (fnCall && fnCall.type === "function") {
							if (!TypeChecker.isCoercableType(param.varType, fnCall.retType))
								throw new CompilerError("Attempting to pass argument of type " + fnCall.retType + " into slot with type " + param.varType, node.loc);
						}
						else {
							throw new CompilerError("Attempting to call non-function '" + node.callee.label + "' as a function", node.loc);
						}
					}
				}

				return {
					type: 'functionCall',
					callee: node.callee.label
				};
			}
			else {
				throw new CompilerError("Attempting to call non-function '" + node.callee.label + "' as a function", node.loc);
			}
		}
		else if (node.nodeType === "MemberExpression") {
			//TODO Implement this
		}
	}

	//Extract variable information from a declaration statement
	function _getVariables (varDecl) {
		var variables = [];
		if (varDecl.nodeType === "VariableDeclaration") {
			for (var i = 0, len = varDecl.declarators.length; i < len; i++) {
				var declarator = varDecl.declarators[i];

				var variable = {
					type: 'variable',
					name: declarator.name,
					ref: declarator,
					varType: varDecl.type,
					isArray: varDecl.isArray,
					initializer: declarator.initializer
				};

				variables.push(variable);
			}
		}
		return variables;
	}

	//Utility to store variables
	function _registerVariables(varDecl, context, noCallInInitializer) {
		var variables = _getVariables(varDecl);
		for (var i = 0, len = variables.length; i < len; i++) {
			var variable = variables[i];

			if (context[variable.name] !== undefined) {
				throw new CompilerError("'" + variable.name + "' has already been declared", variable.ref.loc);
			}

			//See if we need to grab a value
			if (variable.initializer !== undefined) {
				var initializer = variable.initializer;
				var value = _evaluate(initializer, context, noCallInInitializer);
				//Type check it
				if (variable.isArray) {
					if (value.length !== undefined) {
						var arrayValues = value;
						var tempArray = [];
						for (var valIdx = 0, valLen = value.length; valIdx < valLen; valIdx++) {
							var tmpVal = _evaluate(arrayValues[valIdx], context);

							if (TypeChecker.typeCheck(variable.varType, tmpVal)) {
								tmpVal = TypeChecker.coerceValue(variable.varType, tmpVal);
							}
							else {
								throw new CompilerError("Cannot assign value of type " + (typeof value) + " to array variabel of type " + variable.varType, initializer.loc);
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
					console.log('value: ', value);
					if (TypeChecker.typeCheck(variable.varType, value)) {
						value = TypeChecker.coerceValue(variable.varType, value);
					}
					else {
						throw new CompilerError("Cannot assign value of type " + (typeof value) + " to variable of type " + varDecl.type, initializer.loc);
					}
					variable.value = value;
				}
			}
			else {
				//sensible defaults
				switch(variable.varType) {
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

			context[variable.name] = variable;
		}
	}

	function _compileBlock (statements, context) {

	}

	function _compileExpression (statement, context) {
		//The idea is that the result will always be stored in R0
		console.log('compiling expression', statement);
		var map = [];

		//do the operation and push the result on to the stack
		if (statement.nodeType === "Literal") {
			map.push(new PUSHInstruction({
				type: 'raw',
				value: statement.value,
			}, statement, "Push raw value on to stack while processing expression"));
		}
		else if (statement.nodeType === "Identifier") {
			_getRawFromContext(statement.label, context, statement.loc);
			map.push(new PUSHInstruction({
				type: 'pendingVariable',
				value: {
					name: statement.label
				}
			}, statement, "Push variable value onto stack while processing expression"));
		}
		else if (statement.nodeType === 'BinaryExpression') {
			//compile the left side
			var leftMap = _compileExpression(statement.left, context);
			var rightMap = _compileExpression(statement.right, context);

			//pop left into R0, right into R1
			map = map.concat(leftMap);
			map = map.concat(rightMap);
			map.push(new POPInstruction({
				type: 'register',
				value: 'R1'
			}, statement, 'Store right side of expression in R1'));

			map.push(new POPInstruction({
				type: 'register',
				value: 'R0'
			}, statement, 'Store left side of expression in R0'));
			
			//Do the op
			switch (statement.operator) {
				case "+":
					map.push(new ADDInstruction({
						type: 'register',
						value: 'R0'
					}, {
						type: 'register',
						value: 'R1'
					}, statement, "Perform ADD operation on R0 and R1"));
					break;
			}

			map.push(new PUSHInstruction({
				type: 'register',
				value: 'R0'
			}, statement, "Push result onto the stack"));
		}

		return map;
	}

	function _compileAssignment (statement, context) {
		console.log('compiling assignment expression: ', statement);

		var map = [];

		//verify that we have an appropriate left side
		if (statement.left.nodeType !== "Identifier" && statement.left.nodeType !== "MemberExpression") {
			throw new CompilerError("Left hand side of assignment expression must be a variable or array member", statement.loc);
		}

		var storageLocation = {};
		if (statement.left.nodeType === "Identifier") {
			//attempt to query the context
			_getRawFromContext(statement.left.label, context, statement.left.loc);
			storageLocation.name = statement.left.label;
		}
		else {
			//member expression
			//we only support single dimensional arrays
			if (statement.left.base.nodeType !== "Identifier") {
				throw new CompilerError("Only single dimensional arrays are supported", statement.left.base.loc);
			}
			var data = _getRawFromContext(statement.left.base, context, statement.left.base.loc);
			if (!data.isArray) {
				throw new CompilerError("'" + statement.left.base.label + "' is not an array and does not support indexing", statement.left.base.loc);
			}
			storageLocation.name = statement.left.base.label;

			//TODO Implement
			//Ugh we have to evaluate the location
			//store it in R7
			//storageLocation.index = 
		}

		//simplify the right side expression
		var newRight = statement.right;
		if (statement.right.cfold) {
			newRight = statement.right.cfold();
		}
		console.log('newRight: ', newRight);

		//if it's a literal, we just need to do the assignment
		if (newRight.nodeType === "Literal") {
			//Generate a MOV command, with storageLocation as the destination
			
			map.push(new MOVInstruction({
				type: 'pendingVariable', //This tells the compiler that we still need to resolve this
				value: storageLocation,
			}, {
				type: 'raw',
				value: newRight.value
			}, statement.right, "Store value in variable '" + storageLocation.name + "'"));
		}
		else if (newRight.nodeType === "Identifier") {
			//ensure that the identifier exists
			_getRawFromContext(newRight.label, context, statement.right.loc);
			map.push(new MOVInstruction({
				type: 'pendingVariable',
				value: storageLocation,
			}, {
				type: 'pendingVariable',
				value: {
					name: newRight.label
				}
			}, statement.right, "Store variable '" + newRight.label + "' in variable '" + storageLocation.name + "'"));
		}
		else {
			var expressionMap = _compileExpression(newRight, context);
			map = map.concat(expressionMap);
		}

		//will need to set up place holders for the variable locations


		return map;
	}

	function _compileForLoop (statement, context) {

	}

	function _compileWhileLoop (statement, context) {

	}

	function _compileDoWhileLoop (statement, context) {

	}

	function _compileFunctionCall (statement, context) {

	}

	function _compileFunction (progStatement, context) {
		//Register the function
		if (context[progStatement.name] !== undefined) {
			throw new CompilerError("'" + progStatement.name + "' is already defined", progStatement.loc);
		}

		//base pointer offsets
		var basePointerOffsets = {};
		var bpOffset = -1;

		var functionContext = {
			__parentContext: context,
		};

		var varmap = []; //use this to store the variables first. These are the first instructions to get run
		var memmap = [];

		var paramList = [];
		//Get the params list in the form {varType, name}
		for (var i = 0, len = progStatement.parameters.length; i < len; i++) {
			var param = progStatement.parameters[i];
			var paramDeclarators = _getVariables(param);
			paramList.push({
				varType: paramDeclarators[0].varType,
				name: paramDeclarators[0].name
			});

			//push this into function context and ebpoffsets as well
			functionContext[paramDeclarators[0].name] = {
				type: "variable",
				varType: paramDeclarators[0].varType,
				isArray: paramDeclarators[0].isArray,
				name: paramDeclarators[0].name
			};

			basePointerOffsets[paramDeclarators[0].name] = bpOffset--;
		}

		//reset bpOffset to prepare for local variables
		bpOffset = 1;

		//Actually register with the context
		context[progStatement.name] = {
			type: 'function',
			retType: progStatement.type,
			parameters: paramList
		};

		//Generate the memory layout
		if (!progStatement.body) {
			//just put in a NOP
			memmap.push(new NOPInstruction());
		}
		else {
			//process the statements
			for (var i = 0, len = progStatement.body.length; i < len; i++) {
				var statement = progStatement.body[i];

				//send the statement to the relevant compilation modules
				if (statement.nodeType === "VariableDeclaration") {
					_registerVariables(statement, functionContext);
					//Grab the new variables and assign them base offsets
					for (var j in functionContext) {
						var ctxItem = functionContext[j];
						if (ctxItem.type === "variable") {
							if (!basePointerOffsets[ctxItem.name]) {
								basePointerOffsets[ctxItem.name] = bpOffset++;
								//It's a new variable we are declaring
								//push onto the stack
								//we can just save the value...
								varmap.push(new PUSHInstruction({
									type: 'raw',
									value: ctxItem.value
								}, statement, 'Set up space for variable \'' + ctxItem.name + '\' on stack'));
							}
						}
					}

				}
				else if (statement.nodeType === "AssignmentExpression") {
					var assignmentMap = _compileAssignment(statement, functionContext);
					console.log('assignmentMap: ', assignmentMap);
					memmap = memmap.concat(assignmentMap);
				}
			}
		}

		memmap = varmap.concat(memmap);

		//loop through the map and find anything with pendingVariable
		for (var i = 0, len = memmap.length; i < len; i++) {
			var stmt = memmap[i];
			if (stmt.destination) {
				if (stmt.destination.type === 'pendingVariable') {
					//grab ebp offset
					var ebpOffset = basePointerOffsets[stmt.destination.value.name];
					stmt.destination.type = 'pointer';
					stmt.destination.value = 'EBP';
					stmt.destination.offset = ebpOffset;
				}
			}
			if (stmt.source) {
				if (stmt.source.type === 'pendingVariable') {
					//grab ebp offset
					var ebpOffset = basePointerOffsets[stmt.source.value.name];
					stmt.source.type = 'pointer';
					stmt.source.value = 'EBP';
					stmt.source.offset = ebpOffset;
				}
			}
		}

		console.log('Function Context: ', functionContext);
		console.log("Base Pointer Offsets: ", basePointerOffsets);
		console.log('memmap: ', memmap);

		_printAssembly(memmap);
	}

	function _compile (programAST) {
		console.log("======= COMPILER 2 ========");
		//Global variables, the _data segment
		var _data = {};

		//Store addresses of function entry points
		var _functions = {};

		//Context, storing variable names (not values!)
		var _context = {};

		//Load all the global variables and functions
		for (var i = 0, len = programAST.statements.length; i < len; i++) {
			var statement = programAST.statements[i];

			//Handle variable declarations
			if (statement.nodeType === "VariableDeclaration") {
				_registerVariables(statement, _context, true);
			}
			else if (statement.nodeType === "FunctionDeclaration") {
				_compileFunction(statement, _context);
			}
			else {
				throw new CompilerError("Top level of program may only contain function or variable declarations", statement.loc);
			}
		}

		//This stores global scope!
		console.log("Context: ", _context);
	}

	function _generateTargetString(obj) {
		if (obj.type === 'raw') {
			return obj.value;
		}
		else if (obj.type === 'register') {
			return obj.value;
		}
		else if (obj.type === 'pointer') {
			return obj.value + (obj.offset >= 0 ? '+' : '') + obj.offset;
		}
	}

	function _printAssembly (memmap) {
		console.log('=== ASSEMBLY INSTRUCTIONS ===');
		for (var i = 0, len = memmap.length; i < len; i++) {
			var statement = memmap[i];
			var str = statement.toString();
			if (statement.comment) {
				str += "\t\t;" + statement.comment;
			}
			console.log(str);
		}
	}

	return {
		compile: _compile
	};
});