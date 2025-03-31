// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

/**
 * @swagger
 * definitions:
 *   Account_payments:
 *     properties:
 *       method_used:
 *         type: string
 *         enum: ['MTN_MOMO', 'CARD']
 *       user:
 *         type: string
 *       college:
 *         type: string
 *       amount_paid:
 *         type: number
 *       periodType:
 *         type: string
 *         enum: ['MONTH','YEAR']
 *       periodValue:
 *         type: number
 *       disabled:
 *         type: string
 *       startingDate:
 *         type: string
 *         formate: date
 *       status:
 *         type: string
 *         enum: ['ACTIVE', 'INACTIVE']
 *     required:
 *       - name
 *       - email
 */

const methods = ['MTN_MOMO', 'CARD']
const statuses = ['ACTIVE', 'INACTIVE']
const periods = ['MONTH', 'YEAR']

// to trace college plan changes
// const college_payment_plan = new mongoose.Schema(
//     {
//         name: {
//             type: String,
//             required: true
//         },
//         status: {
//             type: String,
//             enum: statuses,
//             default: 'ACTIVE'
//         },
//     },
//     {timestamps: true}
// )

// payment logs
// ifata payment id na conditions zose yakozwe zihari

const userPaymentsSchema = new mongoose.Schema({
    method_used: {
        type: String,
        enum: methods,
        required: true
    },
    user: {
        type: String,
        ref: "user"
    },
    amount_paid: {
        type: Number
    },
    balance: {
        type: Number,
        default: 0
    },
    periodType: {
        type: String,
        enum: periods
    },
    periodValue: {
        type: Number
    },
    college: {
        type: String,
        ref: "college"
    },
    startingDate: {
        type: Date,
        required: true
    },
    // college_plans: [college_payment_plan],
    status: {
        type: String,
        enum: statuses,
        default: 'ACTIVE'
    },
}, {timestamps: true})

// validate user
exports.validate_account_payments = (credentials, type = 'payment') => {
    const schema = type === 'payment' ? {
        method_used: Joi.string().valid(methods).required(),
        amount_paid: Joi.number().min(1).max(100).required(),
        periodType: Joi.string().valid(periods).required(),
        periodValue: Joi.number().min(1).required(),
        total_users: Joi.number(),
        startingDate: Joi.date().required()
    } : {
        periodType: Joi.string().valid(periods).required(),
        periodValue: Joi.number().min(1).required(),
    }

    return Joi.validate(credentials, schema)
}
// create users model
exports.Account_payments = mongoose.model('account_payment', userPaymentsSchema)