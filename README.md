robosim
=======

RoboSim is a virtual robot that can be controlled via a C-like programming language. It is meant as an interactive way of teaching students basic programming concepts. Specifically, this was developed as a side project to teach students who are involved in the FIRST Robotics competition.

Usage
-----

The robot in RoboSim is controlled by a user defined program that is entered in the code editor pane. The entire simulation consists of the visual representation of the field and robot, an interpreter and compiler which converts the source code into something vaguely resembling assembly, and a virtual processor for the robot which executes the assembly program.

The system supports general programs as well (meaning that they don't always have to control the robot). The only thing that is necessary is a main function, which is the starting point for all programs.

That is, the simplest legal program in RoboSim is:

<pre>
void main() {
	
}
</pre>

If the compiler does not find a main function, it'll throw a fit, uh, an error, which will be indicated in the code editor view (and in the Compiler Output tab).

The Language
------------

The language used to program in RoboSim is similar to C, with some limitations.

- No array support (yet)
- No variable declarations in block statements (and by extension, loops)
- No empty loop bodies
- Various other parts that I got too lazy to implement

The variable types available in RoboSim are
- int
- double
- char
- string
- bool

Declaring a variable is similar to C. If you want to declare a global, declare it outside of any function scope:

<pre>
int a = 5;

void main() {
	...
}
</pre>

The global variable will then be accessible anywhere in your program. Local variables can be declared within a function, and will only be accessible by that function.

<pre>
void main() {
	int noOneElseCanSeeThis = 5;
}
</pre>

Function return types can be any one of the 5 supported types, or 'void'.

Loops are exactly the same as in C, and RoboSim supports do...while, while, and for loops.

RoboSim Specific Functions and Libraries
----------------------------------------
RoboSim includes several "linked" libraries that allow common tasks to be done.

The _Simulation_ library (which has no namespace), contains the following functions:

- print(string message) : Prints output to the simulation console

The _Core_ library (which has no namespace), contains:

- getTime() : Returns the number of milliseconds that have elapsed since midnight, Jan 1, 1970

The _Math_ library (namespace Math), contains:

- random() : Returns a random number between 0 and 1
- randomInt(int low, int high) : Returns a random integer between _low_ and _high_ (inclusive)
- abs(int number) : Returns absolute value of _number_
- cos(double x) : Returns cosine of angle passed in (in radians)
- sin(double x) : Returns sine of angle passed in (in radians)
- tan(double x) : Returns tangent of angle passed in (in radians)
- max(double x1, double x2) : Returns the higher of _x1_ and _x2_
- min(double x1, double x2) : Returns the lower of _x1_ and _x2_
- floor(double x) : Returns the largest integer that is less than or equal to _x_
- ceil(double x) : Returns the smallest integer that is greater than or equal to _x_
- sqrt(double x) : Returns the square root of _x_

The _Robot_ namespace is a special one, and contains functions needed to control the virtual robot. There are 2 built in functions to the Robot object:

- drive(double leftSpeed, double rightSpeed) : Drive the robot with the provided speeds. The robot uses differential steering. See examples further down on how to use this
- networkTable.putValue(string key, string value) : Updates the network table database with the corresponding key/value pair. Uses of this include setting up a "dashboard" to constantly monitor robot variables without flooding the console

Other functions supported by the _Robot_ object depend on the type of sensors loaded on the robot (as specified in 'Environment Setup'). By default, there are 2 sensors, loaded, a Range Finder named _rangeFinder_ and a Gyro named _gyro_. All sensors have 1 method, getValue() which returns some value, depending on the sensor type.

Sensors can also be mounted on various parts of the chassis, and may return different values, depending on where they are mounted (mostly true for rangefinders)

Example:

<pre>
//Get the current reading of the gyro (degrees per second)
double turnRate = Robot.gyro.getValue();
//                       ^ the name of the sensor

//Get the current rangefinder reading 
double distanceToFront = Robot.rangeFinder.getValue();
</pre>