// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')
const plans = ['TRIAL', 'HUGUKA', 'JIJUKA', 'MINUZA']

const schema = new mongoose.Schema({
    college: {
        type: String,
        ref: 'college'
    },
    plan: {
        type: String,
        enum: plans,
        default: 'TRIAL'
    },
    discount: {
        type: Number,
        default: 20
    },
    status: {
        type: Number,
        default: 1
    },
}, {timestamps: true})

// validate college
function validate_college_payment_plans(credentials) {
    const schema = {
        college: Joi.ObjectId().required(),
        plan: Joi.string().enum(plans),
        discount: Joi.number(),
    }
    return Joi.validate(credentials, schema)
}

// export the model and the validation function
module.exports.college_payment_plans = mongoose.model('college_payment_plans', schema)
module.exports.validate_college_payment_plans= validate_college_payment_plans

