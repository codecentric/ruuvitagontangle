const noble = require('noble');

noble.on('scanStart', function (state) {
    console.log('Start scannig', state);
});

noble.on('scanStop', function (state) {
    console.log('Stop scanning', state);
});

noble.on('stateChange', function (state) {
    console.log('State change', state);
});

noble.on('warning', function (state) {
    console.log('Warning', state);
});

const parseRawRuuvi = function(manufacturerDataString){
    const humidityStart      = 6;
    const humidityEnd        = 8;
    const temperatureStart   = 8;
    const temperatureEnd     = 12;
    const pressureStart      = 12;
    const pressureEnd        = 16;
    const accelerationXStart = 16;
    const accelerationXEnd   = 20;
    const accelerationYStart = 20;
    const accelerationYEnd   = 24;
    const accelerationZStart = 24;
    const accelerationZEnd   = 28;
    const batteryStart       = 28;
    const batteryEnd         = 32;

    const robject = {};

    let humidity = manufacturerDataString.substring(humidityStart, humidityEnd);
    humidity = parseInt(humidity, 16);
    humidity/= 2; //scale
    robject.humidity = humidity;

    const temperatureString = manufacturerDataString.substring(temperatureStart, temperatureEnd);
    let temperature = parseInt(temperatureString.substring(0, 2), 16);  //Full degrees
    temperature += parseInt(temperatureString.substring(2, 4), 16)/100; //Decimals
    if(temperature > 128){           // Ruuvi format, sign bit + value
        temperature = temperature-128;
        temperature = 0 - temperature;
    }
    robject.temperature = +temperature.toFixed(2); // Round to 2 decimals, format as a number

    let pressure = parseInt(manufacturerDataString.substring(pressureStart, pressureEnd), 16);  // uint16_t pascals
    pressure += 50000; //Ruuvi format
    robject.pressure = pressure;

    let accelerationX = parseInt(manufacturerDataString.substring(accelerationXStart, accelerationXEnd), 16);  // milli-g
    if(accelerationX > 32767){ accelerationX -= 65536;}  //two's complement

    let accelerationY = parseInt(manufacturerDataString.substring(accelerationYStart, accelerationYEnd), 16);  // milli-g
    if(accelerationY > 32767){ accelerationY -= 65536;}  //two's complement

    let accelerationZ = parseInt(manufacturerDataString.substring(accelerationZStart, accelerationZEnd), 16);  // milli-g
    if(accelerationZ > 32767){ accelerationZ -= 65536;}  //two's complement

    robject.accelerationX = accelerationX;
    robject.accelerationY = accelerationY;
    robject.accelerationZ = accelerationZ;
    robject.battery = parseInt(manufacturerDataString.substring(batteryStart, batteryEnd), 16);

    return robject;
};

const printAdvertisement = function (peripheral) {
    const advertisement = peripheral.advertisement;
    const localName = advertisement.localName;
    const txPowerLevel = advertisement.txPowerLevel;
    const manufacturerData = advertisement.manufacturerData;
    const serviceData = advertisement.serviceData;
    const serviceUuids = advertisement.serviceUuids;

    if (localName) {
        console.log('  Local Name        = ' + localName);
    }
    if (txPowerLevel) {
        console.log('  TX Power Level    = ' + txPowerLevel);
    }
    if (manufacturerData) {
        console.log('  Manufacturer Data = ' + manufacturerData);
    }
    if (serviceData) {
        console.log('  Service Data      = ' + JSON.stringify(serviceData, null, 2));
    }
    if (serviceUuids) {
        console.log('  Service UUIDs     = ' + serviceUuids);
    }
};

const isRuuviPeripheral = function (peripheral) {
    const manufacturerDataSting = peripheral.advertisement.manufacturerData.toString('hex');
    return manufacturerDataSting.substring(4, 6) === '03';
};

const handlePeripheral = function (peripheral) {
    peripheral.connect(function (error) {
        if (error) {
            console.log(error);
            return;
        }

        peripheral.discoverServices([], function (error, services) {
            // console.log(error);
            // console.log(services);

            services.forEach(function (service) {
                console.log('  Service', service.name);

                service.discoverCharacteristics([], function (error, characteristics) {
                    characteristics.forEach(function (characteristic) {

                        characteristic.on('data', function (data) {
                            console.log('      Data', data);
                        });


                        let characteristicInfo = '  ' + characteristic.uuid;

                        if (characteristic.name) {
                            characteristicInfo += ' (' + characteristic.name + ')';
                        }

                        // characteristic.subscribe(function (error) {
                        //     console.log(error);
                        // });

                        console.log('  ' + characteristicInfo);
                    })
                });
            });
        });
    });
};

const handleRuuviData = function (peripheral) {
    const manufacturerDataSting = peripheral.advertisement.manufacturerData.toString('hex');
    console.log(parseRawRuuvi(manufacturerDataSting));
};


noble.on('discover', function (peripheral) {
    if (!isRuuviPeripheral(peripheral)) {
        return;
    }

    console.log('------------------------------------------');
    console.log('Peripheral ID', peripheral.id);

    printAdvertisement(peripheral);
    handlePeripheral(peripheral);
    handleRuuviData(peripheral);
});

noble.startScanning();
