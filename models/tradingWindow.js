/* eslint-disable object-curly-newline */
/** THIS CAPTURED THE USERS AND PROFILES INFORMATION
 * FailedMax : Max number of failed login attempt
 * Failed : Number of failed login attempt
 * mnemonics : This is the user's account recorvery seed phrase, encrypted and backedup for  them.
 */
const { Schema, model } = require('mongoose')

const TradingWindowSchema = new Schema(
  {
    isOpen : { type: Boolean, default: true },
    closingData : { type: String }
  },
  { timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } }
)

const TradingWindow = model('TradingWindow', TradingWindowSchema)

exports.TradingWindowModel = TradingWindow
