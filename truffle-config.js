require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');
const fs = require('fs');
const path = require('path');
require('babel-register');
require('babel-polyfill');

module.exports = {
    networks: {
      development: {
        host: "127.0.0.1",
        port: 8545,
        network_id: "*"
      },
      "rinkeby-infura": {
        provider: () => new HDWalletProvider(process.env.TEST_MNEMONIC, "https://rinkeby.infura.io/v3/"+process.env.INFURA_KEY, 0),
        network_id: 4,
        gas: 4700000,
        gasPrice: 100000000000
      },
    blockchainservice: {
      network_id: "*",
      gas: 0,
      gasPrice: 0,
      provider: new HDWalletProvider(fs.readFileSync(path.resolve(__dirname, 'mnemonic.env'), 'utf-8'), "https://blockchainservice.blockchain.azure.com:3200/iPs3xHlFHhxqUruq8bIVy9Jq"),
      consortium_id: 1568368670751
    }
  },
  compilers: {
    solc: {
      version: "0.5.0"
    }
  }
};
