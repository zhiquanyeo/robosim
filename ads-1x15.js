var Promise = require('promise');

//====================
// ADS 1x15 12 bit ADC
//====================

function ADS1x15(i2c, address, ic, debug) {
    // IC Identifiers
    var IC_ADS1015                      = 0x00;
    var IC_ADS1115                      = 0x01;

    // Pointer Register
    var ADS1015_REG_POINTER_MASK        = 0x03;
    var ADS1015_REG_POINTER_CONVERT     = 0x00;
    var ADS1015_REG_POINTER_CONFIG      = 0x01;
    var ADS1015_REG_POINTER_LOWTHRESH   = 0x02;
    var ADS1015_REG_POINTER_HITHRESH    = 0x03;

    // Config Register
    var ADS1015_REG_CONFIG_OS_MASK      = 0x8000;
    var ADS1015_REG_CONFIG_OS_SINGLE    = 0x8000;   // Write: Set to start a single conversion
    var ADS1015_REG_CONFIG_OS_BUSY      = 0x0000;   // Read: Bit = 0 when conversion is in progress
    var ADS1015_REG_CONFIG_NOTBUSY      = 0x8000;   // Read: Bit = 1 when device is not performing a conversion

    var ADS1015_REG_CONFIG_MUX_MASK     = 0x7000;
    var ADS1015_REG_CONFIG_MUX_DIFF_0_1 = 0x0000;   // Differential P = AIN0, N = AIN1 (default)
    var ADS1015_REG_CONFIG_MUX_DIFF_0_3 = 0x1000;   // Differential P = AIN0, N = AIN3
    var ADS1015_REG_CONFIG_MUX_DIFF_1_3 = 0x2000;   // Differential P = AIN1, N = AIN3
    var ADS1015_REG_CONFIG_MUX_DIFF_2_3 = 0x3000;   // Differential P = AIN2, N = AIN3
    var ADS1015_REG_CONFIG_MUX_SINGLE_0 = 0x4000;   // Single ended AIN0
    var ADS1015_REG_CONFIG_MUX_SINGLE_1 = 0x5000;   // Single ended AIN1
    var ADS1015_REG_CONFIG_MUX_SINGLE_2 = 0x6000;   // Single ended AIN2
    var ADS1015_REG_CONFIG_MUX_SINGLE_3 = 0x7000;   // Single ended AIN3

    var ADS1015_REG_CONFIG_PGA_MASK     = 0x0E00;
    var ADS1015_REG_CONFIG_PGA_6_144V   = 0x0000;   // +/-6.144V range
    var ADS1015_REG_CONFIG_PGA_4_096V   = 0x0200;   // +/-4.096V range
    var ADS1015_REG_CONFIG_PGA_2_048V   = 0x0400;   // +/-2.048V range
    var ADS1015_REG_CONFIG_PGA_1_024V   = 0x0600;   // +/-1.024V range
    var ADS1015_REG_CONFIG_PGA_0_512V   = 0x0800;   // +/-0.512V range
    var ADS1015_REG_CONFIG_PGA_0_256V   = 0x0A00;   // +/-0.256V range

    var ADS1015_REG_CONFIG_MODE_MASK    = 0x0100;
    var ADS1015_REG_CONFIG_MODE_CONTIN  = 0x0000;   // Continuous conversion mode
    var ADS1015_REG_CONFIG_MODE_SINGLE  = 0x0100;   // Power down single-shot mode (default)

    var ADS1015_REG_CONFIG_DR_MASK      = 0x00E0;
    var ADS1015_REG_CONFIG_DR_128SPS    = 0x0000;   // 128 samples per second
    var ADS1015_REG_CONFIG_DR_250SPS    = 0x0020;   // 250 samples per second
    var ADS1015_REG_CONFIG_DR_490SPS    = 0x0040;   // 490 samples per second
    var ADS1015_REG_CONFIG_DR_920SPS    = 0x0060;   // 920 samples per second
    var ADS1015_REG_CONFIG_DR_1600SPS   = 0x0080;   // 1600 samples per second (default)
    var ADS1015_REG_CONFIG_DR_2400SPS   = 0x00A0;   // 2500 samples per second
    var ADS1015_REG_CONFIG_DR_3300SPS   = 0x00C0;   // 3300 samples per second (also 0x00E0)

    var ADS1115_REG_CONFIG_DR_8SPS      = 0x0000;   // 8 samples per second
    var ADS1115_REG_CONFIG_DR_16SPS     = 0x0020;   // 16 samples per second
    var ADS1115_REG_CONFIG_DR_32SPS     = 0x0040;   // 32 samples per second
    var ADS1115_REG_CONFIG_DR_64SPS     = 0x0060;   // 64 samples per second
    var ADS1115_REG_CONFIG_DR_128SPS    = 0x0080;   // 128 samples per second
    var ADS1115_REG_CONFIG_DR_250SPS    = 0x00A0;   // 250 samples per second (default)
    var ADS1115_REG_CONFIG_DR_475SPS    = 0x00C0;   // 475 samples per second
    var ADS1115_REG_CONFIG_DR_860SPS    = 0x00E0;   // 860 samples per second

    var ADS1015_REG_CONFIG_CMODE_MASK   = 0x0010;
    var ADS1015_REG_CONFIG_CMODE_TRAD   = 0x0000;   // Traditional comparator with hysterisis (default)
    var ADS1015_REG_CONFIG_CMODE_WINDOW = 0x0010;   // Window comparator

    var ADS1015_REG_CONFIG_CPOL_MASK    = 0x0008;
    var ADS1015_REG_CONFIG_CPOL_ACTVLOW = 0x0000;   // ALERT/RDY pin is low when active (default)
    var ADS1015_REG_CONFIG_CPOL_ACTVHI  = 0x0008;   // ALERT/RDY pin is high when active

    var ADS1015_REG_CONFIG_CLAT_MASK    = 0x0004;   // Determins is ALERT/RDY pinlatches once asserted
    var ADS1015_REG_CONFIG_CLAT_NONLAT  = 0x0000;   // Non-latching comparator (default)
    var ADS1015_REG_CONFIG_CLAT_LATCH   = 0x0004;   // Latching Comparator

    var ADS1015_REG_CONFIG_CQUE_MASK    = 0x0003;
    var ADS1015_REG_CONFIG_CQUE_1CONV   = 0x0000;   // Assert ALERT/RDY after one conversion
    var ADS1015_REG_CONFIG_CQUE_2CONV   = 0x0001;   // Assert ALERT/RDY after two conversions
    var ADS1015_REG_CONFIG_CQUE_3CONV   = 0x0002;   // Assert ALERT/RDY after three conversions
    var ADS1015_REG_CONFIG_CQUE_NONE    = 0x0003;   // Disable the comparator and put ALERT/RDY in high state (default)

    var SPS_ADS1115 = {
        8:      ADS1115_REG_CONFIG_DR_8SPS,
        16:     ADS1115_REG_CONFIG_DR_16SPS,
        32:     ADS1115_REG_CONFIG_DR_32SPS,
        64:     ADS1115_REG_CONFIG_DR_64SPS,
        128:    ADS1115_REG_CONFIG_DR_128SPS,
        250:    ADS1115_REG_CONFIG_DR_250SPS,
        475:    ADS1115_REG_CONFIG_DR_475SPS,
        860:    ADS1115_REG_CONFIG_DR_860SPS
    };

    var SPS_ADS1015 = {
        128:    ADS1015_REG_CONFIG_DR_128SPS,
        250:    ADS1015_REG_CONFIG_DR_250SPS,
        490:    ADS1015_REG_CONFIG_DR_490SPS,
        920:    ADS1015_REG_CONFIG_DR_920SPS,
        1600:   ADS1015_REG_CONFIG_DR_1600SPS,
        2400:   ADS1015_REG_CONFIG_DR_2400SPS,
        3300:   ADS1015_REG_CONFIG_DR_3300SPS
    };

    var PGA_ADS1x15 = {
        6144:   ADS1015_REG_CONFIG_PGA_6_144V,
        4096:   ADS1015_REG_CONFIG_PGA_4_096V,
        2048:   ADS1015_REG_CONFIG_PGA_2_048V,
        1024:   ADS1015_REG_CONFIG_PGA_1_024V,
        512:    ADS1015_REG_CONFIG_PGA_0_512V,
        256:    ADS1015_REG_CONFIG_PGA_0_256V
    };

    // Default values
    if (address === undefined) address = 0x48;
    if (ic === undefined) ic = IC_ADS1015;

    var d_i2c = i2c;
    var d_addr = address;
    var d_debug = !!debug;
    

    if (d_ic < IC_ADS1015 || d_ic > IC_ADS1115) {
        if (d_debug) {
            console.log("[ADS1x15] Invalid IC specified: " + ic);
        }
        return null;
    }

    var d_ic = ic;
    var d_pga = 6144;

    // Returns a promise giving an mV reading
    function readADCSingleEnded(channel, pga, sps) {
        return new Promise(function(fulfill, reject) {
            if (channel === undefined) channel = 0;
            if (pga === undefined) pga = 6144;
            if (sps === undefined) sps = 250;

            if (channel < 0 || channel > 3) {
                if (d_debug) {
                    console.log("[ADS1x15] Invalid channel specified: " + channel);
                }
                reject("Invalid channel");
            }

            // Disable comparator, non-latching, alert/rdy active low
            // traditional comparator, singleshot mode
            var config =    ADS1015_REG_CONFIG_CQUE_NONE |
                            ADS1015_REG_CONFIG_CLAT_NONLAT |
                            ADS1015_REG_CONFIG_CPOL_ACTVLOW |
                            ADS1015_REG_CONFIG_CMODE_TRAD |
                            ADS1015_REG_CONFIG_MODE_SINGLE;

            // Set sample per seconds, defaults to 250 (for ADS1115), or 1600 for (ADS1015)
            if (d_ic === IC_ADS1015) {
                config |= (SPS_ADS1015[sps] !== undefined ? SPS_ADS1015[sps] : ADS1015_REG_CONFIG_DR_1600SPS);
            }
            else {
                config |= (SPS_ADS1115[sps] !== undefined ? SPS_ADS1115[sps] : ADS1115_REG_CONFIG_DR_250SPS);
            }

            // Set PGA/Voltage range, defaults to +/- 6.144V
            config |= (PGA_ADS1x15[pga] !== undefined ? PGA_ADS1x15[pga] : ADS1015_REG_CONFIG_PGA_6_144V);

            d_pga = pga;

            // Set the channel to be converted
            if (channel === 3) {
                config |= ADS1015_REG_CONFIG_MUX_SINGLE_3;
            }
            else if (channel === 2) {
                config |= ADS1015_REG_CONFIG_MUX_SINGLE_2;
            }
            else if (channel === 1) {
                config |= ADS1015_REG_CONFIG_MUX_SINGLE_1;
            }
            else {
                config |= ADS1015_REG_CONFIG_MUX_SINGLE_0;
            }

            // Set start single-conversion bit
            config |= ADS1015_REG_CONFIG_OS_SINGLE;

            // Write config to ADC
            d_i2c.writeSync(d_addr, ADS1015_REG_POINTER_CONFIG, new Buffer([(config >> 8) & 0xFF, config & 0xFF]));

            // Wait for the ADC conversion to complete
            // The minimum delay depends on the sps: delay >= 1/sps
            // We add 0.1ms to be sure
            var delayMs = ((1.0 / sps) + 0.0001) * 1000;
            setTimeout(function () {
                // Read the conversion results 
                var result = d_i2c.readSync(d_addr, ADS1015_REG_POINTER_CONVERT, 2);
                var mV;
                if (d_ic === IC_ADS1015) {
                    // shift right 4 bits for the 12 bit ADS1015 and convert to mV
                    mV = ( ((result[0] << 8) | (result[1] & 0xFF)) >> 4  ) * pga / 2048.0;
                }
                else {
                    // Return an mV value for the ADS1115
                    // Take signed values into account as well
                    var val = (result[0] << 8) | (result[1]);
                    if (val > 0x7FFFF) {
                        mV = (val - 0x7FFF) * pga / 32768.0;
                    }
                    else {
                        mV = ( (result[0] << 8) | (result[1]) ) * pga / 32768.0;
                    }
                }

                fulfill(mV);
            }, delayMs);
        });
    }

    // Returns a promise of a mV differential ADC reading from channels chP and chN
    function readADCDifferential(chP, chN, pga, sps) {
        return new Promise(function(fulfill, reject) {
            if (chP === undefined) chP = 0;
            if (chN === undefined) chN = 1;
            if (pga === undefined) pga = 6144;
            if (sps === undefined) sps = 250;

            // Disable comparator, non latching, alert/rdy active low
            // traditional comparator, single shot
            var config =    ADS1015_REG_CONFIG_CQUE_NONE |
                            ADS1015_REG_CONFIG_CLAT_NONLAT |
                            ADS1015_REG_CONFIG_CPOL_ACTVLOW |
                            ADS1015_REG_CONFIG_CMODE_TRAD |
                            ADS1015_REG_CONFIG_MODE_SINGLE;

            // set channels
            if (chP === 0 && chNN === 1) {
                config |= ADS1015_REG_CONFIG_MUX_DIFF_0_1;
            }
            else if (chP === 0 && chN === 3) {
                config |= ADS1015_REG_CONFIG_MUX_DIFF_0_3;
            }
            else if (chP === 2 && chN === 3) {
                config |= ADS1015_REG_CONFIG_MUX_DIFF_2_3;
            }
            else if (chP === 1 && chN === 3) {
                config |= ADS1015_REG_CONFIG_MUX_DIFF_1_3;
            }
            else {
                if (d_debug) {
                    console.log("[ADS1x15] Invalid channels specified for differential: " + chP + ", " + chN);
                }
                reject("Invalid channels");
            }

            // Set sample per seconds, defaults to 250 (for ADS1115), or 1600 for (ADS1015)
            if (d_ic === IC_ADS1015) {
                config |= (SPS_ADS1015[sps] !== undefined ? SPS_ADS1015[sps] : ADS1015_REG_CONFIG_DR_1600SPS);
            }
            else {
                config |= (SPS_ADS1115[sps] !== undefined ? SPS_ADS1115[sps] : ADS1115_REG_CONFIG_DR_250SPS);
            }

            // Set PGA/Voltage range, defaults to +/- 6.144V
            config |= (PGA_ADS1x15[pga] !== undefined ? PGA_ADS1x15[pga] : ADS1015_REG_CONFIG_PGA_6_144V);

            d_pga = pga;

            // Set start single-conversion bit
            config |= ADS1015_REG_CONFIG_OS_SINGLE;

            // Write config to ADC
            d_i2c.writeSync(d_addr, ADS1015_REG_POINTER_CONFIG, new Buffer([(config >> 8) & 0xFF, config & 0xFF]));

            // Wait for the ADC conversion to complete
            // The minimum delay depends on the sps: delay >= 1/sps
            // We add 0.1ms to be sure
            var delayMs = ((1.0 / sps) + 0.0001) * 1000;
            setTimeout(function () {
                var result = d_i2c.readSync(d_addr, ADS1015_REG_POINTER_CONVERT, 2);
                var mV, val;
                if (d_ic === IC_ADS1015) {
                    // shift right 4 bits for 12bit ADS1015 and convert to mV
                    val = ((result[0] << 8) | (result[1] & 0xFF)) >> 4;
                    // Take signed values into account
                    if (val >> 11) {
                        val = val - 0xFFF;
                    }
                    mV = val * pga / 2048.0;
                }
                else {
                    val = (result[0] << 8) | (result[1]);
                    if (val > 0x7FFF) {
                        mV = (val - 0xFFFF) * pga / 32768.0;
                    }
                    else {
                        mV = ( (result[0] << 8) | (result[1]) ) * pga / 32768.0;
                    }
                }

                fulfill(mV);
            }, delayMs);
        });
    }

    function readADCDifferential01(pga, sps) {
        return readADCDifferential(0, 1, pga, sps);
    }

    function readADCDifferential03(pga, sps) {
        return readADCDifferential(0, 3, pga, sps);
    }

    function readADCDifferential13(pga, sps) {
        return readADCDifferential(1, 3, pga, sps);
    }

    function readADCDifferential23(pga, sps) {
        return readADCDifferential(2, 3, pga, sps);
    }

    // TODO: Implement continuous mode

    this.readADCSingleEnded = readADCSingleEnded;
    this.readADCDifferential = readADCDifferential;
    this.readADCDifferential01 = readADCDifferential01;
    this.readADCDifferential03 = readADCDifferential03;
    this.readADCDifferential13 = readADCDifferential13;
    this.readADCDifferential23 = readADCDifferential23;
}

module.exports = ADS1x15;