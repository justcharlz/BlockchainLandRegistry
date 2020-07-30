const { Schema, model } = require('mongoose')

const Wallet = new Schema({
  balance: { type: Schema.Types.Number, required: true, default: 0 },
  activeAccounts: [{ type: Schema.Types.String }]
}, { timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } })

exports.WalletModel = model('wallet', Wallet);
