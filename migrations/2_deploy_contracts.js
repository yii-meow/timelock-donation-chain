const AuthManager = artifacts.require("./AuthManager.sol");
const ChatApp = artifacts.require("./ChatApp.sol");
const CombinedTimeLock = artifacts.require("./CombinedTimeLock.sol");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(AuthManager)
    .then(() => AuthManager.deployed())
    .then((authManagerInstance) => {
      // Deploy ChatApp with AuthManager address
      return deployer.deploy(ChatApp, authManagerInstance.address);
    })
    .then(() => {
      // Deploy CombinedTimeLock
      const signatories = [accounts[0], accounts[1], accounts[2]];
      const delay = 3600; // 1 hour delay (in seconds)
      const requiredSignatures = 2;

      return deployer.deploy(CombinedTimeLock, signatories, delay, requiredSignatures);
    });
};