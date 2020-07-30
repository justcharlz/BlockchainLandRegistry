const { ApiResponse, HttpStatus, GetCodeMsg, Errors, GetLoggerInstance, Config, Random, Encrypt, Decrypt } = require('../utils');
const { WalletModel, UserModel, TransactionModel, AdminSettingsModel, TradeModel, TradingWindowModel, ScheduleModel, AllocationModel, SharePriceModel } = require('../models');
const { SterlingTokenContract } = require('../services');
const XLSX = require("xlsx")
const fs = require("fs")

const settingsController = {

  /**
     * Open Trading Window
     * @description Allows admin open a trading window
    */
  async OpenTradingWindow(req, res, next) {
    
    let response = new ApiResponse()
    try {

        let currentTradingWindow = await TradingWindowModel.findOne({isOpen : true}).exec()
        if (currentTradingWindow) {
            return next(response.PlainError(Errors.OPENWINDOWERR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.OPENWINDOWERR), {error : "There Is An Open Window Already"}))
        }
  
        const tradingWindow = new TradingWindowModel()
        await tradingWindow.save()

        GetLoggerInstance().info(`Outgoing Response To OpenTradingWindow Request : ${GetCodeMsg(Errors.SUCCESS)} `)
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
     * Get All Trade Transactions 
     * @description Fetch All All Trade Transactions
     * @param {number} offset Number of records to skip
     * @param {number} limit No of records to fetch
     * @returns {object[]} Transactions
     */
    async GetAllTradingWindows(req, res, next) {
      let response = new ApiResponse()
      
      try {
        let responseBody = {}
  
        let tradingWindow = await TradingWindowModel.find({}).sort({updatedAt : -1}).exec()   

        responseBody = {
          tradingWindow
        }

        GetLoggerInstance().info(`Outgoing Response To GetAllTradingWindows Request : ${JSON.stringify(responseBody)}`)
        return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), responseBody));
  
      } catch (error) {
        if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
          next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
          return
        } 
        return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
      }
  },

  /**
     * Close Trading Window
     * @description Allows admin close a trading window
     * @param {string} windowId WIndows Id
     * @returns {string} exported excel url
    */
  async CloseTradingWindow(req, res, next) {
    
    let response = new ApiResponse()
    try {

        let requestBody = {}
        let responseBody = {}
  
        requestBody = (req.params.windowId == undefined)? req.query : req.params
        GetLoggerInstance().info(`Incoming Request For CloseTradingWindow : ${JSON.stringify(requestBody)} `)

        const tradingWindow = await TradingWindowModel.findById(requestBody.windowId)
        if (!tradingWindow) {
          return next(response.PlainError(Errors.WINDOWNOTEXIST, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.WINDOWNOTEXIST), {error : "Trading Window Does Not Exist"}))
        }
        if (!tradingWindow.isOpen) {
          return next(response.PlainError(Errors.CLOSEWINDOWERR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.CLOSEWINDOWERR), {error : "Trading Window Does Not Exist"}))
        }

        const users = await UserModel.find({userRole : { $ne : UserModel.UserType.SUPERADMIN}}, {authToken: 0, password: 0 })
        const schedules = await ScheduleModel.find({windowId : requestBody.windowId})

        function terminateAllScheduleAndAllocations() {
          return new Promise(async (resolve, reject) => {
            try {
              if (schedules.length > 0) {
                for (let i = 0; i < schedules.length; i++) {
                  let schedule = schedules[i]
                  // Terminate All Allocations
                  await AllocationModel.updateMany({$and : [{scheduleId : schedule._id}, {$or : [{status: AllocationModel.Status.FAILED }, {status: AllocationModel.Status.INPROGRESS }, {status: AllocationModel.Status.PENDING }]} ]} , {status : AllocationModel.Status.TERMINATED}).exec()

                  if (ScheduleModel.Status.INPROGRESS || ScheduleModel.Status.PENDING || ScheduleModel.Status.APPROVED || ScheduleModel.Status.APPROVING) {
                    await ScheduleModel.updateOne({_id : schedule._id}, {status : ScheduleModel.Status.TERMINATED })
                  }
                  
                }
                return resolve()
              }
              return resolve()
            } catch (error) {
              return reject(error)
            }
          })
        } 

        function getWorkBookData() {
          return new Promise(async (resolve, reject) => {
            try {
              let dataToExport = []
              for (let i = 0; i < users.length; i++) {
                let user = users[i]

                // move all user shares in escrow back to user share wallet
                // await SterlingTokenContract.moveEscrow(user.address)

                // Cancel all user open trades 
                const openTrades = await TradeModel.find({userId : user._id, isOpen : true, windowId : tradingWindow._id})
                if(openTrades.length > 0) {
                  openTrades.forEach(async (trade) => {
                    await SterlingTokenContract.transferFrom(user.address, user.address, trade.volume)
                    const tradeToCancel = await TradeModel.findOne({_id : trade._id})
                    tradeToCancel.isCancel = true
                    tradeToCancel.isOpen = false
                    await tradeToCancel.save()
                  })
                }

                // Get user current share balance to be exported
                let shareWallet = await SterlingTokenContract.balanceOf(user.address)
                GetLoggerInstance().info(`Response from web3 balanceOf : ${JSON.stringify(shareWallet)}`)
                
                dataToExport.push({
                  "S/N": i+1,
                  USERNAME : user.username,
                  VOLUME : shareWallet
                })

                // Re-initialize users share balance to zero
                await SterlingTokenContract.zeroBalance(user.address)
                
                if (i == users.length - 1) {
                  return resolve(dataToExport)
                }
                  
              }
            } catch (error) {
              return reject(error)
            }
          })
        } 

        await terminateAllScheduleAndAllocations()
        let workBookData = await getWorkBookData()
        console.log("workBookData >> ", workBookData)

        //write to excel file and get url
        const worksheet = XLSX.utils.json_to_sheet(workBookData,{header: ["S/N", "USERNAME", "VOLUME"]})
        const excelWorkBook = XLSX.utils.book_new()
        var dataFilename = `data${Date.now()}`
        XLSX.utils.book_append_sheet(excelWorkBook, worksheet, "TradindWindow")
        fs.mkdir(__appbasedir+'/uploads/tradingWindows', { recursive: true }, (err) => {
          if (err) {
            GetLoggerInstance().error(`the directory 'tradingWindows' already exist : ${JSON.stringify(err)}`)
          }
          XLSX.writeFile(excelWorkBook,__appbasedir+`/uploads/tradingWindows/${dataFilename}.xlsx`)
        });

        tradingWindow.isOpen = false
        tradingWindow.closingData = `/tradingWindows/${dataFilename}.xlsx`
        await tradingWindow.save()

        responseBody = {
          windowData : Config.BASEURL+tradingWindow.closingData
        }

        GetLoggerInstance().info(`Outgoing Response To CloseTradingWindow Request : ${JSON.stringify(responseBody)} `)
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
     * Set Require Approvals
     * @description Set The Number of Required Approvals For a Schedules
     * @param {number} requirement Number of approvals required on a schedule
    */
   async SetApprovalRequirements(req, res, next) {
    
    let response = new ApiResponse()
    try {

        let requestBody = {}
  
        requestBody = req.body
        GetLoggerInstance().info(`Incoming Request For SetApprovalRequirements : ${JSON.stringify(requestBody)} `)

        
        const chainResponse = await SterlingTokenContract.changeRequirement(requestBody.requirement, Config.SuperAdmin)
        GetLoggerInstance().info(`Response from web3 changeRequirement : ${JSON.stringify(chainResponse)}`)

        GetLoggerInstance().info(`Outgoing Response To SetApprovalRequirements Request : ${GetCodeMsg(Errors.SUCCESS)} `)
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
     * Get Required Approvals
     * @description Get The Number of Required Approvals For a Schedules
     * @returns {number} requiredApprovals Number of approvals required on a schedule
    */
   async GetApprovalRequirements(req, res, next) {
    
    let response = new ApiResponse()
    try {

        let requestBody = {}
  
        requestBody = req.body
        GetLoggerInstance().info(`Incoming Request For GetApprovalRequirements : ${JSON.stringify(requestBody)} `)

        
        const requirement = await SterlingTokenContract.getrequiredapprovals(requestBody.requirement, Config.SuperAdmin)
        GetLoggerInstance().info(`Response from web3 getrequiredapprovals : ${JSON.stringify(requirement)}`)

        GetLoggerInstance().info(`Outgoing Response To GetApprovalRequirements Request : ${JSON.stringify({requirement})} `)
        return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), {requirement}));

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
     * Export 
     * @description Allows admin close a trading window
     * @param {string} windowId WIndows Id
     * @returns {string} exported excel url
    */
  async exportAllocationRecord(req, res, next) {
    
    let response = new ApiResponse()
    try {

        let requestBody = {}
        let responseBody = {}
  
        requestBody = (req.params.windowId == undefined)? req.query : req.params
        GetLoggerInstance().info(`Incoming Request For CloseTradingWindow : ${JSON.stringify(requestBody)} `)

        const tradingWindow = await TradingWindowModel.findById(requestBody.windowId)
        if (!tradingWindow) {
          return next(response.PlainError(Errors.WINDOWNOTEXIST, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.WINDOWNOTEXIST), {error : "Trading Window Does Not Exist"}))
        }
        if (!tradingWindow.isOpen) {
          return next(response.PlainError(Errors.CLOSEWINDOWERR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.CLOSEWINDOWERR), {error : "Trading Window Does Not Exist"}))
        }

        const users = await UserModel.find({userRole : { $ne : UserModel.UserType.SUPERADMIN}}, {authToken: 0, password: 0 })
        const schedules = await ScheduleModel.find({windowId : requestBody.windowId})

        function terminateAllScheduleAndAllocations() {
          return new Promise(async (resolve, reject) => {
            try {
              if (schedules.length > 0) {
                for (let i = 0; i < schedules.length; i++) {
                  let schedule = schedules[i]
                  // Terminate All Allocations
                  await AllocationModel.updateMany({$and : [{scheduleId : schedule._id}, {$or : [{status: AllocationModel.Status.FAILED }, {status: AllocationModel.Status.INPROGRESS }, {status: AllocationModel.Status.PENDING }]} ]} , {status : AllocationModel.Status.TERMINATED}).exec()

                  if (ScheduleModel.Status.INPROGRESS || ScheduleModel.Status.PENDING || ScheduleModel.Status.APPROVED || ScheduleModel.Status.APPROVING) {
                    await ScheduleModel.updateOne({_id : schedule._id}, {status : ScheduleModel.Status.TERMINATED })
                  }
                  
                }
                return resolve()
              }
              return resolve()
            } catch (error) {
              return reject(error)
            }
          })
        }

        function getWorkBookData() {
          return new Promise(async (resolve, reject) => {
            try {
              let dataToExport = []
              for (let i = 0; i < users.length; i++) {
                let user = users[i]

                // move all user shares in escrow back to user share wallet
                await SterlingTokenContract.moveEscrow(user.address)

                // Cancel all user open trades 
                const openTrades = await TradeModel.find({userId : user._id, isOpen : true, windowId : tradingWindow._id})
                if(openTrades.length > 0) {
                  openTrades.forEach(async (trade) => {
                    // await SterlingTokenContract.transferFrom(user.address, user.address, trade.volume)
                    const tradeToCancel = await TradeModel.findOne({_id : trade._id})
                    tradeToCancel.isCancel = true
                    tradeToCancel.isOpen = false
                    await tradeToCancel.save()
                  })
                }

                // Get user current share balance to be exported
                let shareWallet = await SterlingTokenContract.balanceOf(user.address)
                GetLoggerInstance().info(`Response from web3 balanceOf : ${JSON.stringify(shareWallet)}`)
                
                dataToExport.push({
                  "S/N": i+1,
                  USERNAME : user.username,
                  VOLUME : shareWallet
                })

                // Re-initialize users share balance to zero
                await SterlingTokenContract.zeroBalance(user.address)
                
                if (i == users.length - 1) {
                  return resolve(dataToExport)
                }
                  
              }
            } catch (error) {
              return reject(error)
            }
          })
        } 

        await terminateAllScheduleAndAllocations()
        let workBookData = await getWorkBookData()
        console.log("workBookData >> ", workBookData)

        //write to excel file and get url
        const worksheet = XLSX.utils.json_to_sheet(workBookData,{header: ["S/N", "USERNAME", "VOLUME"]})
        const excelWorkBook = XLSX.utils.book_new()
        var downloadFileName
        XLSX.utils.book_append_sheet(excelWorkBook, worksheet, "TradindWindow")
        fs.mkdir(__appbasedir+'/uploads/tradingWindows', { recursive: true }, (err) => {
          if (err) {
            GetLoggerInstance().error(`the directory 'tradingWindows' already exist`)
          }
          downloadFileName = `data${Date.now()}`
          XLSX.writeFile(excelWorkBook,__appbasedir+`/uploads/tradingWindows/${downloadFileName}.xlsx`)
        });

        tradingWindow.isOpen = false
        tradingWindow.closingData = `/tradingWindows/${downloadFileName}.xlsx`
        await tradingWindow.save()

        responseBody = {
          windowData : Config.BASEURL+tradingWindow.closingData
        }

        GetLoggerInstance().info(`Outgoing Response To CloseTradingWindow Request : ${JSON.stringify(responseBody)} `)
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
     * Set Custom Share Price
     * @description Set The Per Unit Price of Shares
     * @param {number} requirement Value of share price per unit
    */
   async SetSharePrice(req, res, next) {
    
    let response = new ApiResponse()
    try {
      
      let requestBody = {}
      requestBody = req.body
      const priceId = requestBody._id
      //let sharePrice = new SharePriceModel()
      let sharePrice = await SharePriceModel.findOne({_id: priceId}).exec()
      let responseBody = {}
  
        
        console.log('Price >>',priceId)
        GetLoggerInstance().info(`Incoming Request For SetSharePrice : ${JSON.stringify(requestBody)} `)
        
        const price = requestBody.price
        GetLoggerInstance().info(`Outgoing Response To SetSharePrice Request : ${GetCodeMsg(Errors.SUCCESS)} `)

        sharePrice.price = price
        sharePrice.userId = req.authUser._id
        await sharePrice.save()


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
     * Get Custom Share Price
     * @description Set The Per Unit Price of Shares
    */
   async GetSharePrice(req, res, next) {
    
    let response = new ApiResponse()
    try {
     
          let share = await SharePriceModel.findOne().exec()
         
      //console.log(share)
      responseBody = {
        shareId: share._id,
        sharesvalue : share.price
      }
      
      GetLoggerInstance().info(`Outgoing Response To AllSchedules Request : ${JSON.stringify(responseBody)}`)
      return res.status(HttpStatus.OK).json(response.Success(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS), responseBody));

    } catch (error) {
        if (error.hasOwnProperty("errCode") && error.hasOwnProperty("statusCode") ) {
        next(response.PlainError(error.errCode, error.statusCode, GetCodeMsg(error.errCode), error.error))
        return
      } 
      return next(response.PlainError(Errors.SERVERERROR, HttpStatus.SERVER_ERROR, GetCodeMsg(Errors.SERVERERROR), error)) 
    }
  },
};

module.exports = settingsController;
