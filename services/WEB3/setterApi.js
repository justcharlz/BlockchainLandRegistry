const connect = require('./web3config.js')

    //Token smart connect.contract methods
    exports.initialize = async (_addr, _initApprove)=>{ 
      try {
            unlockSuperAdmin()
           const result = await connect.contract.methods.initialize(_addr, _initApprove).send({from: connect.account})
           //const result = await connect.contract.methods.initialize(_addr, _initApprove).send({from: '0x5E4a258d7f025Fe9Bfb3D883353661Cc0C98625E'})
           
           return result;
      
      } catch (error) {
        err  = {
          name : "Web3-Initialize",
          error : error
      }
      throw err
      }
    },

    exports.generateToken = async (_scheduleId, _addr, _amount, _from, _passwrd)=>{ 
      try {
          if (_passwrd) {
            const result = connect.contract.methods.generateToken(_scheduleId, _addr, _amount)
           const nonce = await connect.web3.eth.getTransactionCount(_from)
           const data = result.encodeABI();
           const tx = {
                  nonce:  nonce,
                  from: _from ,
                  to: connect.address,
                  data: data,
                  gas: 2000000,
                  gasPrice: 0
           }
           await connect.web3.eth.personal.unlockAccount(_from, _passwrd, 600)
           const schedule = await connect.web3.eth.signTransaction(tx, _passwrd)
           serializetx = schedule.raw
           const sendtx = await connect.web3.eth.sendSignedTransaction(serializetx)
           return sendtx
          } else {
            unlockSuperAdmin()
            sendtx = await connect.contract.methods.generateToken(_scheduleId, _addr, _amount).send({from: connect.account })
          return sendtx
          }
           
      } catch (error) {
        console.log("got to web3 error >", error)
          err = {
            name : "Web3-GenerateToken",
            error : error,
        }
      throw err
      }
    }