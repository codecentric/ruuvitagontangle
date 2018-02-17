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

noble.on('discover', function (peripheral) {
    if (!isRuuviPeripheral(peripheral)) {
        return;
    }

    console.log('------------------------------------------');
    console.log('Peripheral ID', peripheral.id);

    printAdvertisement(peripheral);
    handlePeripheral(peripheral);
});

noble.startScanning();
