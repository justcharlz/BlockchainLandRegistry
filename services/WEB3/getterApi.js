  const connect = require('./web3config.js')
  

    //Token Contract
    exports.getOwner = async ()=>{
        try {
            let result = await connect.contract.methods.owner().call()
            return result
        
        } catch (error) {
            err = {
                name : "Web3-Owner",
                error : error,
            }
            throw err
        }   
    }

    exports.getTnxCount = async ()=>{
        try {
            unlockSuperAdmin()
            let result = await connect.web3.eth.getTransactionCount(connect.account).call()
            
            return result
        
        } catch (error) {
            err = {
                name : "Web3-TnxCount",
                error : error
            }
            throw err
        }
    }