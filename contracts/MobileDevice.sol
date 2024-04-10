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
        string email;
    }
    device[] public devices;

    struct user {
        //email, password, address, country, zip, name;
        string email;
        string password;
        string address_;
        string country;
        string zip;
        string name;
        string lat;
        string lon;
    }
    user[] public users;

    // struct location {
    //     string email;
    //     string lat;
    //     string lon;
    // }
    // location[] public locations;

    function updateLocation(string memory email, string memory lat, string memory lon) public{
        for (uint i = 0; i < users.length; i++) {
            if (keccak256(abi.encodePacked((users[i].email))) == keccak256(abi.encodePacked((email)))){
                users[i].lat = lat;
                users[i].lon = lon;
            }
        }
    }

    function returnLocation(string memory email) public view returns (string memory, string memory) {
        for (uint i = 0; i < users.length; i++) {
            if (keccak256(abi.encodePacked((users[i].email))) == keccak256(abi.encodePacked((email)))){
                return (users[i].lat, users[i].lon);
            }
        }
        return ("", "");
    }

    function checkEmailExists(string memory email) internal view returns (bool) {
        for (uint i = 0; i < users.length; i++) {
            if (keccak256(abi.encodePacked((users[i].email))) == keccak256(abi.encodePacked((email)))) {
                return true;
            }
        }
        return false;
    }

    function registerUser(string memory email, string memory password, string memory address_, string memory country, string memory zip, string memory name) public {
        require(!checkEmailExists(email));
        users.push(user({
            email: email,
            password: password,
            address_: address_,
            country: country,
            zip: zip,
            name: name,
            lat: "",
            lon: ""
        }));
    }

    function loginUser(string memory email, string memory password) public view returns (bool) {
        for (uint i = 0; i < users.length; i++) {
            if (keccak256(abi.encodePacked((users[i].email))) == keccak256(abi.encodePacked((email))) && keccak256(abi.encodePacked((users[i].password))) == keccak256(abi.encodePacked((password))) ) {
                return true;
            }
        }
        return false;
    }

    //retrun user details like name, address, country, zip = taking email as input
    function userDetails(string memory email) public view returns (string memory, string memory, string memory, string memory) {
        for (uint i = 0; i < users.length; i++) {
            if (keccak256(abi.encodePacked((users[i].email))) == keccak256(abi.encodePacked((email))) ) {
                return (users[i].name, users[i].address_, users[i].country, users[i].zip);
            }
        }
        return ("", "", "", "");
    }

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
            deviceId: devices.length,
            email: ""
        }));
        deviceCount++;
    }


    function purchase(uint deviceId, string memory email) public returns (uint) {
        require(deviceId >= 0 && deviceId < devices.length);
        require(devices[deviceId].lost == false);
        devices[deviceId].sold = true;
        devices[deviceId].owner = msg.sender;
        devices[deviceId].email = email;
        // sold[deviceId] = msg.sender;
        return deviceId;
    }

    // function getDevice() public view returns (address[16] memory) {
    //     return sold;
    // }

    function markLost(uint deviceId, string memory email) public {
        // require(deviceId >= 0 && deviceId <= 15);
        require(deviceId >=0 && deviceId < devices.length);
        require(devices[deviceId].sold == true);
        require(devices[deviceId].owner == msg.sender);
        require(keccak256(abi.encodePacked((devices[deviceId].email))) == keccak256(abi.encodePacked((email))));
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

    function getRHomeDevice(uint index) public view returns (string memory, string memory, string memory, string memory, bool, string memory) {
        return (devices[index].name, devices[index].imei, devices[index].location, devices[index].imageUrl, devices[index].lost, devices[index].email);
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

    function transferOwnership(uint256 deviceId, address newOwner, string memory email) public {
        require(deviceId >= 0 && deviceId < devices.length);
        require(devices[deviceId].owner == msg.sender);
        // require(keccak256(abi.encodePacked((devices[deviceId].email))) == keccak256(abi.encodePacked((email))));
        devices[deviceId].owner = newOwner;
        devices[deviceId].email = email;
    }

}