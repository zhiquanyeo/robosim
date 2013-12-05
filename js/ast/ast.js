/* AST with various constituent objects */
define([],
function() {

	//Declarations
	function FunctionDeclaration(name, args, body, loc) {

	}
	
	function VariableDeclaration (type, declarators, loc) {

	}
	function VariableDeclarator (pattern, init, loc) {

	}

	//Expressions
	function SequenceExpression (expression, loc) {

	}

	function ConditionalExpression (test, cons, alt, loc) {

	}

	function UnaryExpression (op, arg, isPrefix, loc) {

	}

	function BinaryExpression (op, left, right, loc) {

	}

	function AssignmentExpression (assignOp, left, right, loc) {

	}

	function LogicalExpression (logicalOp, left, right, loc) {

	}

	function UpdateExpression (updateOp, arg, isPrefix, loc) {

	}

	function MemberExpression (obj, prop, loc) {

	}

	function ArrayExpression (elements, loc) {

	}

	//Statements
	function BlockStatement (body, loc) {

	}

	function ExpressionStatement (expression, loc) {

	}

	function LabeledStatement (label, body, loc) {

	}

	function IfStatement (test, trueStatement, elseStatement, loc) {

	}

	function SwitchStatement (testExpr, cases, loc) {

	}

	function WhileStatement (test, body, loc) {

	}

	function DoWhileStatement (body, test, loc) {

	}

	function ForStatement (init, test, update, body, loc) {

	}

	function BreakStatement (loc) {

	}

	function ContinueStatement (loc) {

	}

	function ReturnStatement (arg, loc) {

	}

	function SwitchCase (test, body, loc) {

	}

	function Identifier (label, loc) {

	}

	function Literal (value, loc) {
		
	}

	return {
		functionDeclaration: function(name, args, body, loc) {
			return new FunctionDeclaration(name, args, body, loc);
		}
	};

});