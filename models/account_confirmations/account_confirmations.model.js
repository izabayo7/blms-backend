// import dependencies
const {
    mongoose
} = require('../../utils/imports')

const paginate = require('mongoose-paginate-v2')

/**
 * @swagger
 * definitions:
 *   Account_confirmation:
 *     properties:
 *       user:
 *         type: string
 *         description: user id
 *       token:
 *         type: string
 *       status:
 *         type: string
 *         enum: ['PENDING', 'CONFIRMED']
 *     required:
 *       - user
 *       - token
 */

const account_confirmation_schema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true
    },
    token: {
        type: String,
        required: true
    },
    email: {
      type: String,
    },
    hasEmail:{
      type: Boolean,
      default: false
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'CONFIRMED'],
        default: 'PENDING',

    },
}, { timestamps: true })

account_confirmation_schema.plugin(paginate)

exports.Account_confirmation = mongoose.model('account_confirmation', account_confirmation_schema)