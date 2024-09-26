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
      const signatories = [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5], accounts[6], accounts[7], accounts[8], accounts[9]];
      const delay = 3600; // 1 hour delay (in seconds)
      const requiredSignatures = 2;

      return deployer.deploy(CombinedTimeLock, signatories, delay, requiredSignatures, authManagerInstance.address);
    });
};