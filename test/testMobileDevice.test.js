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
    });
});