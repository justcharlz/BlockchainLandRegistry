const { ApiResponse, HttpStatus, GetCodeMsg, Errors, GetLoggerInstance, Config, Random, Decrypt, RabbitMQService } = require('../utils');
const { SharesModel, AdminSettingsModel, TransactionModel, TradeModel, TradingWindowModel, WalletModel, UserModel, SharePriceModel } = require('../models');
const { VerifyAccount, Transfer, ADDetails, GetAccountInfo, IBSTransfer, IbsTransfer, SterlingTokenContract } = require('../services');
const bcrypt = require("bcrypt");
const async = require("async");

const MarketController = {

    /**
     * Get All Trades 
     * @description Fetch All Trades On The Platform
     * @returns {object} responseBody
     */
    async GetAllTrade(req, res, next) {
        let response = new ApiResponse()

        try {

            let responseBody = {}

            const allTrades = await TradeModel.find().sort('updatedAt').exec()

            // Response Body
            responseBody = {
                trades : allTrades
            }
            
            GetLoggerInstance().info(`Outgoing Response To GetAllTrades Request : ${JSON.stringify(responseBody)} `)
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
     * Get All User Trades 
     * @description Fetch All User Trades On The Platform
     * @returns {object} responseBody
     */
    async GetAllUserTrade(req, res, next) {
        let response = new ApiResponse()

        try {

            let responseBody = {}

            const allTrades = await TradeModel.find({userId : req.authUser._id}).sort('updatedAt').exec()

            // Response Body
            responseBody = {
                trades : allTrades
            }
            
            GetLoggerInstance().info(`Outgoing Response To GetAllUserTrade Request : ${JSON.stringify(responseBody)} `)
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
     * Get All Open Trades 
     * @description Fetch Available All Open Trades 
     * @returns {object} Trade
     */
    async GetAllOpenTrades(req, res, next) {
        let response = new ApiResponse()

        try {

            let responseBody = {}

            // Get All Open Sale
            const opneTrade = await TradeModel.find({isOpen : true}).sort('updatedAt').where({userId : {$ne : req.authUser._id } }).exec()

            // Response Body
            responseBody = {
                trades : opneTrade
            }
            
            GetLoggerInstance().info(`Outgoing Response To GetAllOpenTrades Request : ${JSON.stringify(responseBody)} `)
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
     * Get All Closed Trades 
     * @description Fetch Available All Closed Trades 
     * @returns {object} Trade
     */
    async GetAllClosedTrades(req, res, next) {
        let response = new ApiResponse()

        try {

            let responseBody = {}

            // Get All Open Sale
            const opneTrade = await TradeModel.find({isOpen : false}).sort('updatedAt').exec()

            // Response Body
            responseBody = {
                trades : opneTrade
            }
            
            GetLoggerInstance().info(`Outgoing Response To GetAllClosedTrades Request : ${JSON.stringify(responseBody)} `)
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
     * Get User Open Trades 
     * @description Fetch Available User Open Trades 
     * @returns {object} Trade
     */
    async GetUserOpenTrades(req, res, next) {
        let response = new ApiResponse()

        try {

            let responseBody = {}

            // Get All Open Sale
            const openTrade = await TradeModel.find({userId : req.authUser._id}).where({isOpen : true}).sort('updatedAt')

            // Response Body
            responseBody = {
                trades : openTrade
            }
            
            GetLoggerInstance().info(`Outgoing Response To GetUserOpenTrades Request : ${JSON.stringify(responseBody)} `)
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
     * Get User Closed Trades 
     * @description Fetch Available User Closed Trades 
     * @returns {object} Trade
     */
    async GetUserClosedTrades(req, res, next) {
        let response = new ApiResponse()

        try {

            let responseBody = {}

            // Get All Open Sale
            const closedTrade = await TradeModel.find({userId : req.authUser._id}).where({isOpen : false}).sort('updatedAt').exec()

            // Response Body
            responseBody = {
                trades : closedTrade
            }
            
            GetLoggerInstance().info(`Outgoing Response To GetUserClosedTrades Request : ${JSON.stringify(responseBody)} `)
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
     * Get All Trade Transactions 
     * @description Fetch All All Trade Transactions
     * @param {number} offset Number of records to skip
     * @param {number} limit No of records to fetch
     * @returns {object[]} Transactions
     */
    async GetAllTradingTransactions(req, res, next) {
        let response = new ApiResponse()
        
        try {
          let requestBody = {}
          let responseBody = {}
    
          requestBody = req.params
          let {offset, limit} = requestBody
          offset = parseInt(offset)
          limit = parseInt(limit)
          GetLoggerInstance().info(`Incoming Request For GetAllTradingTransactions : ${requestBody} `)
  
          const transactions = await TransactionModel.find().where({type : TransactionModel.Type.TRADE}).skip((!offset)?0:offset).limit((!limit)?50:limit).sort({updateAt : -1}).exec()
  
          responseBody = {
            transactions
          }
  
          GetLoggerInstance().info(`Outgoing Response To GetAllTradingTransactions Request : ${JSON.stringify(responseBody)}`)
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
     * Get User Trade Transactions 
     * @description Fetch All User's Trade Transactions
     * @param {number} offset Number of records to skip
     * @param {number} limit No of records to fetch
     * @returns {object[]} Transactions
     */
    async GetUserTradingTransactions(req, res, next) {
        let response = new ApiResponse()
        
        try {
          let requestBody = {}
          let responseBody = {}

          requestBody = (req.params.offset == undefined)? req.query : req.params
          let {offset, limit} = requestBody
          offset = parseInt(offset)
          limit = parseInt(limit)
          GetLoggerInstance().info(`Incoming Request For GetUserTradingTransactions : ${requestBody} `)
  
          const transactions = await TransactionModel.find({$and: [{type : TransactionModel.Type.TRADE},{$or : [{from : req.authUser.username},{to : req.authUser.username}, {userId : req.authUser._id}]}]}).skip((!offset)?0:offset).limit((!limit)?50:limit).sort({ updateAt: -1 }).exec()
  
          responseBody = {
            transactions
          }
  
          GetLoggerInstance().info(`Outgoing Response To GetUserTradingTransactions Request : ${JSON.stringify(responseBody)}`)
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
     * Put Up Shares For Sale
     * @description Allows a user to put up shares for sale
     * @param {string} price unit price, per one quantity
     * @param {string} quantity Quantity of what to sell
    */
    async SellOffer(req, res, next) {
        
        let response = new ApiResponse()
        try {

            let requestBody = {}
            let tradingWindow = await TradingWindowModel.findOne({isOpen : true}).exec()
    
            requestBody = req.body
            GetLoggerInstance().info(`Incoming Request For sellOffer : ${JSON.stringify(requestBody)} `)

            const quantity = Math.abs(parseInt(requestBody.quantity))
            const price = Math.abs(parseInt(requestBody.price))

            if (quantity == 0 || price == 0) {
                return next(response.PlainError(Errors.ZEROTRADE, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.ZEROTRADE), {error : "Zero Trade Not Allow"}))
            }

            let balance = await SterlingTokenContract.balanceOf(req.authUser.address) 
            if (parseInt(balance) < quantity) {
                return next(response.PlainError(Errors.INSUFICIENTFUND, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.INSUFICIENTFUND), {error : "User Does Not Exist"}))
            }
            
            let allowance = await SterlingTokenContract.allowance(req.authUser.address, Config.SuperAdmin)
            let chainPass = await Decrypt(req.authUser.password)
            let chainResponse
            GetLoggerInstance().info(`Request from web3 approve / increaseAllowance : ${Config.SuperAdmin, quantity, req.authUser.address, chainPass}`)
            if (parseInt(allowance) <= 0) {
                chainResponse = await SterlingTokenContract.approve(Config.SuperAdmin, quantity, req.authUser.address, chainPass)
            }else{
                chainResponse = await SterlingTokenContract.increaseAllowance(Config.SuperAdmin, quantity, req.authUser.address, chainPass)
            }
            GetLoggerInstance().info(`Response from web3 approve / increaseAllowance : ${JSON.stringify(chainResponse)}`)
           
            tradeOffer = new TradeModel()
            tradeOffer.windowId = tradingWindow._id
            tradeOffer.userId = req.authUser._id
            tradeOffer.price = price
            tradeOffer.initialVolume = quantity
            tradeOffer.volume = quantity
            await tradeOffer.save()

            GetLoggerInstance().info(`Outgoing Response To sellOffer Request : ${GetCodeMsg(Errors.SUCCESS)} `)
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
    },
    

    /**
     * Put A Buy Request
     * @description Allows a user to put up a buy request for share
     * @param {string} price unit price, per one quantity
     * @param {number} quantity Quantity of what to sell
    */
    async BuyOffer(req, res, next) {
        
        let response = new ApiResponse()
        try {

            let requestBody = {}
            let tradingWindow = await TradingWindowModel.findOne({isOpen : true}).exec()

            requestBody = req.body
            GetLoggerInstance().info(`Incoming Request For buyOffer : ${JSON.stringify(requestBody)} `)

            const quantity = Math.abs(parseInt(requestBody.quantity))
            const price = Math.abs(parseInt(requestBody.price))

            if (quantity == 0 || price == 0) {
                return next(response.PlainError(Errors.ZEROTRADE, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.ZEROTRADE), {error : "Zero Trade Not Allow"}))
            }

            const wallet = await WalletModel.findById(req.authUser.walletId)
            if (wallet.balance < (quantity * price)) {
                return next(response.PlainError(Errors.INSUFICIENTFUND, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.INSUFICIENTFUND), {error : "User HAs Insufficient Funds To Pay"}))
            }

            tradeOffer = new TradeModel()
            tradeOffer.windowId = tradingWindow._id
            tradeOffer.userId = req.authUser._id
            tradeOffer.price = price
            tradeOffer.volume = quantity
            tradeOffer.initialVolume = quantity
            tradeOffer.type = TradeModel.Type.BUY
            await tradeOffer.save()

            GetLoggerInstance().info(`Outgoing Response To buyOffer Request : ${GetCodeMsg(Errors.SUCCESS)} `)
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
    },
    
    /**
     * Put Up Shares For Sale
     * @description Allows a user to put up shares for sale
     * @param {string} price unit price, per one quantity
     * @param {string} tradeId unit price, per one quantity
    */
    async UpdateOffer(req, res, next) {
        let response = new ApiResponse()
        try {

            let requestBody = {}

            requestBody = req.body
            const offerId = (req.params.tradeId == undefined)? req.query.tradeId : req.params.tradeId
            GetLoggerInstance().info(`Incoming Request For updateOffer : ${JSON.stringify(requestBody)} `)
            const price = Math.abs(parseInt(requestBody.price))

            if (price == 0) {
                return next(response.PlainError(Errors.ZEROTRADE, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.ZEROTRADE), {error : "Zero Trade Not Allow"}))
            }

            const tradeOffer = await TradeModel.findOne({_id : offerId}).where({userId : req.authUser._id}).exec()

            if (!tradeOffer) {
                return next(response.PlainError(Errors.TRADENOEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.TRADENOEXIST), {error : "Trade Does Not Exist"}))
            }
            if (!tradeOffer.isOpen) {
                return next(response.PlainError(Errors.TRADECLOSEERR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.TRADECLOSEERR), {error : "Cannot Update A Closed Trade"}))
            }
            if (tradeOffer.isCancel) {
                return next(response.PlainError(Errors.TRADECANCELERR, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.TRADECANCELERR), {error : "Trade Is Canceled"}))
            }
            if (tradeOffer.tradeType == TradeModel.Type.BUY) {
                const wallet = await WalletModel.findById(req.authUser.walletId)
                if (wallet.balance < (volume * price)) {
                    return next(response.PlainError(Errors.INSUFICIENTFUND, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.INSUFICIENTFUND), {error : "User HAs Insufficient Funds To Pay"}))
                }
            }
            
            tradeOffer.price = price
            await tradeOffer.save()

            GetLoggerInstance().info(`Outgoing Response To updateOffer Request : ${GetCodeMsg(Errors.SUCCESS)} `)
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
    },

     /**
     * Make A Buy Offer
     * @description Allows a user to request to buy shares
     * @param {string} tradeId unit price, per one quantity
    */
    async CancelOffer(req, res, next) {
        let response = new ApiResponse()
        try {

            let requestBody = {}

            requestBody = req.body
            const offerId = (req.params.tradeId == undefined)? req.query.tradeId : req.params.tradeId
            GetLoggerInstance().info(`Incoming Request For buyOffer : ${JSON.stringify(requestBody)} `)

            const tradeOffer = await TradeModel.findOne({_id : offerId}).where({userId : req.authUser._id}).exec()
            if (!tradeOffer) {
                return next(response.PlainError(Errors.TRADENOEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.TRADENOEXIST), {error : "Trade Does Not Exist"}))
            }
            if (!tradeOffer.isOpen) {
                return next(response.PlainError(Errors.TRADECLOSEERR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.TRADECLOSEERR), {error : "Cannot Cancel A Closed Trade"}))
            }

            if (tradeOffer.type == TradeModel.Type.SELL) {
                let allowance = await SterlingTokenContract.allowance(req.authUser.address, Config.SuperAdmin)
                if (parseInt(allowance) <= 0) {
                    return next(response.PlainError(Errors.WEBLIBRARYERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.WEBLIBRARYERROR), {error : "Insufficient balance in share escrow account"}))
                }else{
                    GetLoggerInstance().info(`Request to web3 transferFrom : ${req.authUser.address, req.authUser.address, tradeOffer.volume}`)
                    let chainResponse = await SterlingTokenContract.transferFrom(req.authUser.address, req.authUser.address, tradeOffer.volume)
                    GetLoggerInstance().info(`Response from web3 transferFrom : ${JSON.stringify(chainResponse)}`)
                }
            }
            
            tradeOffer.isCancel = true
            tradeOffer.isOpen = false
            await tradeOffer.save()

            GetLoggerInstance().info(`Outgoing Response To buyOffer Request : ${GetCodeMsg(Errors.SUCCESS)} `)
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
    },

    /**
     * Buy Shares
     * @description Allows a user to buy shares from the market
     * @param {number} quantity Quantity of what to sell
     * @param {string} tradeId The trade offer to buy from 
     * @param {string} transactionPin Transaction Pin
    */
    async Buy(req, res, next) {
            
        let response = new ApiResponse()
        try {

            let requestBody = {}

            requestBody = req.body
            const quantity = parseInt(requestBody.quantity)
            const offerId = (req.params.tradeId == undefined)? req.query.tradeId : req.params.tradeId
            GetLoggerInstance().info(`Incoming Request For Buy : ${JSON.stringify(requestBody)} `)

            // Validate Buy Trade
            const sellOffer = await TradeModel.findById(offerId)
            if (!sellOffer) {
                return next(response.PlainError(Errors.TRADENOEXIST, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.TRADENOEXIST), {error : "Trade Does Not Exist"}))
            }
            if (!sellOffer.isOpen) {
                return next(response.PlainError(Errors.TRADECLOSEERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.TRADECLOSEERR), {error : "Trade Is Closed"}))
            }
            if (sellOffer.isCancel) {
                return next(response.PlainError(Errors.TRADECANCELERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.TRADECANCELERR), {error : "Trade Is Canceled"}))
            }
            if (quantity > parseInt(sellOffer.volume)) {
                return next(response.PlainError(Errors.BUYINSUFFICIENTERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.BUYINSUFFICIENTERR), {error : "Insufficient volume in sell offer"}))
            }
            if (req.authUser._id > sellOffer.userId) {
                return next(response.PlainError(Errors.TRADELOOP, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.TRADELOOP), {error : "Cannot Trade To Self"}))
            }
            
            // Verify Transaction Pin
            const match = await bcrypt.compare(requestBody.transactionPin, req.authUser.transactionPin);
            if(!match) {
              next(response.PlainError(Errors.INVALIDPIN, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDPIN), {error : "Invalid Transaction Pin Supplied"}))
            }

            const amountToPay = quantity * parseInt(sellOffer.price)
            const sellerInfo = await UserModel.findById(sellOffer.userId)

            // get Wallet instances
            const buyerWallet = await WalletModel.findById(req.authUser.walletId)
            const sellerWallet = await WalletModel.findById(sellerInfo.walletId)

            // Ensures Buyer Has Sufficiently Enough Funds To Pay
            if (buyerWallet.balance < amountToPay) {
                return next(response.PlainError(Errors.INSUFICIENTFUND, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.INSUFICIENTFUND), {error : "User Has Insufficient Funds To Pay"}))
            }
            
            // Ensures Seller Has Sufficiently Enough Shares In Escrow To Transfer
            let allowance = await SterlingTokenContract.allowance(sellerInfo.address, Config.SuperAdmin)
            if (parseInt(allowance) <= 0) {
                return next(response.PlainError(Errors.WEBLIBRARYERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.WEBLIBRARYERROR), {error : "Insufficient balance in share escrow account"}))
            }
            
            // debit seller share wallet and credit buyer share wallet
            console.log("quantity >> ", quantity)
            GetLoggerInstance().info(`Request to web3 transferFrom : ${sellerInfo.address, req.authUser.address, quantity}`)
            let chainResponse = await SterlingTokenContract.transferFrom(sellerInfo.address, req.authUser.address, quantity)
            GetLoggerInstance().info(`Response from web3 transferFrom : ${JSON.stringify(chainResponse)}`)
        
            // debit buyer fiat wallet and credit seller fiat wallets
            buyerWallet.balance = parseInt(buyerWallet.balance) - amountToPay
            sellerWallet.balance = parseInt(sellerWallet.balance) + amountToPay
            await Promise.all([buyerWallet.save(), sellerWallet.save()])

            // Update trade
            if (parseInt(sellOffer.volume) - quantity == 0) {
                sellOffer.isOpen = false
            }
            sellOffer.volume -= quantity
            await sellOffer.save()
            
            // Write Transaction
            let transaction = new TransactionModel() 
            transaction.userId = req.authUser._id
            transaction.from = sellerInfo.username
            transaction.to = req.authUser.username
            transaction.txHash = chainResponse.txHash
            transaction.amount = amountToPay
            transaction.volume = quantity
            transaction.remark = "Shares Bought"
            transaction.type = TransactionModel.Type.TRADE
            transaction.tradeType = TransactionModel.TradeType.BUY
            transaction.status = TransactionModel.Status.COMPLETED
            transaction.wallet = TransactionModel.Wallet.SHARES
            await transaction.save()

            let emailFields = {
                amount : amountToPay,
                seller : sellerInfo.username,
                platformTradeURL : Config.PLATFORMTRADEURL+"/"+offerId
            }

            RabbitMQService.queue('SEND_EMAIL_TO_SELLER', { trade :  emailFields})

            GetLoggerInstance().info(`Outgoing Response To sellOffer Request : ${GetCodeMsg(Errors.SUCCESS)} `)
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
    },

    /**
    * Buy Shares
    * @description Allows a user to buy shares from the market
    * @param {number} quantity Quantity of what to sell
    * @param {string} tradeId The trade offer to buy from 
    * @param {string} transactionPin Transaction Pin
    */
    async Sell(req, res, next) {
       
       let response = new ApiResponse()
       try {

           let requestBody = {}

           requestBody = req.body
           const quantity = Math.abs(parseInt(requestBody.quantity))
           const offerId = (req.params.tradeId == undefined)? req.query.tradeId : req.params.tradeId
           GetLoggerInstance().info(`Incoming Request For Sell : ${JSON.stringify(requestBody)} `)

           // Validate Sell Trade
           const buyOffer = await TradeModel.findById(offerId)
           if (!buyOffer) {
               return next(response.PlainError(Errors.TRADENOEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.TRADENOEXIST), {error : "Trade Does Not Exist"}))
           }
           if (!buyOffer.isOpen) {
               return next(response.PlainError(Errors.TRADECLOSEERR, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.TRADECLOSEERR), {error : "Trade Is Closed"}))
           }
           if (buyOffer.isCancel) {
                return next(response.PlainError(Errors.TRADECANCELERR, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.TRADECANCELERR), {error : "Trade Is Canceled"}))
           }
           if (quantity > parseInt(buyOffer.volume)) {
               return next(response.PlainError(Errors.SELLOVERERR, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.SELLOVERERR), {error : "Insufficient volume in sell offer"}))
           }
           if (req.authUser._id > buyOffer.userId) {
               return next(response.PlainError(Errors.TRADELOOP, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.TRADELOOP), {error : "Cannot Trade To Self"}))
           }

           // Ensures Buyer Has Sufficiently Enough To Pay
           const buyerInfo = await UserModel.findById(buyOffer.userId)
           const buyerWallet = await WalletModel.findById(buyerInfo.walletId)
           if (buyerWallet.balance < (quantity * parseInt(buyOffer.price))) {
               return next(response.PlainError(Errors.SELLINSUFFICIENTERR, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.SELLINSUFFICIENTERR), {error : "Buyer Has Insufficient Funds To Pay"}))
           }

           // Ensures Seller Has Enough Shares To Sell
           let sellerBalance = await SterlingTokenContract.balanceOf(req.authUser.address)
           if (parseInt(sellerBalance) < quantity) {
                return next(response.PlainError(Errors.LIMITFUNDS412, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.LIMITFUNDS412), {error : "Insufficient balance in seller share account"}))
           }

            // Verify Transaction Pin
            const match = await bcrypt.compare(requestBody.transactionPin, req.authUser.transactionPin);
            if(!match) {
              next(response.PlainError(Errors.INVALIDPIN, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDPIN), {error : "Invalid Transaction Pin Supplied"}))
            }

           const amountToPay = quantity * parseInt(buyOffer.price)

           // debit seller share wallet and credit buyer share wallet
            let chainPass = await Decrypt(req.authUser.password)
            GetLoggerInstance().info(`Request to web3 transfer : ${buyerInfo.address, quantity, req.authUser.address, chainPass}`)
            let chainResponse = await SterlingTokenContract.transfer(buyerInfo.address, quantity, req.authUser.address, chainPass)
            GetLoggerInstance().info(`Response from web3 transfer : ${JSON.stringify(chainResponse)}`)
       
           // debit buyer fiat wallet and credit seller fiat wallets
           const sellerWallet = await WalletModel.findById(req.authUser.walletId)
           buyerWallet.balance = parseInt(buyerWallet.balance) - amountToPay
           sellerWallet.balance = parseInt(sellerWallet.balance) + amountToPay
           await Promise.all([sellerWallet.save(), buyerWallet.save()])

           // Update trade
           if (parseInt(buyOffer.volume) - quantity == 0) {
            buyOffer.isOpen = false
           }
           buyOffer.volume -= quantity
           await buyOffer.save()
           
           // Write Transaction
           let transaction = new TransactionModel() 
           transaction.userId = req.authUser._id
           transaction.from = req.authUser.username
           transaction.to = buyerInfo.username
           transaction.txHash = chainResponse.txHash
           transaction.amount = amountToPay
           transaction.volume = quantity
           transaction.remark = "Shares Sold"
           transaction.type = TransactionModel.Type.TRADE
           transaction.tradeType = TransactionModel.TradeType.SELL
           transaction.status = TransactionModel.Status.COMPLETED
           transaction.wallet = TransactionModel.Wallet.SHARES
           await transaction.save()

           let emailFields = {
               volume : amountToPay,
               buyer : buyerInfo.username,
               platformTradeURL : Config.PLATFORMTRADEURL+"/"+offerId
           }

           RabbitMQService.queue('SEND_EMAIL_TO_BUYER', { trade :  emailFields})

           GetLoggerInstance().info(`Outgoing Response To Sell Request : ${GetCodeMsg(Errors.SUCCESS)} `)
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
    },

    /**
     * Buy Back All Open Trades 
     * @description Fetch Available All Open Trades 
     * @returns {object} Trade
     */
    async MopAllOpenTrades(req, res, next) {
        let response = new ApiResponse()

        // req.authUser = new Object()
        // req.authUser._id = "5ddffa603f1c213068be662d"
        // req.authUser.password = "5wsXeW3+A+h6wsR3AqXWCIKbZd9D8Sbq"

        try {

            let responseBody = {}
            let requestBody = {}

            requestBody = req.body
            GetLoggerInstance().info(`Incoming Request For sellOffer : ${JSON.stringify(requestBody)} `);

            //Get set share market-value
            const setMarketPrice = Math.abs(parseInt(requestBody.shareprice))

            //Check if setMarket price is not zero else use NSE marketprice
            if(setMarketPrice){
             price = setMarketPrice
            }else{
            shareprice = await SharePriceModel.findOne().exec()
            //Get sterling share market-value from NSE
             price = shareprice.price
            }

            if (price == 0) {
                return next(response.PlainError(Errors.ZEROTRADE, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.ZEROTRADE), {error : "Zero Trade Not Allow"}))
            }

            //Get total buyback trade volume
            tradevolume = Math.abs(parseInt(requestBody.volume))

            //check Admin wallet fund covers trade volume
            buyerInfo = await UserModel.findById(req.authUser._id)
            buyerWallet = await WalletModel.findById(buyerInfo.walletId)
           if (buyerWallet.balance < (tradevolume * parseInt(price))) {
               return next(response.PlainError(Errors.SELLINSUFFICIENTERR, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.SELLINSUFFICIENTERR), {error : "Buyer Has Insufficient Funds To Pay"}))
           }

            // Get All Open Trade order that is equals or less than price
            const openTrade = await TradeModel.find({$and:[{isOpen : true}, {price : {$lte : price}}]}).sort('volume').where({userId : {$ne : req.authUser._id } })
           
            let opentradevolume;
            //Get total open trade volumes
            openTraders = openTrade.length
            if(openTraders > 0 ){
                 opentradevolume = openTrade.map((openTrade)=> openTrade.volume).reduce((a,b) => a + b)
                
            //check buyer has funds to pay for all open trades
           if (buyerWallet.balance < (opentradevolume * parseInt(price))) {
            return next(response.PlainError(Errors.SELLINSUFFICIENTERR, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.SELLINSUFFICIENTERR), {error : "Buyer Has Insufficient Funds To Pay"}))
            }
            //console.log('Open Trade>>',opentradevolume)
            trades = openTraders
            //If total buyback volume is empty, close and buyback all open trades
            if (tradevolume == 0 && opentradevolume > 0) {
            
                tradevolume = opentradevolume
                
            //Burn token shares from user's opentrade and initiate wallet transfer
            trade = async (openTrade)=>{
                 buyerInfo = await UserModel.findById(req.authUser._id)
                 buyerWallet = await WalletModel.findById(buyerInfo.walletId)
                 sellerInfo = await UserModel.findById(openTrade.userId)
                 sellerWallet = await WalletModel.findById(sellerInfo.walletId)

                //Calculate amount to buy from users
                let sharesBuyBack = parseInt(openTrade.volume)
                
                // Ensures Seller Has Enough Shares To Sell
                let sellerBalance = await SterlingTokenContract.balanceOf(sellerInfo.address)
                if (parseInt(sellerBalance) < sharesBuyBack) {
                    return next(response.PlainError(Errors.LIMITFUNDS412, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.LIMITFUNDS412), {error : "Insufficient balance in seller share account"}))
                }
                
                //if opentrade vol is less/equals sharesbuyback
                //set dbtable to newvolume and subtract from TradeVol
                const tradeOffer = await TradeModel.findOne({_id : openTrade._id}).where({userId : openTrade.userId}).exec()
                amountToPay = price * openTrade.volume
                tradeOffer.isOpen = false
                tradeOffer.volume -= openTrade.volume
                await tradeOffer.save()

                //subtract newvolume from blockchain account
                let chainPass = await Decrypt(req.authUser.password)
                GetLoggerInstance().info(`Request to web3 decrease allowance : ${buyerInfo.address, sharesBuyBack, req.authUser.address, chainPass}`)
                let chainResponse = await SterlingTokenContract.decreaseAllowance(Config.SuperAdmin, sharesBuyBack, sellerInfo.address, chainPass)
                GetLoggerInstance().info(`Response from web3 decrease allowance : ${JSON.stringify(chainResponse)}`)
                

                // debit buyer fiat wallet and credit seller fiat wallets
                //const sellerWallet = await WalletModel.findById(req.authUser.walletId)
                buyerWallet.balance = Math.max(0, parseInt(buyerWallet.balance) - amountToPay)
                sellerWallet.balance = Math.max(0, parseInt(sellerWallet.balance) + amountToPay)
                await sellerWallet.save()
                await buyerWallet.save()
                
                

                //recalculates tradevolume and openTrade
                trades -= 1
                tradevolume -= sharesBuyBack
            }

            await Promise.all(openTrade.map(trade))

            }
            else if(tradevolume > 0){

                // let tradevol = tradevolume
                // trades = openTraders
                
                
            //Burn token shares from user's opentrade and initiate wallet transfer
           
              trade = async (openTrade)=>{
                // buyerInfo = await UserModel.findById(req.authUser._id)
                // buyerWallet = await WalletModel.findById(buyerInfo.walletId)
                sellerInfo = await UserModel.findById(openTrade.userId)
                console.log('Seller Info>>', openTrade.userId)
                //console.log('Seller Info>>', sellerInfo )
                sellerWallet = await WalletModel.findById(sellerInfo.walletId)
                // buyerWallet = buyerWallet.toObject()
                // sellerWallet = sellerWallet.toObject()
                // delete buyerWallet._id
                // delete sellerWallet._id
                
                console.log('Seller Wallet Object>>', sellerWallet)
                console.log('Buyer Wallet Object>>', buyerWallet)
                console.log('Old Seller Balance>>',  sellerWallet.balance)
                console.log('Old Buyer Balance>>',  buyerWallet.balance)
                
                //Calculate amount to buy from users
                sharesBuyBack = parseInt(tradevolume / trades)
                                
                // Ensures Seller Has Enough Shares To Sell
                // let sellerBalance = await SterlingTokenContract.balanceOf(sellerInfo.address)
                // if (parseInt(sellerBalance) < sharesBuyBack) {
                //     return next(response.PlainError(Errors.LIMITFUNDS412, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.LIMITFUNDS412), {error : "Insufficient balance in seller share account"}))
                // }
                
                //set dbtable to newvolume and subtract from TradeVol
                tradeOffer = await TradeModel.findOne({_id : openTrade._id}).where({userId : openTrade.userId}).exec()

                if (openTrade.volume <= sharesBuyBack) {
                    sharesBuyBackBal = sharesBuyBack - openTrade.volume
                    tradevolume -= openTrade.volume
                    trades -= 1
                    newvolume = 0
                    sharesBuyBack = parseInt(tradevolume / trades)
                    amountToPay = price * openTrade.volume
                    tradeOffer.isOpen = false
                                   
                } else if (openTrade.volume > sharesBuyBack) {
                    newvolume = openTrade.volume - sharesBuyBack
                    amountToPay = price * sharesBuyBack
                    sharesBuyBack = parseInt(tradevolume / trades)
                    //recalculates tradevolume and openTrade
                     trades = trades - 1
                     tradevolume = tradevolume - sharesBuyBack
                     
                }
                tradeOffer.volume = newvolume
                await tradeOffer.save()

                //subtract newvolume from blockchain account
                // let chainPass = await Decrypt(req.authUser.password)
                // GetLoggerInstance().info(`Request to web3 decrease allowance : ${buyerInfo.address, newvolume, req.authUser.address, chainPass}`)
                // let chainResponse = await SterlingTokenContract.decreaseAllowance(Config.SuperAdmin, newvolume, sellerInfo.address, chainPass)
                // GetLoggerInstance().info(`Response from web3 decrease allowance : ${JSON.stringify(chainResponse)}`)

                // debit buyer fiat wallet and credit seller fiat wallets
                buyerWallet.balance = Math.max(0, parseInt(buyerWallet.balance) - amountToPay)
                
                sellerWallet.balance = Math.max(0, parseInt(sellerWallet.balance) + amountToPay)  

                await Promise.all([sellerWallet.save(), buyerWallet.save()])
                console.log('New Balance Seller>>', sellerWallet.balance)
                console.log('New Balance Buyer>>', buyerWallet.balance)
            
            }
            async.forEachOf(openTrade, trade)
            //await Promise.all(openTrade.map(trade))
            }
            
        }
            
            //console.log('Open Trade volume>>', opentradevolume, 'Set Trade Volume>>',tradevolume)

    
            // Response Body
            responseBody = {
                trades : openTrade
            }
            
            GetLoggerInstance().info(`Outgoing Response To GetAllOpenTrades Request : ${JSON.stringify(responseBody)} `)
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
    }
  
}

module.exports = MarketController