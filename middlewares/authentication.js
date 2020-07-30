const jwt = require('jsonwebtoken')
const { ApiResponse, HttpStatus, GetCodeMsg, Errors, Config } = require('../utils');
const { UserModel, TradingWindowModel } = require('../models');


/**
 * Authenticate User Request
 */
exports.IsAuthenticated = async (req, res, next) => {
  response = new ApiResponse()
  try {
    let token = null;
    if (req.headers.authorization) {
      token = req.headers.authorization;
      const tokenArray = token.split(' ');
      token = tokenArray[1];
    }
    if (req.query.token) {
      token = req.query.token;
    }
    if (req.body.token) {
      token = req.body.token
    }
    if (!token) {
      return next(response.PlainError(Errors.AUTHORIZATIONERR, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.AUTHORIZATIONERR), {error : "No Authorization Token Found in Request Param, body or header"}))
    }
    token = await jwt.verify(token, Config.jwtKey);
    const user = await UserModel.findById(token.id)
    if(!user || user.authToken == ""){
      return next(response.PlainError(Errors.AUTHORIZATIONERR, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.AUTHORIZATIONERR), {error : "No User Found for The Auth Token User Id"}))
    }
    req.authToken = token
    req.authUser = user
    next()
  } catch (error) {
    if (error.hasOwnProperty("name")) {
      console.log("yeah")
      if (error.name  === 'TokenExpiredError') {
        return next(response.PlainError(Errors.AUTHTOKENEXPIRY, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.AUTHTOKENEXPIRY), error))
      }
    }
    return next(response.PlainError(Errors.AUTHORIZATIONERR, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.AUTHORIZATIONERR), error))
  }
};


/**
 * Ensure Only Activated Users Have Access To Selected Resource
 */
exports.IsActivated = async (req, res, next) => {
  try {
    if (req.authUser.status) {
      return next()
    } else {
      return next(response.PlainError(Errors.ACCESSDENIED, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.ACCESSDENIED), {error : "This Resource Is Only Accessible By Admins"}))
    }
  } catch (error) {
    return next(response.PlainError(Errors.AUTHORIZATIONERR, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.AUTHORIZATIONERR), error))
  }
};

/**
 * Ensure Only Activated Users Have Access To Selected Resource
 */
exports.IsWindowOpen = async (req, res, next) => {
  try {
    let tradingWindow = await TradingWindowModel.findOne({isOpen : true}).exec()        
    if (!tradingWindow) {
      return next(response.PlainError(Errors.WINDOWREQUIREDERR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.WINDOWREQUIREDERR), error))
    }
    next()
  } catch (error) {
    return next(response.PlainError(Errors.WINDOWREQUIREDERR, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.WINDOWREQUIREDERR), error))
  }
};

/**
 * Ensure Resource is Accessible To Only Admins
 */
exports.IsAdmin = async (req, res, next) => {
  try {
    if (req.authUser.userRole === UserModel.UserType.ADMIN || req.authUser.userRole === UserModel.UserType.SUPERADMIN) {
      next()
    } else {
      return next(response.PlainError(Errors.ACCESSDENIED, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.ACCESSDENIED), {error : "This Resource Is Only Accessible By Admins"}))
    }
  } catch (error) {
    return next(response.PlainError(Errors.AUTHORIZATIONERR, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.AUTHORIZATIONERR), error))
  }
}


/**
 * Ensure Resource is Accessible To Only Approvals
 */
exports.IsApprover = async (req, res, next) => {
  try {
    if (req.authUser.userRole === UserModel.UserType.APPROVER) {
      next()
    } else {
      return next(response.PlainError(Errors.ACCESSDENIED, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.ACCESSDENIED), {error : "This Resource Is Only Accessible To Approvers"}))
    }
  } catch (error) {
    return next(response.PlainError(Errors.AUTHORIZATIONERR, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.AUTHORIZATIONERR), error))
  }
}


/**
 * Ensure Resource is Accessible To Only Approvals
 */
exports.IsSuperAdmin = async (req, res, next) => {
  try {
    if (req.authUser.userRole === UserModel.UserType.SUPERADMIN) {
      next()
    } else {
      return next(response.PlainError(Errors.ACCESSDENIED, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.ACCESSDENIED), {error : "This Resource Is Only Accessible By SuperAdmin"}))
    }
  } catch (error) {
    return next(response.PlainError(Errors.AUTHORIZATIONERR, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.AUTHORIZATIONERR), error))
  }
}
