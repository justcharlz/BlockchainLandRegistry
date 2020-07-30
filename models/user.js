/* eslint-disable object-curly-newline */
/** THIS CAPTURED THE USERS AND PROFILES INFORMATION
 * FailedMax : Max number of failed login attempt
 * Failed : Number of failed login attempt
 * mnemonics : This is the user's account recorvery seed phrase, encrypted and backedup for  them.
 */
const { Schema, model } = require('mongoose')

const UserType = Object.freeze({
  USER: 'User',
  ADMIN: 'Admin',
  APPROVER: 'Approver',
  SUPERADMIN: 'SuperAdmin'
})


const UserSchema = new Schema(
  {

    userRole: { type: Schema.Types.String, enum: Object.values(UserType), default: UserType.USER, required: true,  select: true  },
    username: { type: Schema.Types.String, unique: [true,"User has already been profiled"],  select: true },
    address: { type: Schema.Types.String ,  select: true},
    transactionPin: { type: Schema.Types.String ,  select: true },
    authToken: { type: Schema.Types.String,  select: true },
    status: { type: Schema.Types.Boolean, default: true,  select: true },
    password: { type: Schema.Types.String, select: true, required : [true, "User password is required"]  },
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', select: true  },
    name :  { type: Schema.Types.String, select: true  },
    email : { type: Schema.Types.String, select: true  },
    mobile :  { type: Schema.Types.String, select: true  },
    title : { type: Schema.Types.String, select: true  },
    staffId : { type: Schema.Types.String, select: true },
    __v: { type: Number, select: false },
    lastLogin: { type: Date,  select: true}
  },
  { timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } }
)

UserSchema.statics.UserType = UserType

const User = model('Users', UserSchema)

exports.UserModel = User
