/* eslint-disable object-curly-newline */
/** THIS CAPTURED THE USERS AND PROFILES INFORMATION
 * FailedMax : Max number of failed login attempt
 * Failed : Number of failed login attempt
 * mnemonics : This is the user's account recorvery seed phrase, encrypted and backedup for  them.
 */
const { Schema, model } = require('mongoose')

const Settings = new Schema(
  {
    isOpen : { type: Boolean, default: true }
  },
  { timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } }
)

const AdminSettings = model('Settings', Settings)

exports.AdminSettingsModel = AdminSettings
