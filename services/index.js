const { ADLogin, ADDetails, GetAccountInfo, IbsTransfer, SendEmail, ADUserByStaffId, SendOTP, VerifyOTP } = require("./SOAP")
const SterlingTokenContract = require("./WEB3")
const { ADProfile } = require("./AD")

module.exports = {
    ADLogin, ADDetails, SterlingTokenContract, GetAccountInfo, IbsTransfer, ADProfile, SendEmail, ADUserByStaffId, SendOTP, VerifyOTP
}