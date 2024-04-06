// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
// pragma experimental ABIEncoderV2;

contract MobileDevice {
    // address[16] public sold;
    // address[16] public lost;
    uint256 public deviceCount;

    struct device {
        string name;
        string imei;
        string location;
        string imageUrl;
        bool sold;
        bool lost;
        address owner;
        uint deviceId;
    }
    device[] public devices;

    function checkImeiExists(string memory imei) internal view returns (bool) {
        for (uint i = 0; i < devices.length; i++) {
            if (keccak256(abi.encodePacked((devices[i].imei))) == keccak256(abi.encodePacked((imei)))) {
                return true;
            }
        }
        return false;
    }

    function registerDevice(string memory name_, string memory imei, string memory location, string memory imageUrl) public {
        require(!checkImeiExists(imei));
        devices.push(device({
            name: name_,
            imei: imei,
            location: location,
            imageUrl: imageUrl,
            sold: false,
            lost: false,
            owner: msg.sender,
            deviceId: devices.length
        }));
        deviceCount++;
    }


    function purchase(uint deviceId) public returns (uint) {
        require(deviceId >= 0 && deviceId < devices.length);
        require(devices[deviceId].lost == false);
        devices[deviceId].sold = true;
        devices[deviceId].owner = msg.sender;
        // sold[deviceId] = msg.sender;
        return deviceId;
    }

    // function getDevice() public view returns (address[16] memory) {
    //     return sold;
    // }

    function markLost(uint deviceId) public {
        // require(deviceId >= 0 && deviceId <= 15);
        require(deviceId >=0 && deviceId < devices.length);
        require(devices[deviceId].sold == true);
        require(devices[deviceId].owner == msg.sender);
        devices[deviceId].lost = true;
        // sold[deviceId] = address(0);
        // lost[deviceId] = msg.sender;
    }

    // function getLost() public view returns (address[16] memory) {
    //     return lost;
    // }

    function isDeviceLost(uint256 deviceId) public view returns (bool) {
        return devices[deviceId].lost == true;
    }

    function isDeviceSold(uint256 deviceId) public view returns (bool) {
        return devices[deviceId].sold == true;
    }
    
    function device_Count() public view returns (uint256) {
        return deviceCount;
    }

    function getRDevice(uint index) public view returns (string memory, string memory, string memory, string memory, bool, bool) {
        return (devices[index].name, devices[index].imei, devices[index].location, devices[index].imageUrl, devices[index].sold, devices[index].lost);
    }
    // return registered devices encoded as caver.abi.encodeParameters. dont't use encodePacked(). use caver.abi.encodeParameters
    function getRegisteredDevices() public view returns (bytes memory) {
        string[] memory names = new string[](devices.length);
        string[] memory imeis = new string[](devices.length);
        string[] memory locations = new string[](devices.length);
        string[] memory imageUrls = new string[](devices.length);

        for (uint i = 0; i < devices.length; i++) {
            names[i] = devices[i].name;
            imeis[i] = devices[i].imei;
            locations[i] = devices[i].location;
            imageUrls[i] = devices[i].imageUrl;
        }
        return abi.encode(names, imeis, locations, imageUrls);
    }
    function getRDevices() public view returns (device[] memory) {
        return devices;
    }

}