// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')


// user_id,
//     method used,
//     amount paid,
//     valid until,

const methods = ['MTN_MOMO', 'CARD']
const userPaymentsSchema = new mongoose.Schema({
    method_used: {
        type: String,
        enum: methods,
        required: true
    },
    user: {
        type: String,
        ref: "user_category"
    },
    amount_paid: {
        type: Number
    },
    college: {
        type: String,
        ref: "college"
    },
},{timestamps: true})

// validate user
exports.validate_user = (credentials) => {
    const schema = {
        method_used: Joi.string().enum(methods).required(),
        amount_paid: Joi.number().min(1).max(100).required()
    }
    return Joi.validate(credentials, schema)
}
// create users model
exports.User_payments = mongoose.model('user_payment', userPaymentsSchema)