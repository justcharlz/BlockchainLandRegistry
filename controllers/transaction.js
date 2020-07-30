const { ApiResponse, HttpStatus, GetCodeMsg, Errors, GetLoggerInstance, Config, Random } = require('../utils');
const { WalletModel, UserModel, TransactionModel } = require('../models');
const { VerifyAccount, Transfer, ADDetails, GetAccountInfo, IBSTransfer, IbsTransfer } = require('../services');


const TransactionController = {
  /**
    * Get transactions
    * @description Get all transactions
    * @param {string} type
    * @param {string} wallet
    * @param {string} to
    * @param {string} from
    * @param {string} status
    * @param {string} userId
    * @return {object[]} transactions
    */
  async AllTransactions(req, res, next) {
    try {
      let requestBody = {}
      let responseBody = {}

      requestBody = req.params
      const { type, to, from, status, wallet } = requestBody
      GetLoggerInstance().info(`Incoming Request For AllTransactions : ${JSON.stringify(requestBody)} `)

      const query = { }
      if (status) query.status = TransactionModel.Status[status.toUpperCase()]
      if (type) query.type = TransactionModel.Type[type.toUpperCase()]
      if (wallet) query.wallet = TransactionModel.Wallet[wallet.toUpperCase()]

      if (from && to == null) query.createdAt = { $gte: from }
      if (to && from == null) query.createdAt = { $lt: to }
      if (from && to) query.createdAt = { $lt: to, $gte: from }

      const transactions = await TransactionModel.find(query).sort({ updatedAt: -1 })
    
      let responseBody = {
        transactions
      }

      GetLoggerInstance().info(`Outgoing Response To getWalletTransactions Request : ${JSON.stringify(responseBody)}`)
      return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), responseBody));

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
};

module.exports = TransactionController;
