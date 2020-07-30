
const generator = require("generate-password");
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, json, prettyPrint, colorize } = format;
const jwt = require("jsonwebtoken");
const serializer = require("xml2js");
const { Config } = require("./config");
const crypto = require("crypto");
const { promisify } = require('util')

exports.HttpStatus = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  PRECONDITION_FAILED: 412,
  SERVER_ERROR: 500,
  NO_AMPQ_URL_ERROR: "Please specify an AMQP connection string.",
  INIT_EVENTBUS_ERROR: "Please initialize the Event Bus by calling `.init()` before attempting to use the Event Bus.",
  INIT_SOCKET_ERROR: "Please initialize the Socket by calling `.init()` before attempting to use the socket connection.",
}

exports.Errors = {
  SUCCESS : "ST200",
  SERVERERROR : "ST500",
  NOTFOUNDERROR :  "ST404",
  VALIDATIONERR : "ST666",
  USERAUTHFAILED : "AUTH400",
  ENCRYPTIONERROR : "AUTHENC500",
  DECRYPTIONERROR : "AUTHDEC500",
  ADAUTHSERVICEERROR : "ADAUTH500",
  ADDETAILSSERVICEERROR : "ADDETAILS500",
  GETACCTFULLINFOERROR : "ACCTINFO500",
  IBSSERVICEERROR : "IBS500",
  OTPSERVICEERROR : "OTP500",
  EMAILSERVICEERROR : "MAIL500",
  JWTCREATEERROR : "JSONW500",
  MONGOVALIDERROR  : "DBVAL400",
  DUPLICATEUSERERROR  : "DUP11000",
  AUTHORIZATIONERR  : "AUTH401",
  ACCESSDENIED  : "ACCESS401",
  USERNOTEXIST  : "USR404",
  WALLETNOTEXIST  : "WALLET404",
  AUTHTOKENEXPIRY : "AUTHEXP401",
  DUPLICATEWALLETERR : "DUPWALLET1100",
  INVALIDWALLETACCTERR : "INVALACCT400",
  WEBLIBRARYERROR : "WEB3500",
  CACHEERROR : "CACHE500",
  INSUFICIENTFUND : "LIMITFUNDS412",
  TRANSACTIONLIMIT: "ABOVETRXAMOUNT412",
  ACCOUNTNOTEXIST : "ACCT404",
  INVALIDPIN : "PAYPIN400",
  RANDOMERROR : "ST900",
  FIXEDALLOCRULEERROR : "FIXALLOC400",
  FIXALLOCRULENOEXISTERR : "FIXALLOC404",
  ALLOCRULENOEXISTERR : "PERCENTALLOC404",
  PERCENTALALLOCRULEERROR : "PERCENTALLOC400",
  INVALIDFILEFORMAT : "FILE400",
  INVALIDFILEHEADER : "FILEHEAD400",
  INVALIDFILEHEADERARR : "FILEHEADARR400",
  SCHAPPROVEDERR : "SCHAPPROVE400",
  SCHREJECTEDERR : "SCHREJECT400",
  SCHPROCESSERR : "SCHPROCES400",
  SCHTERMINATEDERR : "SCHTERMINATE400",
  APPROVERNOTEXIST: "APPROVER404",
  SCHEDULENOTEXIST: "SCH404",
  EMPTYFILE: "FILE204",
  TRADECLOSEERR: "CLOSETRADE412",
  TRADEOPENERR: "OPENTRADE412",
  TRADEOPENERR: "CANCELTRADE412",
  TRADENOEXIST: "TRADE404",
  BUYINSUFFICIENTERR: "BUY412",
  SELLINSUFFICIENTERR: "SELL412",
  SELLOVERERR: "SELL400",
  BLACKLISTERR: "BLKLIST400",
  OPENWINDOWERR:"WINDOW403",
  CLOSEWINDOWERR: "WINDOW400",
  WINDOWREQUIREDERR:"WINDOW412",
  WINDOWNOTEXIST:"WINDOW404",
  NOTACTIVEERR : "ACTIVE412",
  TRANSFERLOOP: "LOOP403",
  TRADELOOP: "TRADE403",
  INVALIDSCHEDULE: "INVALIDSCH400",
  TRADECANCELERR: "CANCELTRADE400",
  OLDPINMISMATCH: "OLDPIN400",
  INVALIDOTPERR: "OTP400",
  ZEROTRADE: "TRADE412"
}

exports.GetCodeMsg = (errCode) => {

    switch (errCode) {
      case "ST200":
        return "Request Proccessed Successfully"
      case "ST666":
        return "Validation Failed For Some Fields"
      case "ST500":
        return "Request Could Not Be Processed"
      case "AUTH400":
        return "Authentication Failed For User. Check username or password "
      case "AUTHENC500":
        return "An Error Occured During User Record Encryption"
      case "AUTHDEC500":
        return "An Error Occured During User Record Decryption"
      case "ADAUTH500":
        return "An Error Occured Authenticating User With AD"
      case "ADDETAILS500":
        return "An Error Occured Fetching User AD Details"
      case "ACCTINFO500":
        return "An Error Occured Calling EACBS GEtAccountFullInfo"
      case "IBS500":
        return "An Error Occured Calling IBS Service"
      case "OTP500":
        return "An Error Occured Calling OTP Service"
      case "MAIL500":
        return "An Error Occured Calling Email Service"
      case "ST404":
        return "Resource Could Not Be Found"
      case "JSONW500":
        return "An Error Occured During Auth Token Generation"
      case "DBVAL400":
        return "An Error Occured Validating DB Fields"
      case "DUP11000":
        return "User Has Already Been Profiled"
      case "AUTH401":
        return "User Authorization Failed"
      case "ACCESS401":
        return "Access not granted for this resource"
      case "USR404":
        return "Given User Does Not Exist On This Platform"
      case "AUTHEXP401":
        return "Authentication Token Has Expired"
      case "WALLET404":
        return "User Wallet Does Not Exist For The Provided Id"
      case "DUPWALLET1100":
        return "Account Number Has Already Been Added"
      case "INVALACCT400":
        return "Invalid Account, Name Enquiry Failed For Account"
      case "WEB3500":
        return "An error occured during request processing"
      case "CACHE500":
        return "An Error Occured While Writing/Retrieving From Cache"
      case "LIMITFUNDS412":
        return "Insufficient balance!"
      case "ACCT404":
        return "Given account is not in the list of user active accounts"
      case "PAYPIN400":
        return "Invalid Transaction Pin"
      case "FIXALLOC400":
        return "Given Allocation Rule Does Not Sum Up To The Schedule Amount"
      case "PERCENTALLOC400":
        return "Given Allocation Rule Does Not Sum Up To 100%"
      case "FIXALLOC404":
        return "Allocation Rule Is Required For Schedule Allocation Type 'Fixed'"
      case "PERCENTALLOC404":
        return "No existing schedule allocation rule found for schedule type 'Percental'"
      case "FILE400":
        return "File must be an excel format"
        case "FILE204":
          return "Given file has no content"
      case "FILEHEAD400":
        return "File content must contain fields 'USERNAME' and 'VOLUME' as headings"
      case "FILEHEADARR400":
        return "File heading should have 'USERNAME' in cell B1 and 'VOLUME' in cell C1"
      case "SCHAPPROVE400":
        return "Given schedule has already been approved"
      case "SCHREJECT400":
        return "Given schedule has been rejected"
      case "SCHPROCES400":
        return "Given schedule is already being processed"
      case "SCHTERMINATE400":
        return "Given schedule has been terminated"
      case "APPROVER404":
        return "Given user is not an approver" 
      case "WINDOWNOTEXIST":
        return "Given trading window does not exist" 
      case "SCH404":
        return "No record found for given schedule"
      case "CLOSETRADE412":
        return "Operation not allowed on closed trade"
      case "CANCELTRADE412":
        return "Operation not allowed on canceled trade"
      case "OPENTRADE412":
        return "Trade is still open"
      case "TRADE404":
        return "Given trade does not exist"
      case "BUY412":
        return "Seller deos not have sufficient volume to Sell"
      case "SELL412":
        return "Buyer does not have sufficient amount to pay"
      case "SELL400":
        return "Sell amount is way morethan the requet to buy"
      case "BLKLIST400":
        return "User cannot be deactivated, as there are outstanding trades mapped to user"
      case "WINDOW403":
        return "A Trading Window Is Currently Opened"
      case "WINDOW400":
        return "Given Trading Window Is Already closed"
      case "WINDOW412":
        return "Operation not allowed. There is no active trading window"
      case "CANCELTRADE400":
        return "Operation not allowed. Given trade has been canceled"
      case "ACTIVE412":
        return "Given user does not have an active profile on this platform"
      case "LOOP403":
        return "Transfer to self is not allowed"
      case "TRADE403":
        return "Cannot Trade With Self"
      case "TRADE412":
        return "Zero Trade Not Allowed"
      case "OLDPIN400":
        return "The old transaction pin given deos not match"
      case "OTP400":
        return "Invalid OTP"
      case "INVALIDSCH400":
        return "Given Schedule Is Invalid"
      default :
        return "Request Is Being Processed"
    }
  
}


/**
 * Create Jwt token
 */
exports.CreateToken = (username, id, type) => {
  try {
    const jwtToken = jwt.sign({ username, id, type }, Config.jwtKey, { expiresIn: "12h" });
    return jwtToken
  } catch (error) {
    err = {
      errCode :  this.Errors.JWTCREATEERROR,
      statusCode : this.Errors.SERVER_ERROR,
      error
    }
    throw err;
  }
};

exports.GeneratePassword = () => {
  var password = generator.generate({
    length: 16,
    numbers: true
  });
 return password
}

exports.GetLoggerInstance = () => {
  const appLogger = createLogger({
      format: combine(
        timestamp(),
        prettyPrint(),
        json(),
        colorize()
      ),
      transports: [
        new transports.File({
          filename: "logs/app_info.log",
          level: "info"
        }),
        new transports.File({
          filename: "logs/app_errors.log",
          level: "error"
        })
      ],
      exceptionHandlers: [
        new transports.File({ filename: "logs/exceptions.log" })
      ]
  });
  return appLogger
}

exports.DeSensitize = (sensitiveObj) => {
  let desensitive = JSON.stringify(sensitiveObj)
  desensitive = JSON.parse(desensitive)
  delete desensitive.password;
  delete desensitive.authToken;

  return desensitive;
}

exports.SerializeAD = (sensitiveObj) => {
  const desensitized = {
    department : (sensitiveObj.department != undefined )? sensitiveObj.department[0] : "",
    jobDesc : (sensitiveObj.title != undefined )? sensitiveObj.title[0] : 0,
    mail : (sensitiveObj.mail != undefined )? sensitiveObj.mail[0] : "",
    employeeid : (sensitiveObj.employeeid != undefined )? sensitiveObj.employeeid[0] : "",
    mobile : (sensitiveObj.mobile != undefined )? sensitiveObj.mobile[0] : "",
    title : (sensitiveObj.personaltitle != undefined )? sensitiveObj.personaltitle[0] : "",
    grade : (sensitiveObj.extensionattribute1 != undefined )? sensitiveObj.extensionattribute1[0] : "",
    name : (sensitiveObj.name != undefined )? sensitiveObj.name[0] : "",
    surname : (sensitiveObj.sn != undefined )? sensitiveObj.sn[0] : "",
    firstname : (sensitiveObj.givenname != undefined )? sensitiveObj.givenname[0] : ""
  }

  return desensitized;
}

exports.DeSensitizeUser = (sensitiveObj) => {
  let desensitive = JSON.stringify(sensitiveObj)
  desensitive = JSON.parse(desensitive)
  delete desensitive.password;
  delete desensitive.transactionPin;

  return desensitive;
}

exports.DeSensitizeUserPlus = (sensitiveObj) => {
  let desensitive = JSON.stringify(sensitiveObj)
  desensitive = JSON.parse(desensitive)
  delete desensitive.password;
  delete desensitive.authToken;
  delete desensitive.createdAt;
  delete desensitive.updatedAt;

  return desensitive;
}

exports.TrimObject = (input) => {
  let trimmedObj = JSON.stringify(input)
  trimmedObj = JSON.parse(trimmedObj)
  delete trimmedObj.createdAt;
  delete trimmedObj.updatedAt;

  return trimmedObj;
}

exports.Random = async (stringLen) => {

  let rand = await crypto.randomBytes(stringLen)
  randString = rand.toString("hex")

  return randString

}

exports.GetXML = async (jsonParam) => {
  try {

    const builder = new serializer.Builder();
    const xml = builder.buildObject(jsonParam)

    return xml 
  } catch (error) {
      throw(error)
  }

}

exports.SerializeXML = async (xml) => {
  try {
      const parseStringAsync = promisify(serializer.parseString)
      var serialized = await parseStringAsync(xml);

      return serialized 
  } catch (error) {
      throw(error)
  }
}