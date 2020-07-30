var soap = require('soap');
const { ApiResponse, Config, HttpStatus, GetCodeMsg, Errors, GetLoggerInstance } = require('../utils');


exports.ADLogin = async (args) => {
    try {
        let url = Config.ADServiceURL;
        let SoapClient = await soap.createClientAsync(url) 
        let soapResult = await SoapClient.loginAsync(args)
        return soapResult

    } catch (error) {
        err = {
          errCode :  Errors.ADAUTHSERVICEERROR,
          statusCode : HttpStatus.SERVER_ERROR,
          error
        }
        throw err;
    }
}

exports.ADUserByStaffId = async (args) => {
    try {
        let url = Config.ADServiceURL;
        let SoapClient = await soap.createClientAsync(url) 
        let soapResult = await SoapClient.searchUsersByStaffIDAsync(args)
        return soapResult

    } catch (error) {
        err = {
          errCode :  Errors.ADAUTHSERVICEERROR,
          statusCode : HttpStatus.SERVER_ERROR,
          error
        }
        throw err;
    }
}

exports.ADDetails = async (args) => {
    try {
        let url = Config.ADServiceURL;
        let SoapClient = await soap.createClientAsync(url) 
        let soapResult = await SoapClient.GetInfo2Async(args)
        return soapResult

    } catch (error) {
        err = {
          errCode :  Errors.ADDETAILSSERVICEERROR,
          statusCode : HttpStatus.SERVER_ERROR,
          error
        }
        throw err;
    }
}

exports.GetAccountInfo = async (args) => {
    try {
        let url = Config.EACBS;
        let SoapClient = await soap.createClientAsync(url) 
        let soapResult = await SoapClient.getAccountFullInfoAsync(args)
        return soapResult

    } catch (error) {
        err = {
          errCode :  Errors.GETACCTFULLINFOERROR,
          statusCode : HttpStatus.SERVER_ERROR,
          error
        }
        throw err;
    }
}

exports.IbsTransfer = async (args) => {
    try {
        let url = Config.IBS
        let SoapClient = await soap.createClientAsync(url) 
        let soapResult = await SoapClient.IBSBridgeAsync(args)
        return soapResult

    } catch (error) {
        err = {
          errCode :  Errors.IBSSERVICEERROR,
          statusCode : HttpStatus.SERVER_ERROR,
          error
        }
        throw err;
    }
}

exports.SendEmail = async (args) => {
    try {
        let url = Config.EWSERVICE
        let SoapClient = await soap.createClientAsync(url) 
        let soapResult = await SoapClient.SendMailAsync(args)
        return soapResult

    } catch (error) {
        err = {
          errCode :  Errors.EMAILSERVICEERROR,
          statusCode : HttpStatus.SERVER_ERROR,
          error
        }
        throw err;
    }
}


exports.SendOTP = async (args) => {
    try {
        console.log("Config >> ", Config)
        let url = Config.OTP
        let SoapClient = await soap.createClientAsync(url) 
        let soapResult = await SoapClient.doGenerateOtpAsync(args)
        return soapResult

    } catch (error) {
        err = {
          errCode :  Errors.OTPSERVICEERROR,
          statusCode : HttpStatus.SERVER_ERROR,
          error
        }
        throw err;
    }
}

exports.VerifyOTP = async (args) => {
    try {
        let url = Config.OTP
        let SoapClient = await soap.createClientAsync(url) 
        let soapResult = await SoapClient.verifyOtpAsync(args)
        return soapResult

    } catch (error) {
        err = {
          errCode :  Errors.OTPSERVICEERROR,
          statusCode : HttpStatus.SERVER_ERROR,
          error
        }
        throw err;
    }
}