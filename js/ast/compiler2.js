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
	function ADDInstruction(dest, src) {
		var _dest = dest;
		var _src = src;

		Object.defineProperty(this, 'destination', {
			get: function() {
				return _dest;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'source', {
			get: function() {
				return _src;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'ADD';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "ADD " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function SUBInstruction(dest, src) {
		var _dest = dest;
		var _src = src;

		Object.defineProperty(this, 'destination', {
			get: function() {
				return _dest;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'source', {
			get: function() {
				return _src;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'SUB';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "SUB " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function MULInstruction(dest, src) {
		var _dest = dest;
		var _src = src;

		Object.defineProperty(this, 'destination', {
			get: function() {
				return _dest;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'source', {
			get: function() {
				return _src;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'MUL';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "MUL " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function DIVInstruction(dest, src) {
		var _dest = dest;
		var _src = src;

		Object.defineProperty(this, 'destination', {
			get: function() {
				return _dest;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'source', {
			get: function() {
				return _src;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'DIV';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "DIV " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function ANDInstruction(dest, src) {
		var _dest = dest;
		var _src = src;

		Object.defineProperty(this, 'destination', {
			get: function() {
				return _dest;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'source', {
			get: function() {
				return _src;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'AND';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "AND " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function ORInstruction(dest, src) {
		var _dest = dest;
		var _src = src;

		Object.defineProperty(this, 'destination', {
			get: function() {
				return _dest;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'source', {
			get: function() {
				return _src;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'OR';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "OR " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function XORInstruction(dest, src) {
		var _dest = dest;
		var _src = src;

		Object.defineProperty(this, 'destination', {
			get: function() {
				return _dest;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'source', {
			get: function() {
				return _src;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'XOR';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "XOR " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function INCInstruction(dest) {
		var _dest = dest;

		Object.defineProperty(this, 'destination', {
			get: function() {
				return _dest;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'INC';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "SUB " + this.destination;
		}.bind(this);
	}

	function DECInstruction(dest) {
		var _dest = dest;

		Object.defineProperty(this, 'destination', {
			get: function() {
				return _dest;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'DEC';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "DEC " + this.destination;
		}.bind(this);
	}

	function RJMPInstruction(k) {
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

		this.toString = function() {
			return "RJMP " + this.destination;
		}.bind(this);
	}

	function JMPInstruction(k) {
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

		this.toString = function() {
			return "JMP " + this.destination;
		}.bind(this);
	}

	function CALLInstruction(k) {
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

		this.toString = function() {
			return "CALL " + this.destination;
		}.bind(this);
	}

	function RETInstruction() {
		Object.defineProperty(this, 'type', {
			get: function() {
				return 'RET';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "RET";
		};
	}

	//Compare
	function CPInstruction(dest, src) {
		var _dest = dest;
		var _src = src;

		Object.defineProperty(this, 'destination', {
			get: function() {
				return _dest;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'source', {
			get: function() {
				return _src;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'CP';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "CP " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function MOVInstruction(dest, src) {
		var _dest = dest;
		var _src = src;

		Object.defineProperty(this, 'destination', {
			get: function() {
				return _dest;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'source', {
			get: function() {
				return _src;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'MOV';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "MOV " + this.destination + ", " + this.source;
		}.bind(this);
	}

	function LDIInstruction(dest, value) {
		var _dest = dest;
		var _value = value;

		Object.defineProperty(this, 'destination', {
			get: function() {
				return _dest;
			},
			enumerable: true
		});

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

		this.toString = function() {
			return "LDI " + this.destination + ", " + this.value;
		}.bind(this);
	}

	function PUSHInstruction(src) {
		var _src = src;

		Object.defineProperty(this, 'source', {
			get: function() {
				return _src;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'PUSH';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "PUSH " + this.source;
		}.bind(this);
	}

	function POPInstruction(dest) {
		var _dest = dest;

		Object.defineProperty(this, 'destination', {
			get: function() {
				return _dest;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'POP';
			},
			enumerable: true,
		});

		this.toString = function() {
			return "POP " + this.destination;
		}.bind(this);
	}

	function NOPInstruction() {
		Object.defineProperty(this, 'type', {
			get: function() {
				return 'NOP';
			},
			enumerable: true
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

	}

	function _compileAssignment (statement, context) {

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
								var instruction;
								if (ctxItem.initializer) {
									if (ctxItem.initializer.nodeType === "Literal") {
										instruction = new LDIInstruction('R1', ctxItem.initializer.value);
										memmap.push(instruction);
										instruction = new PUSHInstruction('R1');
									}
								}
								instruction = new PUSHInstruction()
							}
						}
					}

				}

			}
		}

		console.log('Function Context: ', functionContext);
		console.log("Base Pointer Offsets: ", basePointerOffsets);
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

	return {
		compile: _compile
	};
});