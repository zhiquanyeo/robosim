var PWM = require('./pca9685');

// Constants
var MOTORHAT_CONSTANTS = {
    FORWARD:    1,
    BACKWARD:   2,
    BRAKE:      3,
    RELEASE:    4,

    SINGLE:     1,
    DOUBLE:     2,
    INTERLEAVE: 3,
    MICROSTEP:  4,
};

// Stepper Motor Class
function StepperMotor(controller, num, steps, debug) {
    var MICROSTEPS = 8;
    var MICROSTEP_CURVE = [0, 50, 98, 142, 180, 212, 236, 250, 255];

    // Default values
    if (steps === undefined) steps = 200;

    // Properties
    var d_MC = controller;
    var d_revSteps = steps;
    var d_motorNum = num;
    var d_secPerStep = 0.1;
    var d_steppingCounter = 0;
    var d_currentStep = 0;

    var d_debug = !!debug;

    var d_PWMA, d_AIN2, d_AIN1, d_PWMB, d_BIN2, d_BIN1;

    num -= 1;

    if (num === 0) {
        d_PWMA = 8;
        d_AIN2 = 9;
        d_AIN1 = 10;
        d_PWMB = 13;
        d_BIN2 = 12;
        d_BIN1 = 11;
    }
    else if (num === 1) {
        d_PWMA = 2;
        d_AIN2 = 3;
        d_AIN1 = 4;
        d_PWMB = 7;
        d_BIN2 = 6;
        d_BIN1 = 5;
    }
    else {
        throw new Error("MotorHAT Stepper must be between 1 and 2 inclusive");
    }

    function setSpeed(rpm) {
        d_secPerStep = 60.0 / (d_revSteps * rpm);
        d_steppingCounter = 0;
    }

    function oneStep(dir, style) {
        var pwmA = pwmB = 255;

        // First determine what sort of stepping procedure we are up to
        if (style === MOTORHAT_CONSTANTS.SINGLE) {
            if ((~~(d_currentStep / (MICROSTEPS/2))) % 2) { // double bitwise NOT to floor a number
                //We're at an odd step, weird
                if (dir == MOTORHAT_CONSTANTS.FORWARD) {
                    d_currentStep += MICROSTEPS / 2;
                }
                else {
                    d_currentStep -= MICROSTEPS / 2;
                }
            }
            else {
                // Go to next even step
                if (dir === MOTORHAT_CONSTANTS.FORWARD) {
                    d_currentStep += MICROSTEPS;
                }
                else {
                    d_currentStep -= MICROSTEPS;
                }
            }
        }

        if (style === MOTORHAT_CONSTANTS.DOUBLE) {
            if (!((~~(d_currentStep / (MICROSTEPS / 2))) % 2)) {
                // we're at an even step, weird
                if (dir === MOTORHAT_CONSTANTS.FORWARD) {
                    d_currentStep += MICROSTEPS / 2;
                }
                else {
                    d_currentStep -= MICROSTEPS / 2;
                }
            }
            else {
                // Go to next odd step
                if (dir === MOTORHAT_CONSTANTS.FORWARD) {
                    d_currentStep += MICROSTEPS;
                }
                else {
                    d_currentStep -= MICROSTEPS;
                }
            }
        }

        if (style === MOTORHAT_CONSTANTS.INTERLEAVE) {
            if (dir === MOTORHAT_CONSTANTS.FORWARD) {
                d_currentStep += MICROSTEPS / 2;
            }
            else {
                d_currentStep -= MICROSTEPS / 2;
            }
        }

        if (style === MOTORHAT_CONSTANTS.MICROSTEP) {
            if (dir === MOTORHAT_CONSTANTS.FORWARD) {
                d_currentStep += 1;
            }
            else {
                d_currentStep -= 1;
            }

            // Go to next 'step' and wrap around
            d_currentStep += (MICROSTEPS * 4);
            d_currentStep %= (MICROSTEPS * 4);

            pwmA = pwmB = 0;
            if (d_currentStep >= 0 && d_currentStep < MICROSTEPS) {
                pwmA = MICROSTEP_CURVE[MICROSTEPS - d_currentStep];
                pwmB + MICROSTEP_CURVE[d_currentStep];
            }
            else if (d_currentStep >= MICROSTEPS && d_currentStep < (MICROSTEPS * 2)) {
                pwmA = MICROSTEP_CURVE[d_currentStep - MICROSTEPS];
                pwmB = MICROSTEP_CURVE[(MICROSTEPS * 2) - d_currentStep];
            }
            else if (d_currentStep >= (MICROSTEPS * 2) && d_currentStep < (MICROSTEPS * 3)) {
                pwmA = MICROSTEP_CURVE[(MICROSTEPS * 3) - d_currentStep];
                pwmB = MICROSTEP_CURVE[d_currentStep - (MICROSTEPS * 2)];
            }
            else if (d_currentStep >= (MICROSTEPS * 3) && d_currentStep < (MICROSTEPS * 4)) {
                pwmA = MICROSTEP_CURVE[d_currentStep - (MICROSTEPS * 3)];
                pwmB = MICROSTEP_CURVE[(MICROSTEPS * 4) - d_currentStep];
            }
        }

        // Go to next step and wrap around
        d_currentStep += (MICROSTEPS * 4);
        d_currentStep %= (MICROSTEPS * 4);

        // Only really used for microstepping, otherwise always on
        d_MC._pwm.setPWM(d_PWMA, 0, pwmA * 16);
        d_MC._pwm.setPWM(d_PWMB, 0, pwmB * 16);

        // Set up coil energizing
        var coils = [0, 0, 0, 0];

        if (style === MOTORHAT_CONSTANTS.MICROSTEP) {
            if (d_currentStep >= 0 && d_currentStep < MICROSTEPS) {
                coils = [1, 1, 0, 0];
            }
            else if (d_currentStep >= MICROSTEPS && d_currentStep < (MICROSTEPS * 2)) {
                coils = [0, 1, 1, 0];
            }
            else if (d_currentStep >= (MICROSTEPS * 2) && d_currentStep < (MICROSTEPS * 3)) {
                coils = [0, 0, 1, 1];
            }
            else if (d_currentStep >= (MICROSTEPS * 3) && d_currentStep < (MICROSTEPS * 4)) {
                coils = [1, 0, 0, 1];
            }
        }
        else {
            var step2coils = [
                [1, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 1],
                [0, 0, 0, 1],
                [1, 0, 0, 1]
            ];
            coils = step2coils[~~(d_currentStep / (MICROSTEPS / 2))];
        }

        if (d_debug) {
            console.log("[STEPPER-MOTOR] Coil State: [" + coils.join(", ") + "]");
        }

        d_MC.setPin(d_AIN2, coils[0]);
        d_MC.setPin(d_BIN1, coils[1]);
        d_MC.setPin(d_AIN1, coils[2]);
        d_MC.setPin(d_BIN2, coils[3]);

        return d_currentStep;
    }

    function _oneStepDelay(direction, style, delay) {
        return new Promise(function(fulfill, reject) {
            oneStep(direction, style);
            setTimeout(function() {
                fulfill();
            }, delay);
        });
    }

    function step(steps, direction, stepStyle) {
        var s;
        var sPerS = d_secPerStep;
        var latestStep = 0;

        if (stepStyle === MOTORHAT_CONSTANTS.INTERLEAVE) {
            sPerS = sPerS / 2.0;
        }
        if (stepStyle === MOTORHAT_CONSTANTS.MICROSTEP) {
            sPerS /= MICROSTEPS;
            steps *= MICROSTEPS;
        }

        if (d_debug) {
            console.log("[STEPPER-MOTOR] " + sPerS + " sec per step");
        }

        var p = _oneStepDelay(direction, stepStyle);
        for (s = 0; s < steps - 1; s++) {
            p = p.then(_oneStepDelay(direction, stepStyle));
        }

        // Handle edge case. If we are between full steps AND microstepping
        // Keep going till we end on a full step
        if (stepStyle === MOTORHAT_CONSTANTS.MICROSTEP) {
            p.then(function() {
                if (d_currentStep > 0 && d_currentStep < MICROSTEPS) {
                    var numExtra = d_currentStep % MICROSTEPS;
                    for (s = 0; s < numExtra; s++) {
                        p = p.then(_oneStepDelay(direction, stepStyle));
                    }
                }
            });
        }
    }

    this.setSpeed = setSpeed;
    this.oneStep = oneStep;
    this.step = step;
}

function DCMotor(controller, num) {
    var d_MC = controller;
    var d_motorNum = num;

    var d_pwm, d_in1, d_in2;
    d_pwm = d_in1 = d_in2 = 0;

    num -= 1;

    if (num === 0) {
        d_pwm = 8;
        d_in2 = 9;
        d_in1 = 10;
    }
    else if (num === 1) {
        d_pwm = 13;
        d_in2 = 12;
        d_in1 = 11;
    }
    else if (num === 2) {
        d_pwm = 2;
        d_in2 = 3;
        d_in1 = 4;
    }
    else if (num === 3) {
        d_pwm = 7;
        d_in2 = 6;
        d_in1 = 5;
    }
    else {
        throw new Error("MotorHAT Motor must be between 1 and 4 inclusive");
    }

    var d_PWMpin = d_pwm;
    var d_IN1pin = d_in1;
    var d_IN2pin = d_in2;

    function run(command) {
        if (!d_MC) {
            return;
        }

        if (command === MOTORHAT_CONSTANTS.FORWARD) {
            d_MC.setPin(d_IN2pin, 0);
            d_MC.setPin(d_IN1pin, 1);
        }
        if (command === MOTORHAT_CONSTANTS.BACKWARD) {
            d_MC.setPin(d_IN1pin, 0);
            d_MC.setPin(d_IN2pin, 1);
        }
        if (command === MOTORHAT_CONSTANTS.RELEASE) {
            d_MC.setPin(d_IN2pin, 0);
            d_MC.setPin(d_IN1pin, 0);
        }
        
    }

    function setSpeed(speed) {
        if (speed < 0) {
            speed = 0;
        }
        if (speed > 255) {
            speed = 255;
        }

        d_MC._pwm.setPWM(d_PWMpin, 0, speed * 16);
    }

    this.run = run;
    this.setSpeed = setSpeed;
}

function MotorHAT(i2c, addr, freq) {
    if (addr === undefined) addr = 0x60;
    if (freq === undefined) freq = 1600;

    var d_isReady = false;

    var d_i2cAddr = addr;   // Default 0x60
    var d_freq = freq;      // Default 1600Hz PWM freq
    var d_motors = [
        new DCMotor(this, 1),
        new DCMotor(this, 2),
        new DCMotor(this, 3),
        new DCMotor(this, 4)
    ];

    var d_steppers = [
        new StepperMotor(this, 1),
        new StepperMotor(this, 2)
    ];

    var d_pwm = new PWM(i2c, addr, false);
    d_pwm.setPWMFreq(d_freq).then(function() {
        d_isReady = true;
    });

    function setPin(pin, value) {
        if (pin < 0 || pin > 15) {
            throw new Error("PWM pin must be between 0 and 15 inclusive");
        }
        if (value !== 0 && value !== 1) {
            throw new Error("Pin value must be 0 or 1");
        }
        if (value === 0) {
            d_pwm.setPWM(pin, 0, 4096);
        }
        if (value === 1) {
            d_pwm.setPWM(pin, 4096, 0);
        }
    }

    function getStepper(num) {
        if (num < 1 || num > 2) {
            throw new Error("MotorHAT Stepper must be between 1 and 2 inclusive");
        }
        return d_steppers[num - 1];
    }

    function getMotor(num) {
        if (num < 1 || num > 4) {
            throw new Error("MotorHAT Motor must be between 1 and 4 inclusive");
        }
        return d_motors[num - 1];
    }


    this._pwm = d_pwm;
    this.isReady = function() { return d_isReady; }
    this.setPin = setPin;
    this.getStepper = getStepper;
    this.getMotor = getMotor;
}

module.exports = {
    Constants: MOTORHAT_CONSTANTS,
    MotorHAT: MotorHAT,
    StepperMotor: StepperMotor,
    DCMotor: DCMotor
};