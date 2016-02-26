var Promise = require('promise');

//=============================================
// Adafruit PCA9685 16-Channel PWM Servo Driver
//=============================================

// PWM Class
function PWM(i2c, address, debug) {
    // Registers
    var R_MODE1         = 0x00;
    var R_MODE2         = 0x01;
    var R_SUBADR1       = 0x02;
    var R_SUBADR2       = 0x03;
    var R_SUBADR3       = 0x04;
    var R_PRESCALE      = 0xFE;
    var R_LED0_ON_L     = 0x06;
    var R_LED0_ON_H     = 0x07;
    var R_LED0_OFF_L    = 0x08;
    var R_LED0_OFF_H    = 0x09;
    var R_ALL_LED_ON_L  = 0xFA;
    var R_ALL_LED_ON_H  = 0xFB;
    var R_ALL_LED_OFF_L = 0xFC;
    var R_ALL_LED_OFF_H = 0xFD;

    // Bits
    var _RESTART        = 0x80;
    var _SLEEP          = 0x10;
    var _ALLCALL        = 0x01;
    var _INVRT          = 0x10;
    var _OUTDRV         = 0x04;

    // Default Values
    if (address === undefined) address = 0x40;

    // Properties
    var d_i2c = i2c;
    var d_addr = address;
    var d_debug = !!debug;
    var d_ready = false;

    if (d_debug) {
        console.log("[PWM-Driver] Resetting PCA9685 MODE1 (without SLEEP) and MODE2");
    }

    setAllPWM(0, 0);
    _writeByte(R_MODE2, _OUTDRV);
    _writeByte(R_MODE1, _ALLCALL);
    setTimeout(function() {
        var mode1 = _readByte(R_MODE1);
        mode1 = mode1 & ~_SLEEP;    // Wake up (reset sleep)
        _writeByte(R_MODE1, mode1);

        setTimeout(function() {
            d_ready = true;
        }, 5);
    }, 5);

    function setPWMFreq(freq) {
        return new Promise(function(fulfill, reject) {
            var prescaleVal = 25000000.0;   // 25MHz
            prescaleVal /= 4096.0;          // 12 bit
            prescaleVal /= parseFloat(freq);
            prescaleVal -= 1.0;

            if (d_debug) {
                console.log("[PWM-Driver] Setting PWM to " + freq + " Hz");
                console.log("[PWM-Driver] Estimated pre-scale: " + prescaleVal);
            }

            var prescale = Math.floor(prescaleVal + 0.5);
            if (d_debug) {
                console.log("[PWM-Driver] Final pre-scale: " + prescale);
            }

            var oldMode = _readByte(R_MODE1);
            var newMode = (oldMode & 0x7F) | 0x10;      // sleep
            _writeByte(R_MODE1, newMode);
            _writeByte(R_PRESCALE, (parseInt(Math.floor(prescale), 10) & 0xFF));
            _writeByte(R_MODE1, oldMode);

            setTimeout(function() {
                _writeByte(R_MODE1, oldMode | 0x80);
            }, 5);
        });     
    }

    function setPWM(channel, on, off) {
        // Set a single PWM channel
        _writeByte(R_LED0_ON_L + (4 * channel), on & 0xFF);
        _writeByte(R_LED0_ON_H + (4 * channel), on >> 8);
        _writeByte(R_LED0_OFF_L + (4 * channel), off & 0xFF);
        _writeByte(R_LED0_OFF_H + (4 * channel), off >> 8);
    }

    function setAllPWM(on, off) {
        // Set all PWM channels
        _writeByte(R_ALL_LED_ON_L, on & 0xFF);
        _writeByte(R_ALL_LED_ON_H, on >> 8);
        _writeByte(R_ALL_LED_OFF_L, off & 0xFF);
        _writeByte(R_ALL_LED_OFF_H, off >> 8);
    }

    function _writeByte(reg, value) {
        d_i2c.writeByteSync(d_addr, reg, value);
    }

    function _readByte(reg) {
        return d_i2c.readByteSync(d_addr, reg);
    }

    // Public interface
    this.setPWMFreq = setPWMFreq;
    this.setPWM = setPWM;
    this.setAllPWM = setAllPWM;
}

module.exports = PWM;
