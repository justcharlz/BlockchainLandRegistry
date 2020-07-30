/**
 * THIS CAPTURES ALL Authorizations INITIATED BY THE INITIATORS(ADMIN)
 */
const { Schema, model } = require('mongoose')

const TransactionStatus = Object.freeze({
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  TERMINATED: 'Terminated',
  INPROGRESS: 'In Progress'
})

const TransactionType = Object.freeze({
  TRADE: 'Trade',
  FUND: 'Fund',
  WITHDRAW: 'Withdraw',
  TRANSFER: 'Transfer'
})

const TradeTypes = Object.freeze({
  SELL: 'Sell',
  BUY: 'Buy',
  NON: 'Non Trading Transaction'
})

const WalletType = Object.freeze({
  NAIRA: 'Naira',
  SHARES: 'Shares',
})

const PaymentMode = Object.freeze({
  CARD: 'Card',
  ACCOUNT: 'Bank Account',
  NON: 'Non Payment Transaction'
})

const TransactionSchema = new Schema(
  {
    userId: { type: Schema.ObjectId, ref: 'Users', required: true },
    type: {
      type: Schema.Types.String,
      enum: Object.values(TransactionType),
      default: TransactionType.TRADE,
      required: true
    },
    from: { type: Schema.Types.String },
    to: { type: Schema.Types.String },
    wallet: {
      type: Schema.Types.String,
      enum: Object.values(WalletType),
      default: WalletType.NAIRA,
      required: true
    },
    tradeType: {
      type: Schema.Types.String,
      enum: Object.values(TradeTypes),
      default: TradeTypes.NON,
      required: true
    }, // Or token
    mode: {
      type: Schema.Types.String,
      enum: Object.values(PaymentMode),
      default: PaymentMode.NON
    }, 
    volume: { type: Schema.Types.Number },
    amount: { type: Schema.Types.Number },
    txHash: { type: Schema.Types.String },
    remark: { type: Schema.Types.String },
    status: {
      type: Schema.Types.String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      required: true
    },
  },
  { timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } }
)

TransactionSchema.statics.Status = TransactionStatus
TransactionSchema.statics.Type = TransactionType
TransactionSchema.statics.Wallet = WalletType 
TransactionSchema.statics.PaymentMode  = PaymentMode  
TransactionSchema.statics.TradeType  = TradeTypes  

const transaction = model('Transactions', TransactionSchema)
exports.TransactionModel = transaction
