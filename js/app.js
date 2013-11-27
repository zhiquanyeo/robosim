define(['jquery', 'underscore', 'robot', 'field'],
function($, _, Robot, Field) {

    return {
        start: function() {
            
            var robot = new Robot();
            console.log('current Position: ', robot.getPosition());

            robot.setPositionXY(50, 50);
            console.log('current Position: ', robot.getPosition());

            var robot2 = new Robot();
            robot2.setPositionXY(25, 25);

            console.log('Robot Positions: ', robot.getPosition(), robot2.getPosition());
        
            var theField = new Field(document.getElementById('playingField'));
            
            //Resize event handler
            window.addEventListener('resize', _.debounce(function() {
                //force a reset of the dimensions
                theField.forceRedraw();
            }, 100));

        }
    };
});