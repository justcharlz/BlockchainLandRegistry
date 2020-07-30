
var soap = require('soap');
const { Config } = require('./config')
const { EmailDetails } = require('./emails')
const { GetFromCache } = require('./redis')
const { GetLoggerInstance, SerializeXML, SerializeAD } = require('./utils');
const { SharesModel, AdminSettingsModel, AllocationModel, UserModel, ScheduleModel } = require('../models');
const ReadExcel = require('read-excel-file/node');
const path = require("path")


exports.SendApproverMail = async function(schedule) {
    try {
        // Get All Approvers
        let approvers = []
        let operationStatus 
        const result = await GetFromCache('ST_approvers');

        if (result != null && JSON.parse(result).length > 0) {
            approvers = JSON.parse(result);
        } else {
            approvers = await UserModel.find({userRole : UserModel.UserType.APPROVER}, {authToken: 0, password: 0 })
        }

        if (approvers.length > 0) {
            // Email Details
            const email = EmailDetails(`
                <div>
                    <h2><b>Please find the details of the newly created schedule below :</b></h2>
                    <h4><b>Schedule Name</b> : ${schedule.name},</h4>
                    <h4><b>Schedule Description</b> : ${schedule.description},</h4>
                    <h4><b>Schedule Amount</b> : ${schedule.volume},</h4>
                    <h5><a href='${Config.BASEURL+schedule.scheduleFile[schedule.scheduleFile.length - 1]}'>Download Schedule Allocation Details</a>,</h5>
                </div>
                <h4>To Approve Proceed To <a href='${schedule.platformURL}'>The OneExchange Portal</a> </h4>
            `)
            var EmailParams = {
                sourceEmail : Config.appEmail,
                body : email.body,
                subject : "Your Approval Is Needed! A New Schedule Has Been Created"
            }

            approvers.forEach(async (approver) => {
                let SoapClient1 = await soap.createClientAsync(Config.ADServiceURL) 
                let responseFromAD = await SoapClient1.GetInfo2Async({xusername : approver.username})
                const ADRes = await SerializeXML(responseFromAD[0].GetInfo2Result)
                const adProfile =  SerializeAD(ADRes.root.record[0])
                
                // Do this in a seperate queue with data : destination email and emailParams, then if it fails, it reques it
                // Call EWService to send email
                EmailParams.destinationEmail = adProfile.mail
                let SoapClient2 = await soap.createClientAsync(Config.EWSERVICE) 
                let responseSendEmail = await SoapClient2.SendMailAsync(EmailParams)
                
                if (responseSendEmail[0].SendMailResult != "00") {
                  operationStatus = false 
                }
                operationStatus = true 
            })
        }
        return operationStatus
    } catch (error) {
        GetLoggerInstance().error(`SendApproverMail Queue Error : ${JSON.stringify(error)}`)
        return false
    }
} 

exports.SendSellerMail = async function(trade) {
    try {
            // Email Details
            const email = EmailDetails(`
                <div>
                    <h4><b>An amount of '${trade.amount}' has been transfered to your OneExchange Wallet, for a buy transaction on your trade.</b></h4>
                    <h4>For details of the trade, please proceed to <a href='${trade.platformTradeURL}'>The OneExchange Portal</a> </h4>
                </div>
            `)
            var EmailParams = {
                sourceEmail : Config.appEmail,
                body : email.body,
                subject : "Buy Notification On Your Trade"
            }

            let SoapClient1 = await soap.createClientAsync(Config.ADServiceURL) 
            let responseFromAD = await SoapClient1.GetInfo2Async({xusername : trade.seller})
            const ADRes = await SerializeXML(responseFromAD[0].GetInfo2Result)
            const adProfile =  SerializeAD(ADRes.root.record[0])
            
            // Do this in a seperate queue with data : destination email and emailParams, then if it fails, it reques it
            // Call EWService to send email
            EmailParams.destinationEmail = adProfile.mail
            let SoapClient2 = await soap.createClientAsync(Config.EWSERVICE) 
            let responseSendEmail = await SoapClient2.SendMailAsync(EmailParams)
            
            if (responseSendEmail[0].SendMailResult != "00") {
                return false 
            }
            return true
    } catch (error) {
        GetLoggerInstance().error(`SendSellerMail Queue Error : ${JSON.stringify(error)}`)
        return false
    }
} 

exports.SendTransferMail = async function(trade) {
    try {
            // Email Details
            const email = EmailDetails(`
                <div>
                    <h4><b>An amount of '${trade.volume}' has been transfered to your OneExchange Share Wallet from ${trade.sender}.</b></h4>
                    <h4>For details of the trade, please proceed to <a href='${trade.platformTradeURL}'>The OneExchange Portal</a> </h4>
                </div>
            `)
            var EmailParams = {
                sourceEmail : Config.appEmail,
                body : email.body,
                subject : "Shares Transfer Notification On OneExchange"
            }

            let SoapClient1 = await soap.createClientAsync(Config.ADServiceURL) 
            let responseFromAD = await SoapClient1.GetInfo2Async({xusername : trade.sender})
            const ADRes = await SerializeXML(responseFromAD[0].GetInfo2Result)
            const adProfile =  SerializeAD(ADRes.root.record[0])
            
            // Do this in a seperate queue with data : destination email and emailParams, then if it fails, it reques it
            // Call EWService to send email
            EmailParams.destinationEmail = adProfile.mail
            let SoapClient2 = await soap.createClientAsync(Config.EWSERVICE) 
            let responseSendEmail = await SoapClient2.SendMailAsync(EmailParams)
            
            if (responseSendEmail[0].SendMailResult != "00") {
                return false 
            }
            return true
    } catch (error) {
        GetLoggerInstance().error(`SendSellerMail Queue Error : ${JSON.stringify(error)}`)
        return false
    }
} 


exports.SendUserMail = async function(user) {
    try {
        
    console.log("Got to send user email 3 > ", user)
            // Email Details
            const email = EmailDetails(`
                <div>
                    <h4><b>A share volume of '${user.amount}' has been allocated to you</b></h4>
                    <h4>For details of the allocation, please proceed to <a href='${user.platformTradeURL}'>The OneExchange Portal</a> </h4>
                </div>
            `)
            var EmailParams = {
                sourceEmail : Config.appEmail,
                body : email.body,
                subject : "New Shares Allocated"
            }

            let SoapClient1 = await soap.createClientAsync(Config.ADServiceURL) 
            let responseFromAD = await SoapClient1.GetInfo2Async({xusername : user.username})
            const ADRes = await SerializeXML(responseFromAD[0].GetInfo2Result)
            const adProfile =  SerializeAD(ADRes.root.record[0])
            
            // Do this in a seperate queue with data : destination email and emailParams, then if it fails, it reques it
            // Call EWService to send email
            EmailParams.destinationEmail = adProfile.mail
            let SoapClient2 = await soap.createClientAsync(Config.EWSERVICE) 
            let responseSendEmail = await SoapClient2.SendMailAsync(EmailParams)
            
            if (responseSendEmail[0].SendMailResult != "00") {
                return false 
            }
            return true
    } catch (error) {
        GetLoggerInstance().error(`SendUserMail Queue Error : ${JSON.stringify(error)}`)
        return false
    }
} 

exports.SendBuyerMail = async function(trade) {
    try {
            // Email Details
            const email = EmailDetails(`
                <div>
                    <h4><b>A share value of '${trade.volume}' has been transfered to your OneExchange Share Wallet, for a sell transaction on your trade.</b></h4>
                    <h4>For details of the trade, please proceed to <a href='${trade.platformTradeURL}'>The OneExchange Portal</a> </h4>
                </div>
            `)
            var EmailParams = {
                sourceEmail : Config.appEmail,
                body : email.body,
                subject : "Sell Notification On Your Trade"
            }

            let SoapClient1 = await soap.createClientAsync(Config.ADServiceURL) 
            let responseFromAD = await SoapClient1.GetInfo2Async({xusername : trade.buyer})
            const ADRes = await SerializeXML(responseFromAD[0].GetInfo2Result)
            const adProfile =  SerializeAD(ADRes.root.record[0])
            
            // Do this in a seperate queue with data : destination email and emailParams, then if it fails, it reques it
            // Call EWService to send email
            EmailParams.destinationEmail = adProfile.mail
            let SoapClient2 = await soap.createClientAsync(Config.EWSERVICE) 
            let responseSendEmail = await SoapClient2.SendMailAsync(EmailParams)
            
            if (responseSendEmail[0].SendMailResult != "00") {
                return false 
            }
            return true
    } catch (error) {
        GetLoggerInstance().error(`SendSellerMail Queue Error : ${JSON.stringify(error)}`)
        return false
    }
} 

exports.UpdateApproverMail = async function(oldSchedule, updatedSchedule) {
    try {
        // Get All Approvers
        let approvers = []
        let operationStatus 
        const result = await GetFromCache('ST_approvers');
        
        if (result != null && JSON.parse(result).length > 0) {
            approvers = JSON.parse(result);
        } else {
            approvers = await UserModel.find({userRole : UserModel.UserType.APPROVER}, {authToken: 0, password: 0 })
        }

        if (approvers.length > 0) {
            // Email Details
            const email = EmailDetails(`
                <div>
                    <h3><b>A Schedule Named "${oldSchedule}" has been updated. Please find the details OF the update below :</b></h3>
                    <h4><b>Schedule Name</b> : ${updatedSchedule.name},</h4>
                    <h4><b>Schedule Description</b> : ${updatedSchedule.description},</h4>
                    <h4><b>Schedule Amount</b> : ${updatedSchedule.volume},</h4>
                    <h5><a href='${Config.BASEURL+updatedSchedule.scheduleFile[schedule.scheduleFile.length - 1]}'>Download Schedule Allocation Details</a>,</h5>
                </div>
                <h4>To Approve Proceed To <a href='${updatedSchedule.platformURL}'>The OneExchange Portal</a> </h4>
            `)
            var EmailParams = {
                sourceEmail : Config.appEmail,
                body : email.body,
                subject : "Your Approval Is Needed! A Schedule Has Been Updated"
            }

            approvers.forEach(async (approver) => {
                let SoapClient1 = await soap.createClientAsync(Config.ADServiceURL) 
                let responseFromAD = await SoapClient1.GetInfo2Async({xusername : approver.username})
                const ADRes = await SerializeXML(responseFromAD[0].GetInfo2Result)
                const adProfile =  SerializeAD(ADRes.root.record[0])
                
                // Do this in a seperate queue with data : destination email and emailParams, then if it fails, it requeues it
                // Call EWService to send email
                EmailParams.destinationEmail = adProfile.mail
                let SoapClient2 = await soap.createClientAsync(Config.EWSERVICE) 
                let responseSendEmail = await SoapClient2.SendMailAsync(EmailParams)
                if (responseSendEmail[0].SendMailResult != "00") {
                  operationStatus = false 
                }
                operationStatus = true 
            })
        }
        return operationStatus
    } catch (error) {
        GetLoggerInstance().error(`UpdateApproverMail Queue Error : ${JSON.stringify(error)}`)
        return false
    }
}

exports.CreateAllocationEntries = async function(schedule) {
    try {
        // Read Contents from Excel File
        var entries = await ReadExcel(path.resolve(__appbasedir,"./uploads","./"+schedule.scheduleFile[schedule.scheduleFile.length - 1]));
        entries.shift()
        console.log("entries > ", entries)

        // Update Schedule To Processing 
        const scheduleModel  = await ScheduleModel.findById(schedule._id)
        scheduleModel.status = ScheduleModel.Status.INPROGRESS
        await scheduleModel.save()

        // Loop Over Contents And Write Entries To File
        entries.forEach(async (entry) => {
            const allocation = new AllocationModel()
            allocation.scheduleId = schedule._id
            allocation.username = entry[1]
            allocation.amount = entry[2]
            await allocation.save()
        })

        return true

    } catch (error) {
        GetLoggerInstance().error(`CreateAllocationEntries Queue Error : ${JSON.stringify(error)}`)
        return false
    }
}

exports.PopulateUserName = async function(username) {
    try {

        console.log("got here also > ", username)
        // Get User
        const user  = await UserModel.findOne({username})

        // CAll AD To Get Full User Profile 
        let SoapClient = await soap.createClientAsync(Config.ADServiceURL) 
        let responseFromAD = await SoapClient.GetInfo2Async({xusername : username})
        const adProfile = await SerializeXML(responseFromAD[0].GetInfo2Result)
        let profile = SerializeAD(adProfile.root.record[0])

        user.name = profile.name
        user.email = profile.mail
        user.mobile = profile.mobile
        user.title = profile.title
        user.staffId = profile.employeeid
        await user.save()
        
        return true

    } catch (error) {
        GetLoggerInstance().error(`PopulateUserName Queue Error : ${JSON.stringify(error)}`)
        return false
    }
}