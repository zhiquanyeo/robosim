var MOTOR_HAT = require('./adafruit-motor-hat');
var RASPI = require('raspi');
var I2C = require('raspi-i2c').I2C;
var ADS1X15 = require('./ads-1x15');

// Support functions
function distInMM(mV) {
	var volts = mV / 1000;
	return (60.374 * Math.pow(volts, -1.16)) * 10;
}

RASPI.init(function() {
	var i2c = new I2C();
	var motorHat = new MOTOR_HAT.MotorHAT(i2c);
	var adc = new ADS1X15(i2c, undefined, 0x01);

	console.log("i2c initialized");
	console.log("MotorHAT initialized");
	console.log("ADC initialized");
	
	var latestVoltage = 3.0;

	// Set up the ADC to constantly record voltage and store
	setInterval(function() {
		adc.readADCSingleEnded(0)
		.then(function(val) {
			latestVoltage = val;
		});
	}, 10);

	// Drive system
	var leftMotor = motorHat.getMotor(1);
	var rightMotor = motorHat.getMotor(2);

	// TODO Set up express here as well
	
});

