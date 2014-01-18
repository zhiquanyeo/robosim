define(['./typechecker', './ast'],
function(TypeChecker, AST) {
	//Compiler settings
	var ALLOW_VARIABLES_IN_BLOCK = false;
	var ALLOW_VARIABLE_DECLARATION_IN_FOR_LOOP = false;

	var VERBOSE = false;

	//Errors
	function CompilerError(message, loc) {
		this.message = message;
		this.loc = loc;
		this.errorType = "CompilerError";
	}

	//The Program. Self contained execution unit, including program counter
	function Program(memmap, globalVars, mainOffset) {
		var _pc = 0; //program counter;
		var _sp = 0; //Stack Pointer
		var _bp = 0; //Base pointer

		var _zf = false; //zero flag

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

		var _stack = [-1, null];
		_sp = 2; //Start at 2, slot 0 is termination marker, slot 1 is base pointer
		_bp = 1;

		var _progmem = memmap;

		//this is an array of global variables
		//they are accessed as offsets from the EGV pointer
		var _globals = globalVars;

		//Start the PC at main
		_pc = mainOffset;


		if (VERBOSE) console.log('---- Program ready ----');
		if (VERBOSE) console.log('_pc is set to ', _pc);

		this.reset = function() {
			_pc = mainOffset;
			stack = [-1, null];
			_sp = 2;
			_bp = 1;
			_zf = false;
		}

		this.getPC = function () {
			return _pc;
		};

		this.getSP = function () {
			return _sp;
		};

		this.getBP = function () {
			return _bp;
		};

		this.getZF = function() {
			return _zf;
		};

		this.getStack = function() {
			return _stack;
		};

		this.getInstructions = function() {
			return _progmem;
		};

		this.getRegisters = function() {
			return registers;
		};

		//We also need to register any external functions
		var _externalFunctions = {};

		this.registerExternalFunction = function(name, func) {
			_externalFunctions[name] = func;
		};

		function _getValue(addrInfo) {
			var actualAddress;
			switch (addrInfo.type) {
				case 'raw':
					return addrInfo.value;
				case 'register':
					return registers[addrInfo.value];
				case 'pointer':
					if (addrInfo.value === 'EGV') {
						//we know globals will always have an offset
						return _globals[addrInfo.offset];
					}
					if (addrInfo.value === 'EBP') {
						actualAddress = _bp;
					}
					else if (addrInfo.value === 'ESP') {
						actualAddress = _sp;
					}
					if (addrInfo.offset)
						actualAddress += addrInfo.offset;
					return _stack[actualAddress];
				case 'pointerAddress':
					if (addrInfo.value === 'EBP') {
						actualAddress = _bp;
					}
					else if (addrInfo.value === 'ESP') {
						actualAddress = _sp;
					}
					else if (addrInfo.value === 'PC') {
						actualAddress = _pc;
					}
					if (addrInfo.offset)
						actualAddress += addrInfo.offset;
					return actualAddress;
				case 'registerValue':
					var val = registers[addrInfo.value];
					if (addrInfo.offset) 
						val += addrInfo.offset;
					return _stack[val];
			}
		}

		function _setValue(addrInfo, valueInfo) {
			switch (addrInfo.type) {
				case 'register':
					registers[addrInfo.value] = _getValue(valueInfo);
					break;
				case 'pointerAddress':
					if (addrInfo.value === 'EBP')
						_bp = _getValue(valueInfo);
					else if (addrInfo.value === 'ESP')
						_sp = _getValue(valueInfo);
						//_stack = _stack.splice(0, _sp);
					break;
				case 'pointer':
					var addr;
					if (addrInfo.value === 'EGV') {
						_globals[addrInfo.offset] = _getValue(valueInfo);
						return;
					}
					if (addrInfo.value === 'EBP')
						addr = _bp;
					else if (addrInfo.value === 'ESP')
						addr = _sp;
					if (addrInfo.offset)
						addr += addrInfo.offset;
					_stack[addr] = _getValue(valueInfo);
					break;
				case 'registerValue':
					var val = registers[addrInfo.value];
					if (addrInfo.offset)
						val += addrInfo.offset;
					_stack[val] = _getValue(valueInfo);
					break;
				default:
					console.error("Could not process setValue instruction");
			}
		}

		function _printStackInfo() {
			if (VERBOSE) console.log("=== STACK ===");
			if (VERBOSE) console.log("Stack Pointer: ", _sp);
			if (VERBOSE) console.log("Base Pointer: ", _bp);
			for (var i = 0, len = _stack.length; i < len; i++) {
				if (VERBOSE) console.log('[' + i + ']', _stack[i]);
			}
			if (VERBOSE) console.log('=== END STACK ===');
		}

		function _printRegisters() {
			if (VERBOSE) console.log("=== REGISTERS ===");
			for (var i in registers) {
				if (VERBOSE) console.log("'" + i + "' - ", registers[i]);
			}
			if (VERBOSE) console.log("=== END REGISTERS ===");
		}

		function _printInfo() {
			_printStackInfo();
			_printRegisters();
		}

		//This executes in blocks
		var _lastContext;
		this.executeNextBlock = function () {
			if (_pc >= _progmem.length || _pc < 0)
				return false;

			var instruction = _progmem[_pc];
			if (instruction.executionUnit != _lastContext) {
				_lastContext = instruction.executionUnit;
			}

			while (this.getCurrentInstruction() && 
				this.getCurrentInstruction().executionUnit == _lastContext &&
				this.hasNextStatement()) {

				this.executeNext();
			}

			return this.hasNextStatement();
		}

		this.getCurrentInstruction = function () {
			return _progmem[_pc];
		}

		//returns true if statement was executed, false otherwise
		this.executeNext = function() {
			if (_pc >= _progmem.length || _pc < 0)
				return false;

			if (VERBOSE) console.log('-- pc:', _pc);
			var instruction = _progmem[_pc];
			//increment the pc here
			_pc++;

			switch (instruction.type) {
				case "PUSH": {
					_stack[_sp] = _getValue(instruction.source);
					//_stack.push(_getValue(instruction.source));
					_sp++;
				} break;
				case 'POP': {
					_sp--;
					_setValue(instruction.destination, {
						type: 'raw',
						value: _stack[_sp]
						//value: _stack.pop()
					});
				} break;
				case 'MOV': {
					_setValue(instruction.destination, instruction.source);
				} break;
				case 'ADD': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) + _getValue(instruction.source)
					});
				} break;
				case 'SUB': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) - _getValue(instruction.source)
					});
				} break;
				case 'MUL': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) * _getValue(instruction.source)
					});
				} break;
				case 'DIV': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) / _getValue(instruction.source)
					});
				} break;
				case 'CALL': {
					_pc = _getValue(instruction.offset);
					if (VERBOSE) console.log('setting PC to ', _getValue(instruction.offset));
				} break;

				case 'EQ': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) == _getValue(instruction.source)
					});
				} break;
				case 'NEQ': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) != _getValue(instruction.source)
					});
				} break;
				case 'LT': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) < _getValue(instruction.source)
					});
				} break;
				case 'LTE': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) <= _getValue(instruction.source)
					});
				} break;
				case 'GT': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) > _getValue(instruction.source)
					});
				} break;
				case 'GTE': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) >= _getValue(instruction.source)
					});
				} break;
				case 'CMP': {
					_zf = (_getValue(instruction.destination) - _getValue(instruction.source)) == 0;
				} break;
				case 'RJNE': {
					if (!_zf) {
						_pc = _pc + _getValue(instruction.offset);
					}
				} break;
				case 'RJEQ': {
					if (_zf) {
						_pc = _pc + _getValue(instruction.offset);
					}
				} break;
				case 'RJMP': {
					_pc = _pc + _getValue(instruction.offset);
				} break;
				case 'NEG': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) * -1
					});
				} break;
				case 'INC': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) + 1
					});
				} break;
				case 'DEC': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) - 1
					});
				} break;
				case 'NOT': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: !_getValue(instruciton.destination)
					});
				} break;
				case 'AND': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) && _getValue(instruction.source)
					});
				} break;
				case 'OR': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) || _getValue(instruction.source)
					});
				} break;
				case 'XOR': {
					_setValue(instruction.destination, {
						type: 'raw',
						value: _getValue(instruction.destination) ^ _getValue(instruction.source)
					});
				} break;
				//Experimental
				case 'EXT': {
					if (VERBOSE) console.log('running external:', instruction);
					//Get the list of parameters ready
					var numParams = instruction.data.length;
					var data = [];
					for (var i = 0; i < numParams; i++) {
						data.push(_getValue({
							type: 'pointer',
							value: 'EBP',
							offset: -2 - i,
						}));
					}
					if (VERBOSE) console.log('passing parameters: ', data);
					if (_externalFunctions[instruction.command]) {
						var retValue = _externalFunctions[instruction.command].apply(null, data);
						if (retValue !== undefined) {
							registers['RAX'] = retValue;
						}
					}
				} break;

				case 'RET': {
					//_sp = _bp;
					//_bp = _stack[_bp];
					//if (VERBOSE) console.log ('new stack pointer:', _sp);
					//if (VERBOSE) console.log('new base pointer:', _bp);
					_pc = _stack[_sp-1];
					_sp--;
					if (VERBOSE) console.log('pc: ', _pc);
					if (VERBOSE) console.log('--- returning from function ---');
					_stack = _stack.slice(0, _sp);
					
				} break;
			}

			//_printInfo();
			return true;
		};

		this.hasNextStatement = function() {
			return _pc < _progmem.length && _pc >= 0;
		};
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
			return "SUB " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
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
			return "MUL " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
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
			return "DIV " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
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
			return "AND " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
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
			return "OR " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
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
			return "XOR " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
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
			return "INC " + _generateTargetString(this.destination);
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
			return "DEC " + _generateTargetString(this.destination);
		}.bind(this);
	}

	function NEGInstruction(dest, executionUnit, comment) {
		this.destination = dest;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'NEG';
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
			return "NEG " + _generateTargetString(this.destination);
		}.bind(this);
	}

	function NOTInstruction(dest, executionUnit, comment) {
		this.destination = dest;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'NOT';
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
			return "NOT " + _generateTargetString(this.destination);
		}.bind(this);
	}

	function RJMPInstruction(k, executionUnit, comment) {
		this.offset = k;

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
			return "RJMP " + _generateTargetString(this.offset);
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
		this.offset = k;

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
			return "CALL " + _generateTargetString(this.offset);
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
	function CMPInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'CMP';
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
			return "CMP " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
		}.bind(this);
	}

	function EQInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'EQ';
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
			return "EQ " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
		}.bind(this);
	}

	function NEQInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'NEQ';
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
			return "NEQ " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
		}.bind(this);
	}

	function LTInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'LT';
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
			return "LT " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
		}.bind(this);
	}

	function LTEInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'LTE';
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
			return "LTE " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
		}.bind(this);
	}

	function GTInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'GT';
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
			return "GT " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
		}.bind(this);
	}

	function GTEInstruction(dest, src, executionUnit, comment) {
		this.destination = dest;
		this.source = src;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'GTE';
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
			return "GTE " + _generateTargetString(this.destination) + ", " + _generateTargetString(this.source);
		}.bind(this);
	}

	//Branching
	//Relative jump if equal
	function RJEQInstruction(k, executionUnit, comment) {
		this.offset = k;


		Object.defineProperty(this, 'type', {
			get: function() {
				return 'RJEQ';
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
			return "RJEQ " + this.offset;
		}.bind(this);
	}

	//Relative jump if not equal
	function RJNEInstruction(k, executionUnit, comment) {
		this.offset = k;


		Object.defineProperty(this, 'type', {
			get: function() {
				return 'RJNE';
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
			return "RJNE " + _generateTargetString(this.offset);
		}.bind(this);
	}

	//Relative jump if equal
	function RJEQInstruction(k, executionUnit, comment) {
		this.offset = k;


		Object.defineProperty(this, 'type', {
			get: function() {
				return 'RJEQ';
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
			return "RJEQ " + _generateTargetString(this.offset);
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

	//External function call for special functions
	function EXTInstruction(command, data, executionUnit, comment) {
		this.command = command;
		this.data = data;

		Object.defineProperty(this, 'type', {
			get: function() {
				return 'EXT';
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
			return "EXT " + this.command;
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
			//Constant fold first
			var newNode = node.cfold();
			//just return a placeholder object

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
					if (VERBOSE) console.log('value: ', value);
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
					case "bool":
						variable.value = false;
						break;
					case "string":
						variable.value = "";
						break;
				}
			}
			variable.isGlobal = true;
			context[variable.name] = variable;
		}
	}

	function _compileBlock (blockStatement, context, isLoop) {
		//essentially a copy of function
		//TODO: Right now we cannot specify variables in block statement
		var map = [];
		var varmap = [];

		var blockContext = {
			__parentContext: context
		};

		//we'll need to reset the EBP and ESP (similar to a function call)
		var basePointerOffsets = {};
		var bpOffset = 0; //get ready for local variables

		var pendingInitializers = [];

		var setupmap = [];
		if (ALLOW_VARIABLES_IN_BLOCK) {
			//store ESP in R7
			setupmap.push(new MOVInstruction({
				type: 'register',
				value: 'R7'
			}, {
				type: 'pointerAddress',
				value: 'ESP'
			}, blockStatement, 'Move ESP into R7'));


		}

		var varCount = 0;

		for (var i = 0, len = blockStatement.body.length; i < len; i++) {
			var statement = blockStatement.body[i];

			if (statement.nodeType === "VariableDeclaration") {
				if (!ALLOW_VARIABLES_IN_BLOCK) {
					throw new CompilerError("Variable declarations are not allowed in block statements", statement.loc);
				}

				var variables = _getVariables(statement);
				for (var v = 0; v < variables.length; v++) {
					var variable = variables[v];
					if (blockContext[variable.name] !== undefined) {
						throw new CompilerError("'" + variable.name + "' has already been declared", statement.loc);
					}

					blockContext[variable.name] = variable;

					if (variable.initializer !== undefined) {
						pendingInitializers.push({
							name: variable.name,
							initializer: variable.initializer
						});
					}

					basePointerOffsets[variable.name] = bpOffset++;
					var defaultVal;
					if (variable.varType === "int" || variable.varType === "double")
						defaultVal = 0;
					else if (variable.varType === "bool")
						defaultVal = false;
					else if (variable.varType === "string")
						defaultVal = "";

					varmap.push(new PUSHInstruction({
						type: 'raw',
						value: defaultVal,
					}, statement, "Set up space for variable '" + variable.name + "' on stack"));
					varCount++;
				}
			}
			else if (statement.nodeType === "AssignmentExpression") {
				var assignmentMap = _compileAssignment(statement, blockContext);
				map = map.concat(assignmentMap);
			}
			else if (statement.nodeType === "CallExpression") {
				var callMap = _compileFunctionCall(statement, blockContext);
				map = map.concat(callMap);
			}
			else if (statement.nodeType === "IfStatement") {
				var ifMap = _compileIfStatement(statement, blockContext, true);
				map = map.concat(ifMap);
			}
			else if (statement.nodeType === "DoWhileStatement") {
				var doWhileMap = _compileDoWhileLoop(statement, blockContext);
				map = map.concat(doWhileMap);
			}
			else if (statement.nodeType === "WhileStatement") {
				var whileMap = _compileWhileLoop(statement, blockContext);
				map = map.concat(whileMap);
			}
			else if (statement.nodeType === "ForStatement") {
				var forMap = _compileForLoop(statement, blockContext);
				map = map.concat(forMap);
			}
			else if (statement.nodeType === "BreakStatement") {
				if (isLoop) {
					map.push(new RJMPInstruction({
						type: 'pendingRelativeJump',
						value: 'end'
					}, statement, "Jump to end of loop"));
				}
			}
			else if (statement.nodeType === "ContinueStatement") {
				if (isLoop) {
					throw new CompilerError("[NOT IMPLEMENTED YET] continue statement", statement.loc);
					// map.push(new RJMPInstruction({
					// 	type: 'pendingRelativeJump',
					// 	value: 'start'
					// }, statement, "Jump to beginning of loop"));
				}
			}
			else if (statement.nodeType === 'UnaryExpression') {
				throw new CompilerError("[NOT IMPLEMENTED YET] UnaryExpression in function", statement.loc);
			}
			else if (statement.nodeType === 'UpdateExpression') {
				var updateMap = _compileExpression(statement, blockContext);
				map = map.concat(updateMap);
				if (statement.expression.nodeType === 'Identifier') {
					var item = _getRawFromContext(statement.expression.label, blockContext, statement.expression.loc);
					var destType = 'pendingVariable';
					if (item.isGlobal)
						destType = 'pendingGlobal';
					map.push(new POPInstruction({
						type: destType,
						value: {
							name: statement.expression.label
						}
					}, statement.expression, "Pop variable back into variable space"));
				}
			}
		}

		//handle initializers
		for (var vi = 0; vi < pendingInitializers.length; vi++) {
			var pInit = pendingInitializers[vi];
			var varInfo = blockContext[pInit.name];
			if (pInit.initializer.nodeType === "Literal") {
				var value = pInit.initializer.value;
				if (TypeChecker.typeCheck(varInfo.varType, value)) {
					value = TypeChecker.coerceValue(varInfo.varType, value);

					varmap.push(new MOVInstruction({
						type: 'registerValue',
						value: 'R7',
						offset: basePointerOffsets[pInit.name]
					}, {
						type: 'raw',
						value: value
					}, pInit.initializer, "Assign value to variable '" + pInit.name +"'"));

					// varmap.push(new MOVInstruction({
					// 	type: 'pointer',
					// 	value: 'EBP',
					// 	offset: basePointerOffsets[pInit.name]
					// }, {
					// 	type: 'raw',
					// 	value: value
					// }, pInit.initializer, "Assign value to variable '" + pInit.name +"'"));
				}
			}
			else if (pInit.initializer.nodeType === "Identifier") {
				var targetInfo = _getRawFromContext(pInit.initializer.label, blockContext, pInit.initializer.loc);
				//If the variable was not declared in this block scope then we set it to be pending
				var sourceValue;
				if (blockContext[pInit.initializer.label] !== undefined) {
					sourceValue = {
						type: 'registerValue',
						value: 'R7',
						offset: basePointerOffsets[pInit.initializer.label]
					}
				}
				else {
					var destType = 'pendingVariable';
					if (targetInfo.isGlobal)
						destType = 'pendingGlobal';

					sourceValue = {
						type: destType, 
						value: {
							name: pInit.name
						}
					}
				}

				varmap.push(new MOVInstruction({
					type: 'registerValue',
					value: 'R7',
					offset: basePointerOffsets[pInit.name]
				}, sourceValue, pInit.initializer, "Assign value to variable '" + pInit.name + "'"));

			}
			else if (pInit.initializer.nodeType === "BinaryExpression") {
				var exprMap = _compileExpression(pInit.initializer, blockContext);
				varmap = varmap.concat(exprMap);
				varmap.push(new POPInstruction({
					type: 'registerValue',
					value: 'R7',
					offset: basePointerOffsets[pInit.name]
				}, pInit.initializer, "Move result of expression into variable '" + pInit.name + "'"));
			}
			else if (pInit.initializer.nodeType === "CallExpression") {
				var callMap = _compileFunctionCall(pInit.initializer, blockContext);
				varmap = varmap.concat(callMap);
				varmap.push(new MOVInstruction({
					type: 'registerValue',
					value: 'R7',
					offset: basePointerOffsets[pInit.name]
				}, {
					type: 'register',
					value: 'RAX'
				}, pInit.initializer, "Assign result of function call to variable '" + pInit.name + "'"));
			}
		}
		varmap = setupmap.concat(varmap);
		map = varmap.concat(map);
		map.push(new SUBInstruction({
			type: 'pointerAddress',
			value: 'ESP'
		}, {
			type: 'raw',
			value: varCount
		}, blockStatement, "Move stack pointer back " + varCount + " slots to remove variables"));

		//fix any pending variables
		for (var i = 0, len = map.length; i < len; i++) {
			var stmt = map[i];
			if (stmt.destination) {
				if (stmt.destination.type === 'pendingVariable') {
					var ebpOffset = basePointerOffsets[stmt.destination.value.name];
					if (ebpOffset !== undefined) {
						stmt.destination.type = "registerValue";
						stmt.destination.value = "R7";
						stmt.destination.offset = ebpOffset;
					}
				}
			}
			if (stmt.source) {
				if (stmt.source.type === 'pendingVariable') {
					var ebpOffset = basePointerOffsets[stmt.source.value.name];
					if (ebpOffset !== undefined) {
						stmt.source.type = "registerValue";
						stmt.source.value = "R7";
						stmt.source.offset = ebpOffset;
					}
				}
			}
		}

		return map;
	}

	function _compileExpression (statement, context) {
		//The idea is that the result will always be stored in R0
		if (VERBOSE) console.log('compiling expression', statement);
		var map = [];

		//do the operation and push the result on to the stack
		if (statement.nodeType === "Literal") {
			map.push(new PUSHInstruction({
				type: 'raw',
				value: statement.value,
			}, statement, "Push raw value on to stack while processing expression"));
		}
		else if (statement.nodeType === "Identifier") {
			var item = _getRawFromContext(statement.label, context, statement.loc);
			var type = 'pendingVariable';
			if (item.isGlobal) {
				type = 'pendingGlobal'
			}
			map.push(new PUSHInstruction({
				type: type,
				value: {
					name: statement.label
				}
			}, statement, "Push variable value onto stack while processing expression"));
		}
		else if (statement.nodeType === 'UnaryExpression') {
			var exprMap = _compileExpression(statement.expression, context);
			map = map.concat(exprMap);
			//if the operator is '+', we don't need to do anything else
			if (statement.operator === '-') {
				//pop the result off the stack and into R0
				map.push(new POPInstruction({
					type: 'register',
					value: 'R0',
				}, statement.expression, "Pop expression value into R0"));

				//negate
				map.push(new NEGInstruction({
					type: 'register',
					value: 'R0'
				}, statement.operator, "Negate value in R0"));

				map.push(new PUSHInstruction({
					type: 'register',
					value: 'R0'
				}, statement.expression, "Push new value back onto stack"));
			}
			else if (statement.operator === '!') {
				map.push(new POPInstruction({
					type: 'register',
					value: 'R0',
				}, statement.expression, "Pop expression value into R0"));

				//negate
				map.push(new NOTInstruction({
					type: 'register',
					value: 'R0'
				}, statement.operator, "Negate value in R0"));

				map.push(new PUSHInstruction({
					type: 'register',
					value: 'R0'
				}, statement.expression, "Push new value back onto stack"));
			}
			else if (statement.operator !== '+') {
				//anything else, we throw an error
				//for now...
				throw new CompilerError("[NOT IMPLEMENTED YET] UnaryExpression operators other than +/-", statement.operator.loc);
			}

		}
		else if (statement.nodeType === 'CallExpression') {
			var callMap = _compileFunctionCall(statement, context);
			//result is in RAX
			map = map.concat(callMap);
			map.push(new PUSHInstruction({
				type: 'register',
				value: 'RAX'
			}, statement, "Push result of function call onto stack"));
		}
		else if (statement.nodeType === "UpdateExpression") {
			var exprMap = _compileExpression(statement.expression, context);
			map = map.concat(exprMap);
			//pop the result into R0 first
			map.push(new POPInstruction({
				type: 'register',
				value: 'R0'
			}, statement.expression, "Pop expression value into R0"));

			if (statement.operator === '--') {
				map.push(new DECInstruction({
					type: 'register',
					value: 'R0'
				}, statement.expression, "Decrement R0"));
			}
			else if (statement.operator === '++') {
				map.push(new INCInstruction({
					type: 'register',
					value: 'R0'
				}, statement.expression, "Increment R0"));
			}
			else {
				throw new CompilerError("Only ++/-- are supported for update expressions", statement.operator.loc);
			}

			map.push(new PUSHInstruction({
				type: 'register',
				value: 'R0'
			}, statement.expression, "Push new value back onto stack"));
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
				case "-":
					map.push(new SUBInstruction({
						type: 'register',
						value: 'R0'
					}, {
						type: 'register',
						value: 'R1'
					}, statement, "Perform SUB operation on R0 and R1"));
					break;
				case "*":
					map.push(new MULInstruction({
						type: 'register',
						value: 'R0'
					}, {
						type: 'register',
						value: 'R1'
					}, statement, "Perform MUL operation on R0 and R1"));
					break;
				case "/":
					map.push(new DIVInstruction({
						type: 'register',
						value: 'R0'
					}, {
						type: 'register',
						value: 'R1'
					}, statement, "Perform DIV operation on R0 and R1"));
					break;
				case "==":
					//Just push the result (true/false)
					map.push(new EQInstruction({
						type: 'register',
						value: 'R0',
					}, {
						type: 'register',
						value: 'R1',
					}, statement, "Perform EQ operation on R0 and R1 and store in R0"));
					break;
				case "!=":
					//Just push the result (true/false)
					map.push(new NEQInstruction({
						type: 'register',
						value: 'R0',
					}, {
						type: 'register',
						value: 'R1',
					}, statement, "Perform NEQ operation on R0 and R1 and store in R0"));
					break;
				case "<":
					//Just push the result (true/false)
					map.push(new LTInstruction({
						type: 'register',
						value: 'R0',
					}, {
						type: 'register',
						value: 'R1',
					}, statement, "Perform LT operation on R0 and R1 and store in R0"));
					break;
				case "<=":
					//Just push the result (true/false)
					map.push(new LTEInstruction({
						type: 'register',
						value: 'R0',
					}, {
						type: 'register',
						value: 'R1',
					}, statement, "Perform LTE operation on R0 and R1 and store in R0"));
					break;
				case ">":
					//Just push the result (true/false)
					map.push(new GTInstruction({
						type: 'register',
						value: 'R0',
					}, {
						type: 'register',
						value: 'R1',
					}, statement, "Perform GT operation on R0 and R1 and store in R0"));
					break;
				case ">=":
					//Just push the result (true/false)
					map.push(new GTEInstruction({
						type: 'register',
						value: 'R0',
					}, {
						type: 'register',
						value: 'R1',
					}, statement, "Perform GTE operation on R0 and R1 and store in R0"));
					break;
				case "&&":
					map.push(new ANDInstruction({
						type: 'register',
						value: 'R0',
					}, {
						type: 'register',
						value: 'R1'
					}, statement, "Perform AND operation on R0 and R1 and store in R0"));
					break;
				case "||":
					map.push(new ORInstruction({
						type: 'register',
						value: 'R0',
					}, {
						type: 'register',
						value: 'R1'
					}, statement, "Perform OR operation on R0 and R1 and store in R0"));
					break;
				case "^":
					map.push(new XORInstruction({
						type: 'register',
						value: 'R0',
					}, {
						type: 'register',
						value: 'R1'
					}, statement, "Perform XOR operation on R0 and R1 and store in R0"));
					break;
				
				default:
					throw new CompilerError("Operation '" + statement.operator + "' is not supported yet", statement.loc);
			}

			map.push(new PUSHInstruction({
				type: 'register',
				value: 'R0'
			}, statement, "Push result onto the stack"));
		}

		return map;
	}

	function _compileAssignment (statement, context) {
		if (VERBOSE) console.log('compiling assignment expression: ', statement);
		var map = [];

		//verify that we have an appropriate left side
		if (statement.left.nodeType !== "Identifier" && statement.left.nodeType !== "MemberExpression") {
			throw new CompilerError("Left hand side of assignment expression must be a variable or array member", statement.loc);
		}

		var storageLocation = {};
		if (statement.left.nodeType === "Identifier") {
			//attempt to query the context
			var item = _getRawFromContext(statement.left.label, context, statement.left.loc);
			if (item.isGlobal)
				storageLocation.isGlobal = true;
			storageLocation.name = statement.left.label;
		}
		else {
			//member expression
			//we only support single dimensional arrays
			if (statement.left.base.nodeType !== "Identifier") {
				throw new CompilerError("Only single dimensional arrays are supported", statement.left.base.loc);
			}
			var data = _getRawFromContext(statement.left.base.label, context, statement.left.base.loc);
			if (!data.isArray) {
				throw new CompilerError("'" + statement.left.base.label + "' is not an array and does not support indexing", statement.left.base.loc);
			}
			storageLocation.name = statement.left.base.label;
			if (data.isGlobal)
				storageLocation.isGlobal = true;

			if (VERBOSE) console.log('index: ', statement.left.property);

			if (statement.left.property.nodeType === "Literal") {
				if (statement.left.property.type !== "NumericLiteral") {
					throw new CompilerError("Array index must be a number", statement.left.property.loc);
				}
				storageLocation.index = statement.left.property.value;
			}
			else if (statement.left.property.nodeType === "Identifier") {
				throw new CompilerError("Member expression assignment to property has NOT BEEN IMPLEMENTED", statement.left.property.loc);
			}
			else {
				if (statement.left.property.nodeType !== 'BinaryExpression')
					throw new CompilerError("Cannot evaluate array index", statement.left.property.loc);

				//it's a binary expression, so... generate the statements
				//the result will be stored on the stack
				var exprMap = _compileExpression(statement.left.property, context);

			}

			//TODO Implement
			//Ugh we have to evaluate the location
			//store it in R7
			//storageLocation.index = 
		}

		//simplify the right side expression
		//check the operator first
		var newRight;
		
		if (statement.operator != '=') {
			var newOp;
			switch (statement.operator) {
				case '+=':
					newOp = '+';
					break;
				case '-=':
					newOp = '-';
					break;
				case '*=':
					newOp = '*';
					break;
				case '/=':
					newOp = '/';
					break;
					
			}
			newRight = AST.binaryExpression(newOp, statement.left, statement.right, statement.right.loc);
		}
		else { 
			newRight = statement.right;
		}

		if (newRight.cfold) {
			newRight = newRight.cfold();
		}
		if (VERBOSE) console.log('newRight: ', newRight);

		//if it's a literal, we just need to do the assignment
		if (newRight.nodeType === "Literal") {
			//Generate a MOV command, with storageLocation as the destination
			var sourceType = 'pendingVariable';
			if (storageLocation.isGlobal)
				sourceType = 'pendingGlobal';
			
			map.push(new MOVInstruction({
				type: sourceType, //This tells the compiler that we still need to resolve this
				value: storageLocation,
			}, {
				type: 'raw',
				value: newRight.value
			}, statement.right, "Store value in variable '" + storageLocation.name + "'"));
		}
		else if (newRight.nodeType === "Identifier") {
			//ensure that the identifier exists
			var item = _getRawFromContext(newRight.label, context, statement.right.loc);
			var sourceType = 'pendingVariable';
			if (item.isGlobal)
				sourceType = 'pendingGlobal';
			var destType = 'pendingVariable';
			if (storageLocation.isGlobal)
				destType = 'pendingGlobal';

			map.push(new MOVInstruction({
				type: destType,
				value: storageLocation,
			}, {
				type: sourceType,
				value: {
					name: newRight.label
				}
			}, statement.right, "Store variable '" + newRight.label + "' in variable '" + storageLocation.name + "'"));
		}
		else if (newRight.nodeType === "BinaryExpression") {
			var expressionMap = _compileExpression(newRight, context);
			map = map.concat(expressionMap);
			//need to pop the expression
			map.push(new POPInstruction({
				type: 'register',
				value: 'R0'
			}, statement.right, "Put result of expression in R0"));

			var destType = 'pendingVariable';
			if (storageLocation.isGlobal)
				destType = 'pendingGlobal';

			map.push(new MOVInstruction({
				type: destType,
				value: storageLocation,
			}, {
				type: 'register',
				value: 'R0'
			}, statement.right, "Store result of expression in variable '" + storageLocation.name + "'"));
		}
		else if (newRight.nodeType === "UnaryExpression") {
			var expressionMap = _compileExpression(newRight, context);
			map = map.concat(expressionMap);
			//need to pop the expression
			map.push(new POPInstruction({
				type: 'register',
				value: 'R0'
			}, statement.right, "Put result of expression in R0"));

			var destType = 'pendingVariable';
			if (storageLocation.isGlobal)
				destType = 'pendingGlobal';

			map.push(new MOVInstruction({
				type: destType,
				value: storageLocation,
			}, {
				type: 'register',
				value: 'R0'
			}, statement.right, "Store result of expression in variable '" + storageLocation.name + "'"));
		}
		else if (newRight.nodeType === "CallExpression") {
			var callMap = _compileFunctionCall(newRight, context);
			map = map.concat(callMap);

			var destType = 'pendingVariable';
			if (storageLocation.isGlobal)
				destType = 'pendingGlobal';

			map.push(new MOVInstruction({
				type: destType,
				value: storageLocation
			}, {
				type: 'register',
				value: 'RAX'
			}, statement.right, "Assign result of function call to variable '" + storageLocation.name + "'"));
		}

		//will need to set up place holders for the variable locations


		return map;
	}

	function _compileIfStatement (statement, context, isInLoop) {
		if (VERBOSE) console.log('compiling if statement', statement);
		var map = [];

		//Some sanity checks
		if (statement.condition.nodeType === "BinaryExpression") {
			if (statement.condition.operator !== "<=" &&
				statement.condition.operator !== ">=" &&
				statement.condition.operator !== "<" &&
				statement.condition.operator !== ">" &&
				statement.condition.operator !== "==" &&
				statement.condition.operator !== "!=" &&
				statement.condition.operator !== "&&" &&
				statement.condition.operator !== "||") {
				throw new CompilerError("Condition must resolve to boolean value", statement.condition.loc);
			}
			var exprMap = _compileExpression(statement.condition, context);
			map = map.concat(exprMap);
			//result is stores on the stack, pop it into R0
			map.push(new POPInstruction({
				type: 'register',
				value: 'R0'
			}, statement.condition, "Put result of expression in R0"));

			//compare with true (this will set the zero flag if it's true)
			map.push(new CMPInstruction({
				type: 'register',
				value: 'R0',
			}, {
				type: 'raw',
				value: true
			}, statement.condition, "Compare result with true"));

			//do a RJNE (Relative Jump if NOT Equal) to a point AFTER the code block
			var trueMap;
			var elseMap;
			//compile the else statement (if present)
			if (statement.elseStatement) {
				if (statement.elseStatement.nodeType === "BlockStatement") {
					elseMap = _compileBlock(statement.elseStatement, context, isInLoop);
				}
				else if (statement.elseStatement.nodeType === "IfStatement") {
					elseMap = _compileIfStatement(statement.elseStatement, context, isInLoop)
				}
				else {
					throw new CompilerError("Expected a BlockStatement or IfStatement", statement.elseStatement.loc);
				}
			}
			else {
				elseMap = [];
			}

			if (statement.trueStatement.nodeType === "BlockStatement") {
				trueMap = _compileBlock(statement.trueStatement, context, isInLoop);
				trueMap.push(new RJMPInstruction({
					type: 'raw',
					value: elseMap.length
				}, statement.trueStatement, "Jump past the else block"));

				if (VERBOSE) console.log('trueMap: ', trueMap);
				_printAssembly(trueMap);
				var trueMapLen = trueMap.length;
				map.push(new RJNEInstruction({
					type: 'raw',
					value: trueMapLen
				}, statement.trueStatement, "Continue execution if NOT equal"));
				map = map.concat(trueMap);
				map = map.concat(elseMap);
			}
			else {
				throw new CompilerError("Expected a BlockStatement", statement.trueStatement.loc);
			}
		}
		else if (statement.condition.nodeType === "Literal") {
			throw new CompilerError("[NOT YET IMPLEMENTED] literal condition in if statement", statement.condition.loc);
		}
		else if (statement.condition.nodeType === "Identifier") {
			throw new CompilerError("[NOT YET IMPLEMENTED] identifier condition in if statement", statement.condition.loc);
		}

		return map;
	}

	function _compileForLoop (statement, context) {
		if (VERBOSE) console.log('compiling for loop', statement);
		var map = [];

		/* 
		Form:
		for (init; condition; increment) {
			body
		}

		becomes

		init;
		if (condition) {
			do {
				body
				increment
			} while (condition)
		}
		*/

		var initMap = [];
		var whileMap = [];

		if (statement.initializer) {
			if (statement.initializer.nodeType === "VariableDeclaration") {
				if (!ALLOW_VARIABLE_DECLARATION_IN_FOR_LOOP) {
					throw new CompilerError("Variable declarations are not allowed in for loop initializer", statement.initializer.loc);
				}
				else {
					//TODO Implement
				}
			}
			else if (statement.initializer.nodeType === "AssignmentExpression") {
				initMap = _compileAssignment(statement.initializer, context);
			}
			else {
				//throw an error for now
				throw new CompilerError("For loop initializer should either be empty or an assignment expression", statement.initializer.loc);
			}
		}

		//we need to inject the increment operation into the body
		if (statement.body && statement.body.nodeType === "BlockStatement") {
			if (statement.body.body) {
				if (statement.update) {
					statement.body.body.push(statement.update);
				}
			}
			else {
				throw new CompilerError("Empty for-loop body is not allowed", statement.body.loc);
			}
		}
		else {
			throw new CompilerError("Body of for loop must be a block statement", statement.body ? statement.body.loc : statement.loc);
		}

		whileMap = _compileWhileLoop(statement, context);

		map = map.concat(initMap);
		map = map.concat(whileMap);

		return map;
	}

	function _compileWhileLoop (statement, context) {
		//a while loop is a if statement with the check, followed by the do-while
		if (VERBOSE) console.log('compiling while loop', statement);

		var map = [];

		var doWhileMap = _compileDoWhileLoop(statement, context);

		//do the compare
		var compareMap = _compileExpression(statement.condition, context);
		compareMap.push(new POPInstruction({
			type: 'register',
			value: 'R0'
		}, statement.condition, "Pop value of condition expression from stack into R0"));

		compareMap.push(new CMPInstruction({
			type: 'register',
			value: 'R0'
		}, {
			type: 'raw',
			value: true
		}, statement.condition, "Compare with true"));

		compareMap.push(new RJNEInstruction({
			type: 'raw',
			value: doWhileMap.length
		}, statement.condition, "Jump past loop body if condition not met"));

		map = map.concat(compareMap);
		map = map.concat(doWhileMap);

		return map;
	}

	function _compileDoWhileLoop (statement, context) {
		if (VERBOSE) console.log('compiling do-while statement', statement);

		var map = [];

		var bodyMap = _compileBlock(statement.body, context, true);
		map = map.concat(bodyMap);

		//Do the check
		var conditionMap = _compileExpression(statement.condition, context);
		//pop into R0
		conditionMap.push(new POPInstruction({
			type: 'register',
			value: 'R0'
		}, statement.condition, "Pop result into R0"));

		conditionMap.push(new CMPInstruction({
			type: 'register',
			value: 'R0'
		}, {
			type: 'raw',
			value: true
		}, statement.condition, "Compare condition with true"));

		var rjmpVal = -(bodyMap.length + conditionMap.length + 1);

		conditionMap.push(new RJEQInstruction({
			type: 'raw',
			value: rjmpVal
		}, statement.condition, "Continue loop if condition met"));

		map = map.concat(conditionMap);

		//find any break/continue statements
		for (var i = 0, len = map.length; i < len; i++) {
			var stmt = map[i];
			if (stmt.offset) {
				if (stmt.offset.type === 'pendingRelativeJump') {
					if (stmt.offset.value === 'start') {
						stmt.offset.type = 'raw';
						stmt.offset.value = -i;
					}
					else if (stmt.offset.value === 'end') {
						stmt.offset.type = 'raw';
						stmt.offset.value = len - i - 1; //number of remaining slots
					}
				}
			}
		}

		return map;
	}

	function _compileFunctionCall (statement, context) {
		if (VERBOSE) console.log('compiling call expression', statement);
		var map = [];

		var funcName;
		if (statement.callee.nodeType === "Identifier") {
			funcName = statement.callee.label;
		}
		else if (statement.callee.nodeType === "MemberExpression") {
			var nameParts = [statement.callee.property];
			var base = statement.callee.base;
			while (base.nodeType !== "Identifier") {
				nameParts.unshift(base.property);
				base = base.base;
			}
			nameParts.unshift(base.label);
			funcName = nameParts.join('~');
		}
		if (VERBOSE) console.log('=== Generating code for call to function ' + funcName);
		var funcInfo = _getRawFromContext(funcName, context, statement.callee.loc);
		if (VERBOSE) console.log('funcInfo: ', funcInfo);
		if (statement.args.length != funcInfo.parameters.length) {
			throw new CompilerError("Incorrect number of arguments passed to function '" +
				funcName + "'. Expected " + funcInfo.parameters.length + " but received " +
				statement.args.length, statement.loc);
		}

		//push these onto the stack
		for (var i = statement.args.length - 1; i >= 0; i--) {
			var argument = statement.args[i];
			var paramInfo = funcInfo.parameters[i];

			//Generate the statements.
			//if it's a Literal, just insert and check against varType in funcInfo
			if (argument.nodeType === "Literal") {
				switch (paramInfo.varType) {
					case "int":
					case "double":
					case "bool":
						if (argument.type === "NumericLiteral" || argument.type === "BooleanLiteral") {
							map.push(new PUSHInstruction({
								type: 'raw',
								value: TypeChecker.coerceValue(paramInfo.varType, argument.value),
							},
							statement, "Loading value for parameter #" + i));
						}
						else {
							throw new CompilerError("Attempting to pass value of type string as parameter #" + i + " of type " + paramInfo.varType, statement.loc);
						}
						break;
					case "string":
						map.push(new PUSHInstruction({
							type: 'raw',
							value: TypeChecker.coerceValue(paramInfo.varType, argument.value),
						}, statement, "Loading value for parameter #" + i));
						break;
				}
			}
			else if (argument.nodeType === "Identifier") {
				//We should try to typecheck...
				var varInfo = _getRawFromContext(argument.label, context, argument.loc);
				switch (paramInfo.varType) {
					case "int":
					case "double":
					case "bool":
						if (varInfo.varType === "string") {
							throw new CompilerError("Attempting to pass value of type string as parameter #" + i + " of type " + paramInfo.varType, statement.loc);
						}
						break;
				}
				var exprMap = _compileExpression(argument, context);
				map = map.concat(exprMap);
			}
			else if (argument.nodeType === "BinaryExpression") {
				//TODO how do we typecheck this?
				var exprMap = _compileExpression(argument, context);
				map = map.concat(exprMap);
			}
			else if (argument.nodeType === "UnaryExpression") {
				var exprMap = _compileExpression(argument, context);
				map = map.concat(exprMap);
			}
			else if (argument.nodeType === "CallExpression") {
				var callMap = _compileExpression(argument, context);
				map = map.concat(callMap);
			}
			else if (argument.nodeType === "MemberExpression") {
				throw new CompilerError("[NOT IMPLEMENTED YET] MemberExpression as function argument", argument.loc);
			}
		}

		//Push the next statement in line onto the stack (return address)
		map.push(new PUSHInstruction({
			type: 'pointerAddress',
			value: 'PC', 
			offset: 3, //need to jump to the line AFTER the call
		}, statement, "Pushing return address onto stack"));

		//Push the current base pointer onto the stack
		map.push(new PUSHInstruction({
			type: 'pointerAddress',
			value: 'EBP',
		}, statement, "Pushing current EBP onto stack"));

		//Set the base pointer to be 1 less than the stack pointer
		map.push(new MOVInstruction({
			type: 'pointerAddress',
			value: 'EBP',
		}, {
			type: 'pointerAddress',
			value: 'ESP',
			offset: -1
		}, statement, 'Setting new EBP to ESP-1'));

		//Make the call to the function
		map.push(new CALLInstruction({
			type: 'pendingFunctionCall',
			value: funcName
		}, statement, "Jump to function '" + funcName + "'"));

		//Tear down temp space
		map.push(new SUBInstruction({
			type: 'pointerAddress',
			value: 'ESP'
		}, {
			type: 'raw',
			value: statement.args.length
		}, statement, "Move stack pointer back to pre-call position"));

		return map;
	}

	function _compileFunction (progStatement, context) {
		
		//base pointer offsets
		var basePointerOffsets = {};
		var bpOffset = -2; //ebp-1 is return address

		var functionContext = {
			__parentContext: context,
		};

		var varmap = []; //use this to store the variables first. These are the first instructions to get run
		var memmap = [];

		//Get the params list in the form {varType, name}
		for (var i = 0, len = progStatement.parameters.length; i < len; i++) {
			var param = progStatement.parameters[i];
			var paramDeclarators = _getVariables(param);
			
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

		var hasReturn = false;

		var pendingInitializers = [];

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
					
					var variables = _getVariables(statement);
					for (var v = 0; v < variables.length; v++) {
						var variable = variables[v];
						if (functionContext[variable.name] !== undefined) {
							throw new CompilerError("'" + variable.name + "' has already been declared", variable.ref.loc);
						}

						functionContext[variable.name] = variable;

						if (variable.initializer !== undefined) {
							pendingInitializers.push({
								name: variable.name,
								initializer: variable.initializer
							});
						}

						basePointerOffsets[variable.name] = bpOffset++;
						if (VERBOSE) console.log('variable: ', variable);
						var defaultVal;
						if (variable.varType === "int" || variable.varType === "double")
							defaultVal = 0;
						else if (variable.varType === "bool")
							defaultVal = false;
						else if (variable.varType === "string")
							defaultVal = "";
						varmap.push(new PUSHInstruction({
							type: 'raw',
							value: defaultVal,
						}, statement, "Set up space for variable '" + variable.name + "' on stack"));
					}
				}
				else if (statement.nodeType === "AssignmentExpression") {
					var assignmentMap = _compileAssignment(statement, functionContext);
					if (VERBOSE) console.log('assignmentMap: ', assignmentMap);
					memmap = memmap.concat(assignmentMap);
				}
				else if (statement.nodeType === "CallExpression") {
					var callMap = _compileFunctionCall(statement, functionContext);
					memmap = memmap.concat(callMap);
				}
				else if (statement.nodeType === "ReturnStatement") {
					hasReturn = true;
					if (statement.argument) {
						if (VERBOSE) console.log('return statement has arg', statement.argument);
						if (progStatement.type === "void") {
							throw new CompilerError("Attempting to return value from void function", statement.loc);
						}

						//Put value in RAX
						var retMap = _compileExpression(statement.argument, functionContext);
						//POP into RAX
						memmap = memmap.concat(retMap);
						memmap.push(new POPInstruction({
							type: 'register',
							value: 'RAX'
						}, statement, "Store return value in RAX"));

						memmap.push(new MOVInstruction({
							type: 'pointerAddress',
							value: 'ESP'
						}, {
							type: 'pointerAddress',
							value: 'EBP'
						}, statement, "Tear down stack frame"));

						memmap.push(new MOVInstruction({
							type: 'pointerAddress',
							value: 'EBP'
						}, {
							type: 'pointer',
							value: 'ESP'
						}, statement, "Tear down stack frame"));
					}

					memmap.push(new RETInstruction(statement, "Return from function '" + progStatement.name + "'"));
				}
				else if (statement.nodeType === 'IfStatement') {
					var ifMap = _compileIfStatement(statement, functionContext);
					memmap = memmap.concat(ifMap);
				}
				else if (statement.nodeType === 'DoWhileStatement') {
					var doWhileMap = _compileDoWhileLoop(statement, functionContext);
					memmap = memmap.concat(doWhileMap);
				}
				else if (statement.nodeType === 'WhileStatement') {
					var whileMap = _compileWhileLoop(statement, functionContext);
					memmap = memmap.concat(whileMap);
				}
				else if (statement.nodeType === 'ForStatement') {
					var forMap = _compileForLoop(statement, functionContext);
					memmap = memmap.concat(forMap);
				}
				else if (statement.nodeType === 'UnaryExpression') {
					throw new CompilerError("[NOT IMPLEMENTED YET] UnaryExpression in function", statement.loc);
				}
				else if (statement.nodeType === 'UpdateExpression') {
					var updateMap = _compileExpression(statement, functionContext);
					memmap = memmap.concat(updateMap);
					if (statement.expression.nodeType === 'Identifier') {
						var item = _getRawFromContext(statement.expression.label, functionContext, statement.expression.loc);
						var destType = 'pendingVariable';
						if (item.isGlobal) 
							destType = 'pendingGlobal';
						memmap.push(new POPInstruction({
							type: destType,
							value: {
								name: statement.expression.label
							}
						}, statement.expression, "Pop variable back into variable space"));
					}
				}
			}
		}

		//Handle the init stuff
		//Handle the initializers
		for (var vi = 0; vi < pendingInitializers.length; vi++) {
			var pInit = pendingInitializers[vi];
			var varInfo = functionContext[pInit.name];
			if (pInit.initializer.nodeType === "Literal") {
				var value = pInit.initializer.value;
				if (TypeChecker.typeCheck(varInfo.varType, value)) {
					value = TypeChecker.coerceValue(varInfo.varType, value);
					//generate the MOV instruction
					varmap.push(new MOVInstruction({
						type: 'pointer',
						value: 'EBP',
						offset: basePointerOffsets[pInit.name]
					}, {
						type: 'raw',
						value: value
					}, pInit.initializer, "Assign value to variable '" + pInit.name + "'"));
				}
			}
			else if (pInit.initializer.nodeType === "Identifier") {
				var targetInfo = functionContext[pInit.initializer.label];
				if (targetInfo === undefined)
					throw new CompilerError("'" + pInit.initializer.label + "' has not been declared", pInit.initializer.loc);
				//TODO type check?
				varmap.push(new MOVInstruction({
					type: 'pointer',
					value: 'EBP',
					offset: basePointerOffsets[pInit.name]
				}, {
					type: 'pointer',
					value: 'EBP',
					offset: basePointerOffsets[targetInfo.name]
				}, pInit.initializer, "Assign value to variable '" + pInit.name + "'"));
			}
			else if (pInit.initializer.nodeType === "BinaryExpression") {
				var exprMap = _compileExpression(pInit.initializer, functionContext);
				varmap = varmap.concat(exprMap);
				varmap.push(new POPInstruction({
					type: 'pointer',
					value: 'EBP',
					offset: basePointerOffsets[pInit.name]
				}, pInit.initializer, "Move result of expression into variable '" + pInit.name + "'"));
			}
			else if (pInit.initializer.nodeType === "CallExpression") {
				var callMap = _compileFunctionCall(pInit.initializer, functionContext);
				varmap = varmap.concat(callMap);
				varmap.push(new MOVInstruction({
					type: 'pointer',
					value: 'EBP',
					offset: basePointerOffsets[pInit.name]
				}, {
					type: 'register',
					value: 'RAX',
				}, pInit.initializer, "Assign result of function call to variable '" + pInit.name + "'"));
			}
		}

		memmap = varmap.concat(memmap);

		if (!hasReturn) {
			if (progStatement.type !== "void") {
				throw new CompilerError("Function '" + progStatement.name + "' does not return a value. Expected to return type " + progStatement.type, progStatement.loc);
			}

			memmap.push(new MOVInstruction({
				type: 'pointerAddress',
				value: 'ESP'
			}, {
				type: 'pointerAddress',
				value: 'EBP'
			}, progStatement, "Tear down stack frame"));

			memmap.push(new MOVInstruction({
				type: 'pointerAddress',
				value: 'EBP'
			}, {
				type: 'pointer',
				value: 'ESP'
			}, progStatement, "Tear down stack frame"));

			//generate an implicit return statement
			memmap.push(new RETInstruction(progStatement, "Return from function '" + progStatement.name + "'"));
		}

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

		//if (VERBOSE) console.log('Function Context: ', functionContext);
		//if (VERBOSE) console.log("Base Pointer Offsets: ", basePointerOffsets);
		//if (VERBOSE) console.log('memmap: ', memmap);

		//_printAssembly(memmap);

		return memmap;
	}

	function _installBuiltIns(list, functionList, context) {
		var map = [];
		mapOffset = 0;

		for (var i = 0, len = list.length; i < len; i++) {
			var item = list[i];
			functionList[item.name] = mapOffset;
			context[item.name] = {
				type: 'function',
				retType: item.retType,
				parameters: item.parameters
			}

			map.push(new EXTInstruction(item.name, item.parameters, null, "External call to " + item.name + " function"));
			map.push(new MOVInstruction({
				type: 'pointerAddress',
				value: 'ESP',
			}, {
				type: 'pointerAddress',
				value: 'EBP',
			}, null, "Tear down stack frame"));
			map.push(new MOVInstruction({
				type: 'pointerAddress',
				value: 'EBP'
			}, {
				type: 'pointer',
				value: 'ESP'
			}, null, "Tear down stack frame"));

			map.push(new RETInstruction(null, "Return from " + item.name));
			mapOffset = map.length;
		}

		return map;
	}

	function _compile (programAST, builtIns) {
		if (VERBOSE) console.log("======= COMPILER 2 ========");
		//Global variables, the _data segment
		var _globalVarIndex = {};

		var _globalVars = [];
		var _gVarOffset = 0;

		//Store addresses of function entry points
		var _functions = {};

		//Context, storing variable names (not values!)
		var _context = {};

		//Overall program memmap
		var _memmap = [];
		var _mapOffset = 0;

		_memmap = _memmap.concat(_installBuiltIns(builtIns, _functions, _context));
		_mapOffset = _memmap.length;

		//Hoist function declarations to the top
		for (var i = 0, len = programAST.statements.length; i < len; i++) {
			var statement = programAST.statements[i];

			if (statement.nodeType === "FunctionDeclaration") {
				var paramList = [];

				if (_context[statement.name] !== undefined) {
					throw new CompilerError("'" + statement.name + "' is already defined", statement.loc);
				}

				for (var pi = 0, plen = statement.parameters.length; pi < plen; pi++) {
					var param = statement.parameters[pi];
					var paramDeclarators = _getVariables(param);

					paramList.push({
						varType: paramDeclarators[0].varType,
						name: paramDeclarators[0].name
					});
				}

				_context[statement.name] = {
					type: 'function',
					retType: statement.type,
					parameters: paramList
				};
			}
		}

		//Load all the global variables and functions
		for (var i = 0, len = programAST.statements.length; i < len; i++) {
			var statement = programAST.statements[i];

			//Handle variable declarations
			if (statement.nodeType === "VariableDeclaration") {
				_registerVariables(statement, _context, true);
				for (var gIdx in _context) {
					var item = _context[gIdx];
					if (item.type === "variable") {
						if (_globalVarIndex[gIdx] === undefined) {
							_globalVarIndex[gIdx] = _gVarOffset;
							_globalVars.push(item.value);
							_gVarOffset++;
						}
					}
				}
			}
			else if (statement.nodeType === "FunctionDeclaration") {
				if (_functions[statement.name] !== undefined)
					throw new CompilerError("Function '" + statement.name + "' has already been defined", statement.loc);
				
				//Store the offset
				_functions[statement.name] = _mapOffset;
				var functionMap = _compileFunction(statement, _context);
				_mapOffset = _mapOffset + functionMap.length;
				_memmap = _memmap.concat(functionMap);
			}
			else {
				throw new CompilerError("Top level of program may only contain function or variable declarations", statement.loc);
			}
		}

		for (i = 0, len = _memmap.length; i < len; i++) {
			var stmt = _memmap[i];
			if (stmt.offset) {
				if (stmt.offset.type === 'pendingFunctionCall') {
					var offset = _functions[stmt.offset.value];
					stmt.offset.type = 'raw';
					stmt.offset.value = offset;
				}
			}
			if (stmt.destination) {
				if (stmt.destination.type === 'pendingGlobal') {
					var gOffset = _globalVarIndex[stmt.destination.value.name];
					stmt.destination.type = 'pointer';
					stmt.destination.value = 'EGV';
					stmt.destination.offset = gOffset;
				}
			}
			if (stmt.source) {
				if (stmt.source.type === 'pendingGlobal') {
					var gOffset = _globalVarIndex[stmt.source.value.name];
					stmt.source.type = 'pointer';
					stmt.source.value = 'EGV';
					stmt.source.offset = gOffset;
				}
			}
		}

		//This stores global scope!
		if (VERBOSE) console.log("Context: ", _context);

		if (VERBOSE) console.log("=== The Program ===");
		_printAssembly(_memmap);

		if (_functions["main"] === undefined) {
			throw new CompilerError("Expecting a main function but found none", {line: 1, column: 0});
		}

		var program = new Program(_memmap, _globalVars, _functions["main"]);

		//register the builtin implementations
		for (var i = 0, len = builtIns.length; i < len; i++) {
			var item = builtIns[i];
			program.registerExternalFunction(item.name, item.implementation);
		}

		return program;
	}

	function _generateTargetString(obj) {
		if (obj.type === 'raw') {
			return obj.value;
		}
		else if (obj.type === 'register') {
			return obj.value;
		}
		else if (obj.type === 'pointer') {
			return '[' + obj.value + (obj.offset >= 0 ? '+' : '') + (obj.offset ? obj.offset : '') + ']';
		}
		else if (obj.type === 'pointerAddress') {
			return obj.value + (obj.offset >= 0 ? '+' : '') + (obj.offset ? obj.offset : '');
		}
		else if (obj.type === 'address') {
			return obj.value + (obj.offset ? obj.offset : 0);
		}
		else if (obj.type === 'registerValue') {
			return '[' + obj.value + '] ' + (obj.offset >= 0 ? '+' : '') + (obj.offset ? obj.offset : '0');
		}
	}

	function _printAssembly (memmap) {
		if (VERBOSE) console.log('=== ASSEMBLY INSTRUCTIONS ===');
		for (var i = 0, len = memmap.length; i < len; i++) {
			var statement = memmap[i];
			var str = statement.toString();
			if (statement.comment) {
				str += "\t\t;" + statement.comment;
			}
			if (VERBOSE) console.log('[' + i + ']\t' + str);
		}
	}

	return {
		compile: _compile
	};
});