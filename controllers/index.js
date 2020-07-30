
const { ApiResponse, HttpStatus, GetCodeMsg, Errors, GetLoggerInstance } = require('../utils');
const {TradingWindowModel} = require("../models")

const Controller = {

  /**
   * Ping LogServerin
   * @description Ping to ensure server is up
   * @return {object} Response Success
   */
  async Ping(req, res, next) {
    response = new ApiResponse()

    try {
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
   * Check Trading Status
   * @description Check if a trading windows has been opened
   * @return {object} Response Success
   */
  async CheckTradingStatus(req, res, next) {
    response = new ApiResponse()

    try {

      let tradingWindow = await TradingWindowModel.findOne({isOpen : true}).exec()        
      if (!tradingWindow) {
        return res.status(HttpStatus.OK).json(response.PlainError(Errors.WINDOWREQUIREDERR, HttpStatus.SUCCESS, GetCodeMsg(Errors.WINDOWREQUIREDERR)))
      }
      return res.status(HttpStatus.OK).json(response.PlainSuccess(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS)));

    } catch (error) {
      
      if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
        next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
        return
      }
      return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
    }
  }
};

module.exports = Controller;
