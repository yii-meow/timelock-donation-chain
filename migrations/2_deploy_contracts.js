var AuthManager = artifacts.require("./AuthManager.sol");
var ChatApp = artifacts.require("./ChatApp.sol");

module.exports = function (deployer) {
  deployer.deploy(AuthManager);
  deployer.deploy(ChatApp);
};
