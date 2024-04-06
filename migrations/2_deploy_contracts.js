const MobileDevice = artifacts.require("MobileDevice");

module.exports = function(deployer) {
  deployer.deploy(MobileDevice);
};