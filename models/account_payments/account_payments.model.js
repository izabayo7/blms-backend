// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')


const methods = ['MTN_MOMO', 'CARD']
const statuses = ['ACTIVE', 'INACTIVE']
const periods = ['MONTH','YEAR']

// to trace college plan changes
const college_payment_plan = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: statuses,
            default: 'ACTIVE'
        },
    },
    {timestamps: true}
)
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
    college_plans: [college_payment_plan],
    status: {
        type: String,
        enum: statuses,
        default: 'ACTIVE'
    },
}, {timestamps: true})

// validate user
exports.validate_account_payments = (credentials) => {
    const schema = {
        method_used: Joi.string().enum(methods).required(),
        amount_paid: Joi.number().min(1).max(100).required(),
        periodType: Joi.string().enum(periods).required(),
        periodValue: Joi.number().required(),
    }
    return Joi.validate(credentials, schema)
}
// create users model
exports.Account_payments = mongoose.model('account_payment', userPaymentsSchema)