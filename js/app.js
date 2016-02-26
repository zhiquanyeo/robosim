define(['jquery', 'jqxwidgets', 'underscore',
    'robot', 'field', 'fieldobstacle',
    'sensors/rangefinder', 'sensors/gyro',
    'simulation', 'ast/parser', 'samples'],
function($, jqxWidgets, _, Robot, Field, FieldObstacle,
    RangeFinder, Gyro,
    Simulation, Parser, Samples) {

    var mouseDown = false;
    var vMouseDown = false;
    var lastX;
    var lastY;


    function _generateNetworkTableView(networkTable) {
        var retArray = [];
        for (var key in networkTable) {
            retArray.push({
                fieldName: key,
                fieldValue: networkTable[key]
            });
        }

        return retArray;
    }

    return {
        start: function() {

            var compilerOutput = document.getElementById('compilerOutput');
            
            
            var isRunning = false;
            var timerToken;

            var errorLine = null;
            var EditorRange = ace.require('ace/range').Range;

            var robot = new Robot({width: 2, height: 2});

            //Code Editor
            //Trigger the extension
            ace.require('ace/ext/language_tools');
            var editor = ace.edit("editorArea");
            //editor.setTheme("ace/theme/monokai");
            editor.getSession().setMode("ace/mode/c_cpp");
            editor.setOptions({
                enableBasicAutocompletion: true,
                enableSnippets: true,
            });

            //Load any samples
            var sampleList = document.getElementById('cboSamples');
            var samples = Samples.sampleList;
            for (var i = 0, len = samples.length; i < len; i++) {
                var sample = samples[i];
                var opt = document.createElement('option');
                opt.value = i;
                opt.innerText = sample.title;
                sampleList.appendChild(opt);
            }

            var loadSampleBtn = document.getElementById('btnLoadSample');
            loadSampleBtn.addEventListener('click', function() {
                var idx = sampleList.selectedIndex;
                if (idx !== -1) {
                    editor.getSession().setValue(samples[idx].code);
                }
            });

            //UI
            $('#mainSplitter').jqxSplitter( { height: '100%', width: '100%', orientation: 'horizontal', panels: [{size: '80%'}, {size:'20%'}]});
            $('#outputSplitter').jqxSplitter({height: '100%', width: '100%', orientation: 'vertical', panels: [{size: '50%'}, {size: '50%'}]});

            $('#mainSplitter').on('resize', function() {
                editor.resize();
            });

            //Hook up the button listeners
            var startStopBtn = document.getElementById('btnStartStop');
            var compileBtn = document.getElementById('btnCompile');
            var resetButton = document.getElementById('btnReset');
            var clearOutputBtn = document.getElementById('btnClearOutput');

            startStopBtn.disabled = true;


            var outputList = document.getElementById('outputList');

            function printOutput(type, message) {
                if (type === 'COMPILE') {
                    compilerOutput.innerHTML += "[COMPILER] " + message + "\n";
                }
                else {
                    outputList.innerHTML += "[" + type + "] " + message + "\n";
                }
            }

            //Simulation Setup
            var simulation = new Simulation();

            simulation.addEventHandler('runStateChanged', function(isRunning) {
                if (isRunning) {
                    startStopBtn.textContent = "Stop";
                }
                else {
                    startStopBtn.textContent = "Start";
                }
            });

            simulation.addEventHandler('simulationComplete', function(e) {
                printOutput('SYS', "Simulation Complete: " + e.message);
                //disable the button
                startStopBtn.disabled = true;
            });

            simulation.addEventHandler('simulationError', function(e) {
                console.warn(e.message);
            });

            simulation.addEventHandler('simulationOutput', function(output) {
                if (output.type === 'output') {
                    printOutput("SIM", output.message);
                }
            });

            startStopBtn.addEventListener('click', function() {
                if (simulation.isRunning) {
                    simulation.stop();
                }
                else {
                    simulation.start();

                }
            });

            clearOutputBtn.addEventListener('click', function() {
                outputList.innerHTML = "";
            });

            var loaderArea = document.getElementById('loader');
            compileBtn.addEventListener('click', function() {
                editor.getSession().clearAnnotations();
                loaderArea.classList.add('loading');

                //Clear out the compiler messages first
                compilerOutput.innerHTML = '';

                printOutput("COMPILE", "Beginning Compilation...");

                if (errorLine !== null) {
                    editor.getSession().removeMarker(errorLine);
                    errorLine = null;
                }
                window.setTimeout(function() {
                    try {
                        var result = Parser.parse(editor.getSession().getValue());

                        simulation.loadProgramAST(result);
                        startStopBtn.disabled = false;
                        loaderArea.classList.remove('loading');
                        printOutput("COMPILE", "Compilation Complete");
                    }
                    catch (e) {
                        if (e instanceof ReferenceError || e instanceof TypeError) {
                            throw e;
                        }
                        startStopBtn.disabled = true;

                        //Do error highlighting
                        var line, col;
                        if (e.line && e.column) {
                            line = e.line;
                            col = e.column;
                        }
                        else if (e.loc) {
                            line = e.loc.line;
                            col = e.loc.column;
                        }
                        if (line !== undefined && col !== undefined) {
                            editor.getSession().setAnnotations([{
                                row: line - 1,
                                column: col,
                                text: e.message,
                                type: 'error'
                            }]);

                            errorLine = editor.getSession().addMarker(new EditorRange(line - 1, 0, line, 0), "error", "line");
                        }
                        loaderArea.classList.remove('loading');
                        printOutput("COMPILE", e.message);
                    }
                }, 0);
            });

            resetButton.addEventListener('click', function () {
                if (simulation) {
                    simulation.reset();
                    startStopBtn.disabled = false;
                }
            });

            
        }
    };
});