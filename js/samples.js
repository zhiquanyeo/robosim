define([],
function() {
	var reverseSample="\x2F*\n * Sample program that sends the robot moving forward at a rate of\n * 1 ft\x2Fs. If the robot comes within 5 feet of a wall, it will back\n * up for 2 seconds, turn at a random speed for a random amount of\n * time, then continue moving forward\n *\x2F\n \n\n\x2F\x2FThe initial speed of the robot\ndouble initialSpeed = 1;\n \n\x2F\x2FThe main() method is required. This is the first function to run\nvoid main() {\n    \x2F\x2FSet the initial robot speed\n    Robot.drive(initialSpeed, initialSpeed); \x2F\x2FSet the left and right motors to 1 foot\x2Fs\n    \n    \x2F\x2FLoop forever\n    while (true) {\n        \x2F\x2FAccess the rangeFinder sensor and obtain its value\n        if (Robot.rangeFinder.getValue() \x3C 5) {\n            backupAndTurn();\n            Robot.drive(initialSpeed, initialSpeed);\n        }\n    }\n}\n\nvoid backupAndTurn() {\n    \x2F\x2FGet a random turn speed\n    double turnSpeed = Math.random();\n    \n    \x2F\x2FGet a random turn duration in seconds\n    double turnDuration = Math.randomInt(2, 6);\n    turnDuration *= 1000; \x2F\x2Fconvert to milliseconds\n    \n    \x2F\x2FGet the current time (in ms)\n    int lastTime = getTime();\n    while (getTime() - lastTime \x3C 2000) {\n        Robot.drive(-1, -1);\n    }\n    \n    \x2F\x2Fnow do the turn\n    lastTime = getTime();\n    while (getTime() - lastTime \x3C turnDuration) {\n        Robot.drive(turnSpeed, -turnSpeed);\n    }\n}";
	return {
		sampleList: [
			{
                title: 'Reverse and Turn',
                code: reverseSample
            }
		]
	};
});