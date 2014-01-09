define(['jquery', 'jqxwidgets', 'underscore',
    'robot', 'field', 
    'sensors/rangefinder', 'sensors/gyro',
    'simulation', 'ast/parser', 'samples'],
function($, jqxWidgets, _, Robot, Field, 
    RangeFinder, Gyro,
    Simulation, Parser, Samples) {

    var mouseDown = false;
    var vMouseDown = false;
    var lastX;
    var lastY;

    return {
        start: function() {

            var isRunning = false;
            var timerToken;

            var errorLine = null;
            var EditorRange = ace.require('ace/range').Range;
            
            var robot = new Robot({width:10,height:10});
            
            _resetRobot();
            
            //Set up the robot
            var frontRangeFinder = new RangeFinder();
            robot.addSensor(frontRangeFinder, robot.SensorMountPoint.FRONT);

            var gyro = new Gyro();
            robot.addSensor(gyro, robot.SensorMountPoint.CHASSIS);

            var theField = new Field(document.getElementById('playingField'), {
                width: 200,
                height: 100
            });

            robot.addEventHandler('collision', function() {
                console.log('Robot had a collision!');
            });
            
            //Resize event handler
            window.addEventListener('resize', _.debounce(function() {
                //force a reset of the dimensions
                theField.forceRedraw();
            }, 100));

            //Code Editor
            var editor = ace.edit("editorArea");
            //editor.setTheme("ace/theme/monokai");
            editor.getSession().setMode("ace/mode/c_cpp");

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
            $('#mainSplitter').jqxSplitter( { height: '100%', width: '100%', orientation: 'vertical', panels: [{size: '50%'}, {size:'50%'}]});
            $('#outputSplitter').jqxSplitter({height: '100%', width: '100%', orientation: 'horizontal', panels: [{size: '50%'}, {size: '50%'}]});

            $('#mainSplitter').on('resize', function() {
                theField.forceRedraw();
                editor.resize();
            });

            var boundingBoxCheckbox = document.getElementById('chkBoundingBox');
            boundingBoxCheckbox.addEventListener('change', function() {
                robot.showBoundingBox = boundingBoxCheckbox.checked;
            });


            //Main App initialization
            theField.addItem(robot, theField.FieldItemType.ROBOT);

            //Hook up the button listeners
            var startStopBtn = document.getElementById('btnStartStop');
            var compileBtn = document.getElementById('btnCompile');
            var resetButton = document.getElementById('btnReset');
            var clearOutputBtn = document.getElementById('btnClearOutput');

            startStopBtn.disabled = true;


            var outputList = document.getElementById('outputList');

            function printOutput(type, message) {
                outputList.innerHTML += "[" + type + "] " + message + "\n";
            }

            //Simulation Setup
            var simulation = new Simulation(theField, robot);

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
            })
            
            var loaderArea = document.getElementById('loader');
            compileBtn.addEventListener('click', function() {
                editor.getSession().clearAnnotations();
                loaderArea.classList.add('loading');
                printOutput("SYS", "Beginning Compilation...");

                if (errorLine !== null) {
                    editor.getSession().removeMarker(errorLine);
                    errorLine = null;
                }
                window.setTimeout(function() {
                    try {
                        _resetRobot();
                        var result = Parser.parse(editor.getSession().getValue());
                        
                        simulation.loadProgramAST(result);
                        startStopBtn.disabled = false;
                        loaderArea.classList.remove('loading');
                        printOutput("SYS", "Compilation Complete");
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
                        printOutput("SYS", e.message);
                    }
                }, 0);
            });

            resetButton.addEventListener('click', function () {
                _resetRobot();
                if (simulation) {
                    simulation.reset();
                    startStopBtn.disabled = false;
                }
            });

            function _resetRobot() {
                robot.setPositionXY(50, 50);
                robot.speed = 0;
                robot.rotationalSpeed = 0;
                robot.bearing = 0;
            }

            theField.forceRedraw();
        }
    };
});