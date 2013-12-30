define(['ast/ast', 'ast/parser', 'ast/compiler2'],
function(AST, Parser, Compiler) {

	return {
		start: function() {
			console.log('starting');

			var editor = ace.edit("editorPane");
			editor.getSession().setMode("ace/mode/c_cpp");

			var compileButton = document.getElementById('btnCompile');
			var stepNextButton = document.getElementById('btnStepNext');
			var clearOutputButton = document.getElementById('btnClearOutput');

			var outputArea = document.getElementById('outputArea');
			var instructionArea = document.getElementById('instructions');
			var stackArea = document.getElementById('stack');

			var pointerInfoArea = document.getElementById('pointerInfo');

			var program;

			//quick refs to the indicator
			var pcIndicators = [];
			var bpIndicators = [];
			var spIndicators = [];

			function regenerateRegisters() {
				pointerInfoArea.innerHTML = "";
				var registers = program.getRegisters();
				for (var reg in registers) {
					pointerInfoArea.innerHTML += reg + ":&nbsp;&nbsp;" + registers[reg] + ",&nbsp;&nbsp;";
				}
			}

			function resetPCDisplay() {
				var elt = document.querySelector('.pc-indicator.selected');
				if (elt)
					elt.classList.remove('selected');
				var pcElt = pcIndicators[program.getPC()];
				if (pcElt) {
					pcElt.classList.add('selected');
					pcElt.scrollIntoView();
				}
			}

			function resetSPDisplay() {
				var elt = document.querySelector('.sp-indicator.selected');
				if (elt)
					elt.classList.remove('selected');
				var spElt = spIndicators[program.getSP()];
				if (spElt) {
					spElt.classList.add('selected');
					spElt.scrollIntoView();
				}
			}

			function resetBPDisplay() {
				var elt = document.querySelector('.bp-indicator.selected');
				if (elt)
					elt.classList.remove('selected');
				var bpElt = bpIndicators[program.getBP()];
				if (bpElt) {
					bpElt.classList.add('selected');
					bpElt.scrollIntoView();
				}
			}

			function regenerateStack() {
				stackArea.innerHTML = '';
				bpIndicators = [];
				spIndicators = [];

				var stack = program.getStack().slice(0);
				stack.push('&lt;EMPTY&gt;');
				for (var i = 0, len = stack.length; i < len; i++) {
					var stackEntry = stack[i];

					var stackDiv = document.createElement('div');
					stackDiv.classList.add('stack-entry');

					var bpIndicator = document.createElement('div');
					bpIndicator.classList.add('bp-indicator');
					bpIndicators.push(bpIndicator);

					var address = document.createElement('div');
					address.classList.add('address');
					address.innerHTML = '[' + i + ']';

					var data = document.createElement('div');
					data.classList.add('data');
					data.innerHTML = stackEntry;

					var spIndicator = document.createElement('div');
					spIndicator.classList.add('sp-indicator');
					spIndicators.push(spIndicator);

					stackDiv.appendChild(bpIndicator);
					stackDiv.appendChild(address);
					stackDiv.appendChild(data);
					stackDiv.appendChild(spIndicator);

					stackArea.appendChild(stackDiv);
				}

				resetBPDisplay();
				resetSPDisplay();
			}

			clearOutputButton.addEventListener('click', function() {
				outputArea.innerHTML = "";
			});

			stepNextButton.addEventListener('click', function() {
				if (!program || !program.hasNextStatement())
					return;

				program.executeNext();
				resetPCDisplay();
				regenerateStack();
				regenerateRegisters();
			});

			compileButton.addEventListener('click', function() {
				try {
					var result = Parser.parse(editor.getSession().getValue());
					program = Compiler.compile(result);

					program.registerExternalFunction('print', function(str) {
						outputArea.innerHTML += "[PROGRAM OUTPUT] " + str + "\n";
					});

					instructionArea.innerHTML = '';

					pcIndicators = [];

					var instructions = program.getInstructions();
					for (var i = 0, len = instructions.length; i < len; i++) {
						var instr = instructions[i];
						var instrDiv = document.createElement('div');
						instrDiv.classList.add('instruction-entry');
						
						var pcIndicator = document.createElement('div');
						pcIndicator.classList.add('pc-indicator');
						pcIndicators.push(pcIndicator);

						var address = document.createElement('div');
						address.classList.add('address');
						address.innerHTML = '[' + i + ']';

						var instruction = document.createElement('div');
						instruction.classList.add('instruction');
						instruction.innerHTML = instr.toString() +
							(instr.comment ? '&nbsp;&nbsp;&nbsp;&nbsp;;&nbsp;' + instr.comment : '');

						instrDiv.appendChild(pcIndicator);
						instrDiv.appendChild(address);
						instrDiv.appendChild(instruction);

						instructionArea.appendChild(instrDiv);
					}

					pcIndicators[program.getPC()].classList.add('selected');
					regenerateStack();
					regenerateRegisters();
				}
				catch (e) {
					if (e instanceof ReferenceError || e instanceof TypeError) {
						throw e;
					}
					outputArea.innerHTML += "[Line " + e.loc.line + ", Col " + e.loc.column + "] " + e.message + "\n";
				}
			});
		}
	};
});