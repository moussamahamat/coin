var DicoinToken = artifacts.require("./DicoinToken.sol");
var DicoinTokenSale = artifacts.require("./DicoinTokenSale.sol");

module.exports = function(deployer) {
    deployer.deploy(DicoinToken, 1000000).then(function() {
        // prix du Token est 0.001 Ether
        var tokenPrice = 1000000000000000;
        return deployer.deploy(DicoinTokenSale, DicoinToken.address, tokenPrice);
    });
};