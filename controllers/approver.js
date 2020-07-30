const { ApiResponse, HttpStatus, GetCodeMsg, Errors, GetLoggerInstance, Config, AddToCache, GetFromCache, AddOrUpdateUserCache } = require('../utils')
const { WalletModel, UserModel, TransactionModel } = require('../models')
const { SterlingTokenContract } = require('../services')

const ApproverController = {

  /**
   * Get approvers.
   * @description This returns all approvers on the platform.
   * @return {object[]} approvers
   */
  async AllApprovers(req, res, next) {
    let response = new ApiResponse()

    try {
        let responseBody = {}

        let approvers = []
        const result = await GetFromCache('ST_approvers');

        if (result != null && JSON.parse(result).length > 0) {
            approvers = JSON.parse(result);

        } else {
            approvers = await UserModel.find({userRole : UserModel.UserType.APPROVER}, {authToken: 0, password: 0, transactionPin : 0 })
            let cashedapprovers = []

            // Use User's Id as cahedUser array index
            for (let index = 0; index < approvers.length; index++) {
                cashedapprovers[approvers[index]._id] = approvers[index]
            }
            await AddToCache('ST_approvers', cashedapprovers)
        }
        
        responseBody = {
            approvers
        }
  
        GetLoggerInstance().info(`Outgoing Response To Allapprovers Request : ${JSON.stringify(responseBody)}`)
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
     * Add Approver
     * @description This allows a superadmin add an Approver 
     * @param   {string}  userId  User's ID
     */
  async AddApprover(req, res, next) {
    let response = new ApiResponse()
    
    try {
        let requestBody = {}
  
        requestBody = (req.params.username == undefined)? req.query : req.params
        GetLoggerInstance().info(`Incoming Request For AddApprover : ${JSON.stringify(requestBody)} `)

        let user = await UserModel.findOne({username : requestBody.username}, {authToken: 0, password: 0 });
        if(!user){
            next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
            return
        }

        // update blockchain record
        const chainResponse = await SterlingTokenContract.addAuthorizer(user.address, req.authUser.address)
        GetLoggerInstance().info(`Response from web3 addApprover : ${JSON.stringify(chainResponse)}`)
        user.userRole = UserModel.UserType.APPROVER
        await user.save()
        
        GetLoggerInstance().info(`Outgoing Response To AddApprover Request : ${GetCodeMsg(Errors.SUCCESS)}`)
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
  async RemoveApprover(req, res, next) {
    let response = new ApiResponse()
    
    try {
        let requestBody = {}
  
        requestBody = (req.params.username == undefined)? req.query : req.params
        GetLoggerInstance().info(`Incoming Request For RemoveApprover : ${JSON.stringify(requestBody)} `)

        let user = await UserModel.findOne({username : requestBody.username}, {authToken: 0, password: 0 });
        if(!user){
            return next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
        }

        // update blockchain record
        const chainResponse = await SterlingTokenContract.removeAuthorizer(user.address, req.authUser.address)
        GetLoggerInstance().info(`Response from web3 addApprover : ${JSON.stringify(chainResponse)}`)
        user.userRole = UserModel.UserType.USER
        await user.save()
        
        GetLoggerInstance().info(`Outgoing Response To RemoveApprover Request : ${GetCodeMsg(Errors.SUCCESS)}`)
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

module.exports = ApproverController;
