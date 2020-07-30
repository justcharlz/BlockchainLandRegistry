const cron = require('node-cron')
const { AllocationModel, UserModel, ScheduleModel, TradeModel, WalletModel, TransactionModel } = require('../models');
const { SterlingTokenContract } = require('../services');
const { HttpStatus, GetCodeMsg, Errors, GetLoggerInstance, Config, RabbitMQService, Decrypt } = require('../utils');

exports.AllocationJob = () => {
    cron.schedule("15 * * * * *", async function() {
        console.log("Running Allocation Job")
        try {
            // Get all allocation entries with status false
            const allocations = await AllocationModel.find({status : {$nin : [AllocationModel.Status.COMPLETED, AllocationModel.Status.Terminated, AllocationModel.Status.FAILED]}})
            if (allocations.length > 0) {
                allocations.forEach( async entry => {
                    // Get Allocation
                    let allocation = await AllocationModel.findById(entry._id)

                    // Get User
                    const user = await UserModel.findOne({username : entry.username})
                    if (!user) {
                        allocation.comment = "Minting Paused, No Record Found For This User"
                        allocation.status = AllocationModel.Status.INPROGRESS
                        await allocation.save()
                        return
                    }

                    allocation.comment = "Allocation Started"
                    allocation.status = AllocationModel.Status.INPROGRESS
                    allocation.name = user.name
                    await allocation.save()

                    // Get schedule 
                    const schedule = await ScheduleModel.findById(entry.scheduleId)
                    if (schedule.status == ScheduleModel.Status.COMPLETED) {
                        allocation.comment = "Minting Failed, Schedule Status Is Completed"
                        allocation.status = AllocationModel.Status.FAILED
                        await allocation.save()
                        return
                    }
                    
                     
                    let scheduleChainInfo = await SterlingTokenContract.getschedule(schedule.scheduleId, Config.SuperAdmin, "")
                    if (parseInt(scheduleChainInfo.amount) < parseInt(entry.amount)) {
                        allocation.comment = "Minting Failed, Schedule has insuffient amount ("+scheduleChainInfo.amount+") to mint"
                        allocation.status = AllocationModel.Status.FAILED
                        await allocation.save()
                        return
                    }

                    // Call blockchain to mint token
                    GetLoggerInstance().info(`Cron Job Request to web3 generateToken : ${schedule.scheduleId, user.address, entry.amount, Config.SuperAdmin, ""}`)
                    let chainResponse = await SterlingTokenContract.generateToken(schedule.scheduleId, user.address, entry.amount, Config.SuperAdmin, "")
                    GetLoggerInstance().info(`web3 generateToken response to cron job : ${JSON.stringify(chainResponse)}`)

                    if (!chainResponse) {
                        allocation.comment = "Minting Failed, Could Not Mint To User"
                        allocation.status = AllocationModel.Status.FAILED
                        await allocation.save()
                        return
                    }

                    allocation.status = AllocationModel.Status.COMPLETED
                    allocation.comment = "Minting Completed"
                    await allocation.save()

                    const emailParams = {
                        amount : entry.amount,
                        username : entry.username
                    }

                    // Send Email To User 
                    RabbitMQService.queue('SEND_USERS_MAIL_ON_SCHEDULE_ALLOCATION', { user : emailParams })
                    
                    scheduleChainInfo = await SterlingTokenContract.getschedule(schedule.scheduleId, Config.SuperAdmin, "")
                    if (parseInt(scheduleChainInfo.amount) == 0) {
                        schedule.status = ScheduleModel.Status.COMPLETED
                        await schedule.save()
                    }

                });
            }
        } catch (error) {
            console.log("error >> ", error)
            GetLoggerInstance().error(`Cron Job Error : ${JSON.stringify(error)}`)
        }

        //Close trade automatically
    //     try {
    //         const openSellTrade = await TradeModel.findOne({$and:[{isOpen : true}, {type : 'Sell' }]}).sort('createdAt').exec()
    //         //console.log('Errors>>',Errors)

    //         //validate a buy trade exits and close trade
    //         if(openSellTrade){

    //             autotrade = async (openSellTrade)=>{
    //                 const openBuyTrade = await TradeModel.findOne({$and:[{isOpen : true}, {type : 'Buy' },{price : {$lte : openSellTrade.price}}]}).sort('createdAt').where({userId : {$ne : openSellTrade.userId } }).exec()

    //             // Ensures Seller Has Enough Shares To Sell
    //             let sellerBalance = await SterlingTokenContract.balanceOf(sellerInfo.address)
               
    //             if(openBuyTrade && parseInt(sellerBalance) > quantity){

                 

    //                 // Ensures Buyer Has Sufficiently Enough To Pay
    //                 quantity = openBuyTrade.volume
    //                 const buyerInfo = await UserModel.findById(openBuyTrade.userId)
    //                 const buyerWallet = await WalletModel.findById(buyerInfo.walletId)
                  
    //                 // Ensures Seller has sufficient shares token to sell
    //                 const sellerInfo = await UserModel.findById(openSellTrade.userId)
                  
    //                 const amountToPay = quantity * parseInt(openBuyTrade.price)

    //                 // debit seller share wallet and credit buyer share wallet
    //                 let chainPass = await Decrypt(sellerInfo.password)
    //                 GetLoggerInstance().info(`Request to web3 transfer : ${buyerInfo.address, quantity, sellerInfo.address, chainPass}`)
    //                 let chainResponse = await SterlingTokenContract.transfer(buyerInfo.address, quantity, sellerInfo.address, chainPass)
    //                 GetLoggerInstance().info(`Response from web3 transfer : ${JSON.stringify(chainResponse)}`)

    // transactionSell = async (sellerInfo, buyerInfo,amountToPay, quantity, openBuyTrade, tradetype)=>{
    //                 // Write Transaction
    //                 let transaction = new TransactionModel() 
    //                 transaction.txHash = chainResponse.txHash
    //                 transaction.amount = amountToPay
    //                 transaction.volume = quantity
    //                 transaction.type = TransactionModel.Type.TRADE
    //                 transaction.status = TransactionModel.Status.COMPLETED
    //                 transaction.wallet = TransactionModel.Wallet.SHARES
                   

    //             if (tradetype == 'Sell') {
    //                 transaction.userId = sellerInfo._id
    //                 transaction.from = sellerInfo.username
    //                 transaction.to = buyerInfo.username
    //                 transaction.remark = "Shares Sold"
    //                 transaction.tradeType = TransactionModel.TradeType.SELL
    //                     let emailFields = {
    //                         volume : amountToPay,
    //                         buyer : buyerInfo.username,
    //                         platformTradeURL : Config.PLATFORMTRADEURL+"/"+openBuyTrade.offerId
    //                     } 
    //                     RabbitMQService.queue('SEND_EMAIL_TO_BUYER', { trade :  emailFields})
    //                 }

    //             if (tradetype == 'Buy') {
    //                 transaction.userId = buyerInfo._id
    //                 transaction.from = sellerInfo.username
    //                 transaction.to = buyerInfo.username
    //                 transaction.remark = "Shares Bought"
    //                 transaction.tradeType = TransactionModel.TradeType.BUY
    //                     let emailFields = {
    //                         amount : amountToPay,
    //                         seller : sellerInfo.username,
    //                         platformTradeURL : Config.PLATFORMTRADEURL+"/"+openBuyTrade.offerId
    //                     }
    //                     RabbitMQService.queue('SEND_EMAIL_TO_SELLER', { trade :  emailFields})
    //                 }
    //                 await transaction.save()

    //                 GetLoggerInstance().info(`Outgoing Response To Sell Request : ${GetCodeMsg(Errors.SUCCESS)} `)
    //                 ;
    //                 }
                
                    
    //                 if (openBuyTrade.volume == openSellTrade.volume && openBuyTrade.volume > 0 ) {
    //                     openSellTrade.volume = 0
    //                     openSellTrade.isOpen = false
    //                     openBuyTrade.volume += openSellTrade.volume
    //                     openBuyTrade.isOpen = false
    //                     await Promise.all([openSellTrade.save(), openBuyTrade.save()])
    //                     // transactionSell(sellerInfo, buyerInfo,amountToPay, quantity, openBuyTrade, 'Sell')
    //                     // transactionSell(sellerInfo, buyerInfo,amountToPay, quantity, openBuyTrade, 'Buy')
    //                     }

    //                 if (openSellTrade.volume > openBuyTrade.volume) {
    //                     openSellTrade.volume -= openBuyTrade.volume
    //                     openBuyTrade.volume -= openBuyTrade.volume
    //                     openBuyTrade.isOpen = false
    //                     await Promise.all([openSellTrade.save(), openBuyTrade.save()])
    //                     //transactionSell(sellerInfo, buyerInfo,amountToPay, quantity, openBuyTrade, 'Sell')
    //                     }

    //                 if (openSellTrade.volume < openBuyTrade.volume) {
    //                     openSellTrade.volume -= openSellTrade.volume
    //                     openBuyTrade.volume = openBuyTrade.volume - openSellTrade.volume
    //                     await Promise.all([openSellTrade.save(), openBuyTrade.save()])
    //                     //transactionSell(sellerInfo, buyerInfo,amountToPay, quantity, openBuyTrade, 'Sell')
    //                     }

    //                 // debit buyer fiat wallet and credit seller fiat wallets
    //                 const sellerWallet = await WalletModel.findById(sellerInfo.walletId)
    //                 buyerWallet.balance = parseInt(buyerWallet.balance) - amountToPay
    //                 sellerWallet.balance = parseInt(sellerWallet.balance) + amountToPay
    //                 await Promise.all([sellerWallet.save(), buyerWallet.save()])
                    
    //             }
    //             }

    //             autotrade( openSellTrade)
    //         }

           
           
    //     } catch (error) {
    //         console.log("error >> ", error)
    //         GetLoggerInstance().error(`Cron Job Error : ${JSON.stringify(error)}`)
    //     }
    }).start();
}