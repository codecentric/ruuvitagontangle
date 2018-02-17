const noble = require('noble');
const IOTA = require('iota.lib.js');
const bluebird = require("bluebird");

noble.on('scanStart', () => {
    console.log('Start scanning');
});

noble.on('scanStop', () => {
    console.log('Stop scanning');
});

noble.on('stateChange', (state) => {
    console.log('State change', state);
});

noble.on('warning', (state) => {
    console.log('Warning', state);
});

const parseRawRuuvi = (manufacturerDataString) => {
    const humidityStart = 6;
    const humidityEnd = 8;
    const temperatureStart = 8;
    const temperatureEnd = 12;
    const pressureStart = 12;
    const pressureEnd = 16;
    const accelerationXStart = 16;
    const accelerationXEnd = 20;
    const accelerationYStart = 20;
    const accelerationYEnd = 24;
    const accelerationZStart = 24;
    const accelerationZEnd = 28;
    const batteryStart = 28;
    const batteryEnd = 32;

    const robject = {};

    let humidity = manufacturerDataString.substring(humidityStart, humidityEnd);
    humidity = parseInt(humidity, 16);
    humidity /= 2; //scale
    robject.humidity = humidity;

    const temperatureString = manufacturerDataString.substring(temperatureStart, temperatureEnd);
    let temperature = parseInt(temperatureString.substring(0, 2), 16);  //Full degrees
    temperature += parseInt(temperatureString.substring(2, 4), 16) / 100; //Decimals
    if (temperature > 128) {           // Ruuvi format, sign bit + value
        temperature = temperature - 128;
        temperature = 0 - temperature;
    }
    robject.temperature = +temperature.toFixed(2); // Round to 2 decimals, format as a number

    let pressure = parseInt(manufacturerDataString.substring(pressureStart, pressureEnd), 16);  // uint16_t pascals
    pressure += 50000; //Ruuvi format
    robject.pressure = pressure;

    let accelerationX = parseInt(manufacturerDataString.substring(accelerationXStart, accelerationXEnd), 16);  // milli-g
    if (accelerationX > 32767) {
        accelerationX -= 65536;
    }  //two's complement
    robject.accelerationX = accelerationX;

    let accelerationY = parseInt(manufacturerDataString.substring(accelerationYStart, accelerationYEnd), 16);  // milli-g
    if (accelerationY > 32767) {
        accelerationY -= 65536;
    }  //two's complement
    robject.accelerationY = accelerationY;

    let accelerationZ = parseInt(manufacturerDataString.substring(accelerationZStart, accelerationZEnd), 16);  // milli-g
    if (accelerationZ > 32767) {
        accelerationZ -= 65536;
    }  //two's complement
    robject.accelerationZ = accelerationZ;

    robject.battery = parseInt(manufacturerDataString.substring(batteryStart, batteryEnd), 16); // milli-g

    return robject;
};

const isRuuviPeripheral = (peripheral) => {
    let manufacturerDataSting = peripheral.advertisement.manufacturerData.toString('hex');
    return manufacturerDataSting.substring(4, 6) === '03';
};

noble.on('discover', (peripheral) => {
    if (!isRuuviPeripheral(peripheral)) {
        return;
    }

    console.log('------------------------------------------');
    console.log('Peripheral ID', peripheral.id);

    let manufacturerDataSting = peripheral.advertisement.manufacturerData.toString('hex');
    console.log(parseRawRuuvi(manufacturerDataSting));

});


//
//
//

const generateSeed = () => {
    const length = 81;
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ9";
    let retVal = [81];
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal[i] = charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal.join("");
};

(async () => {

    const config = {
        host: 'http://nodes.iota.fm',
        port: 80
    };

    const iota = new IOTA({
        host: config.host,
        port: config.port,
    });
    console.log(`Connected to node ${config.host}:${config.port}`);

    const api = bluebird.promisifyAll(iota.api);

    const attachToTangle = (seed, receiveAddress) => {
        return async (obj) => {
            const messag = JSON.stringify(obj);
            const messageTrytes = iota.utils.toTrytes(messag);
            console.log(`Converting message: "${message}" -> "${messageTrytes}"`);

            const tag = 'Ruuvi';
            const tagTrytes = iota.utils.toTrytes(tag);
            console.log(`Converting tag: "${tag}" -> "${tagTrytes}"`);

            const transfers = [
                {'address': receiveAddress, 'value': 0, 'message': messageTrytes, 'tag': tagTrytes}
            ];
            console.log(transfers);

            console.log('Sending transaction');
            const result = await api.sendTransfer(seed, 15, 15, transfers);
            console.log('Transaction attached');
        }
    };

    const seed = generateSeed();
    console.log('Seed', seed);

    // const receiveAddress = await api.getNewAddressAsync(seed);
    const receiveAddress = 'THGWJXVJCYXY9G9FSQHDSCKPSFPSONXNBJORQBTNNGXLXFZTWMUGFXTUZTBAAHFTQQIICWMQPNIPHSDED';
    console.log('Receive address:', receiveAddress);

    const attach = attachToTangle(seed, receiveAddress);

    noble.on('discover', async (peripheral) => {
        if (!isRuuviPeripheral(peripheral)) {
            return;
        }
        let manufacturerDataSting = peripheral.advertisement.manufacturerData.toString('hex');
        await attach(parseRawRuuvi(manufacturerDataSting));
    });
    
    noble.startScanning([], true);
})();

