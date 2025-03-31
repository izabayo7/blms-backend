// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

/**
 * @swagger
 * definitions:
 *   College_payment_plans:
 *     properties:
 *       college:
 *         type: string
 *       plan:
 *         type: string
 *         enum: ['TRIAL', 'HUGUKA', 'JIJUKA', 'MINUZA_STARTER','MINUZA_GROWTH','MINUZA_ACCELERATE']
 *       discount:
 *         type: number
 *         default: 20
 *       pricePerUser:
 *         type: number
 *         default: 3532.45
 *       status:
 *         type: string
 *         enum: ['ACTIVE','INACTIVE']
 *     required:
 *       - name
 *       - email
 */

const plans = ['TRIAL', 'HUGUKA', 'JIJUKA', 'MINUZA_STARTER', 'MINUZA_GROWTH', 'MINUZA_ACCELERATE']

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
    pricePerUser: {
        type: Number,
        // 3.5 usd
        default: 3532.45,
        min: 3532.45
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
}, {timestamps: true})

// validate college
function validate_college_payment_plans(credentials) {
    const schema = {
        plan: Joi.string().valid(plans),
        discount: Joi.number(),
        pricePerUser: Joi.number().min(3532.45)
    }
    return Joi.validate(credentials, schema)
}

// export the model and the validation function
module.exports.College_payment_plans = mongoose.model('college_payment_plans', schema)
module.exports.validate_college_payment_plans = validate_college_payment_plans

