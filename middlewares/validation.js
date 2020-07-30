const Joi = require('@hapi/joi');
const { HttpStatus, GetCodeMsg, Errors, ApiResponse, GetLoggerInstance } = require('../utils')
const { ScheduleModel } = require('../models');
  
exports.ValidateUserFirstTimeLogin = async (req, res, next) => {

  response = new ApiResponse()

  try {
    const schema = Joi.object({
      username: Joi.string().required().label("username is required!"),
      password: Joi.string().required().label("Password is required!"),
      transactionPin: Joi.string().required().label("Transaction pin is required!")
    })

    const { error, value } = await schema.validate(req.body)
    
    

    if (error) {
      const validationError = {
        error : error.details[0].context,
        message : error.details[0].message.toString().replace(/"/gi, "") 
      }
      GetLoggerInstance().error(`Incoming Validation Request For ValidateUserLogin : ${JSON.stringify(value)}; validation error : ${JSON.stringify(error)} `)
      next(response.Error(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), validationError, error))
    }
    next()

  } catch (error) {
    next(response.PlainError(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), error))
  }
}

exports.ValidateUserLogin = async (req, res, next) => {

  response = new ApiResponse()

  try {
    const schema = Joi.object({
      username: Joi.string().required().label("username is required!"),
      password: Joi.string().required().label("Password is required!")
    })

    const { error, value } = await schema.validate(req.body)
    
    

    if (error) {
      const validationError = {
        error : error.details[0].context,
        message : error.details[0].message.toString().replace(/"/gi, "") 
      }
      GetLoggerInstance().error(`Incoming Validation Request For ValidateUserLogin : ${JSON.stringify(value)}; validation error : ${JSON.stringify(error)} `)
      next(response.Error(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), validationError, error))
    }
    next()

  } catch (error) {
    next(response.PlainError(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), error))
  }
}  

exports.ValidateUserLogout = async (req, res, next) => {

  response = new ApiResponse()

  try {
    const schema = Joi.object({
      userId: Joi.string().required().label("userId is required for logout!")
    })

    const { error, value } = await schema.validate(req.body)
    
    

    if (error) {
      const validationError = {
        error : error.details[0].context,
        message : error.details[0].message.toString().replace(/"/gi, "") 
      }
      GetLoggerInstance().error(`Incoming Validation Request For ValidateUserLogout : ${JSON.stringify(value)}; validation error : ${JSON.stringify(error)} `)
      next(response.Error(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), validationError, error))
    }
    next()

  } catch (error) {
    next(response.PlainError(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), error))
  }
} 

exports.ValidateWallet = async (req, res, next) => {

  response = new ApiResponse()

  try {
    const schema = Joi.object({
      account: Joi.string().required().label("Account is required")
    })

    const { error, value } = await schema.validate(req.body)
    
    

    if (error) {
      const validationError = {
        error : error.details[0].context,
        message : error.details[0].message.toString().replace(/"/gi, "") 
      }
      GetLoggerInstance().error(`Incoming Validation Request For ValidateWallet : ${JSON.stringify(value)}; validation error : ${JSON.stringify(error)} `)
      next(response.Error(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), validationError, error))
    }
    next()

  } catch (error) {
    console.log("error.details >> ", error.details)
    next(response.PlainError(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), error))
  }
}

exports.ValidateAddAccount = async (req, res, next) => {

  response = new ApiResponse()

  try {
    const schema = Joi.object({
      account: Joi.string().required().label("Account is required"),
      otp: Joi.number().label("OTP Is Required")
    })

    const { error, value } = await schema.validate(req.body)
    
    

    if (error) {
      const validationError = {
        error : error.details[0].context,
        message : error.details[0].message.toString().replace(/"/gi, "") 
      }
      GetLoggerInstance().error(`Incoming Validation Request For ValidateFundWalletByAccount : ${JSON.stringify(value)}; validation error : ${JSON.stringify(error)} `)
      next(response.Error(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), validationError, error))
    }
    next()

  } catch (error) {
    next(response.PlainError(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), error))
  }
}

exports.ValidateFundWalletByAccount = async (req, res, next) => {

  response = new ApiResponse()

  try {
    const schema = Joi.object({
      account: Joi.string().required().label("Account is required"),
      amount: Joi.number().required().label("Amount is required"),
      remark: Joi.string().label("Remark Must Be A String"),
      otp: Joi.number().label("OTP Is Required")
    })

    const { error, value } = await schema.validate(req.body)
    
    

    if (error) {
      const validationError = {
        error : error.details[0].context,
        message : error.details[0].message.toString().replace(/"/gi, "") 
      }
      GetLoggerInstance().error(`Incoming Validation Request For ValidateFundWalletByAccount : ${JSON.stringify(value)}; validation error : ${JSON.stringify(error)} `)
      next(response.Error(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), validationError, error))
    }
    next()

  } catch (error) {
    next(response.PlainError(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), error))
  }
}

exports.ValidateFundWalletByCard = async (req, res, next) => {

  response = new ApiResponse()

  try {
    const schema = Joi.object({
      account: Joi.string().required().label("Account is required"),
      amount: Joi.number().required().label("Amount is required"),
      remark: Joi.string().label("Remark Must Be A String"),
      referenceId: Joi.string().required().label("referenceId is required")
    })

    const { error, value } = await schema.validate(req.body)
    
    

    if (error) {
      const validationError = {
        error : error.details[0].context,
        message : error.details[0].message.toString().replace(/"/gi, "") 
      }
      GetLoggerInstance().error(`Incoming Validation Request For ValidateFundWalletByCard : ${JSON.stringify(value)}; validation error : ${JSON.stringify(error)} `)
      next(response.Error(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), validationError, error))
    }
    next()

  } catch (error) {
    next(response.PlainError(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), error))
  }
}

exports.ValidateTransactionPin = async (req, res, next) => {

  response = new ApiResponse()

  try {
    const schema = Joi.object({
      oldPin: Joi.string().required().label("Old Transaction Pin is required"),
      newPin: Joi.string().required().label("New Transaction Pin is required")
    })

    const { error, value } = await schema.validate(req.body)
    
    

    if (error) {
      const validationError = {
        error : error.details[0].context,
        message : error.details[0].message.toString().replace(/"/gi, "") 
      }
      GetLoggerInstance().error(`Incoming Validation Request For ValidateWalletCashout : ${JSON.stringify(value)}; validation error : ${JSON.stringify(error)} `)
      next(response.Error(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), validationError, error))
    }
    next()

  } catch (error) {
    next(response.PlainError(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), error))
  }
}

exports.ValidateWalletCashout = async (req, res, next) => {

  response = new ApiResponse()

  try {
    const schema = Joi.object({
      account: Joi.string().required().label("Account is required"),
      amount: Joi.number().required().label("Amount is required"),
      remark: Joi.string().label("Remark Must Be A String"),
      transactionPin: Joi.string().required().label("Transaction Pin is required")
    })

    const { error, value } = await schema.validate(req.body)
    
    

    if (error) {
      const validationError = {
        error : error.details[0].context,
        message : error.details[0].message.toString().replace(/"/gi, "") 
      }
      GetLoggerInstance().error(`Incoming Validation Request For ValidateWalletCashout : ${JSON.stringify(value)}; validation error : ${JSON.stringify(error)} `)
      next(response.Error(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), validationError, error))
    }
    next()

  } catch (error) {
    next(response.PlainError(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), error))
  }
}


exports.ValidateCreateSchedule = async (req, res, next) => {

  response = new ApiResponse()
  try {
    const schema = Joi.object({
      name: Joi.string().required().label("Schedule Name Is Required"),
      scheduleAmount: Joi.number().required().label("Schedule Amount Is Required"),
      scheduleType: Joi.string().label("Schedule Type Must Be A String"),
      description: Joi.string().label("Description Must Be A String")
    })

    const { error, value } = await schema.validate(req.body)
    

    if (error) {
      const validationError = {
        error : error.details[0].context,
        message : error.details[0].message.toString().replace(/"/gi, "") 
      }
      GetLoggerInstance().error(`Incoming Validation Request For ValidateCreateSchedule : ${JSON.stringify(value)}; validation error : ${JSON.stringify(error)} `)
      next(response.Error(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), validationError, error.details))
    }

    return next()

  } catch (error) {
    next(response.PlainError(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), error))
  }
}

exports.ValidateUpdateSchedule = async (req, res, next) => {

  response = new ApiResponse()
  try {
    const schema = Joi.object({
      name: Joi.string().label("Schedule Name Should Be A String"),
      scheduleAmount: Joi.number().label("Schedule Amount Should Be A Number"),
      scheduleType: Joi.string().label("Schedule Type Should Be A String"),
      description: Joi.string().label("Schedule Description Should Be A String")
    })

    const { error, value } = await schema.validate(req.body)
    

    if (error) {
      const validationError = {
        error : error.details[0].context,
        message : error.details[0].message.toString().replace(/"/gi, "") 
      }
      GetLoggerInstance().error(`Incoming Validation Request For ValidateUpdateSchedule : ${JSON.stringify(value)}; validation error : ${JSON.stringify(error)} `)
      next(response.Error(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), validationError, error.details))
    }

    return next()

  } catch (error) {
    next(response.PlainError(Errors.VALIDATIONERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.VALIDATIONERR), error))
  }
}
