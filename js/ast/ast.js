/* AST with various constituent objects */
define([],
function() {
	//Program
	function Program(statements, loc) {
		var _statements = statements;
		var _loc = loc;

		Object.defineProperty(this, 'statements', {
			get: function() {
				return _statements;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
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
			}
		});

		Object.defineProperty(this, 'name', {
			get: function() {
				return _name;
			}
		});

		Object.defineProperty(this, 'parameters', {
			get: function() {
				return _args;
			}
		});

		Object.defineProperty(this, 'body', {
			get: function() {
				return _body;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}
	
	function VariableDeclaration (type, isArray, declarators, loc) {
		var _type = type;
		var _isArray = isArray;
		var _declarators = declarators; //an Array
		var _loc = loc;

		Object.defineProperty(this, 'type', {
			get: function() {
				return _type;
			}
		});

		Object.defineProperty(this, 'isArray', {
			get: function() {
				return _isArray;
			}
		});

		Object.defineProperty(this, 'declarators', {
			get: function() {
				return _declarators;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function VariableDeclarator (name, init, loc) {
		var _name = name;
		var _initializer = init;
		var _loc = loc;

		Object.defineProperty(this, 'name', {
			get: function() {
				return _name;
			}
		});

		Object.defineProperty(this, 'initializer', {
			get: function() {
				return _initializer;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	//Expressions
	function SequenceExpression (expression, loc) {
		var _expression = expression;
		var _loc = loc;

		Object.defineProperty(this, 'expression', {
			get: function() {
				return _expression;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
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
			}
		});

		Object.defineProperty(this, 'trueExpression', {
			get: function() {
				return _trueExpression;
			}
		});

		Object.defineProperty(this, 'falseExpression', {
			get: function() {
				return _falseExpression;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
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
			}
		});

		Object.defineProperty(this, 'expression', {
			get: function() {
				return _expression;
			}
		});

		Object.defineProperty(this, 'isPrefix', {
			get: function() {
				return _isPrefix;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
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
			}
		});

		Object.defineProperty(this, 'left', {
			get: function() {
				return _left;
			}
		});

		Object.defineProperty(this, 'right', {
			get: function() {
				return _right;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function AssignmentExpression (assignOp, left, right, loc) {
		var _operator = assignOp;
		var _left = left;
		var _right = right;
		var _loc = loc;

		Object.defineProperty(this, 'operator', {
			get: function() {
				return _operator;
			}
		});

		Object.defineProperty(this, 'left', {
			get: function() {
				return _left;
			}
		});

		Object.defineProperty(this, 'right', {
			get: function() {
				return _right;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
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
			}
		});

		Object.defineProperty(this, 'left', {
			get: function() {
				return _left;
			}
		});

		Object.defineProperty(this, 'right', {
			get: function() {
				return _right;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
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
			}
		});

		Object.defineProperty(this, 'expression', {
			get: function() {
				return _expression;
			}
		});

		Object.defineProperty(this, 'isPrefix', {
			get: function() {
				return _isPrefix;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function CallExpression (callee, args, loc) {
		var _callee = callee;
		var _args = args;
		var _loc = loc;

		Object.defineProperty(this, 'callee', {
			get: function() {
				return _callee;
			}
		});

		Object.defineProperty(this, 'args', {
			get: function() {
				return _args;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function MemberExpression (obj, prop, loc) {
		var _base = obj;
		var _prop = prop;
		var _loc = loc;

		Object.defineProperty(this, 'base', {
			get: function() {
				return _base;
			}
		});

		Object.defineProperty(this, 'property', {
			get: function() {
				return _prop;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function ArrayExpression (elements, loc) {
		var _elements = elements;
		var _loc = loc;

		Object.defineProperty(this, 'elements', {
			get: function() {
				return _elements;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
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
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function EmptyStatement (loc) {
		var _loc = loc;

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function BlockStatement (body, loc) {
		var _body = body;
		var _loc = loc;

		Object.defineProperty(this, 'body', {
			get: function() {
				return _body;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function ExpressionStatement (expression, loc) {
		var _expression = expression;
		var _loc = loc;

		Object.defineProperty(this, 'expression', {
			get: function() {
				return _expression;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function LabeledStatement (label, body, loc) {
		var _label = label;
		var _body = body;
		var _loc = loc;

		Object.defineProperty(this, 'label', {
			get: function() {
				return _label;
			}
		});

		Object.defineProperty(this, 'body', {
			get: function() {
				return _body;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
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
			}
		});

		Object.defineProperty(this, 'trueStatement', {
			get: function() {
				return _trueStatement;
			}
		});

		Object.defineProperty(this, 'elseStatement', {
			get: function() {
				return _elseStatement;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function SwitchStatement (testExpr, cases, loc) {
		var _condition = testExpr;
		var _cases = cases;
		var _loc = loc;

		Object.defineProperty(this, 'condition', {
			get: function() {
				return _condition;
			}
		});

		Object.defineProperty(this, 'cases', {
			get: function() {
				return _cases;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
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
			}
		});

		Object.defineProperty(this, 'body', {
			get: function() {
				return _statements;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function WhileStatement (test, body, loc) {
		var _condition = test;
		var _body = body;
		var _loc = loc;

		Object.defineProperty(this, 'condition', {
			get: function() {
				return _condition;
			}
		});

		Object.defineProperty(this, 'body', {
			get: function() {
				return _body;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function DoWhileStatement (body, test, loc) {
		var _body = body;
		var _test = test;
		var _loc = loc;

		Object.defineProperty(this, 'body', {
			get: function() {
				return _body;
			}
		});

		Object.defineProperty(this, 'condition', {
			get: function() {
				return _test;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
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
			}
		});

		Object.defineProperty(this, 'condition', {
			get: function() {
				return _test;
			}
		});

		Object.defineProperty(this, 'update', {
			get: function() {
				return _update;
			}
		});

		Object.defineProperty(this, 'body', {
			get: function() {
				return _body;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function BreakStatement (loc) {
		var _loc = loc;

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function ContinueStatement (loc) {
		var _loc = loc;

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function ReturnStatement (arg, loc) {
		var _arg = arg;
		var _loc = loc;

		Object.defineProperty(this, 'argument', {
			get: function() {
				return _arg;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function Identifier (label, loc) {
		var _label = label;
		var _loc = loc;

		Object.defineProperty(this, 'label', {
			get: function() {
				return _label;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
	}

	function Literal (value, type, loc) {
		var _value = value;
		var _type = type;
		var _loc = loc;

		Object.defineProperty(this, 'value', {
			get: function() {
				return _value;
			}
		});

		Object.defineProperty(this, 'type', {
			get: function() {
				return _type;
			}
		});

		Object.defineProperty(this, 'loc', {
			get: function() {
				return _loc;
			}
		});
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