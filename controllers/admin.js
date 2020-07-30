const { ApiResponse, HttpStatus, GetCodeMsg, Errors, GetLoggerInstance, Config, AddToCache, GetFromCache, AddOrUpdateUserCache } = require('../utils')
const { WalletModel, UserModel, TransactionModel } = require('../models')
const { SterlingTokenContract } = require('../services')
const AdminController = {

  /**
   * Get Admins.
   * @description This returns all admins on the platform.
   * @return {object[]} admins
   */
  async AllAdmins(req, res, next) {
    let response = new ApiResponse()

    try {
        let responseBody = {}

        let admins = []
        const result = await GetFromCache('ST_admins');

        if (result != null && JSON.parse(result).length > 0) {
            admins = JSON.parse(result);

        } else {
            admins = await UserModel.find({userRole : UserModel.UserType.ADMIN}, {authToken: 0, password: 0, transactionPin : 0 })
            let cashedAdmins = []

            // Use User's Id as cahedUser array index
            for (let index = 0; index < admins.length; index++) {
                cashedAdmins[admins[index]._id] = admins[index]
            }
            await AddToCache('ST_admins', cashedAdmins)
        }
        
        responseBody = {
            admins
        }
  
        GetLoggerInstance().info(`Outgoing Response To All Admins Request : ${JSON.stringify(responseBody)}`)
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
     * Add Admin
     * @description This allows a superadmin add an admin 
     * @param   {string}  userId  User's ID
     */
  async AddAdmin(req, res, next) {
    let response = new ApiResponse()
    
    try {
        let requestBody = {}
        let responseBody = {}
  
        requestBody = (req.params.username == undefined)? req.query : req.params
        GetLoggerInstance().info(`Incoming Request For AddAdmin : ${JSON.stringify(requestBody)} `)

        let user = await UserModel.findOne({username : requestBody.username}, {authToken: 0, password: 0 });
        if(!user){
            return next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
        }

        // update blockchain record
        const chainResponse = await SterlingTokenContract.addAdmin(user.address, req.authUser.address)
        GetLoggerInstance().info(`Response from web3 addAdmin : ${JSON.stringify(chainResponse)}`)
        user.userRole = UserModel.UserType.ADMIN
        await user.save()
        
        GetLoggerInstance().info(`Outgoing Response To AddAdmin Request : ${GetCodeMsg(Errors.SUCCESS)}`)
        return res.status(HttpStatus.OK).json(response.PlainSuccess(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS)));
    
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
     * Remove Admin
     * @description This allows a superadmin remove an admin 
     * @param   {string}  userId  User's ID
     */
  async RemoveAdmin(req, res, next) {
    let response = new ApiResponse()
    
    try {
        let requestBody = {}
  
        requestBody = (req.params.username == undefined)? req.query : req.params
        GetLoggerInstance().info(`Incoming Request For RemoveAdmin : ${JSON.stringify(requestBody)} `)

        let user = await UserModel.findOne({username : requestBody.username}, {authToken: 0, password: 0 });
        if(!user){
            return next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
        }

        // update blockchain record
        const chainResponse = await SterlingTokenContract.removeAdmin(user.address, req.authUser.address)
        GetLoggerInstance().info(`Response from web3 addAdmin : ${JSON.stringify(chainResponse)}`)
        user.userRole = UserModel.UserType.USER
        await user.save()
        
        GetLoggerInstance().info(`Outgoing Response To RemoveAdmin Request : ${GetCodeMsg(Errors.SUCCESS)}`)
        return res.status(HttpStatus.OK).json(response.PlainSuccess(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS)));
    
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

module.exports = AdminController;
