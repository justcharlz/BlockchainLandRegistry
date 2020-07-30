const express = require('express');
const router = express()
const Controller = require('../controllers')
const AuthController = require('../controllers/auth')
const DashboardController = require('../controllers/dashboard')
const WalletController = require('../controllers/nairaWallet')
const UserController = require('../controllers/user')
const AdminController = require('../controllers/admin')
const ApproverController = require('../controllers/approver')
const SettingController = require('../controllers/settings')
const SharesController = require('../controllers/shares')
const MarketController = require('../controllers/market')
const TransactionController = require('../controllers/transaction')
const ScheduleController = require('../controllers/schedule')

const { ValidateCreateSchedule, ValidateUserLogin, ValidateAddAccount, ValidateWalletCashout, ValidateUserFirstTimeLogin, SanitizeUserLogin, SanitizeFundWallet, IsAuthenticated, IsAdmin, IsSuperAdmin, IsActivated, ValidateUserLogout, SanitizeUserLogout, ValidateWallet, SanitizeWallet, SanitizeTransactionPin, ValidateTransactionPin, SanitizeCreateSchedule, ValidateFundWalletByCard, ValidateFundWalletByAccount, ValidateUpdateSchedule, IsApprover, IsWindowOpen } = require('../middlewares')
const { ApiResponse, HttpStatus } = require('../utils');
var multer  = require('multer')

var storage = multer.diskStorage({
    destination: "uploads/schedules",
    preservePath : true,
    filename: function (req, file, cb) {
      let filename = file.originalname.split(".")
      let fileExt = filename.pop()
      let currentDate = new Date()
      cb(null, `schedule-${currentDate.getFullYear()}${("0" + (currentDate.getMonth() + 1)).slice(-2)}${currentDate.getDate()}.${fileExt}`)
    },
    onError : function(error, next) {
      let response = new ApiResponse()
      next(response.PlainError(error.code, HttpStatus.BAD_REQUEST, error.message+(error.field)?error.field : ""))
      return
    }, 
    errorHandling: 'manual'
})
var upload = multer({ storage: storage })

/**Generic Routes*/
router.get('/ping', Controller.Ping);
/**
 * Auth Routes
 */
router.post('/user/register', ValidateUserFirstTimeLogin, SanitizeUserLogin(), AuthController.FirstTimeLogin);
router.post('/user/login', ValidateUserLogin, SanitizeUserLogin(), AuthController.Login);
router.post('/admin/login', ValidateUserLogin, SanitizeUserLogin(), AuthController.SuperLogin);
router.get('/user/logout/:userId', ValidateUserLogout, SanitizeUserLogout(), AuthController.Logout);
/**
 * Dashboard routes
 */
router.get('/user/dashboard', IsAuthenticated, DashboardController.UserDashboard);
router.get('/admin/dashboard', IsAuthenticated, IsAdmin, DashboardController.AdminDashboard);
router.get("/user/getSharePrice", IsAuthenticated, SettingController.GetSharePrice)


/*** User routes */
/**
 * Market Routes
 */
router.get("/market/checktradingwindow", IsAuthenticated, Controller.CheckTradingStatus);
router.get("/market", IsAuthenticated, MarketController.GetAllTrade);
router.get("/market/user", IsAuthenticated, MarketController.GetAllUserTrade);
router.get("/market/openTrades", IsAuthenticated, MarketController.GetAllOpenTrades);
router.post("/market/mopOpenTrades",IsAuthenticated, IsAdmin, MarketController.MopAllOpenTrades);
router.get("/market/closedTrades", IsAuthenticated, MarketController.GetAllClosedTrades);
router.get("/market/user/openTrades", IsAuthenticated, MarketController.GetUserOpenTrades);
router.get("/market/user/closedTrades", IsAuthenticated, MarketController.GetUserClosedTrades);
router.get("/market/transactions", IsAuthenticated, IsAdmin, MarketController.GetAllTradingTransactions);
router.get("/market/user/transactions", IsAuthenticated, MarketController.GetUserTradingTransactions);
router.post("/market/buyOrder", IsAuthenticated, IsWindowOpen, IsActivated, MarketController.BuyOffer);
router.post("/market/sellOrder", IsAuthenticated, IsWindowOpen, IsActivated, MarketController.SellOffer);
router.post("/market/updateTrade/:tradeId?", IsAuthenticated, IsWindowOpen, IsActivated, MarketController.UpdateOffer);
router.get("/market/cancelTrade/:tradeId?", IsAuthenticated, IsWindowOpen, IsActivated, MarketController.CancelOffer);
router.post("/market/buyShares/:tradeId?", IsAuthenticated, IsWindowOpen, IsActivated, MarketController.Buy);
router.post("/market/sellShares/:tradeId?", IsAuthenticated, IsWindowOpen, IsActivated, MarketController.Sell);

/** 
 * Naira Wallet Routes
 */
router.get("/user/wallet/naira", IsAuthenticated, WalletController.GetWallet);
router.get("/user/wallet/naira/transactions", IsAuthenticated, WalletController.GetWalletTransactions);
router.post("/user/wallet/naira/verifyAccount", IsAuthenticated, ValidateWallet, SanitizeWallet(), WalletController.VerifyAccount);
router.post("/user/wallet/naira/addAccount", IsAuthenticated, ValidateAddAccount, SanitizeWallet(), WalletController.AddAccount);
router.post("/user/wallet/naira/removeAccount", IsAuthenticated, ValidateWallet, SanitizeWallet(), WalletController.RemoveAccount);
router.post("/user/wallet/naira/fundByAccount", IsAuthenticated, ValidateFundWalletByAccount, SanitizeFundWallet(), WalletController.FundFromAccount);
router.post("/user/wallet/naira/fundByCard", IsAuthenticated, ValidateFundWalletByCard, SanitizeFundWallet(), WalletController.FundFromCard);
router.post("/user/wallet/naira/cashout", IsAuthenticated, ValidateWalletCashout, SanitizeFundWallet(), WalletController.Cashout);
router.post("/user/wallet/changeTransactionPin", IsAuthenticated, ValidateTransactionPin, SanitizeTransactionPin(), WalletController.AddAccount);
/** 
 * Shares Wallet Routes
 */
router.get("/user/wallet/shares", IsAuthenticated, SharesController.GetShares);
router.get("/user/wallet/shares/transactions", IsAuthenticated, SharesController.GetShareTransactions);
router.post("/user/wallet/shares/transfer", IsAuthenticated, IsActivated, SharesController.TransferShares);



/*** Admin Routes */
/**
 * User Management
 */
router.get("/users", IsAuthenticated, IsAdmin, UserController.AllUsers);
router.get("/users/single/:userId?", IsAuthenticated, IsAdmin, UserController.SingleUser);
router.get("/users/activate/:userId?", IsAuthenticated, IsAdmin, UserController.WhitelistUser);
router.get("/users/deactivate/:userId?", IsAuthenticated, IsAdmin, UserController.BlacklistUser);



/*** SuperAdmin Routes */
/**
 * Admin MAnagement
 */
router.get("/admins", IsAuthenticated, IsSuperAdmin, AdminController.AllAdmins);
router.get("/admins/add/:username?", IsAuthenticated, IsSuperAdmin, AdminController.AddAdmin);
router.get("/admins/remove/:username?", IsAuthenticated, IsSuperAdmin, AdminController.RemoveAdmin);
/**
 * Approval MAnagement
 */
router.get("/approvers", IsAuthenticated, IsSuperAdmin, ApproverController.AllApprovers);
router.get("/approvers/add/:username?", IsAuthenticated, IsSuperAdmin, ApproverController.AddApprover);
router.get("/approvers/remove/:username?", IsAuthenticated, IsSuperAdmin, ApproverController.RemoveApprover);

/**
 * Platform Settings
 */
router.get("/admin/getApprovalRequirements", IsAuthenticated, IsAdmin, SettingController.GetApprovalRequirements);
router.post("/admin/setApprovalRequirements", IsAuthenticated, IsSuperAdmin, SettingController.SetApprovalRequirements);
router.get("/admin/opentradingwindow", IsAuthenticated, IsAdmin, SettingController.OpenTradingWindow);
router.get("/admin/tradingWindows", IsAuthenticated, IsAdmin, SettingController.GetAllTradingWindows);
router.get("/admin/closetradingwindow", IsAuthenticated, IsSuperAdmin, SettingController.CloseTradingWindow);
router.get("/admin/getSharePrice", IsAuthenticated, IsAdmin, SettingController.GetSharePrice)
router.post("/admin/setSharePrice", IsAuthenticated, IsSuperAdmin, SettingController.SetSharePrice)

/**
 * Schedule Management
*/
router.get("/admin/schedules/allocation/:scheduleId?/:filter?", IsAuthenticated, IsAdmin, ScheduleController.ScheduleAllocations);
router.get("/admin/schedules/single/:scheduleId?", IsAuthenticated, IsAdmin, ScheduleController.SingleSchedule);
router.get("/admin/schedules/:filter?", IsAuthenticated, IsAdmin, ScheduleController.AllSchedules);
router.post("/admin/schedule/create", IsAuthenticated, IsAdmin, IsWindowOpen, upload.single('scheduleFile'), ValidateCreateSchedule, SanitizeCreateSchedule(), ScheduleController.CreateSchedule);
router.post("/admin/schedule/update/:scheduleId?", IsAuthenticated, IsAdmin, IsWindowOpen, upload.single('scheduleFile'),ValidateUpdateSchedule, SanitizeCreateSchedule(), ScheduleController.UpdateSchedule);
router.post("/admin/schedule/mintonschedule", IsAuthenticated, IsAdmin, IsWindowOpen, upload.single('scheduleFile'), ScheduleController.MintOnSchedule);
router.get("/approver/schedules", IsAuthenticated, IsApprover, IsWindowOpen, ScheduleController.AllPendingApprovalSchedules);
router.post("/approver/schedule/approve/:scheduleId?", IsAuthenticated, IsApprover, IsWindowOpen, ScheduleController.ApproveSchedule);
router.post("/approver/schedule/reject/:scheduleId?", IsAuthenticated, IsApprover, IsWindowOpen, ScheduleController.RejectSchedule);
router.get("/approver/schedule/undoApproval/:scheduleId", IsAuthenticated, IsApprover, IsWindowOpen, ScheduleController.UndoApproveSchedule);


/**
 * Platform Distributions
 */
router.get("/users", IsAuthenticated, IsAdmin, UserController.AllUsers);
router.get("/users/single/:userId?", IsAuthenticated, IsAdmin, UserController.SingleUser);
router.get("/users/activate/:userId?", IsAuthenticated, IsAdmin, UserController.WhitelistUser);
router.get("/users/deactivate/:userId?", IsAuthenticated, IsAdmin, UserController.BlacklistUser);

/**
 * Platform Transactions
 */
router.get("/transactions", IsAuthenticated, IsAdmin, TransactionController.AllTransactions);

/**
 * Platform Audit Trail
 */
router.get("/users", IsAuthenticated, IsAdmin, UserController.AllUsers);
router.get("/users/single/:userId?", IsAuthenticated, IsAdmin, UserController.SingleUser);
router.get("/users/activate/:userId?", IsAuthenticated, IsAdmin, UserController.WhitelistUser);
router.get("/users/deactivate/:userId?", IsAuthenticated, IsAdmin, UserController.BlacklistUser);

module.exports = router;
