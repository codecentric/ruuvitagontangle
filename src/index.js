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

noble.on('discover', function (peripheral) {
    peripheral.connect(function (error) {
        if (error) {
            console.log(error);
            return;
        }

        console.log('Peripheral ID', peripheral.id);
        peripheral.discoverServices([], function (error, services) {
            // console.log(error);
            // console.log(services);

            services.forEach(function(service) {
                console.log('  ' + service.name);

                service.discoverCharacteristics([], function(error, characteristics) {
                    characteristics.forEach(function (characteristic) {
                        let characteristicInfo = '  ' + characteristic.uuid;

                        if (characteristic.name) {
                            characteristicInfo += ' (' + characteristic.name + ')';
                        }

                        characteristic.discoverDescriptors(function(error, descriptors) {
                            descriptors.forEach(function (descriptor) {
                                descriptor.readValue([function(error, data) {
                                    characteristicInfo += data.toString();
                                }]);
                            })
                        });

                        console.log('  ' + characteristicInfo);
                    })
                });
            });
        });
    });
});

noble.startScanning();
