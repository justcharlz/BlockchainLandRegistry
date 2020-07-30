const connect = require('./proxyconfig')

module.exports.upgradeTo = async _addr => { 
      try {
        
          result =  await connect.contract.methods.upgradeTo( _addr).send({from : connect.account})
          //let result = await connect.contract.methods.upgradeTo( _addr).send({from : '0x5E4a258d7f025Fe9Bfb3D883353661Cc0C98625E'})
          //console.log(result)
          return result
      
      } catch (error) {
          err = {
            name : "Web3-UpGradeTo",
            error : error,
        }
      return err
      }
    }

module.exports.transferProxyOwnership = async _addr => { 
    try {
        
        let result = await connect.contract.methods.transferProxyOwnership( _addr).send({from : connect.account})
        return result
    
    } catch (error) {
        err = {
          name : "Web3-TransferProxyOwnership",
          error : error,
      }
    return err
    }
  }