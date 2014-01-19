define([],
function() {
	//var reverseTurn = "void main() {\n\tint time;\n\tint lastTime;\n\tdouble distance;\n\t\n\tRobot.setTurnSpeed(0);\n\tRobot.setSpeed(5);\n\t\n\twhile (true) {\n\t\tdistance = Robot.getFrontDistance();\n\t\t\n\t\tif (distance \x3C 20) {\n\t\t\treverseAndTurn();\n\t\t}\n\t}\n}\n\nvoid reverseAndTurn() {\n\tint lastTime = getTime();\n\tint time;\n\t\x2F\x2FReverse for 2 seconds, turn right 90 degrees\n\t\n\tRobot.setSpeed(-5);\n\ttime = getTime();\n\twhile (time - lastTime \x3C 2000) {\n\t\ttime = getTime();\n\t}\n\t\n\tRobot.setSpeed(0);\n\tRobot.setTurnSpeed(15); \x2F\x2F15 degrees per second\n\t\x2F\x2Fwe need to turn for 6 seconds\n\t\n\tlastTime = getTime();\n\ttime = getTime();\n\twhile (time - lastTime \x3C 6000) {\n\t\ttime = getTime();\n\t}\n\t\n\tRobot.setTurnSpeed(0);\n\tRobot.setSpeed(5);\n}";
	
	return {
		sampleList: [
			
			
		]
	};
});