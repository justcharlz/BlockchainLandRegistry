/**
 * Set the price unit price of shares
 */
const {Schema, model } = require('mongoose')

const SharePriceSchema = new Schema({
    username: { type: Schema.Types.String, ref: 'Users', required: true },
    price: { type: Schema.Types.Number}
},
{ timestamps: true }, { toObject: { virtuals: true }, toJSON: { virtuals: true } }
)

const SharePrice = model('SharePrice', SharePriceSchema)

exports.SharePriceModel = SharePrice