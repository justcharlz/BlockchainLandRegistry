const { ADLogin, SterlingTokenContract, ADProfile } = require('../services');
const { ApiResponse, HttpStatus, GetCodeMsg, Errors, GetLoggerInstance, SerializeAD, DeSensitizeUserPlus, DeSensitize, SerializeXML } = require('../utils');
const { WalletModel, TradingWindowModel, TradeModel, TransactionModel, UserModel, SharePriceModel } = require('../models');


const DashboardController = {

  /**
   *User Dashboard
   * @description Fetch User Dashboard Info
   * @param {string} token
   * @return {object} dashboard
   */
  async UserDashboard(req, res, next) {

    let response = new ApiResponse()

    try {

      let responseBody = {}

        // CAll AD To Get Full User Profile 
        const adProfile = await ADProfile(req.authUser.username)
        const userProfile = {
          appProfile : DeSensitizeUserPlus(req.authUser),
          adProfile
        }

      // Get Fiat Wallet Info
      const userWallet = await WalletModel.findById(req.authUser.walletId)

      // Get Trading Window
      const tradingWindow = await TradingWindowModel.findOne({isOpen : true})

      // Get Shares Wallet Info
      const userShareBalance = await SterlingTokenContract.balanceOf(req.authUser.address)
      GetLoggerInstance().info(`Response from web3 balanceOf : ${JSON.stringify(userShareBalance)}`)

      // Get All Open Sale
      let openTrade = []
      let closeTradeCount = 0
      let cancelTradeCount = 0
      let allTradesCount = 0
      let countUserOpenTrades = 0
      let openTradeCount = 0
      let sharePrice = 0

      if (tradingWindow) {
        openTrade = await TradeModel.find({isOpen : true}).sort({"price": "asc"}).limit(6).where({userId : {$ne : req.authUser._id },windowId: tradingWindow._id}).exec()
        openTradeCount = await TradeModel.find({isOpen : true, userId : req.authUser._id,windowId: tradingWindow._id}).countDocuments()
        closeTradeCount = await TradeModel.find({isOpen : false, isCancel : false, userId : req.authUser._id,windowId: tradingWindow._id}).countDocuments()
        cancelTradeCount = await TradeModel.find({isCancel : true, userId : req.authUser._id, windowId: tradingWindow._id}).countDocuments()
        allTradesCount = await TradeModel.find({isCancel : true, userId : req.authUser._id, windowId: tradingWindow._id}).countDocuments()
        countUserOpenTrades = await TradeModel.find({userId : req.authUser._id, windowId: tradingWindow._id}).countDocuments()
        sharePrice = await SharePriceModel.findOne().exec()
      }

      // Get Trading Histories //.find({userId : req.authUser.id})
      const tradeHistories = await TransactionModel.find({$and: [{type : TransactionModel.Type.TRADE},{$or : [{from : req.authUser.username},{to : req.authUser.username}, {userId : req.authUser._id}]}]}).limit(50).sort({ updateAt: -1 }).exec()

      // Response Body
      responseBody = {
          profile : userProfile,
          NairaWallet : userWallet.balance,
          SharesWallet : userShareBalance,
          shareValue : sharePrice.price,
          openSales : openTrade,
          tradingHistories : tradeHistories,
          tradeCount : countUserOpenTrades,
          closeTradeCount,
          cancelTradeCount,
          allTradesCount,
          openTradeCount
          
      }
      
      GetLoggerInstance().info(`Outgoing Response To UserDashboard Request : ${JSON.stringify(responseBody)} `)
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
   *Admin Dashboard
   * @description Fetch Admin Dashboard Info
   * @param {string} token
   * @return {object} dashboard
   */
  async AdminDashboard(req, res, next) {

    let response = new ApiResponse()

    try {

      let responseBody = {}

      const sharesCount = await SterlingTokenContract.getTotalSupply()
      GetLoggerInstance().info(`Response from web3 getShareCount : ${JSON.stringify(sharesCount)}`)
      
      // Get Trading Window
      const tradingWindow = await TradingWindowModel.findOne({isOpen : true})
      let countOpenTrade
      let countClosedTrade
      let countCanceledTrade
      let countTotalTrade
      if (tradingWindow) {
        countOpenTrade = await TradeModel.find({isOpen : true, windowId : tradingWindow._id}).countDocuments()
        countClosedTrade = await TradeModel.find({isOpen : false, isCancel: true, windowId : tradingWindow._id}).countDocuments()
        countCanceledTrade = await TradeModel.find({isCancel : true, windowId : tradingWindow._id}).countDocuments()
        countTotalTrade = await TradeModel.find({windowId : tradingWindow._id}).countDocuments()
      }

      const countUsers = await UserModel.find({userRole : UserModel.UserType.USER}).countDocuments()

      // Response Body
      responseBody = {
          totalOpenTrades : countOpenTrade,
          totalClosedTrades : countClosedTrade,
          totalCanceledTrades : countCanceledTrade,
          totalTrades : countTotalTrade,
          totalUsers : countUsers,
          sharesCount
      }
      
      GetLoggerInstance().info(`Outgoing Response To AdminDashboard Request : ${JSON.stringify(responseBody)} `)
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

};

module.exports = DashboardController;
