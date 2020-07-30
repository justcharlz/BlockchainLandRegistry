const { ApiResponse, HttpStatus, GetCodeMsg, Errors, GetLoggerInstance, Decrypt } = require('../utils');
const { TransactionModel, SharePriceModel, UserModel } = require('../models');
const { SterlingTokenContract, ADUserByStaffId } = require('../services');
const bcrypt = require("bcrypt");

const shareController = {
    /**
     * Get Shares Info 
     * @description Fetch User Share Info
     * @returns {object} Share
     */
    async GetShares(req, res, next) {
        let response = new ApiResponse()

        try {

            let responseBody = {}

            // Get Shares Wallet Info
            const sharesWallet = await SterlingTokenContract.balanceOf(req.authUser.address)
            GetLoggerInstance().info(`Response from web3 balanceOf : ${JSON.stringify(sharesWallet)}`)

            // Response Body
            responseBody = {
                sharesWallet
            }
            
            GetLoggerInstance().info(`Outgoing Response To GetShares Request : ${JSON.stringify(responseBody)} `)
            return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), responseBody));

        } catch (error) {
            if (error.hasOwnProperty("name")) {
                if (error.name.split("-").includes("Web3")) {
                    return next(response.PlainError(Errors.WEBLIBRARYERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.WEBLIBRARYERROR), error))
                }
            }
            if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
                next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
                return
            } 
            return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
        }
    },

    /**
     * Get User Share Transactions
     * @description Get User Share Transactions
     * @param {number} offset Number of records to skip
     * @param {number} limit No of records to fetch
     * @return {object[]} transactions
     */
    async GetShareTransactions(req, res, next) {
      
        let response = new ApiResponse()
        
        try {
          let requestBody = {}
          let responseBody = {}
    
          requestBody = req.params
          let {offset, limit} = requestBody
          offset = parseInt(offset)
          limit = parseInt(limit)
          GetLoggerInstance().info(`Incoming Request For getShareTransactions : ${JSON.stringify(requestBody)} `)
  
          const transactions = await TransactionModel.find({userId : req.authUser._id}).where({wallet : TransactionModel.Wallet.SHARES}).skip((!offset)?0:offset).limit((!limit)?50:limit).sort("updateAt")

          const shareprice = await SharePriceModel.findOne().exec()
  
          let responseBody = {
            transactions,
            shareprice: shareprice.price
          }
  
          GetLoggerInstance().info(`Outgoing Response To getShareTransactions Request : ${JSON.stringify(responseBody)}`)
          return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), responseBody));
    
        } catch (error) {
            if (error.hasOwnProperty("name")) {
                if (error.name.split("-").includes("Web3")) {
                    return next(response.PlainError(Errors.WEBLIBRARYERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.WEBLIBRARYERROR), error))
                }
            }
          if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
            next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
            return
          } 
          return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
        }
      },  
      
    /**
     * Transfer Shares
     * @description Allows a user to transfer shares
     * @param {string} toAccount a user to transfer shares, the toAccount can be email or staff id
     * @param {string} volume volume to transfer 
     * @param {string} transactionPin Transaction Pin
    */
    async TransferShares(req, res, next) {
        
        let response = new ApiResponse()
        try {

            let requestBody = {}
    
            requestBody = req.body
            const volume = Math.abs(parseInt(requestBody.volume))
            GetLoggerInstance().info(`Incoming Request For TransferShares : ${JSON.stringify(requestBody)} `)

            ADUserByStaffIdParams = {
              staffid : requestBody.toAccount
            }

            // Call AD Service to authenticate
            let responseFromAD = await ADUserByStaffId(ADUserByStaffIdParams)
            let recipientADProfile = responseFromAD[0].searchUsersByStaffIDResult.diffgram.DocumentElement.sr
            if ( recipientADProfile.length > 1) {
              return next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
            }
            if(recipientADProfile.username.toLowerCase() == req.authUser.username){
              return next(response.PlainError(Errors.TRANSFERLOOP, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.TRANSFERLOOP), {error : "Attempting To Transfer Shares To Self"}))
            }

            const user = await UserModel.findOne({username : recipientADProfile.username.toLowerCase()}, {authToken: 0, password: 0 });
            if(!user){
              return next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
            }
            if (!user.status) {
              return next(response.PlainError(Errors.NOTACTIVEERR, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.NOTACTIVEERR), {error : "User Has Not Been Activated On The Platform"}))
            }

            let balance = await SterlingTokenContract.balanceOf(req.authUser.address) 
            if (parseInt(balance) < volume) {
                return next(response.PlainError(Errors.INSUFICIENTFUND, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.INSUFICIENTFUND), {error : "User Has Insufficient Shares Balance"}))
            }
            
            // Verify Transaction Pin
            const match = await bcrypt.compare(requestBody.transactionPin, req.authUser.transactionPin);
            if(!match) {
              next(response.PlainError(Errors.INVALIDPIN, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDPIN), {error : "Invalid Transaction Pin Supplied"}))
            }

            let chainPass = await Decrypt(req.authUser.password)
            GetLoggerInstance().info(`Request from web3 transfer : ${user.address, volume, req.authUser.address, chainPass}`)
            let chainResponse = await SterlingTokenContract.transfer(user.address, volume, req.authUser.address, chainPass)
            GetLoggerInstance().info(`Response from web3 transfer : ${JSON.stringify(chainResponse)}`)

            // Write Transaction
            let transaction = new TransactionModel() 
            transaction.userId = req.authUser._id
            transaction.from = req.authUser.username
            transaction.to = user.username
            transaction.txHash = chainResponse.txHash
            transaction.amount = volume * shareprice.price
            transaction.volume = volume
            transaction.remark = "Shares transfer"
            transaction.type = TransactionModel.Type.TRANSFER
            transaction.tradeType = TransactionModel.TradeType.NON
            transaction.status = TransactionModel.Status.COMPLETED
            transaction.wallet = TransactionModel.Wallet.SHARES
            await transaction.save()

            let emailFields = {
              volume : volume,
              receiver : user.username,
              sender : req.authUser.username,
              platformTradeURL : Config.PLATFORMTRADEURL
          }

          RabbitMQService.queue('SEND_TRANSFER_EMAIL_TO_RECEIVER', { trade :  emailFields})

            GetLoggerInstance().info(`Outgoing Response To TransferShares Request : ${GetCodeMsg(Errors.SUCCESS)} `)
            return res.status(HttpStatus.OK).json(response.PlainSuccess(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS)));

          

        } catch (error) {
            if (error.hasOwnProperty("name")) {
                if (error.name.toLowerCase().includes("web3")) {
                    return next(response.PlainError(Errors.WEBLIBRARYERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.WEBLIBRARYERROR), error))
                }
            }
            if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
            next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
            return
            } 
            return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
        }
    }
}

module.exports = shareController