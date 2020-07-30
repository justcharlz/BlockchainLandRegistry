const { sanitizeBody } = require('express-validator');

exports.SanitizeUserLogin = () => {
  return [
    sanitizeBody('username').escape(),
    sanitizeBody('password').escape()
  ]
}

exports.SanitizeUserLogout = () => {
  return [
    sanitizeBody('userId').escape()
  ]
}

exports.SanitizeWallet = () => {
  return [
    sanitizeBody('account').escape()
  ]
}

exports.SanitizeTransactionPin = () => {
  return [
    sanitizeBody('oldPin').toInt(),
    sanitizeBody('newPin').toInt()
  ]
}

exports.SanitizeFundWallet = () => {
  return [
    sanitizeBody('account').escape(),
    sanitizeBody('amount').escape(),
    sanitizeBody('remark').escape(),
    sanitizeBody('referenceId').escape(),
    sanitizeBody('cashoutPin').escape()
  ]
}

exports.SanitizeCreateSchedule = () => {
  return [
    sanitizeBody('name').escape(),
    sanitizeBody('scheduleAmount').toInt(),
    sanitizeBody('scheduleType').escape(),
    sanitizeBody('description').escape()
  ]
}