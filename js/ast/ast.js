/* AST with various constituent objects */
define(['./typechecker'],
function(TypeChecker) {
	//Errors
	function InterpreterError(message, data, loc) {
		this.message = message;
		this.loc = loc;
	}

	function _fetchFromContext(ident, context, callContext, loc) {
		var ctx = context;
		var value;
		var found = false;
		while (ctx) {
			if (ctx[ident] !== undefined) {
				console.log('found ' + ident + ' in context');
				value = ctx[ident].value;
				found = true;
				break;
			}

			ctx = ctx.__parentContext;
		}

		if (!found) {
			throw new InterpreterError("Could not find '" + ident + "' in current executing context", callContext, loc);
		}

		return value;
	}

	function _getValue(thing, context) {
		if (thing.nodeType === "Identifier") {
			return _fetchFromContext(thing.execute(context), context, thing, thing.loc);
		}
		return thing.execute(context);
	}

	//Program
	function Program(statements, loc) {
		var _statements = statements;
		var _loc = loc;

		Object.defineProperty(this, 'statements', {
			get: function() {
				return _statements;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "Program";
			},
			enumerable: true
		});

		this.execute = function(context) {
			//Loop through the statements
			for (var i = 0, len = _statements.length; i < len; i++) {
				var statement = _statements[i];
				if (!statement.execute) {
					throw new InterpreterError("Statement does not implement execute()", statement, _loc);
				}
				statement.execute(context);
			}
		};
	}

	//Declarations
	function FunctionDeclaration(type, name, args, body, loc) {
		var _type = type; //Return type
		var _name = name;
		var _args = args;
		var _body = body; //an array of statements
		var _loc = loc;

		Object.defineProperty(this, 'type', {
			get: function() {
				return _type;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'name', {
			get: function() {
				return _name;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'parameters', {
			get: function() {
				return _args;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'body', {
			get: function() {
				return _body;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "FunctionDeclaration";
			},
			enumerable: true
		});

		//All we need to do for a FunctionDeclaration is register it
		this.execute = function (context) {
			//Check if this already exists in context
			if (context[_name] !== undefined) {
				throw new InterpreterError("'" + _name + "' already exists in execution context", this, _loc);
			}

			context[_name] = {
				type: "function",
				ref: this, //Just need to store the ref to the actual object,
				parameters: _args,
			};
		}.bind(this);
	}
	
	function VariableDeclaration (type, isArray, declarators, loc) {
		var _type = type;
		var _isArray = isArray;
		var _declarators = declarators; //an Array
		var _loc = loc;

		Object.defineProperty(this, 'type', {
			get: function() {
				return _type;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'isArray', {
			get: function() {
				return _isArray;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'declarators', {
			get: function() {
				return _declarators;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "VariableDeclaration";
			},
			enumerable: true
		});

		//Register the variables in the context
		this.execute = function(context) {
			//We need to parse the declarators
			for (var i = 0, len = _declarators.length; i < len; i++) {
				var declarator = _declarators[i];
				console.log('declarator: ', declarator);
				if (context[declarator.name] !== undefined) {
					throw new InterpreterError("'" + declarator.name + "' already exists in current execution context", declarator, declarator.loc);
				}

				var variable = {
					type: "variable",
					varType: _type,
				};

				if (declarator.initializer !== undefined) {
					var initializer = declarator.initializer;
					//Type check the variable
					//The initializer will always be some expression/literal (i.e. it will always have .execute())
					if (declarator.initializer.execute === undefined) {
						throw new InterpreterError("Could not obtain value for declarator '" + declarator.name + "'", declarator, declarator.loc);
					}
					var value = _getValue(initializer, context);
					console.log('value: ', value);

					//Try to typecheck now
					if (TypeChecker.typeCheck(_type, value)) {
						value = TypeChecker.coerceValue(_type, value);
					}
					else {
						throw new InterpreterError("Attempting to assign value of type '" + (typeof value) + "' to variable of type '" + _type + "'");
					}
					console.log('after type coercion', value);
					variable.value = value;
				}
				else {
					//sensible defaults
					switch (_type) {
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

				context[declarator.name] = variable;
			}

		}.bind(this);
	}

	function VariableDeclarator (name, init, loc) {
		var _name = name;
		var _initializer = init;
		var _loc = loc;

		Object.defineProperty(this, 'name', {
			get: function() {
				return _name;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'initializer', {
			get: function() {
				return _initializer;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "VariableDeclarator";
			},
			enumerable: true
		});

		//This does not need an 'execute' method
	}

	//Expressions
	function SequenceExpression (expression, loc) {
		var _expression = expression;
		var _loc = loc;

		Object.defineProperty(this, 'expression', {
			get: function() {
				return _expression;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "SequenceExpression";
			},
			enumerable: true
		});
	}

	function ConditionalExpression (condition, trueExpression, falseExpression, loc) {
		var _condition = condition;
		var _trueExpression = trueExpression;
		var _falseExpression = falseExpression;
		var _loc = loc;

		Object.defineProperty(this, 'condition', {
			get: function() {
				return _condition;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'trueExpression', {
			get: function() {
				return _trueExpression;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'falseExpression', {
			get: function() {
				return _falseExpression;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "ConditionalExpression";
			},
			enumerable: true
		});
	}

	function UnaryExpression (op, arg, isPrefix, loc) {
		var _operator = op;
		var _expression = arg;
		var _isPrefix = isPrefix;
		var _loc = loc;

		Object.defineProperty(this, 'operator', {
			get: function() {
				return _operator;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'expression', {
			get: function() {
				return _expression;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'isPrefix', {
			get: function() {
				return _isPrefix;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "UnaryExpression";
			},
			enumerable: true
		});
	}

	function BinaryExpression (op, left, right, loc) {
		var _operator = op;
		var _left = left;
		var _right = right;
		var _loc = loc;

		Object.defineProperty(this, 'operator', {
			get: function() {
				return _operator;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'left', {
			get: function() {
				return _left;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'right', {
			get: function() {
				return _right;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "BinaryExpression";
			},
			enumerable: true
		});

		this.execute = function(context) {
			var leftVal, rightVal;
			if (_left.nodeType === "Identifier") {
				leftVal = _fetchFromContext(_left.execute(context), context, _left, _left.loc);
			}
			else {
				leftVal = _left.execute(context);
			}

			if (_right.nodeType === "Identifier") {
				rightVal = _fetchFromContext(_right.execute(context), context, _right, _right.loc);
			}
			else {
				rightVal = _right.execute(context);
			}

			//depending on what operator we have
			switch (_operator) {
				case "+":
					//if both sides evaluate to the same type, then we're golden
					if (typeof leftVal === typeof rightVal) {
						//special case for bools
						if (typeof leftVal === "boolean")
							return leftVal | rightVal;
						return leftVal + rightVal;
					}
					else {
						//TODO: Implement 
						var commonType = TypeChecker.greatestCommonType([leftVal, rightVal]);
						if (commonType) {
							return (TypeChecker.coerceValue(commonType, leftVal) + TypeChecker.coerceValue(commonType, rightVal));
						}
						else {
							throw new InterpreterError("Could not obtain common type for types " + (typeof leftVal) + " and " + (typeof rightVal), this, _loc);
						}
					}
					break;
				case "-":
					//if both sides evaluate to the same type, then we're golden
					if (typeof leftVal === typeof rightVal) {
						//special case for bools
						if (typeof leftVal === "boolean")
							throw new InterpreterError("operator " + _operator + " is invalid for boolean values", this, _loc);
						//we can't freaking subtract strings...
						if (typeof leftVal === "string")
							throw new InterpreterError("Cannot perform operation " + _operator + " on type string", this, _loc);
						return leftVal - rightVal;
					}
					else {
						//TODO: Implement 
						var commonType = TypeChecker.greatestCommonType([leftVal, rightVal]);
						if (commonType) {
							if (commonType === "boolean") 
								throw new InterpreterError("operator " + _operator + " is invalid for boolean values", this, _loc);
							if (commonType === "string")
								throw new InterpreterError("Cannot perform operation " + _operator + " on type string", this, _loc);
							return (TypeChecker.coerceValue(commonType, leftVal) - TypeChecker.coerceValue(commonType, rightVal));
						}
						else {
							throw new InterpreterError("Could not obtain common type for types " + (typeof leftVal) + " and " + (typeof rightVal), this, _loc);
						}
					}
					break;
				case "*":
					//if both sides evaluate to the same type, then we're golden
					if (typeof leftVal === typeof rightVal) {
						//special case for bools
						if (typeof leftVal === "boolean")
							throw new InterpreterError("operator " + _operator + " is invalid for boolean values", this, _loc);
						//we can't freaking subtract strings...
						if (typeof leftVal === "string")
							throw new InterpreterError("Cannot perform operation " + _operator + " on type string", this, _loc);
						return leftVal * rightVal;
					}
					else {
						//TODO: Implement 
						var commonType = TypeChecker.greatestCommonType([leftVal, rightVal]);
						if (commonType) {
							if (commonType === "boolean") 
								throw new InterpreterError("operator " + _operator + " is invalid for boolean values", this, _loc);
							if (commonType === "string")
								throw new InterpreterError("Cannot perform operation " + _operator + " on type string", this, _loc);
							return (TypeChecker.coerceValue(commonType, leftVal) * TypeChecker.coerceValue(commonType, rightVal));
						}
						else {
							throw new InterpreterError("Could not obtain common type for types " + (typeof leftVal) + " and " + (typeof rightVal), this, _loc);
						}
					}
					break;
				case "/":
					//if both sides evaluate to the same type, then we're golden
					if (typeof leftVal === typeof rightVal) {
						//special case for bools
						if (typeof leftVal === "boolean")
							throw new InterpreterError("operator " + _operator + " is invalid for boolean values", this, _loc);
						//we can't freaking subtract strings...
						if (typeof leftVal === "string")
							throw new InterpreterError("Cannot perform operation " + _operator + " on type string", this, _loc);
						return leftVal / rightVal;
					}
					else {
						//TODO: Implement 
						var commonType = TypeChecker.greatestCommonType([leftVal, rightVal]);
						if (commonType) {
							if (commonType === "boolean") 
								throw new InterpreterError("operator " + _operator + " is invalid for boolean values", this, _loc);
							if (commonType === "string")
								throw new InterpreterError("Cannot perform operation " + _operator + " on type string", this, _loc);
							return (TypeChecker.coerceValue(commonType, leftVal) / TypeChecker.coerceValue(commonType, rightVal));
						}
						else {
							throw new InterpreterError("Could not obtain common type for types " + (typeof leftVal) + " and " + (typeof rightVal), this, _loc);
						}
					}
					break;
			}
		}.bind(this);
	}

	function AssignmentExpression (assignOp, left, right, loc) {
		var _operator = assignOp;
		var _left = left;
		var _right = right;
		var _loc = loc;

		Object.defineProperty(this, 'operator', {
			get: function() {
				return _operator;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'left', {
			get: function() {
				return _left;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'right', {
			get: function() {
				return _right;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "AssignmentExpression";
			},
			enumerable: true
		});
	}

	function LogicalExpression (logicalOp, left, right, loc) {
		var _operator = logicalOp;
		var _left = left;
		var _right = right;
		var _loc = loc;

		Object.defineProperty(this, 'operator', {
			get: function() {
				return _operator;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'left', {
			get: function() {
				return _left;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'right', {
			get: function() {
				return _right;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "LogicalExpression";
			},
			enumerable: true
		});
	}

	function UpdateExpression (updateOp, arg, isPrefix, loc) {
		var _operator = updateOp;
		var _expression = arg;
		var _isPrefix = isPrefix;
		var _loc = loc;

		Object.defineProperty(this, 'operator', {
			get: function() {
				return _operator;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'expression', {
			get: function() {
				return _expression;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'isPrefix', {
			get: function() {
				return _isPrefix;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "UpdateExpression";
			},
			enumerable: true
		});
	}

	function CallExpression (callee, args, loc) {
		var _callee = callee;
		var _args = args;
		var _loc = loc;

		Object.defineProperty(this, 'callee', {
			get: function() {
				return _callee;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'args', {
			get: function() {
				return _args;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "CallExpression";
			},
			enumerable: true
		});

		this.execute = function(context) {
			console.log('Executing CallExpression', _callee.execute());
			var callee = _callee.execute();
			var fn = context[callee];
			if (fn && fn.type === "function") {
				console.log('found the function');
				console.log('args...');
				var valArg = [];
				for (var i = 0, len = _args.length; i < len; i++) {
					var arg = _args[i];
					var value;
					if (arg.nodeType === 'Identifier') {
						var identName = arg.execute();
						if (context[identName] === undefined) {
							throw new InterpreterError("'" + identName + "' is undefined in the current execution context", this, _loc);
						}
						value = _fetchFromContext(identName, context, arg, arg.loc);
						valArg.push(value);
					}
					else {
						value = arg.execute(context);
						valArg.push(value);
					}
					// value = _args[i].execute();
					console.log('[' + i + '] - ', value, _args[i].nodeType);
				}

				console.log('arguments to pass: ', valArg);

				var fnContext = {
					__parentContext: context
				};

				if (valArg.length != fn.parameters.length) {
					throw new InterpreterError("Incorrect number of parameters passed to function", this, _loc);
				}

				console.log('function takes in params:');
				for (i = 0, len = fn.parameters.length; i < len; i++) {
					//array of declarations
					var param = fn.parameters[i];
					console.log(param);

					//Need to finalize what the layout of this array will be

					fnContext[param.name] = valArg[i];
				}

				//We need to execute the function
				for (i = 0, len = fn.ref.body.length; i < len; i++) {
					var statement = fn.ref.body[i];
					statement.execute(fnContext);
					//statement.execute()
				}
			}
		};
	}

	function MemberExpression (obj, prop, loc) {
		var _base = obj;
		var _prop = prop;
		var _loc = loc;

		Object.defineProperty(this, 'base', {
			get: function() {
				return _base;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'property', {
			get: function() {
				return _prop;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "MemberExpression";
			},
			enumerable: true
		});
	}

	function ArrayExpression (elements, loc) {
		var _elements = elements;
		var _loc = loc;

		Object.defineProperty(this, 'elements', {
			get: function() {
				return _elements;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "ArrayExpression";
			},
			enumerable: true
		});
	}

	//Statements
	function VariableStatement (variables, loc) {
		//variables contains an array of variabledeclarations
		var _variableDeclarations = variables;
		var _loc = loc;

		Object.defineProperty(this, 'variables', {
			get: function() {
				return _variableDeclarations;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "VariableStatement";
			},
			enumerable: true
		});
	}

	function EmptyStatement (loc) {
		var _loc = loc;

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "EmptyStatement";
			},
			enumerable: true
		});
	}

	function BlockStatement (body, loc) {
		var _body = body;
		var _loc = loc;

		Object.defineProperty(this, 'body', {
			get: function() {
				return _body;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "BlockStatement";
			},
			enumerable: true
		});
	}

	function ExpressionStatement (expression, loc) {
		var _expression = expression;
		var _loc = loc;

		Object.defineProperty(this, 'expression', {
			get: function() {
				return _expression;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "ExpressionStatement";
			},
			enumerable: true
		});
	}

	function LabeledStatement (label, body, loc) {
		var _label = label;
		var _body = body;
		var _loc = loc;

		Object.defineProperty(this, 'label', {
			get: function() {
				return _label;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'body', {
			get: function() {
				return _body;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "LabeledStatement";
			},
			enumerable: true
		});
	}

	function IfStatement (test, trueStatement, elseStatement, loc) {
		var _condition = test;
		var _trueStatement = trueStatement;
		var _elseStatement = elseStatement;
		var _loc = loc;

		Object.defineProperty(this, 'condition', {
			get: function() {
				return _condition;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'trueStatement', {
			get: function() {
				return _trueStatement;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'elseStatement', {
			get: function() {
				return _elseStatement;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "IfStatement";
			},
			enumerable: true
		});
	}

	function SwitchStatement (testExpr, cases, loc) {
		var _condition = testExpr;
		var _cases = cases;
		var _loc = loc;

		Object.defineProperty(this, 'condition', {
			get: function() {
				return _condition;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'cases', {
			get: function() {
				return _cases;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "SwitchStatement";
			},
			enumerable: true
		});
	}

	function SwitchCase (test, statements, loc) {
		//test is null if this is a default case
		var _test = test;
		var _statements = statements;
		var _loc = loc;

		Object.defineProperty(this, 'test', {
			get: function() {
				return _test;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'body', {
			get: function() {
				return _statements;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "SwitchCase";
			},
			enumerable: true
		});
	}

	function WhileStatement (test, body, loc) {
		var _condition = test;
		var _body = body;
		var _loc = loc;

		Object.defineProperty(this, 'condition', {
			get: function() {
				return _condition;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'body', {
			get: function() {
				return _body;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "WhileStatement";
			},
			enumerable: true
		});
	}

	function DoWhileStatement (body, test, loc) {
		var _body = body;
		var _test = test;
		var _loc = loc;

		Object.defineProperty(this, 'body', {
			get: function() {
				return _body;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'condition', {
			get: function() {
				return _test;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "DoWhileStatement";
			},
			enumerable: true
		});
	}

	function ForStatement (init, test, update, body, loc) {
		var _init = init;
		var _test = test;
		var _update = update;
		var _body = body;
		var _loc = loc;

		Object.defineProperty(this, 'initializer', {
			get: function() {
				return _init;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'condition', {
			get: function() {
				return _test;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'update', {
			get: function() {
				return _update;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'body', {
			get: function() {
				return _body;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "ForStatement";
			},
			enumerable: true
		});
	}

	function BreakStatement (loc) {
		var _loc = loc;

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "BreakStatement";
			},
			enumerable: true
		});
	}

	function ContinueStatement (loc) {
		var _loc = loc;

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "ContinueStatement";
			},
			enumerable: true
		});
	}

	function ReturnStatement (arg, loc) {
		var _arg = arg;
		var _loc = loc;

		Object.defineProperty(this, 'argument', {
			get: function() {
				return _arg;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "ReturnStatement";
			},
			enumerable: true
		});
	}

	function Identifier (label, loc) {
		var _label = label;
		var _loc = loc;

		Object.defineProperty(this, 'label', {
			get: function() {
				return _label;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "Identifier";
			},
			enumerable: true
		});

		this.execute = function(context) {
			return _label;
		};
	}

	function Literal (value, type, loc) {
		var _value = value;
		var _type = type;
		var _loc = loc;

		Object.defineProperty(this, 'value', {
			get: function() {
				return _value;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return _type;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			},
			enumerable: true
		});

		Object.defineProperty(this, 'nodeType', {
			get: function() {
				return "Literal";
			},
			enumerable: true
		});

		this.execute = function() {
			return _value;
		};
	}

	return {
		program: function(statements, loc) {
			return new Program(statements, loc);
		},

		functionDeclaration: function(type, name, args, body, loc) {
			return new FunctionDeclaration(type, name, args, body, loc);
		},

		variableDeclaration: function(type, isArray, declarators, loc) {
			return new VariableDeclaration(type, isArray, declarators, loc);
		},

		variableDeclarator: function(pattern, init, loc) {
			return new VariableDeclarator(pattern, init, loc);
		},

		sequenceExpression: function(expression, loc) {
			return new SequenceExpression(expression, loc);
		},

		conditionalExpression: function(test, cons, alt, loc) {
			return new ConditionalExpression(test, cons, alt, loc);
		},

		unaryExpression: function(op, arg, isPrefix, loc) {
			return new UnaryExpression(op, arg, isPrefix, loc);
		},

		binaryExpression: function(op, left, right, loc) {
			return new BinaryExpression(op, left, right, loc);
		},

		assignmentExpression: function(assignOp, left, right, loc) {
			return new AssignmentExpression(assignOp, left, right, loc);
		},

		logicalExpression: function(logicalOp, left, right, loc) {
			return new LogicalExpression(logicalOp, left, right, loc);
		},

		updateExpression: function(updateOp, arg, isPrefix, loc) {
			return new UpdateExpression(updateOp, arg, isPrefix, loc);
		},

		callExpression: function (callee, args, loc) {
			return new CallExpression(callee, args, loc);
		},

		memberExpression: function(obj, prop, loc) {
			return new MemberExpression(obj, prop, loc);
		},

		arrayExpression: function(elements, loc) {
			return new ArrayExpression(elements, loc);
		},

		variableStatement: function(variables, loc) {
			return new VariableStatement(variables, loc);
		},

		emptyStatement: function(loc) {
			return new EmptyStatement(loc);
		},

		blockStatement: function(body, loc) {
			return new BlockStatement(body, loc);
		},

		expressionStatement: function(expression, loc) {
			return new ExpressionStatement(expression, loc);
		},

		labeledStatement: function(label, body, loc) {
			return new LabeledStatement(label, body, loc);
		},

		ifStatement: function(test, trueStatement, elseStatement, loc) {
			return new IfStatement(test, trueStatement, elseStatement, loc);
		},

		switchStatement: function(testExpr, cases, loc) {
			return new SwitchStatement(testExpr, cases, loc);
		},

		switchCase: function(test, statements, loc) {
			return new SwitchCase(test, statements, loc);
		},

		whileStatement: function(test, body, loc) {
			return new WhileStatement(test, body, loc);
		},

		doWhileStatement: function(body, test, loc) {
			return new DoWhileStatement(body, test, loc);
		},

		forStatement: function(init, test, update, body, loc) {
			return new ForStatement(init, test, update, body, loc);
		},

		breakStatement: function(loc) {
			return new BreakStatement(loc);
		},

		continueStatement: function(loc) {
			return new ContinueStatement(loc);
		},

		returnStatement: function(arg, loc) {
			return new ReturnStatement(arg, loc);
		},

		identifier: function(label, loc) {
			return new Identifier(label, loc);
		},

		literal: function(value, type, loc) {
			return new Literal(value, type, loc);
		}
	};

});