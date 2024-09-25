const AuthManager = artifacts.require("./AuthManager.sol");
const ChatApp = artifacts.require("./ChatApp.sol");
const CombinedTimeLock = artifacts.require("./CombinedTimeLock.sol");

module.exports = function (deployer, network, accounts) {
  let authManagerInstance;

  deployer.deploy(AuthManager)
    .then(() => AuthManager.deployed())
    .then((instance) => {
      authManagerInstance = instance;
      // Deploy ChatApp with AuthManager address
      return deployer.deploy(ChatApp, authManagerInstance.address);
    })
    .then(() => {
      // Deploy CombinedTimeLock
      const signatories = [accounts[0], accounts[1], accounts[2]];
      const delay = 60; // 1 hour delay (in seconds)
      const requiredSignatures = 2;

      return deployer.deploy(CombinedTimeLock, signatories, delay, requiredSignatures, authManagerInstance.address);
    });
};