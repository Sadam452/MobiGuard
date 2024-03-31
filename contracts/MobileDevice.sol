pragma solidity ^0.5.0;

contract MobileDevice {
    address[16] public sold;
    address[16] public lost;

    function purchase(uint deviceId) public returns (uint) {
        require(deviceId >= 0 && deviceId <= 15);
        require(lost[deviceId] != msg.sender);
        sold[deviceId] = msg.sender;
        return deviceId;
    }

    function getDevice() public view returns (address[16] memory) {
        return sold;
    }

    function markLost(uint deviceId) public {
        require(deviceId >= 0 && deviceId <= 15);
        require(sold[deviceId] == msg.sender);
        sold[deviceId] = address(0);
        lost[deviceId] = msg.sender;
    }

    function getLost() public view returns (address[16] memory) {
        return lost;
    }

    function isDeviceLost(uint256 deviceId) public view returns (bool) {
        return lost[deviceId] != address(0);
    }

    function isDeviceSold(uint256 deviceId) public view returns (bool) {
        return sold[deviceId] != address(0);
    }
}
