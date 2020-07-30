const { ADLogin, SterlingTokenContract } = require('../services');
const { ApiResponse, DeSensitizeUser, Encrypt, HttpStatus, CreateToken, GeneratePassword, GetCodeMsg, Errors, GetLoggerInstance, RabbitMQService } = require('../utils');
const { WalletModel, UserModel } = require('../models');
const bcrypt = require("bcrypt");

const AuthController = {

  /**
   * User First Time Login
   * @description Login a user
   * @param {string} username
   * @param {string} password
   * @param {string} transactionPin
   * @return {object} user profile and permissions
   */
  async FirstTimeLogin(req, res, next) {
    response = new ApiResponse()

    try {

      let requestBody = {}
      let responseBody = {}

      requestBody = req.body
      GetLoggerInstance().info(`Incoming Request For FirstTimeLogin : ${JSON.stringify(requestBody)} `)

      ADLoginParams = {
        username : requestBody.username,
        password : requestBody.password
      }

      // Call AD Service to authenticate
      let responseFromAD = await ADLogin(ADLoginParams)
      if (!responseFromAD[0].loginResult) {
        next(response.PlainError(Errors.USERAUTHFAILED, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.USERAUTHFAILED), {error : "AD Authentication Failed"}))
        return
      }

      // Generate and encrypt user blockchain password
      const blockchainPass = GeneratePassword()
      const encryptedPass = await Encrypt(blockchainPass)
      const transactionPin = await bcrypt.hash(requestBody.transactionPin, 10)

      // Call blockchain library to profile user
      const contractResult = await SterlingTokenContract.createAccount(blockchainPass)
      GetLoggerInstance().info(`Response from web3 createAccount : ${JSON.stringify(contractResult)}`)

      // Create User Wallet
      let UserWallet = new WalletModel()
      UserWallet.balance = 0
      
      // insert into user table
      let user = new UserModel({
        username : requestBody.username,
        address : contractResult,
        password : encryptedPass,
        walletId : UserWallet._id,
        transactionPin
      })
      // generate JWT token
      const jwtToken = CreateToken(requestBody.username, user._id,  user.userRole);
      user.authToken = jwtToken;
      user.lastLogin = user.updatedAt;

      responseBody = {
        profile : DeSensitizeUser(user)
      }

      await Promise.all([UserWallet.save(), user.save(), RabbitMQService.queue('ADD_OR_UPDATE_USER_CACHE', { user : DeSensitizeUser(user) }), RabbitMQService.queue('POPULATE_USER_FULLNAME_ONDB', { username : user.username})])

      GetLoggerInstance().info(`Outgoing Response To FirstTimeLogin Request : ${JSON.stringify(responseBody)} `)
      return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), responseBody));

    } catch (error) {
      if (error.hasOwnProperty("name")) {
          if (error.name.split("-").includes("Web3")) {
              return next(response.PlainError(Errors.WEBLIBRARYERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.WEBLIBRARYERROR), error))
          }
          if(error.hasOwnProperty("code")) {
            if ( error.code == "11000" && error.name == "MongoError") {
               return next(response.PlainError(Errors.DUPLICATEUSERERROR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.DUPLICATEUSERERROR), error))
            }
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
   * User Login
   * @description Login a user
   * @param {string} username
   * @param {string} password
   * @return {object} user profile and permissions
   */
  async Login(req, res, next) {
    response = new ApiResponse()

    try {

      let requestBody = {}
      let responseBody = {}

      requestBody = req.body
      GetLoggerInstance().info(`Incoming Request For FirstTimeLogin : ${JSON.stringify(requestBody)} `)

      ADLoginParams = {
        username : requestBody.username,
        password : requestBody.password
      }

      // Call AD Service to authenticate
      let responseFromAD = await ADLogin(ADLoginParams)

      if (responseFromAD[0].loginResult == false) {
        next(response.PlainError(Errors.USERAUTHFAILED, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.USERAUTHFAILED), {error : "AD Authentication Failed"}))
        return
      }

      const user = await UserModel.findOne({username : requestBody.username })
      if(!user){
        return next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
      }

      
      // generate JWT token
      const jwtToken = CreateToken(requestBody.username, user._id,  user.userRole);
      user.authToken = jwtToken;
      //console.log("user.updatedAt >> ", user.updatedAt)
      user.lastLogin = user.updatedAt;

      // Get User Role Perssions
      responseBody = {
        profile : DeSensitizeUser(user)
      }

      await Promise.all([ user.save(), RabbitMQService.queue('ADD_OR_UPDATE_USER_CACHE', { user : DeSensitizeUser(user)}), RabbitMQService.queue('POPULATE_USER_FULLNAME_ONDB', { username : user.username})])
      
      GetLoggerInstance().info(`Outgoing Response To Login Request : ${JSON.stringify(responseBody)} `)
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
   * SuoerAdmin or Admin Login
   * @description Login The Super Admin or Admin
   * @param {string} username
   * @param {string} password
   */
  async SuperLogin(req, res, next) {
    response = new ApiResponse()

    try {

      let requestBody = {}
      let responseBody = {}

      requestBody = req.body
      GetLoggerInstance().info(`Incoming Request For SuperLogin : ${JSON.stringify(requestBody)} `)

      const user = await UserModel.findOne({username : requestBody.username })
      if(!user){
        return next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
      }

      if ((user.userRole != UserModel.UserType.SUPERADMIN) && (user.userRole != UserModel.UserType.ADMIN)) {
      return next(response.PlainError(Errors.ACCESSDENIED, HttpStatus.UNAUTHORIZED, GetCodeMsg(Errors.ACCESSDENIED), {error : "Only superadmin or admin can login through this endpoint"}))
      }


      // Verify Password
      if(user.userRole == UserModel.UserType.SUPERADMIN){
      const match = await bcrypt.compare(requestBody.password, user.password);
   
      if(!match) {
        next(response.PlainError(Errors.USERAUTHFAILED, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.USERAUTHFAILED), {error : "Password Does Not Match"}))
      }
    }

      if(user.userRole == UserModel.UserType.ADMIN){
        ADLoginParams = {
          username : requestBody.username,
          password : requestBody.password
        }
  
        // Call AD Service to authenticate
        let responseFromAD = await ADLogin(ADLoginParams)
  
        if (responseFromAD[0].loginResult == false) {
          next(response.PlainError(Errors.USERAUTHFAILED, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.USERAUTHFAILED), {error : "AD Authentication Failed"}))
          return
        }
      }

      // generate JWT token
      const jwtToken = CreateToken(requestBody.username, user._id,  user.userRole);
      user.authToken = jwtToken;
      user.lastLogin = user.updatedAt;

      responseBody = {
        profile : DeSensitizeUser(user)
      }

      await Promise.all([ user.save(), RabbitMQService.queue('ADD_OR_UPDATE_USER_CACHE', { user : DeSensitizeUser(user) })])
      
      GetLoggerInstance().info(`Outgoing Response To Login Request : ${JSON.stringify(responseBody)} `)
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
   * User Logout
   * @description Logout a user
   * @param {string} UserId
   * @return {object} Response
   */
  async Logout(req, res, next) {
    response = new ApiResponse()

    try {

      let requestBody = {}

      requestBody = req.params
      GetLoggerInstance().info(`Incoming Request For Logout : ${JSON.stringify(requestBody)} `)
      
      const user = await UserModel.findById(requestBody.userId )
      if(!user){
        return next(response.PlainError(Errors.USERNOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.USERNOTEXIST), {error : "User Does Not Exist"}))
      }
      user.authToken = ""

      await Promise.all([ user.save(), RabbitMQService.queue('ADD_OR_UPDATE_USER_CACHE', { user : DeSensitizeUser(user) })])

      GetLoggerInstance().info(`Outgoing Response To Logout Request : ${GetCodeMsg(Errors.SUCCESS)} `)
      return res.status(HttpStatus.OK).json(response.PlainSuccess(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS)));

    } catch (error) {
      if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
        next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
        return
      } 
      return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
    }
  },

};

module.exports = AuthController;
