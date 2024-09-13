var AuthManager = artifacts.require("./AuthManager.sol");

module.exports = function (deployer) {
  deployer.deploy(AuthManager);
};
