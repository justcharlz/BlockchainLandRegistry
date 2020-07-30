const { ApiResponse, HttpStatus, GetCodeMsg, Errors, GetLoggerInstance, Config, Random, Encrypt, Decrypt, GetXML, SerializeXML, TrimObject } = require('../utils');
const { WalletModel, UserModel, TransactionModel } = require('../models');
const { VerifyAccount, Transfer, ADProfile, GetAccountInfo, SendOTP, VerifyOTP, IbsTransfer, ADLogin } = require('../services');
const bcrypt = require("bcrypt");

const walletController = {
  /**
     * Get User Wallet 
     * @description Get User Wallet Details
     * @return {object} wallet
     */
    async GetWallet(req, res, next) {
      
      let response = new ApiResponse()
      
      try {
        const walletId = req.authUser.walletId

        const wallet = await WalletModel.findById(walletId)
        if (!wallet) {
          return next(response.PlainError(Errors.WALLETNOTEXIST, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.WALLETNOTEXIST), {error : "No Fiat Wallet Found For Provided Id"}))
        }
        
        let responseBody = {
            wallet
        }

        GetLoggerInstance().info(`Outgoing Response To getWallet Request : ${JSON.stringify(responseBody)}`)
        return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), responseBody));
  
      } catch (error) {
        if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
          next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
          return
        } 
        return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
      }
    },
    
  /**
     * Get User Wallet Transactions
     * @description Get User Wallet Transactions
     * @param {number} offset Number of records to skip
     * @param {number} limit No of records to fetch
     * @return {object[]} transactions
     */
    async GetWalletTransactions(req, res, next) {
      
      let response = new ApiResponse()
      
      try {
        let requestBody = {}
        let responseBody = {}
  
        requestBody = req.params
        let {offset, limit} = requestBody
        offset = parseInt(offset)
        limit = parseInt(limit)
        GetLoggerInstance().info(`Incoming Request For getWalletTransactions : ${JSON.stringify(requestBody)} `)

        const transactions = await TransactionModel.find({$and: [{type : TransactionModel.Type.NAIRA},{$or : [{from : req.authUser.username},{to : req.authUser.username}, {userId : req.authUser._id}]}]}).skip((!offset)?0:offset).limit((!limit)?50:limit).sort({ updateAt: -1 }).exec()

        responseBody = {
          transactions
        }

        GetLoggerInstance().info(`Outgoing Response To getWalletTransactions Request : ${JSON.stringify(responseBody)}`)
        return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), responseBody));
  
      } catch (error) {
        if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
          next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
          return
        } 
        return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
      }
    },

  /**
     * Verify Bank Account
     * @description Allow users verify an account to add
     * @param {string} account User account number
     */
    async VerifyAccount(req, res, next) {
    
      let response = new ApiResponse()
      try {
  
          let requestBody = {}
    
          requestBody = req.body
          GetLoggerInstance().info(`Incoming Request For addAccount : ${JSON.stringify(requestBody)} `)
  
          // Get User Wallet
          const wallet = await WalletModel.findById(req.authUser.walletId)
          if (!wallet) {
              return next(response.PlainError(Errors.WALLETNOTEXIST, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.WALLETNOTEXIST), {error : "No Fiat Wallet Found For Provided Id"}))
          }
          // Ensure Account Does Not Already Exist
          if (wallet.activeAccounts.includes(requestBody.account)) {
            next(response.PlainError(Errors.DUPLICATEWALLETERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.DUPLICATEWALLETERR), {error : "This account has already been added"}))
            return
          }
  
          // Call Generate OTP Service
          const SendOTPParam = {
            nuban : requestBody.account,
            Appid : Config.APPID
          }

          const otpResponse = await SendOTP(SendOTPParam)
          if (otpResponse[0].doGenerateOtpResult != "1") {
              return next(response.PlainError(Errors.INVALIDWALLETACCTERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDWALLETACCTERR), {error : "Name Enquiry Failed On Account"}))
          }
  
          GetLoggerInstance().info(`Outgoing Response To addAccount Request : ${GetCodeMsg(Errors.SUCCESS)} `)
          return res.status(HttpStatus.OK).json(response.PlainSuccess(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS)));
  
      } catch (error) {
          if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
            next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
            return
          } 
          return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
      }
    },
  
  /**
     * Add Bank Account
     * @description Allow users add a new bank account to their list of active accounts
     * @param {string} account
     * @param {string} otp
     * @return {object} wallet
     */
  async AddAccount(req, res, next) {
    
    let response = new ApiResponse()
    try {

        let requestBody = {}
        let responseBody = {}
  
        requestBody = req.body
        GetLoggerInstance().info(`Incoming Request For AddAccount : ${JSON.stringify(requestBody)} `)

        // Get User Wallet
        const wallet = await WalletModel.findById(req.authUser.walletId)
        if (!wallet) {
            return next(response.PlainError(Errors.WALLETNOTEXIST, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.WALLETNOTEXIST), {error : "No Fiat Wallet Found For Provided Id"}))
        }

        // Call Generate OTP Service
        const VerifyOTPParam = {
          nuban : requestBody.account,
          otp: requestBody.otp,
          Appid : Config.APPID
        }

        const otpResponse = await VerifyOTP(VerifyOTPParam)
        if (otpResponse[0].verifyOtpResult != "1") {
            return next(response.PlainError(Errors.INVALIDOTPERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDOTPERR), {error : "Invalid oTp"}))
        }

        wallet.activeAccounts.push(requestBody.account)
        
        await wallet.save()

        responseBody = {
            wallet
        }

        GetLoggerInstance().info(`Outgoing Response To AddAccount Request : ${JSON.stringify(responseBody)} `)
        return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), responseBody));

    } catch (error) {
        if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
          next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
          return
        } 
        return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
    }
  },

  /**
     * Remove Bank Account
     * @description Allow users remove a bank account from their list of accounts
     * @param {string} account User account to remove
     * @return {object} wallet
     */
  async RemoveAccount(req, res, next) {
        
        let response = new ApiResponse()
        
        try {
        
        let requestBody = {}
        let responseBody = {}

        requestBody = req.body
        GetLoggerInstance().info(`Incoming Request For removeAccount : ${JSON.stringify(requestBody)} `)

        // Get User Wallet
        const wallet = await WalletModel.findById(req.authUser.walletId)
        if (!wallet) {
          return next(response.PlainError(Errors.WALLETNOTEXIST, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.WALLETNOTEXIST), {error : "No Fiat Wallet Found For Provided Id"}))
        }
        wallet.activeAccounts = wallet.activeAccounts.filter(account => account != requestBody.account);
        await wallet.save()

        responseBody = {
            wallet
        }

        GetLoggerInstance().info(`Outgoing Response To removeAccount Request : ${JSON.stringify(responseBody)} `)
        return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), responseBody));

        } catch (error) {
            if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
                next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
                return
            } 
            return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
        }
  },

    /**
   * Fund Wallet From Account
   * @description Allow user fund wallet by direct debit from account
   * @param {object} account  Account to fund from
   * @param {object} amount    Amount to fund wallet with
   * @param {object} otp    OTP for new account
   * @param {object} remark    Transaction remark
   */
  async FundFromAccount(req, res, next) {
    
      let response = new ApiResponse()
    try {
      
        let requestBody = {}
        let responseBody = {}

        requestBody = req.body
        GetLoggerInstance().info(`Incoming Request For fundFromAccount : ${JSON.stringify(requestBody)} `)

        var transaction = await new TransactionModel() 
        const wallet = await WalletModel.findById(req.authUser.walletId)
        if (!wallet) {
          return next(response.PlainError(Errors.WALLETNOTEXIST, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.WALLETNOTEXIST), {error : "No Fiat Wallet Found For Provided Id"}))
        }
        if (!wallet.activeAccounts.includes(requestBody.account)) {
            if (!requestBody.otp) {
              return next(response.PlainError(Errors.INVALIDOTPERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDOTPERR), {error : "No OTP Provided"}))
            }
              // Call Generate OTP Service
            const VerifyOTPParam = {
              nuban : requestBody.account,
              otp: requestBody.otp,
              Appid : Config.APPID
            }
    
            const otpResponse = await VerifyOTP(VerifyOTPParam)
            if (otpResponse[0].verifyOtpResult != "1") {
                return next(response.PlainError(Errors.INVALIDOTPERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDOTPERR), {error : "Invalid OTP"}))
            }
  
        }

        var paymentRef = await Random(20)
        var referenceid = await Random(14)

        // Transaction params
        const amount = requestBody.amount
        const remark = requestBody.remark
        const fromAccount = requestBody.account
        const toAccount = Config.appNairaAccount

        //IBS Request Body
        const jsonRequest = { 
          IBSRequest : {
            "ReferenceID": referenceid,
            "RequestType": 102,
            "Amount": amount,
            "FromAccount": fromAccount,
            "ToAccount": toAccount,
            "PaymentReference": paymentRef,
            "remarks": "STTP Direct Debit/Credit For Naira Wallet : "+remark
          }
        }
        const requestXml = await GetXML(jsonRequest)
        const encIBSBody = await Encrypt(requestXml)
        
        let IBSParams = {
          request : encIBSBody,
          Appid : Config.APPID
        }

        const encryptedResponse = await IbsTransfer(IBSParams)
        const decryptedResponse = await Decrypt(encryptedResponse[0].IBSBridgeResult)
        const ibsResponse = await SerializeXML(decryptedResponse)

        if (ibsResponse.IBSResponse.ResponseCode[0] != "00") {
            transaction.userId = req.authUser._id
            transaction.from = fromAccount
            transaction.to = toAccount
            transaction.txHash = ibsResponse.IBSResponse.ReferenceID[0]
            transaction.amount = amount
            transaction.remark = remark
            transaction.mode = TransactionModel.PaymentMode.ACCOUNT
            transaction.type = TransactionModel.Type.WITHDRAW
            transaction.status = TransactionModel.Status.TERMINATED
            await transaction.save()

            return next(response.PlainError("IBS"+ibsResponse.IBSResponse.ResponseCode[0], HttpStatus.BAD_REQUEST, ibsResponse.IBSResponse.ResponseText[0], {error : `'Wallet funding failed for ${fromAccount}`}))
        }
        GetLoggerInstance().info(`Response from IbsTransfer Service : ${JSON.stringify(ibsResponse.IBSResponse)} `)

        transaction.userId = req.authUser._id
        transaction.from = fromAccount
        transaction.to = toAccount
        transaction.txHash = ibsResponse.IBSResponse.ReferenceID[0]
        transaction.amount = amount
        transaction.remark = remark
        transaction.mode = TransactionModel.PaymentMode.ACCOUNT
        transaction.type = TransactionModel.Type.FUND
        transaction.status = TransactionModel.Status.COMPLETED
        await transaction.save()

        wallet.balance += parseInt(amount)
        if (!wallet.activeAccounts.includes(fromAccount)) {
          wallet.activeAccounts.push(fromAccount)
        }
        await wallet.save()
        
        responseBody = {
          wallet : TrimObject(wallet)
        }

        GetLoggerInstance().info(`Outgoing Response To fundFromAccount Request : ${JSON.stringify(responseBody)} `)
        return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), responseBody));

        } catch (error) {
            if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
                next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
                return
            } 
            return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error))
        }

  },

  /**
   * Fund Wallet From Card
   * @description Allow user fund wallet from card
   * @param {object} wallet user naira wallet
   */
  async FundFromCard(req, res, next) {
    
      let response = new ApiResponse()
    try {
        let requestBody = {}
        let responseBody = {}

        requestBody = req.body
        GetLoggerInstance().info(`Incoming Request For fundFromCard : ${JSON.stringify(requestBody)} `)

        var transaction = await new TransactionModel() 
        const wallet = await WalletModel.findById(req.authUser.walletId)

        // Transaction params
        const amount = requestBody.amount
        const remark = requestBody.remark
        const fromAccount = requestBody.fromAccount
        const referenceId = requestBody.referenceId

        transaction.userId = req.authUser._id
        transaction.from = fromAccount
        transaction.txHash = referenceId
        transaction.amount = amount
        transaction.remark = remark
        transaction.mode = TransactionModel.PaymentMode.CARD
        transaction.type = TransactionModel.Type.FUND
        transaction.status = TransactionModel.Status.COMPLETED
        await transaction.save()

        wallet.balance += parseInt(amount)
        await wallet.save()

        responseBody = {
          wallet : TrimObject(wallet)
        }

        GetLoggerInstance().info(`Outgoing Response To fundFromCard Request : ${JSON.stringify(responseBody)} `)
        return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), responseBody));

        } catch (error) {
            if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
                next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
                return
            } 
            return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
        }

  },

  /**
   * Withdraw Wallet
   * @description Allow user withdraw from their wallet
   * @param {object} account  Account to fund from
   * @param {object} amount    Amount to fund wallet with
   * @param {object} otp    OTP for new account
   * @param {object} remark    Transaction remark
   * @param {object} transactionPin    Transaction pin
   */
  async Cashout(req, res, next) {
    
      let response = new ApiResponse()
    try {
      
        let requestBody = {}
        let responseBody = {}

        requestBody = req.body
        GetLoggerInstance().info(`Incoming Request For Cashout : ${JSON.stringify(requestBody)} `)

        var transaction = await new TransactionModel() 
        const wallet = await WalletModel.findById(req.authUser.walletId)
        if (!wallet) {
          return next(response.PlainError(Errors.WALLETNOTEXIST, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.WALLETNOTEXIST), {error : "No Fiat Wallet Found For Provided Id"}))
        }

        if (!wallet.activeAccounts.includes(requestBody.account)) {
          if (!requestBody.otp) {
            return next(response.PlainError(Errors.INVALIDOTPERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDOTPERR), {error : "No OTP Provided"}))
          }
            // Call Generate OTP Service
          const VerifyOTPParam = {
            nuban : requestBody.account,
            otp: requestBody.otp,
            Appid : Config.APPID
          }
  
          const otpResponse = await VerifyOTP(VerifyOTPParam)
          if (otpResponse[0].verifyOtpResponse.verifyOtpResult != "1") {
              return next(response.PlainError(Errors.INVALIDOTPERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDOTPERR), {error : "Invalid OTP"}))
          }

        }
      
        // Verify Transaction Pin
        const match = await bcrypt.compare(requestBody.transactionPin, req.authUser.transactionPin);
        if(!match) {
          next(response.PlainError(Errors.INVALIDPIN, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDPIN), {error : "Invalid Transaction Pin Supplied"}))
        }

        var paymentRef = await Random(20)
        var referenceid = await Random(14)
        
        // Transaction params
        const amount = req.body.amount
        const remark = req.body.remark
        const toAccount = requestBody.account
        const fromAccount = Config.appNairaAccount

        const limitAmount = parseInt(50000)

        if(parseInt(amount) > limitAmount){
          return next(response.PlainError(Errors.TRANSACTIONLIMIT, HttpStatus.PRECONDITION_FAILED, GetCodeMsg(Errors.TRANSACTIONLIMIT), {error : "Maximum amount per transaction is 50,000"}))
        }

        if (amount > wallet.balance) {

          transaction.userId = req.authUser._id
          transaction.from = fromAccount
          transaction.to = toAccount
          transaction.txHash = referenceid
          transaction.amount = amount
          transaction.remark = remark
          transaction.mode = TransactionModel.PaymentMode.ACCOUNT
          transaction.type = TransactionModel.Type.WITHDRAW
          transaction.status = TransactionModel.Status.TERMINATED
          await transaction.save()

          return next(response.PlainError(Errors.INSUFICIENTFUND, HttpStatus.PRECONDITION_FAILED, GetCodeMsg(Errors.INSUFICIENTFUND), {error : "No Fiat Wallet Found For Provided Id"}))
        }

        //IBS Request Body
        const jsonRequest = { 
          IBSRequest : {
            "ReferenceID": referenceid,
            "RequestType": 102,
            "Amount": amount,
            "FromAccount": fromAccount,
            "ToAccount": toAccount,
            "PaymentReference": paymentRef,
            "remarks": "STTP Direct Debit/Credit For Naira Wallet : "+remark
          }
        }
        const requestXml = await GetXML(jsonRequest)
        const encIBSBody = await Encrypt(requestXml)
        console.log("APPID >> ", Config.APPID)
        let IBSParams = {
          request : encIBSBody,
          Appid : Config.APPID
        }

        const encryptedResponse = await IbsTransfer(IBSParams)
        const decryptedResponse = await Decrypt(encryptedResponse[0].IBSBridgeResult)
        const ibsResponse = await SerializeXML(decryptedResponse)

        if (ibsResponse.IBSResponse.ResponseCode[0] != "00") {
            transaction.userId = req.authUser._id
            transaction.from = fromAccount
            transaction.to = toAccount
            transaction.txHash = referenceid
            transaction.amount = amount
            transaction.remark = remark
            transaction.mode = TransactionModel.PaymentMode.ACCOUNT
            transaction.type = TransactionModel.Type.WITHDRAW
            transaction.status = TransactionModel.Status.TERMINATED
            await transaction.save()

            return next(response.PlainError("IBS"+ibsResponse.IBSResponse.ResponseCode, HttpStatus.BAD_REQUEST, ibsResponse.IBSResponse.ResponseText[0], {error : `'Wallet funding failed for ${fromAccount}`}))
        }
        GetLoggerInstance().info(`Response from IbsTransfer Service : ${JSON.stringify(ibsResponse.IBSResponse)} `)

        transaction.userId = req.authUser._id
        transaction.from = fromAccount
        transaction.to = toAccount
        transaction.txHash = ibsResponse.IBSResponse.ReferenceID[0]
        transaction.amount = amount
        transaction.remark = remark
        transaction.mode = TransactionModel.PaymentMode.ACCOUNT
        transaction.type = TransactionModel.Type.WITHDRAW
        transaction.status = TransactionModel.Status.COMPLETED
        await transaction.save()

        wallet.balance -= parseInt(amount)
        await wallet.save()

        responseBody = {
          wallet : TrimObject(wallet)
        }

        GetLoggerInstance().info(`Outgoing Response To Cashout Request : ${JSON.stringify(responseBody)} `)
        return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), responseBody));

        } catch (error) {
            if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
                next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
                return
            } 
            return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
        }

  }

};

module.exports = walletController;
