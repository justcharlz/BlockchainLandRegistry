const SterlingShares = artifacts.require('SterlingShares.sol')
const Proxy = artifacts.require('OwnedUpgradeabilityProxy.sol')

module.exports = deployer => {
 
    deployer.deploy(SterlingShares)
    console.log("SterlingToken deployed")

    deployer.deploy(Proxy)
    console.log("Proxy deployed")

}

