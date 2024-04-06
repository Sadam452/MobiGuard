const MobileDevice = artifacts.require("MobileDevice");

contract("MobileDevice", (accounts) => {
    let mobileDeviceInstance;
    let expected;

    before(async () => {
        mobileDeviceInstance = await MobileDevice.deployed();
    });
    describe("purchase a device", async() => {
        before("purchase a device", async() => {
            await mobileDeviceInstance.purchase(1, {from: accounts[0]});
            expected = accounts[0];    
        });
        it("can fetch the device owner by id", async() => {
            const customer = await mobileDeviceInstance.isDeviceSold(1);
            assert.equal(customer, true, "The device was not sold");
        });
        it("can fetch the collection of devices", async() => {
            const devices = await mobileDeviceInstance.getDevice();
            assert.equal(devices[1], expected, "Collection not matching with owner");
        });
        // before("purchase a device using register function", async() => {
        //     await mobileDeviceInstance.register(9, {from: accounts[0]});
        //     expected = accounts[0];    
        // });
        // it("can fetch the device owner by id", async() => {
        //     const customer = await mobileDeviceInstance.isDeviceSold(9);
        //     assert.equal(customer, true, "The device was not sold");
        // });
        // it("can fetch the collection of devices", async() => {
        //     const devices = await mobileDeviceInstance.getDevice();
        //     assert.equal(devices[9], expected, "Collection not matching with owner");
        // });
        before("Register a device", async() => {
            await mobileDeviceInstance.registerDevice("Galaxy", "565446", "New delhi", "https://www.google.com", {from: accounts[0]});
            expected = accounts[0];   

        });
        it("can fetch the registered devices", async() => {
            // const deviceObject = await mobileDeviceInstance.getRDevice(0);
            // console.log("Device Location = "+device.location+" "+device.length);
            // const deviceObject = device[0];
            // console.log("Name: " + deviceObject.name);
            // console.log("IMEI: " + deviceObject.imei);
            // console.log("Location: " + deviceObject.location);
            // console.log("Image URL: " + deviceObject.imageUrl);
            // console.log("Sold Address: " + deviceObject.sold);
            // console.log("Lost Address: " + deviceObject.lost);
            // console.log("Owner Address: " + deviceObject.owner);
            const deviceObject = await mobileDeviceInstance.getRegisteredDevices();
            console.log(deviceObject);
            // Assuming result is the returned byte array
            var decodedDevices = web3.eth.abi.decodeParameters(
                ['string[]', 'string[]', 'string[]', 'string[]'],
                deviceObject
            );

            // Now you can access the decoded arrays
            var names = decodedDevices[0];
            var imeis = decodedDevices[1];
            var locations = decodedDevices[2];
            var imageUrls = decodedDevices[3];

            // Iterate through the arrays and process each device
            for (var i = 0; i < names.length; i++) {
                console.log("Name: " + names[i]);
                console.log("IMEI: " + imeis[i]);
                console.log("Location: " + locations[i]);
                console.log("Image URL: " + imageUrls[i]);
            }

            //console.log("Device ID: " + deviceObject.deviceId);
            //assert.equal("Galaxy", device[0].name, "The device was not registered");
            const deviceObject2 = await mobileDeviceInstance.getRDevice(0);
            console.log(deviceObject2[0]);
            const deviveCount = await mobileDeviceInstance.getDeviceCount();
            console.log(deviveCount.toString());
        });
    });
});