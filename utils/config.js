require('dotenv').config();

exports.Config = {
  jwtKey: process.env.JWT_SECRET,
  appKey : process.env.ENCRYPTION_KEY,
  appIVLength : parseInt(process.env.ENCRYPTION_IV_LENGTH),
  mongo: process.env.DATABASE_URL,
  BASEURL: process.env.BASE_URL,
  HOST : `${process.env.BASE_URL}/api/v1`,
  PLATFORMURL : `${process.env.PLATFORM_URL}`,
  PLATFORMTRADEURL : `${process.env.PLATFORMTRADE_URL}`,
  REDIS:process.env.REDIS_URL,
  amqp_url: process.env.AMQP_URL,
  port: process.env.PORT,
  appNairaAccount: process.env.APP_ESCROW_ACCOUNT,
  db : process.env.DATABASE_NAME,
  ADServiceURL : process.env.AD_SERVICE_URL,
  EACBS : process.env.EACBS_URL,
  EWSERVICE : process.env.EWSERVICE_URL,
  SPAY : process.env.SPAY_URL,
  SPAYSOAP : process.env.SPAY_SOAP,
  SPAYAPPID : process.env.SPAY_APP_ID,
  IBSKeY : process.env.IBSKeY,
  IBSIV  : process.env.IBSIV,
  IBS : process.env.IBS_URL,
  APPID : process.env.IBS_APP_ID,
  SuperAdmin : process.env.SUPERADMIN,
  SuperAdmin_Pass : process.env.SUPERADMIN_PASS,
  appEmail : process.env.appEmailAccount,
  OTP: process.env.OTPSERVICE_URL
}
 