define(['jquery', 'underscore', 'robot', 'field'],
function($, _, Robot, Field) {

    return {
        start: function() {
            
            var robot = new Robot();
            console.log('current Position: ', robot.position);

            robot.setPositionXY(50, 50);
            console.log('current Position: ', robot.position);

            var robot2 = new Robot();
            robot2.setPositionXY(25, 25);

            console.log('Robot Positions: ', robot.position, robot2.position);
        
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

            //expt
            var counter = 0;
            function moveTheRobot() {
                robot.position = {
                    x: robot.position.x,
                    y: robot.position.y - 1
                };

                counter++;
                if (counter < 30) {
                    setTimeout(moveTheRobot, 250);
                }
            }

            moveTheRobot();
        }
    };
});