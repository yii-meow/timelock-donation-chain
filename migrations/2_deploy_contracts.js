var AuthManager = artifacts.require("./AuthManager.sol");
var ChatApp = artifacts.require("./ChatApp.sol");
var TransactionApp = artifacts.require("./kfsh.sol");

module.exports = function (deployer) {
  deployer.deploy(AuthManager);
  deployer.deploy(ChatApp);
  deployer.deploy(TransactionApp);
};
