define(['jquery', 'underscore',
    'robot', 'field', 'sensors/rangefinder',
    'simulation', 'ast/ast', 'ast/parser', 'robotprogram', 'ast/compiler',
    'ast/compiler2'],
function($, _, Robot, Field, RangeFinder,
    Simulation, AST, Parser, RobotProgram, Compiler,
    Compiler2) {

    var mouseDown = false;
    var lastY;

    return {
        start: function() {

            var isRunning = false;
            var timerToken;
            
            var robot = new Robot({width:10,height:10});
            
            robot.setPositionXY(50, 50);
            robot.rotationalSpeed = 12;

            //Set up the robot
            var frontRangeFinder = new RangeFinder();
            robot.addSensor(frontRangeFinder, robot.SensorMountPoint.FRONT);

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
            var editor = ace.edit("editorPane");
            //editor.setTheme("ace/theme/monokai");
            editor.getSession().setMode("ace/mode/c_cpp");


            //UI
            var splitter = document.getElementById('horizontalSplitter');
            var editorPane = document.getElementById('editorPane');

            splitter.addEventListener('mousedown', function (e) {
                mouseDown = true;
                lastY = e.clientY;
            });

            window.addEventListener('mouseup', function (e) {
                mouseDown = false;
            });

            window.addEventListener('mousemove', function(e) {
                if (!mouseDown) return;

                var currY = e.clientY;
                var delta = lastY - currY;

                var height = parseInt(editorPane.style.height, 10);
                height += delta;
                editorPane.style.height = height + 'px';
                lastY = currY;

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
            var speedEntry = document.getElementById('txtSpeed');
            var setSpeedBtn = document.getElementById('btnSetSpeed');
            var forwardBtn = document.getElementById('btnForward');
            var startStopBtn = document.getElementById('btnStartStop');
            var abortButton = document.getElementById('btnAbort');

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

            simulation.addEventHandler('simulationError', function(e) {
                console.warn(e.message);
            });

            simulation.addEventHandler('simulationOutput', function(output) {
                if (output.type === 'output') {
                    console.log('[SIM OUTPUT] ' + output.message);
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

            setSpeedBtn.addEventListener('click', function() {
                var newSpeed = parseFloat(speedEntry.value);
                if (!isNaN(newSpeed)) {
                    robot.speed = newSpeed;
                }
                else {
                    robot.speed = 0;
                    speedEntry.value = 0;
                }
            });

            var robotProgram;

            function builtInPrint(str) {
                console.log("[PROGRAM OUTPUT] " + str);
            }

            var builtIns = [
                {
                    name: 'print',
                    retType: 'void',
                    parameters: [{
                        varType: 'string',
                        name: 'str'
                    }],
                    implementation: builtInPrint
                }
            ]

            forwardBtn.addEventListener('click', function() {
                try {
                    var result = Parser.parse(editor.getSession().getValue());
                    
                    // robotProgram = new RobotProgram(result);
                    // robotProgram.execute({});

                    //Compiler.compile(result);
                    // Compiler2.compile(result);

                    simulation.loadProgramAST(result);
                }
                catch (e) {
                    if (e instanceof ReferenceError || e instanceof TypeError) {
                        throw e;
                    }
                    console.warn(e);
                }
            });

            abortButton.addEventListener('click', function () {
                if (robotProgram) {
                    console.log('!!!!!! ABORTING PROGRAM !!!!!!!!');
                    robotProgram.abort();
                }
            });
        }
    };
});