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

    function _generateSensorLabel(sensorEntry) {
        var positionString;
        switch (sensorEntry.position) {
            case Robot.SensorMountPoint.FRONT: 
                positionString = 'FRONT';
                break;
            case Robot.SensorMountPoint.BACK: 
                positionString = 'BACK';
                break;
            case Robot.SensorMountPoint.RIGHT: 
                positionString = 'RIGHT';
                break;
            case Robot.SensorMountPoint.LEFT: 
                positionString = 'LEFT';
                break;
            default:
                positionString = 'CHASSIS';
        }

        var label = "'" + sensorEntry.name + "' - Type: " + sensorEntry.type + ", Position: " + positionString
        sensorEntry.label = label;
        sensorEntry.value = sensorEntry.name;
    }

    function _sensorExists(sensorName, sensorList) {
        for (var i = 0, len = sensorList.length; i < len; i++) {
            var sensorItem = sensorList[i];
            if (sensorItem.name === sensorName) {
                return true;
            }
        }
        return false;
    }

    return {
        start: function() {

            //Setup entries
            var txtFieldWidth = document.getElementById('txtFieldWidth');
            var txtFieldHeight = document.getElementById('txtFieldHeight');
            var btnUpdateField = document.getElementById('btnUpdateField');

            var txtSensorName = document.getElementById('txtSensorName');
            var cboSensorType = document.getElementById('cboSensorType');
            var cboSensorPosition = document.getElementById('cboSensorPosition');
            var btnAddSensor = document.getElementById('btnAddSensor');
            var btnDeleteSensor = document.getElementById('btnDeleteSensor');
            //end setup

            //"Model"
            var fieldSize = {
                width: 200,
                height: 100
            };

            var sensors = [
                {
                    type: 'RangeFinder',
                    position: Robot.SensorMountPoint.FRONT,
                    name: 'rangeFinder',
                },
                {
                    type: 'Gyro',
                    position: Robot.SensorMountPoint.CHASSIS,
                    name: 'gyro',
                }
            ];

            for (var i = 0, len = sensors.length; i < len; i++) {
                var sensor = sensors[i];
                _generateSensorLabel(sensor);
            }

            //hash table of network table values
            var networkTableValues = {};
            //End "Model"

            //UI Initialization routines
            txtFieldWidth.value = fieldSize.width;
            txtFieldHeight.value = fieldSize.height;
            //End UI Init
            

            var isRunning = false;
            var timerToken;

            var errorLine = null;
            var EditorRange = ace.require('ace/range').Range;
            
            var robot = new Robot({width:10,height:10});
            
            _resetRobot();
            
            
            var theField = new Field(document.getElementById('playingField'), fieldSize);

            //==== Add some obstacles ===
            var obstacle1 = new FieldObstacle({x: 75, y: 50}, 
                {width: 5, height: 10}, 0, FieldObstacle.ObstacleColor.RED);

            //theField.addItem(obstacle1, theField.FieldItemType.OBSTACLE);

            //==== End obstacles ====

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

            //set up the tabs in the UI
            $('#mainTabs').jqxTabs({width: '100%', height: '100%', position:'top'});
            $('#outputTabs').jqxTabs({width: '100%', height: '100%', position: 'top'});

            $('#sensorList').jqxListBox({source: sensors, width: '100%', height: 200});
            

            $('#addSensorPanel').jqxExpander({width: '100%', expanded: false});

            var boundingBoxCheckbox = document.getElementById('chkBoundingBox');
            boundingBoxCheckbox.addEventListener('change', function() {
                robot.showBoundingBox = boundingBoxCheckbox.checked;
            });

            btnUpdateField.addEventListener('click', function() {
                var tempWidth = parseInt(txtFieldWidth.value);
                var tempHeight = parseInt(txtFieldHeight.value);

                if (!isNaN(tempWidth) && !isNaN(tempHeight)) {
                    fieldSize.width = tempWidth;
                    fieldSize.height = tempHeight;
                }
                else {
                    txtFieldWidth.value = fieldSize.width;
                    txtFieldHeight.value = fieldSize.height;
                }

                theField.dimensions = fieldSize;
            });

            btnDeleteSensor.addEventListener('click', function() {
                var selIndex = $('#sensorList').jqxListBox('getSelectedIndex');
                console.log('selectedIndex: ', selIndex);
                if (selIndex !== -1) {
                    sensors.splice(selIndex, 1);
                    $('#sensorList').jqxListBox('refresh', true);
                }
            });

            btnAddSensor.addEventListener('click', function() {
                var selSensorType = cboSensorType.options.item(cboSensorType.selectedIndex);
                var selSensorPosition = cboSensorPosition.options.item(cboSensorPosition.selectedIndex);
                
                var sensorName = txtSensorName.value.trim();
                if (sensorName.length === 0) {
                    alert('Sensor name cannot be empty');
                    return;
                }
                else {
                    if (_sensorExists(sensorName, sensors)) {
                        alert('Sensor name already exists');
                        return;
                    }
                    var sensorObj = {
                        type: selSensorType.value,
                        position: parseInt(selSensorPosition.value),
                        name: sensorName
                    };
                    _generateSensorLabel(sensorObj);
                    sensors.push(sensorObj);
                    $('#sensorList').jqxListBox('refresh', true);
                }
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
            var simulation = new Simulation(theField, robot, sensors);

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

            simulation.addEventHandler('networkTableValueUpdated', function(e) {
                printOutput("NET", e.varName + ": " + e.value);
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
                robot.resetSensors();
            }

            theField.forceRedraw();
        }
    };
});