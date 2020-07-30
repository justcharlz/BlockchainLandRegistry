const { Schema, model } = require('mongoose')

const TradeTypes = Object.freeze({
  SELL: 'Sell',
  BUY: 'Buy'
})

const TradeSchema = new Schema(
  {
    userId: { type: Schema.ObjectId, ref: 'Users', required: true },
    windowId: { type: Schema.ObjectId, ref: 'TradingWindow', required: true, select: true },
    price: { type: Schema.Types.Number, default: 0 },
    isOpen: { type: Schema.Types.Boolean, default: true },
    isCancel: { type: Schema.Types.Boolean, default: false },
    initialVolume: { type: Schema.Types.Number, default: 0 },
    volume: { type: Schema.Types.Number, default: 0, select:true },
    type: { type: Schema.Types.String, enum: Object.values(TradeTypes), default: TradeTypes.SELL, required: true  }
  },
  { timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } }
)

TradeSchema.statics.Type = TradeTypes

const Trade = model('Trades', TradeSchema)

exports.TradeModel = Trade
