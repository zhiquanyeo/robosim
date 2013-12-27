define(['./typechecker', './ast'],
function(TypeChecker, AST) {
	//Errors
	function CompilerError(message, loc) {
		this.message = message;
		this.loc = loc;
		this.errorType = "CompilerError";
	}

	/*
	Virtual machine instructions
	PUSH <location>/<value>
	POP <location>
	CALL <fn location> -> resolves to ... followed by JMP
	JMP <location>

	*/

	var _tempVarCounter = 0;

	//The Program object
	function Program() {
		var _eip = 0; //instruction pointer
		var _esp = 0; //stack pointer
		var _ebp = 0; //base pointer

		var _eax = null; //EAX register, for storing return values
		//Other registers (6)
		//ra, rb, rc, rd, re, rf

		var _stack = [];

		var _progmem = [];
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
		console.log('Generating function map for function ' + functionDeclaration.name);

		//This will also check for lexical scope
		/* 
		Mode of operation

		BlockStatements, and other related things will push and pop stuff onto/off the stack
		
		We first assemble a basic context (for checking), by inserting all the parameters. Then run
		through all statements 

		ALWAYS REMEMBER: parameters are pushed onto the stack in REVERSE ORDER
		*/

		var context = {};
		var stackOffset = {};
		var ebpOffset = {};

		var memMap = [];

		var numParams = functionDeclaration.parameters.length;

		//Store the arguments in context
		for (var i = 0, len = functionDeclaration.parameters.length; i < len; i++) {
			console.log('\tParameter [' + i + ']: ', functionDeclaration.parameters[i]);
			var param = functionDeclaration.parameters[i];
			var paramType = param.type;

			//there really should only be ONE declarator
			var declarator = param.declarators[0];
			if (context[declarator.name] !== undefined) {
				throw new CompilerError("Parameter '" + declarator.name + "' has already been defined", declarator.loc);
			}
			context[declarator.name] = {
				type: 'parameter',
				varType: paramType
			};

			//These do not go on the stack, instead they are EBP offsets
			ebpOffset[declarator.name] = -(i + 1); //1 slot reserved for return address
		}

		//Look for any local variables
		//These will be stored at EBP + whatever

		//Support function
		function _storeVarInContext(variable, ctx) {
			if (ctx[variable.name] !== undefined) {
				throw new CompilerError("Variable '" + variable.name + "' has already been defined", variable.ref.loc);
			}

			ctx[variable.name] = {
				type: "variable",
				varType: variable.varType,
			};
		}

		// INVARIANT: Variables MUST be declared before they are referenced

		var toInit = []; //store any initialization things that we need to do
		var localVarEbpOffset = 0;
		for (var i = 0, len = functionDeclaration.body.length; i < len; i++) {
			var funcStatement = functionDeclaration.body[i];
			if (funcStatement.nodeType === "VariableDeclaration") {
				//console.log("\tProcessing variable declaration statement");
				var variables = _getVariables(funcStatement);
				//console.log("\tvariables: ", variables);

				for (var j = 0, len2 = variables.length; j < len2; j++) {
					//Attempt to store in context
					var variable = variables[j];
					_storeVarInContext(variable, context);

					//If we got here, we're fine
					ebpOffset[variable.name] = ++localVarEbpOffset;
					if (variable.initializer) {
						toInit.push({
							name: variable.name,
							initializer: variable.initializer
						});
					}
				}
			}
			else if (funcStatement.nodeType === "BinaryExpression") {
				var instructions = _evalExpression(funcStatement, ebpOffset, true);
				_prettyPrintInstructions(instructions);
			}
		}

		console.log("\tContext: ", context);
		console.log("\tEBP Offsets: ", ebpOffset);
		console.log('\tOutstanding initializations: ', toInit);


		//Generate the memory map
		for (var i = 0, len = functionDeclaration.body.length; i < len; i++) {
			var statement =functionDeclaration.body[i];

			//Ignore VariableDeclaration
			if (statement.nodeType === "VariableDeclaration") {
				continue;
			}
			
			console.log("\tProcessing statement: ", statement);


		}

		// === Process initializers

		
		console.log("========================================================\n\n");
	}

	function _prettyPrintInstructions(instructions) {
		for (var i = 0, len = instructions.length; i < len; i++) {
			var instr = instructions[i];
			var str = instr.type + " ";

			if (instr.type === "STORE") {
				str += instr.location + " ";
				if (instr.value.type === "raw") {
					str += instr.value.value;
				}
				else if (instr.value.type === "offset") {
					str += "[" + instr.value.base + (instr.value.offset >= 0 ? "+" : "") + instr.value.offset + "]";
				}
			}
			else if (instr.type === "ADD" || instr.type === "MUL") {
				str += instr.location + " ";
				if (instr.value.type === "raw") {
					str += instr.value.value;
				}
				else if (instr.value.type === "register") {
					str += instr.value.base;
				}
				else if (instr.value.type === "offset") {
					str += "[" + instr.value.base + (instr.value.offset >= 0 ? "+" : "") + instr.value.offset + "]";
				}
			}

			console.log(str);
		}
	}

	//Convert an expression into memory map format
	//(break down into individual ops)
	//Left side, stored in RA, right side and evaled in RB
	function _evalExpression (expr, ebpOffsets, isTopLevel) {
		var instructions = [];

		//Evaluate the left
		if (expr.left.nodeType == "Literal") {
			//Generate a STORE command
			instructions.push({
				type: 'STORE',
				location: 'RA',
				value: {
					type: 'raw',
					value: expr.left.value,
				}
			});
		}
		else if (expr.left.nodeType == "Identifier") {
			//Attempt to load from ebpOffset
			if (ebpOffsets[expr.left.label] === undefined) {
				throw new CompilerError("'" + expr.left.label + "' is not defined in current context", expr.left.loc);
			}
			instructions.push({
				type: 'STORE',
				location: 'RA',
				value: {
					type: 'offset',
					base: 'ebp',
					offset: ebpOffsets[expr.left.label]
				}
			});
		}
		else {
			//set instructions to point at whatever array was returned by eval-ing
			instructions = _evalExpression(expr.left, ebpOffsets);
		}

		//Now do the right side
		if (expr.right.nodeType == "Literal") {
			instructions.push({
				type: 'STORE',
				location: 'RB',
				value: {
					type: 'raw',
					value: expr.right.value
				}
			});
		}
		else if (expr.right.nodeType == "Identifier") {
			if (ebpOffsets[expr.right.label] === undefined)
				throw new CompilerError("'" + expr.right.label + "' is not defined in current context", expr.right.loc);

			instructions.push({
				type: 'STORE',
				location: 'RB',
				value: {
					type: 'offset',
					base: 'ebp',
					offset: ebpOffsets[expr.right.label]
				}
			});
		}
		else {
			instructions = instructions.concat(_evalExpression(expr.right, ebpOffsets));
		}

		var tempvarName;
		if (!isTopLevel) {
			tempvarName = '__tempVar' + (_tempVarCounter++);
			//initialize a temp variable to hold this
			instructions.push({
				type: 'STORE',
				location: {
					type: 'tempvar',
					name: tempvarName
				},
				value: {
					type: 'register',
					base: 'RB'
				}
			});
		}

		//do the op
		var op;
		switch (expr.operator) {
			case "+":
				instructions.push({
					type: 'ADD',
					location: (isTopLevel ? 'RA' : {type:'tempvar', name: tempvarName}),
					value: {
						type: 'register',
						base: 'RB'
					}
				});
				break;
			case "*":
				instructions.push({
					type: 'MUL',
					location: (isTopLevel ? 'RA' : {type:'tempvar', name: tempvarName}),
					value: {
						type: 'register',
						base: 'RB'
					}
				});
				break;
		}

		return instructions;
	}

	//Flatten out an expression
	//series of steps that are done in sequence
	//must maintain mathematical ordering
	function _flattenExpression (expr) {
		var steps = [];

		//Do a DFS
		//we also need to indicate that we need to store intermediate results
		var exp = expr;
		var prev = expr;

		//All left side expressions will be evaled and stored in RA
		//All right side expressions will be eval-ed and stored in RB
		while (exp) {
			if (exp.left && exp.right) {

			}
		}
	}

	//Simplify expressions. returns an expression
	//TERMINALS are Literal and Identifier
	function _simplifyExpression (expr) {
		if (expr.nodeType === "BinaryExpression") {
			//base case: 2 literals
			if (expr.left.nodeType === "Literal" && expr.right.nodeType === "Literal") {
				var type = TypeChecker.greatestCommonType([expr.left.value, expr.right.value]);
				if (type == "int" || type == "double")
					type = "NumericLiteral";
				else if (type == "string")
					type = "StringLiteral";
				else if (type == "boolean")
					type = "BooleanLiteral";

				//Return a literal node
				return new AST.literal(expr.execute(), type, expr.loc);
			}
			else if (expr.left.nodeType === "Literal") {
				var newRight = _simplifyExpression(right);
				return _simplifyExpression(new AST.binaryExpression(expr.operator, expr.left, newRight, expr.loc));
			}
			else if (expr.right.nodeType === "Literal") {

			}
			else {
				//Both sides are expressions
			}
		}
	}

	//This function will ONLY extract variables, types, and initializer values. It will NOT care if 
	//something is already defined
	function _getVariables (varDecl) {
		var variables = [];
		if (varDecl.nodeType == "VariableDeclaration") {
			
			for (var i = 0, len = varDecl.declarators.length; i < len; i++) {
				var declarator = varDecl.declarators[i];

				var variable = {
					type: 'variable',
					name: declarator.name,
					ref: declarator,
					varType: varDecl.type,
					isArray: varDecl.isArray,
					initializer: declarator.initializer,
				};

				variables.push(variable);
			}
		}

		return variables;
	}

	//Simply extract a list of variables and types from a variable declaration
	//Will also store the variables in context
	//about damn time i wrote this....
	function _getVariableInfo (varDecl, context) {
		if (varDecl.nodeType !== "VariableDeclaration") {
			throw new CompilerError("Trying to obtain variable declaration information from a non-VariableDeclaration type", varDecl.loc);
		}
		var retVariables = {};
		//Parse the declarators
		for (var i = 0, len = varDecl.declarators.length; i < len; i++) {
			var declarator = varDecl.declarators[i];
			//check if this already exists in a given context
			if (context[declarator.name] !== undefined) {
				throw new CompilerError("'" + declarator.name + "' has already been declared", declarator.loc);
			}

			var variable = {
				type: 'variable',
				varType: varDecl.type,
				isArray: varDecl.isArray,
			};

			if (declarator.initializer !== undefined) {
				var initializer = declarator.initializer;

				var value = _getValue(initializer, context);
				if (varDecl.isArray) {
					if (value.length !== undefined) {
						var arrayValues = value;
						var tempArray = [];
						for (var valIdx = 0, valLen = value.length; valIdx < valLen; valIdx++) {
							var tmpVal = _getValue(arrayValues[valIdx], context);

							if (TypeChecker.typeCheck(varDecl.type, tmpVal)) {
								tmpVal = TypeChecker.coerceValue(varDecl.type, tmpVal);
							}
							else {
								throw new CompilerError("Cannot assign value of type " + (typeof value) + " to array variable of type " + varDecl.type, initializer.loc);
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
					if (TypeChecker.typeCheck(varDecl.type, value)) {
						value = TypeChecker.coerceValue(varDecl.type, value);
					}
					else {
						throw new CompilerError("Cannot assign value of type " + (typeof value) + " to variable of type " + varDecl.type, initializer.loc);
					}
					variable.value = value;
				}
			}
			else {
				//defaults
				switch(varDecl.type) {
					case "int":
					case "double":
						variable.value = 0;
						break;
					case "boolean":
						variable.value= false;
						break;
					case "string":
						variable.value = "";
						break;
				}
			}
			context[declarator.name] = variable;
			
			retVariables[declarator.name] = variable;
		}

		return retVariables;
	}

	function _compile(progAst) {
		//We need a setup() routine, and a loop() routine to exist
		var _memoryMap = [];
		var _heap = {};

		var _data = {}; //Data segment, all global variables

		var _functions = {};

		//TODO: Inject built in functions

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
				var variables = _getVariableInfo(progStatement, _data);

			}
			else {
				//Throw an error, we only support function declarations and variable declarations at the top level
				throw new CompilerError("Top level of program can only contain function declarations or variable declarations", progStatement, progStatement.loc);
			}
		}
	}

	return {
		compile: _compile,
	};
});