const connect = require('./proxyconfig')
  
module.exports.proxyOwner = async ()=>{
    try {
        let result = await connect.contract.methods.proxyOwner().call()
        console.log(result)
        return result
    
    } catch (error) {
        err = {
            name : "Web3-ProxyOwner",
            error : error,
        }
        return err
    }
    
}

module.exports.implementation = async ()=>{
    try {
        let result = await connect.contract.methods.implementation().call()
        console.log(result)
        return result
    
    } catch (error) {
        err = {
            name : "Web3-Implementation",
            error : error,
        }
        throw err
    }
    
}