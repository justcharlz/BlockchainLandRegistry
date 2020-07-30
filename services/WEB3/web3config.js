   require('dotenv').config()
   var Web3 = require("web3")
    
//Azure Blockchain
 var provider = new Web3.providers.HttpProvider("https://blockchainservice.blockchain.azure.com:3200/0uXMY98SnG7OmuAC_lnJ0Bvs");

 //Local Blockchain
 //let provider = new Web3.providers.HttpProvider("http://localhost:8545")

    var web3 = new Web3(provider)
    const account = process.env.SUPERADMIN
    const account_pass = process.env.SUPERADMIN_PASS
    
    //Contract address
      const address = "0x0E5510b2A9bAda7D053f3c065042c09feb7F089e"

    //Proxy address
      //const address = "0xC0D455Fc91d78Aa22b890C76d1a33190C9F03318";

    const abi = ;
      
    const contract = new web3.eth.Contract(abi, address)
     
    module.exports = {web3, address, abi, contract, account, account_pass}

