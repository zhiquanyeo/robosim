define(['jquery', 'underscore', 'robot', 'field', 'sensors/rangefinder'],
function($, _, Robot, Field, RangeFinder) {

    return {
        start: function() {

            var isRunning = false;
            var timerToken;
            
            var robot = new Robot({width:10,height:10});
            
            robot.setPositionXY(50, 50);
            robot.rotationalSpeed = 12;

            //Set up the robot
            

            var theField = new Field(document.getElementById('playingField'), {
                width: 200,
                height: 100
            });
            
            //Resize event handler
            window.addEventListener('resize', _.debounce(function() {
                //force a reset of the dimensions
                theField.forceRedraw();
            }, 100));

            //Main App initialization
            theField.addItem(robot, theField.FieldItemType.ROBOT);

            //TODO we need to make sure that when we are added to a field, 
            //we should add sensors
            // In the mean time, we add sensors AFTER we initialize the field
            var frontRangeFinder = new RangeFinder();
            robot.addSensor(frontRangeFinder, robot.SensorMountPoint.FRONT);

            //Hook up the button listeners
            var speedEntry = document.getElementById('txtSpeed');
            var setSpeedBtn = document.getElementById('btnSetSpeed');
            var forwardBtn = document.getElementById('btnForward');
            var startStopBtn = document.getElementById('btnStartStop');

            var lastTime;

            function doTimerTick() {
                var currTime = (new Date()).getTime();
                var deltaTime = currTime - lastTime;
                
                robot.processTick(deltaTime);

                lastTime = currTime;

                //EXPT
                console.log('Distance: ', frontRangeFinder.getValue());
            }

            startStopBtn.addEventListener('click', function() {
                isRunning = !isRunning;

                //What's the new state?
                if (isRunning) {
                    startStopBtn.textContent = "Stop";
                    lastTime = (new Date()).getTime();
                    timerToken = setInterval(doTimerTick.bind(this), 100);

                }
                else {
                    startStopBtn.textContent = "Start";
                    if (timerToken) {
                        clearInterval(timerToken);
                        timerToken = null;
                    }
                }
            }.bind(this));

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
        }
    };
});