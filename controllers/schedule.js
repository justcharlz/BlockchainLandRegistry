const { ApiResponse, HttpStatus, GetCodeMsg, Errors, GetLoggerInstance, Config, GetFromCache, RabbitMQService, Decrypt, AddToCache } = require('../utils');
const { UserModel, ScheduleModel, TradingWindowModel, AllocationModel } = require('../models');
const { SterlingTokenContract } = require('../services');
const ReadExcel = require('read-excel-file/node');
const path = require("path")

const scheduleController = {

    /**
     * Get All Schedule Allocations.
     * @description This returns all allocations for the given schedule.
     * @param {string} scheduleId
     * @return {object[]} Allocations
     */
    async ScheduleAllocations(req, res, next) {
        let response = new ApiResponse()
    
        try {
            let responseBody = {}
            let allocations = []
            const scheduleId = (req.params.scheduleId == undefined)? req.query.scheduleId : req.params.scheduleId
            const allocationFilter = (req.params.filter == undefined)? req.query.filter : req.params.filter

          switch (allocationFilter) {
            case AllocationModel.Status.COMPLETED:
                    allocations =  await AllocationModel.find({scheduleId: scheduleId, status : AllocationModel.Status.COMPLETED}).select({scheduleId : 0})
                break;
            case AllocationModel.Status.INPROGRESS:
                    allocations = await AllocationModel.find({scheduleId: scheduleId, status : AllocationModel.Status.INPROGRESS }).select({scheduleId : 0})
                break;
            case AllocationModel.Status.FAILED:
                    allocations = await AllocationModel.find({scheduleId: scheduleId, status : AllocationModel.Status.FAILED }).select({scheduleId : 0})
                break;
            case AllocationModel.Status.TERMINATED:
                    allocations = await AllocationModel.find({scheduleId: scheduleId, status : AllocationModel.Status.TERMINATED }).select({scheduleId : 0})
                break;
            case AllocationModel.Status.PENDING:
                    allocations = await AllocationModel.find({scheduleId: scheduleId, status : AllocationModel.Status.PENDING }).select({scheduleId : 0})
                break;
            default:
                    const result = await GetFromCache('ST_allocations');
            
                    if (result != null && JSON.parse(result).length > 0) {
                        allocations = JSON.parse(result);
                    } else {
                        allocations = await AllocationModel.find({scheduleId: scheduleId}).select({scheduleId : 0})
                        let cashedallocations = []
            
                        // Use schedule's id as cashedallocations array index
                        for (let index = 0; index < allocations.length; index++) {
                            cashedallocations[allocations[index]._id] = allocations[index]
                        }
                        await AddToCache('ST_allocations', cashedallocations)
                    }
                break;
          }
            function getWorkBookData() {
                return new Promise(async (resolve, reject) => {
                try {
                    let dataToExport = []
                    for (let i = 0; i < allocations.length; i++) {
                        let allocation = allocations[i]

                        dataToExport.push({
                            "S/N": i+1,
                            USERNAME : allocation.username,
                            VOLUME : allocation.amount,
                            STATUS: allocation.status,
                            DESCRIPTION : allocation.comment
                        })
                        
                        if (i == allocations.length - 1) {
                            return resolve(dataToExport)
                        }
                    }
                } catch (error) {
                    return reject(error)
                }
                })
            } 
  
            let workBookData = await getWorkBookData()
            console.log("workBookData >> ", workBookData)

            //write to excel file and get url
            const worksheet = XLSX.utils.json_to_sheet(workBookData,{header: ["S/N", "USERNAME", "VOLUME", "STATUS", "DESCRIPTION"]})
            const excelWorkBook = XLSX.utils.book_new()
            var dataFilename = `allocation${Date.now()}`
            XLSX.utils.book_append_sheet(excelWorkBook, worksheet, "scheduleAllocations")
            fs.mkdir(__appbasedir+'/uploads/scheduleAllocations', { recursive: true }, (err) => {
            if (err) {
                GetLoggerInstance().error(`the directory 'scheduleAllocations' already exist : ${JSON.stringify(err)}`)
            }
            XLSX.writeFile(excelWorkBook,__appbasedir+`/uploads/scheduleAllocations/${dataFilename}.xlsx`)
            });

            responseBody = {
              allocation : `/scheduleAllocations/${dataFilename}.xlsx`
            }
      
            GetLoggerInstance().info(`Outgoing Response To ScheduleAllocations Request : ${JSON.stringify(responseBody)}`)
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
     * Get All Pending Schedules.
     * @description This returns all Pending schedule on the platform.
     * @return {object[]} Schedules
     */
    async AllPendingApprovalSchedules(req, res, next) {
        let response = new ApiResponse()
    
        try {
            let responseBody = {}
    
            var schedules = await ScheduleModel.find({status : {$in : [ScheduleModel.Status.PENDING, ScheduleModel.Status.APPROVING]}}).sort({updatedAt : "desc"}).exec()

            const allPendingSchedules = async function () {
                return new Promise(async(resolve, reject) => {
                    let allPendingSchedules = []
                    for (let i = 0; i < schedules.length; i++) {
                        const schedule = schedules[i];
                        let allApprovals = await SterlingTokenContract.getapprovals(schedule.scheduleId)
                        if (allApprovals.approval.length < 1 || allApprovals.approval.includes(req.authUser.address) == false) {
                            allPendingSchedules.push(schedule)
                        }
                    }
                    return resolve(allPendingSchedules)
                })
            }

            responseBody = {
              schedules : await allPendingSchedules()
            }
            
            GetLoggerInstance().info(`Outgoing Response To AllSchedules Request : ${JSON.stringify(responseBody)}`)
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
     * Get All Schedules.
     * @description This returns all created schedule on the platform.
     * @return {object[]} Schedules
     */
    async AllSchedules(req, res, next) {
      let response = new ApiResponse()
  
      try {
          let responseBody = {}
          const scheduleFilter = (req.params.filter == undefined)? req.query.filter : req.params.filter
          let schedules = []
  
          switch (scheduleFilter) {
            case ScheduleModel.Status.PENDING:
                    schedules = await ScheduleModel.find({status : ScheduleModel.Status.PENDING}).select({scheduleId : 0}).sort({updatedAt : "desc"}).exec()
                break;
            case ScheduleModel.Status.REJECTED:
                    schedules = await ScheduleModel.find({status : ScheduleModel.Status.REJECTED}).select({scheduleId : 0}).sort({updatedAt : "desc"}).exec()
                break;
            case ScheduleModel.Status.APPROVED:
                    schedules = await ScheduleModel.find({status : ScheduleModel.Status.APPROVED}).select({scheduleId : 0}).sort({updatedAt : "desc"}).exec()
                break;
            case ScheduleModel.Status.COMPLETED:
                    schedules = await ScheduleModel.find({status : ScheduleModel.Status.COMPLETED}).select({scheduleId : 0}).sort({updatedAt : "desc"}).exec()
                break;
            case ScheduleModel.Status.INPROGRESS:
                    schedules = await ScheduleModel.find({status : ScheduleModel.Status.INPROGRESS}).select({scheduleId : 0}).sort({updatedAt : "desc"}).exec()
                break;
            case ScheduleModel.Status.APPROVING:
                    schedules = await ScheduleModel.find({status : ScheduleModel.Status.APPROVING}).select({scheduleId : 0}).sort({updatedAt : "desc"}).exec()
                break;
            case ScheduleModel.Status.TERMINATED:
                    schedules = await ScheduleModel.find({status : ScheduleModel.Status.TERMINATED}).select({scheduleId : 0}).sort({updatedAt : "desc"}).exec()
                break;
            default:
                    const result = await GetFromCache('ST_schedules');
            
                    if (result != null && JSON.parse(result).length > 0) {
                        schedules = JSON.parse(result);
                    } else {
                        schedules = await ScheduleModel.find({})//.select({scheduleFilter : 1})
                        let cashedschedules = []
            
                        // Use schedule's id as cashedschedules array index
                        for (let index = 0; index < schedules.length; index++) {
                            cashedschedules[schedules[index]._id] = schedules[index]
                        }
                        await AddToCache('ST_schedules', cashedschedules)
                    }
                break;
          }

          
          responseBody = {
            schedules
          }
    
          GetLoggerInstance().info(`Outgoing Response To AllSchedules Request : ${JSON.stringify(responseBody)}`)
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
     * Get Single Schedules.
     * @description This returns all created schedule on the platform.
     * @param {string} scheduleId
     * @return {object[]} Schedule Details
     */
    async SingleSchedule(req, res, next) {
        let response = new ApiResponse()
        try {
            let requestBody = {}
            let responseBody = {}

            requestBody = (req.params.scheduleId == undefined)? req.query : req.params
            GetLoggerInstance().info(`Incoming Request For SingleSchedule : ${JSON.stringify(requestBody)} `)
    
            let schedule
            const result = await GetFromCache('ST_schedules');
    
            if (result != null && JSON.parse(result).length > 0) {
                conssole.log("came here", schedules)
                if (schedules[requestBody.scheduleId]) {
                    schedule = schedules[requestBody.scheduleId]
                }
            } else {
                schedule = await ScheduleModel.findOne({_id : requestBody.scheduleId});
                if(!schedule){
                  return next(response.PlainError(Errors.SCHEDULENOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.SCHEDULENOTEXIST), {error : "Schedule Does Not Exist"}))
                }
    
            }

            let scheduleApprovals = []
            let scheduleRejection = {}
            let totalAllocations = 0
            let successfulAllocations = 0
            let remainingAllocations = 0 
            let failedAllocations = 0   
            let approvals = []

            switch (schedule.status) {
                case ScheduleModel.Status.PENDING:
                    approvals = await SterlingTokenContract.getapprovals(schedule.scheduleId)
                    GetLoggerInstance().info(`Response from web3 getapprovals : ${JSON.stringify(approvals)}`)
                    approvals.approval.forEach(async (approval) => {
                        let approver = await UserModel.findOne({address : approval}).select({transactionPin: 0, authToken: 0, password: 0, walletId: 0});
                        scheduleApprovals.push(approver) 
                    })
                    break;
                case ScheduleModel.Status.REJECTED:
                        // Get schedule rejection Info
                        let rejection = await SterlingTokenContract.getrejects(schedule.scheduleId)
                        GetLoggerInstance().info(`Response from web3 getrejects : ${JSON.stringify(rejection)}`)
                        if (Object.entries(rejection).length !== 0) {
                            const approver = await UserModel.findOne({address : rejection.reject[0]}).select({address: 0, authToken: 0, password: 0, walletId: 0});
                            scheduleRejection = {
                                approver,
                                comment : rejection._eventcomment
                            }
                        }
                    break;
                case ScheduleModel.Status.APPROVED:
                case ScheduleModel.Status.COMPLETED:
                case ScheduleModel.Status.INPROGRESS:
                case ScheduleModel.Status.TERMINATED:
                        approvals = await SterlingTokenContract.getapprovals(schedule.scheduleId)
                        GetLoggerInstance().info(`Response from web3 getapprovals : ${JSON.stringify(approvals)}`)
                        approvals.approval.forEach(async (approval) => {
                            let approver = await UserModel.findOne({address : approval}).select({transactionPin: 0, authToken: 0, password: 0, walletId: 0});
                            scheduleApprovals.push(approver) 
                        })
                        totalAllocations = await AllocationModel.find({scheduleId : schedule._id}).countDocuments()
                        successfulAllocations = await AllocationModel.find({scheduleId : schedule._id, status : AllocationModel.Status.COMPLETED}).countDocuments()
                        remainingAllocations = await AllocationModel.find({scheduleId : schedule._id, status : {$in : [AllocationModel.Status.INPROGRESS, AllocationModel.Status.PENDING]} }).countDocuments()
                        failedAllocations = await AllocationModel.find({scheduleId : schedule._id, status : AllocationModel.Status.FAILED, comment : {$ne : ""}}).countDocuments()

                    break;
                case ScheduleModel.Status.APPROVING:
                        approvals.approval.forEach(async (approval) => {
                            let approver = await UserModel.findOne({address : approval}).select({transactionPin: 0, authToken: 0, password: 0, walletId: 0});
                            scheduleApprovals.push(approver) 
                        })
                    break;
            }

            let requiredApprovals = await SterlingTokenContract.getrequiredapprovals(schedule.scheduleId)

            responseBody = {
                schedule,
                scheduleApprovals,
                scheduleRejection,
                requiredApprovals,
                approvalCount : scheduleApprovals.length,
                totalAllocations,
                successfulAllocations,
                remainingAllocations,
                failedAllocations
            }
      
            GetLoggerInstance().info(`Outgoing Response To SingleSchedule Request : ${JSON.stringify(responseBody)}`)
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
    * Create Mint Schedule
    * @description Allow admin create a mint schedule, used for minting share tokens to users
    * @param {string} name   Schedule name
    * @param {string} description Schedule description 
    * @param {string} scheduleAmount Schedule amount 
    * @param {string} scheduleType Schedule Type
    * @param {file} scheduleFile Schedule file
    */
    async CreateSchedule(req, res, next) {
        let response = new ApiResponse()
        try {

            let requestBody = {}
            let schedule = new ScheduleModel()
            let tradingWindow = await TradingWindowModel.findOne({isOpen : true}).exec()
    
            requestBody = req.body
            GetLoggerInstance().info(`Incoming Request For createSchedule : ${JSON.stringify(requestBody)} `)

            const { description, name, scheduleType } = requestBody
            const scheduleFile = req.file

            const allowedFileMIME = ["application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/msexcel","application/x-msexcel","application/x-ms-excel","application/x-excel","application/x-dos_ms_excel","application/xls","application/x-xls" ] // pull from json file

            if (!allowedFileMIME.includes(scheduleFile.mimetype)) {
                next(response.PlainError(Errors.INVALIDFILEFORMAT, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDFILEFORMAT), "File given is not an excel file"))
                return
            }
            var allocationSchema = await ReadExcel(path.resolve(__appbasedir,scheduleFile.path));
            if (allocationSchema.length <= 1) {
                next(response.PlainError(Errors.EMPTYFILE, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.EMPTYFILE), "Empty Schedule File"))
                return
            }
            if (!allocationSchema[0].includes("USERNAME") || !allocationSchema[0].includes("VOLUME") ) {
                next(response.PlainError(Errors.INVALIDFILEHEADER, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDFILEHEADER), "Invalid file format given"))
                return
            }
            if ( allocationSchema[0][1] != "USERNAME" || allocationSchema[0][2] != "VOLUME") {
                next(response.PlainError(Errors.INVALIDFILEHEADERARR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDFILEHEADERARR), "Invalid file format given"))
                return
            }
            const schedulePath = `/schedules/${scheduleFile.filename}`
            const scheduleAmount = parseFloat(Math.abs(requestBody.scheduleAmount))

            // Create record on blockchain 
            let chainResponse 
            if (req.authUser.userRole == UserModel.UserType.ADMIN) {
                let chainPass = await Decrypt(req.authUser.password)
                GetLoggerInstance().info(`Request from web3 createSchedule : ${scheduleAmount, req.authUser.address, chainPass}`)
                chainResponse = await SterlingTokenContract.createSchedule(scheduleAmount, req.authUser.address, chainPass)
            } else {
                GetLoggerInstance().info(`Request from web3 createSchedule : ${scheduleAmount, req.authUser.address, ""}`)
                chainResponse = await SterlingTokenContract.createSchedule(scheduleAmount, req.authUser.address, "")
            }
            GetLoggerInstance().info(`Response from web3 createSchedule : ${JSON.stringify(chainResponse)}`)

            schedule.scheduleId = chainResponse.scheduleId
            schedule.windowId = tradingWindow._id
            schedule.name = name
            schedule.volume = scheduleAmount
            schedule.description = description
            schedule.scheduleFile.push(schedulePath) 
            if (scheduleType) {
                schedule.type = scheduleType
            }
            await schedule.save() 
            schedule.platformURL = Config.PLATFORMURL

            // RabbitMQService.queue('SEND_EMAIL_TO_APPROVERS_ON_NEWSCHEDULE', { newSchedule : schedule })

            GetLoggerInstance().info(`Outgoing Response To createSchedule Request : ${GetCodeMsg(Errors.SUCCESS)}`)
            return res.status(HttpStatus.OK).json(response.PlainSuccess(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS)));
        
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
    },
    
  
    /**
    * Mint Token On A Schedule
    * @description Allow admin mint token to specified users on a schedule, used for minting share tokens to users
    * @param {file} scheduleFile Schedule file
    * @param  {string}  scheduleId  Schedule's ID
    */
    async MintOnSchedule(req, res, next) {
        let response = new ApiResponse()
        try {

            let requestBody = {}
            const scheduleId = (req.params.scheduleId == undefined)? req.query.scheduleId : req.params.scheduleId
            requestBody = req.body
            GetLoggerInstance().info(`Incoming Request For createSchedule : ${JSON.stringify(requestBody)} `)

            let schedule = await ScheduleModel.findOne({_id : scheduleId});
            console.log("schedule > ", schedule)
            if(!schedule){
                return next(response.PlainError(Errors.SCHEDULENOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.SCHEDULENOTEXIST), {error : "Schedule Does Not Exist"}))
            }
            if(schedule.status != ScheduleModel.Status.INPROGRESS){
                return next(response.PlainError(Errors.INVALIDSCHEDULE, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.INVALIDSCHEDULE), {error : "Schedule Status Should Be In Progress"}))
            }

            const scheduleFile = req.file

            const allowedFileMIME = ["application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/msexcel","application/x-msexcel","application/x-ms-excel","application/x-excel","application/x-dos_ms_excel","application/xls","application/x-xls" ] // pull from json file

            if (!allowedFileMIME.includes(scheduleFile.mimetype)) {
                next(response.PlainError(Errors.INVALIDFILEFORMAT, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDFILEFORMAT), "File given is not an excel file"))
                return
            }
            var allocationSchema = await ReadExcel(path.resolve(__appbasedir,scheduleFile.path));
            if (allocationSchema.length <= 1) {
                next(response.PlainError(Errors.EMPTYFILE, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.EMPTYFILE), "Empty Schedule File"))
                return
            }
            if (!allocationSchema[0].includes("USERNAME") || !allocationSchema[0].includes("VOLUME") ) {
                next(response.PlainError(Errors.INVALIDFILEHEADER, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDFILEHEADER), "Invalid file format given"))
                return
            }
            if ( allocationSchema[0][1] != "USERNAME" || allocationSchema[0][2] != "VOLUME") {
                next(response.PlainError(Errors.INVALIDFILEHEADERARR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDFILEHEADERARR), "Invalid file format given"))
                return
            }
            const schedulePath = `/schedules/${scheduleFile.filename}`

            schedule.scheduleFile.push(schedulePath) 
            await schedule.save() 
            schedule.platformURL = Config.PLATFORMURL

            RabbitMQService.queue('CREATE_SCHEDULE_ALLOCATION_ENTRIES_ONDB', { schedule })

            GetLoggerInstance().info(`Outgoing Response To MintOnSchedule Request : ${GetCodeMsg(Errors.SUCCESS)}`)
            return res.status(HttpStatus.OK).json(response.PlainSuccess(Errors.SUCCESS, GetCodeMsg(Errors.SUCCESS)));
        
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
    },

    /**
        * Approve Schedule
        * @description This allows an approver to approve a schedule
        * @param   {string}  scheduleId  Schedule's ID
        * @param   {string}  comment  Reason for schedule approval
    */
    async ApproveSchedule(req, res, next) {
        let response = new ApiResponse()
        
        try {
            let requestBody = {}
    
            requestBody = req.body
            const scheduleId = (req.params.scheduleId == undefined)? req.query.scheduleId : req.params.scheduleId
            GetLoggerInstance().info(`Incoming Request For ApproveSchedule : ${JSON.stringify(requestBody)} `)

            let schedule = await ScheduleModel.findOne({_id : scheduleId});
            if(!schedule){
                return next(response.PlainError(Errors.SCHEDULENOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.SCHEDULENOTEXIST), {error : "Schedule Does Not Exist"}))
            }
            let chainScheduleId = schedule.scheduleId
            switch (schedule.status) {
                case ScheduleModel.Status.APPROVED:
                    return next(response.PlainError(Errors.SCHAPPROVEDERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHAPPROVEDERR), GetCodeMsg(Errors.SCHAPPROVEDERR)))
                case ScheduleModel.Status.REJECTED:
                    return next(response.PlainError(Errors.SCHREJECTEDERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHREJECTEDERR), GetCodeMsg(Errors.SCHREJECTEDERR)))
                case ScheduleModel.Status.INPROGRESS:
                    return next(response.PlainError(Errors.SCHPROCESSERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHPROCESSERR), GetCodeMsg(Errors.SCHPROCESSERR)))
                case ScheduleModel.Status.TERMINATED:
                    return next(response.PlainError(Errors.SCHTERMINATEDERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHTERMINATEDERR), GetCodeMsg(Errors.SCHTERMINATEDERR)))
            }

            // update blockchain record 
            let chainPass = await Decrypt(req.authUser.password)
            GetLoggerInstance().info(`Request from web3 approveMint : ${chainScheduleId, true, requestBody.comment, req.authUser.address, chainPass}`)
            let chainResponse = await SterlingTokenContract.approveMint(chainScheduleId, true, requestBody.comment, req.authUser.address, chainPass)
            GetLoggerInstance().info(`Response from web3 approveMint : ${JSON.stringify(chainResponse)}`)

            if (chainResponse == ScheduleModel.Status.APPROVED) {
                schedule.status = ScheduleModel.Status.APPROVED
                schedule.approverActionTime = schedule.updatedAt 
                await schedule.save()
                RabbitMQService.queue('CREATE_SCHEDULE_ALLOCATION_ENTRIES_ONDB', { schedule })
            }
            if (schedule.status == ScheduleModel.Status.PENDING) {
                schedule.status = ScheduleModel.Status.APPROVING
                await schedule.save()
            }
            
            GetLoggerInstance().info(`Outgoing Response To ApproveSchedule Request : ${GetCodeMsg(Errors.SUCCESS)}`)
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
        * Reject Schedule
        * @description This allows an approver to reject a schedule
        * @param   {string}  scheduleId  Schedule's ID
        * @param   {string}  comment  Reason for schedule rejection
    */
    async RejectSchedule(req, res, next) {
        let response = new ApiResponse()
    
        try {
            let requestBody = {}

            requestBody = req.body
            GetLoggerInstance().info(`Incoming Request For RejectSchedule : ${JSON.stringify(requestBody)} `)

            const scheduleId = (req.params.scheduleId == undefined)? req.query.scheduleId : req.params.scheduleId
            let schedule = await ScheduleModel.findOne({_id : scheduleId});
            if(!schedule){
                return next(response.PlainError(Errors.SCHEDULENOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.SCHEDULENOTEXIST), {error : "Schedule Does Not Exist"}))
            }
            switch (schedule.status) {
                case ScheduleModel.Status.APPROVED:
                case ScheduleModel.Status.COMPLETED:
                    return next(response.PlainError(Errors.SCHAPPROVEDERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHAPPROVEDERR), GetCodeMsg(Errors.SCHAPPROVEDERR)))
                case ScheduleModel.Status.REJECTED:
                    return next(response.PlainError(Errors.SCHREJECTEDERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHREJECTEDERR), GetCodeMsg(Errors.SCHREJECTEDERR)))
                case ScheduleModel.Status.INPROGRESS:
                    return next(response.PlainError(Errors.SCHPROCESSERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHPROCESSERR), GetCodeMsg(Errors.SCHPROCESSERR)))
                case ScheduleModel.Status.TERMINATED:
                    return next(response.PlainError(Errors.SCHTERMINATEDERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHTERMINATEDERR), GetCodeMsg(Errors.SCHTERMINATEDERR)))
            }

            // update blockchain record 
            let chainScheduleId = schedule.scheduleId
            let chainPass = await Decrypt(req.authUser.password)
            GetLoggerInstance().info(`Request from web3 approveMint : ${chainScheduleId, false, requestBody.comment, req.authUser.address, chainPass}`)
            let chainResponse = await SterlingTokenContract.approveMint(chainScheduleId, false, requestBody.comment, req.authUser.address, chainPass)
            GetLoggerInstance().info(`Response from web3 approveMint : ${JSON.stringify(chainResponse)}`)

            schedule.status = ScheduleModel.Status.REJECTED
            await schedule.save()
            
            GetLoggerInstance().info(`Outgoing Response To RejectSchedule Request : ${GetCodeMsg(Errors.SUCCESS)}`)
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
        * Undo Approve Schedule
        * @description This allows an approver to undo an approval on a schedule
        * @param   {string}  scheduleId  Schedule's ID
    */
    async UndoApproveSchedule(req, res, next) {
        let response = new ApiResponse()
        
        try {
            let requestBody = {}
    
            const scheduleId = (req.params.scheduleId == undefined)? req.query.scheduleId : req.params.scheduleId
            GetLoggerInstance().info(`Incoming Request For ApproveSchedule : ${JSON.stringify(requestBody)} `)

            let schedule = await ScheduleModel.findOne({_id : scheduleId});
            if(!schedule){
                return next(response.PlainError(Errors.SCHEDULENOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.SCHEDULENOTEXIST), {error : "Schedule Does Not Exist"}))
            }

            switch (schedule.status) {
                case ScheduleModel.Status.APPROVED:
                    return next(response.PlainError(Errors.SCHAPPROVEDERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHAPPROVEDERR), GetCodeMsg(Errors.SCHAPPROVEDERR)))
                case ScheduleModel.Status.INPROGRESS:
                    return next(response.PlainError(Errors.SCHPROCESSERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHPROCESSERR), GetCodeMsg(Errors.SCHPROCESSERR)))
                case ScheduleModel.Status.TERMINATED:
                    return next(response.PlainError(Errors.SCHTERMINATEDERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHTERMINATEDERR), GetCodeMsg(Errors.SCHTERMINATEDERR)))
            }

            // update blockchain record 
            let chainScheduleId = schedule.scheduleId
            let chainPass = await Decrypt(req.authUser.password)
            GetLoggerInstance().info(`Request from web3 undoApprovalMint : ${chainScheduleId, req.authUser.address, chainPass}`)
            let chainResponse = await SterlingTokenContract.undoApprovalMint(chainScheduleId, req.authUser.address, chainPass)
            GetLoggerInstance().info(`Response from web3 undoApprovalMint : ${JSON.stringify(chainResponse)}`)
            
            GetLoggerInstance().info(`Outgoing Response To undoApprovalMint Request : ${GetCodeMsg(Errors.SUCCESS)}`)
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
        * Update Schedule
        * @description This allows an admin update a schedule details, provided schedule has not been approved
        * @param   {string}  scheduleId  Schedule's ID
        * @param {string} name   Schedule name
        * @param {string} description Schedule description 
        * @param {string} scheduleAmount Schedule amount 
        * @param {string} scheduleType Schedule type
        * @param {file} scheduleFile Schedule file
    */
    async UpdateSchedule(req, res, next) {
        let response = new ApiResponse()
        
        try {
            let requestBody = {}

            requestBody = req.body
            
            const { description, name, scheduleType } = requestBody
            const scheduleAmount = parseFloat(Math.abs(requestBody.scheduleAmount))
            const scheduleFile = req.file
            GetLoggerInstance().info(`Incoming Request For UpdateSchedule : ${JSON.stringify(requestBody)} `)

            let schedule = await ScheduleModel.findOne({_id : req.params.scheduleId});
            let scheduleToUpdate = schedule.name
            if(!schedule){
                return next(response.PlainError(Errors.SCHEDULENOTEXIST, HttpStatus.NOT_FOUND, GetCodeMsg(Errors.SCHEDULENOTEXIST), {error : "Schedule Does Not Exist"}))
            }

            switch (schedule.status) {
                case ScheduleModel.Status.APPROVED:
                    return next(response.PlainError(Errors.SCHAPPROVEDERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHAPPROVEDERR), GetCodeMsg(Errors.SCHAPPROVEDERR)))
                case ScheduleModel.Status.REJECTED:
                    return next(response.PlainError(Errors.SCHREJECTEDERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHREJECTEDERR), GetCodeMsg(Errors.SCHREJECTEDERR)))
                case ScheduleModel.Status.INPROGRESS:
                    return next(response.PlainError(Errors.SCHPROCESSERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHPROCESSERR), GetCodeMsg(Errors.SCHPROCESSERR)))
                case ScheduleModel.Status.APPROVING:
                    return next(response.PlainError(Errors.SCHPROCESSERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHPROCESSERR), GetCodeMsg(Errors.SCHPROCESSERR)))
                case ScheduleModel.Status.TERMINATED:
                    return next(response.PlainError(Errors.SCHTERMINATEDERR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.SCHTERMINATEDERR), GetCodeMsg(Errors.SCHTERMINATEDERR)))
            }

            if (scheduleFile) {
                const allowedFileMIME = ["application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/msexcel","application/x-msexcel","application/x-ms-excel","application/x-excel","application/x-dos_ms_excel","application/xls","application/x-xls" ] // pull from json file

                if (!allowedFileMIME.includes(scheduleFile.mimetype)) {
                    next(response.PlainError(Errors.INVALIDFILEFORMAT, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDFILEFORMAT), "File given is not an excel file"))
                    return
                }
                var allocationSchema = await ReadExcel(path.resolve(__appbasedir,scheduleFile.path));
                if (allocationSchema.length <= 1) {
                    next(response.PlainError(Errors.EMPTYFILE, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.EMPTYFILE), "Empty Schedule File"))
                    return
                }
                if (!allocationSchema[0].includes("USERNAME") || !allocationSchema[0].includes("VOLUME") ) {
                    next(response.PlainError(Errors.INVALIDFILEHEADER, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDFILEHEADER), "Invalid file format given"))
                    return
                }
                if ( allocationSchema[0][1] != "USERNAME" || allocationSchema[0][2] != "VOLUME") {
                    next(response.PlainError(Errors.INVALIDFILEHEADERARR, HttpStatus.BAD_REQUEST, GetCodeMsg(Errors.INVALIDFILEHEADERARR), "Invalid file format given"))
                    return
                }
                schedule.scheduleFile[schedule.scheduleFile.length - 1] = `${Config.BASEURL}/schedules/${scheduleFile.filename}`
            }

            // update blockchain record 
            let scheduleId = schedule.scheduleId
            if (scheduleAmount) {
                let chainResponse
                if (req.authUser.userRole == UserModel.UserType.ADMIN) {
                    let chainPass = await Decrypt(req.authUser.password)
                    GetLoggerInstance().info(`Request to web3 updateSchedule : ${scheduleId, scheduleAmount, req.authUser.address, chainPass}`)
                    chainResponse = await SterlingTokenContract.updateSchedule(scheduleId, scheduleAmount, req.authUser.address, chainPass)
                } else {
                    GetLoggerInstance().info(`Request to web3 updateSchedule : ${scheduleId, scheduleAmount, req.authUser.address, ""}`)
                    chainResponse = await SterlingTokenContract.updateSchedule(scheduleId, scheduleAmount, req.authUser.address, "")
                }
                GetLoggerInstance().info(`Response from web3 updateSchedule : ${JSON.stringify(chainResponse)}`)
                schedule.volume = scheduleAmount
            }

            // Update DB
            if (name) {
                schedule.name = name
            }
            if (description) {
                schedule.description = description
            }
            if (scheduleType) {
                schedule.type = scheduleType
            }
            await schedule.save() 
            schedule.platformURL = Config.PLATFORMURL

            RabbitMQService.queue('SEND_EMAIL_TO_APPROVERS_ON_SCHEDULEUPDATE', { updatedschedule : schedule, schedule : scheduleToUpdate })

            GetLoggerInstance().info(`Outgoing Response To UpdateSchedule Request : ${GetCodeMsg(Errors.SUCCESS)}`)
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

module.exports = scheduleController