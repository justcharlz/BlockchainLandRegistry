const { ApiResponse, HttpStatus, GetCodeMsg, Errors, GetLoggerInstance, Config, AddToCache, GetFromCache, AddOrUpdateUserCache, DeSensitizeUserPlus } = require('../utils')
const { UserModel, TradeModel } = require('../models')
const { ADProfile } = require('../services');
const { SterlingTokenContract } = require('../services')
const bcrypt = require("bcrypt");

const UserController = {

  /**
   * Get Users.
   * @description This returns all users on the platform.
   * @return {object[]} users
   */
  async AllUsers(req, res, next) {
    let response = new ApiResponse()

    try {
        let responseBody = {}

        let users = []
        const result = await GetFromCache('ST_users');

        if (result != null && JSON.parse(result).length > 0) {
            users = JSON.parse(result);
        } else {
            users = await UserModel.find({userRole : UserModel.UserType.USER}, {authToken: 0, password: 0 , transactionPin : 0})
            let cashedUsers = []

            // Use User's Id as cahedUser array index
            for (let index = 0; index < users.length; index++) {
                cashedUsers[users[index]._id] = users[index]
            }
            await AddToCache('ST_users', cashedUsers)
        }
        
        responseBody = {
            users
        }
  
        GetLoggerInstance().info(`Outgoing Response To AllUsers Request : ${JSON.stringify(responseBody)}`)
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
     * Get User
     * @description This gets a user from the Platform by ID
     * @param   {string}  id  User's ID
     * @return  {object}  user
     */
  async SingleUser(req, res, next) {
    let response = new ApiResponse()
    
    try {
        let requestBody = {}
        let responseBody = {}
  
        requestBody = (req.params.userId == undefined)? req.query : req.params
        GetLoggerInstance().info(`Incoming Request For SingleUser : ${JSON.stringify(requestBody)} `)

        let user
        const result = await GetFromCache('ST_users');

        if (result != null && JSON.parse(result).length > 0) {
            const users = JSON.parse(result);
            if (users[requestBody.userId]) {
                user = users[requestBody.userId]
            }
        } else {
            
            user = await UserModel.findOne({_id : requestBody.userId}, {authToken: 0, password: 0 });
            if(!user){
              return next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
            }

        }
        
        // CAll AD To Get Full User Profile 
        const adProfile = await ADProfile(user.username)
        GetLoggerInstance().info(`Response from AD Service : ${JSON.stringify(adProfile)}`)

        const profile = {
            appProfile : DeSensitizeUserPlus(user),
            adProfile
        }

        // Get Shares Wallet Info
        let shareWallet = await SterlingTokenContract.balanceOf(user.address)
        GetLoggerInstance().info(`Response from web3 balanceOf : ${JSON.stringify(shareWallet)}`)

        responseBody = {
            profile,
            shareWallet
        }
  
        GetLoggerInstance().info(`Outgoing Response To SingleUser Request : ${JSON.stringify(responseBody)}`)
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
     * Get User
     * @description This gets a user from the Platform by staffID
     * @param   {string}  id  User's ID
     * @return  {object}  user
     */
  async GetUserByStaffId(req, res, next) {
    let response = new ApiResponse()
    
    try {
        let requestBody = {}
        let responseBody = {}
  
        requestBody = (req.params.userId == undefined)? req.query : req.params
        GetLoggerInstance().info(`Incoming Request For GetUserByStaffId : ${JSON.stringify(requestBody)} `)

        let user
        const result = await GetFromCache('ST_users');

        if (result != null && JSON.parse(result).length > 0) {
            const users = JSON.parse(result);
            if (users[requestBody.userId]) {
                user = users[requestBody.userId]
            }
        } else {
            
            user = await UserModel.findOne({_id : requestBody.userId}, {authToken: 0, password: 0 });
            if(!user){
              return next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
            }

        }
        
        const ADUserByStaffIdParams = {
            staffid : requestBody.toAccount
        }

        // Call AD Service to authenticate
        let responseFromAD = await ADUserByStaffId(ADUserByStaffIdParams)
        let userProfile = responseFromAD[0].searchUsersByStaffIDResult.diffgram.DocumentElement.sr
        if ( userProfile.length > 1) {
            return next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
            return
        }

        responseBody = {
            profile : userProfile.fullname
        }
  
        GetLoggerInstance().info(`Outgoing Response To GetUserByStaffId Request : ${JSON.stringify(responseBody)}`)
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
     * Withlist User
     * @description This Withlists a user 
     * @param   {string}  id  User's ID
     * @return  {object}  user
     */
  async WhitelistUser(req, res, next) {
    let response = new ApiResponse()
    
    try {
        let requestBody = {}
  
        requestBody = (req.params.userId == undefined)? req.query : req.params
        GetLoggerInstance().info(`Incoming Request For SingleUser : ${JSON.stringify(requestBody)} `)

        user = await UserModel.findOne({_id : requestBody.userId}, {authToken: 0, password: 0 });
        if(!user){
            return next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
        }
        user.status = true
        await user.save()

        // update blockchain record
        let chainResponse 
        if (req.authUser.userRole == UserModel.UserType.ADMIN) {
            const web3Pass = await Decrypt(req.authUser.password)
            chainResponse = await SterlingTokenContract.setWhiteList(user.address, req.authUser.address, web3Pass)
        } else {
            chainResponse = await SterlingTokenContract.setWhiteList(user.address, req.authUser.address)
        }
        GetLoggerInstance().info(`Response from web3 setWhiteList : ${JSON.stringify(chainResponse)}`)
        chainResponse = (chainResponse.hasOwnProperty("error")) ? {} : chainResponse
        
        GetLoggerInstance().info(`Outgoing Response To WhitelistUser Request : ${GetCodeMsg(Errors.SUCCESS)}`)
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
     * Blacklist User
     * @description This removes a whitelisted user 
     * @param   {string}  id  User's ID
     * @return  {object}  user
     */
  async BlacklistUser(req, res, next) {
    let response = new ApiResponse()
    
    try {
        let requestBody = {}
  
        requestBody = (req.params.userId == undefined)? req.query : req.params
        GetLoggerInstance().info(`Incoming Request For SingleUser : ${JSON.stringify(requestBody)} `)

        user = await UserModel.findOne({_id : requestBody.userId}, {authToken: 0, password: 0 });
        if(!user){
            return next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
        }
        const outstandingTrades = await TradeModel.find({isOpen : true})
        if (outstandingTrades.length > 0) {
            return next(response.PlainError(Errors.BLACKLISTERR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.BLACKLISTERR), error)) 
        }

        // update blockchain record
        let chainResponse 
        if (req.authUser.userRole == UserModel.UserType.ADMIN) {
            const web3Pass = await Decrypt(req.authUser.password)
            chainResponse = await SterlingTokenContract.removeWhiteList(user.address, req.authUser.address, web3Pass)
        } else {
            chainResponse = await SterlingTokenContract.removeWhiteList(user.address, req.authUser.address)
        }
        GetLoggerInstance().info(`Response from web3 removeWhiteList : ${JSON.stringify(chainResponse)}`)
        
        user.status = false
        await user.save()
        
        GetLoggerInstance().info(`Outgoing Response To BlacklistUser Request : ${GetCodeMsg(Errors.SUCCESS)}`)
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
     * Change Transaction pin
     * @description This Allows A User Change Transaction pin
     * @param   {string}  oldPin  Old Transaction Pin
     * @param   {string}  newPin  New Transaction Pin
     */
    async ChangeTransactionPin(req, res, next) {
        let response = new ApiResponse()
        
        try {
            let requestBody = {}
      
            requestBody = req.body
            GetLoggerInstance().info(`Incoming Request For ChangeTransactionPin : ${JSON.stringify(requestBody)} `)
    
            const user = await UserModel.findOne({_id : req.authUser._id});

            // Verify Transaction Pin
            const match = await bcrypt.compare(requestBody.oldPin, user.transactionPin);
         
            if(!match) {
              next(response.PlainError(Errors.OLDPINMISMATCH, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.OLDPINMISMATCH), {error : "Old Transaction Pin Mismatch"}))
            }

            user.transactionPin = await bcrypt.hash(requestBody.newPin, 10)
            await user.save()
                
            GetLoggerInstance().info(`Outgoing Response To ChangeTransactionPin Request : ${GetCodeMsg(Errors.SUCCESS)}`)
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
     * Reset Transaction pin
     * @description This Allows A User Reset Transaction pin
     * @param   {string}  oldPin  Old Transaction Pin
     * @param   {string}  newPin  New Transaction Pin
     */
    async ResetTransactionPin(req, res, next) {
        let response = new ApiResponse()
        
        try {
            let requestBody = {}
      
            requestBody = req.body
            GetLoggerInstance().info(`Incoming Request For ResetTransactionPin : ${JSON.stringify(requestBody)} `)
    
            const user = await UserModel.findOne({_id : req.authUser._id});

            // Verify Password
            const match = await bcrypt.compare(requestBody.oldPin, user.transactionPin);
         
            if(!match) {
              next(response.PlainError(Errors.OLDPINMISMATCH, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.OLDPINMISMATCH), {error : "Old Transaction Pin Mismatch"}))
            }

            user.transactionPin = await bcrypt.hash(requestBody.newPin, 10)
            await user.save()
                
            GetLoggerInstance().info(`Outgoing Response To ResetTransactionPin Request : ${GetCodeMsg(Errors.SUCCESS)}`)
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

module.exports = UserController;
