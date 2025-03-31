// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const status_enum = ['ACTIVE', 'INACTIVE']
const paginate = require('mongoose-paginate-v2')

const user_user_group_schema = new mongoose.Schema({
    user: {
        type: String,
        ref: 'user',
        required: true
    },
    user_group: {
        type: String,
        ref: 'user_group',
        required: true
    },
    status: {
        type: String,
        default: 'ACTIVE',
        enum: status_enum
    },
}, { timestamps: true })

user_user_group_schema.plugin(paginate)

// validate user_user_group
function validate_user_user_group(credentials) {
    const schema = {
        user: Joi.string().min(3).max(100).required(),
        user_group: Joi.ObjectId().required()
    }
    return Joi.validate(credentials, schema)
}

// create user_user_group model
const user_user_group = mongoose.model('user_user_group', user_user_group_schema)

// export the model and the validation function
module.exports.User_user_group = user_user_group
module.exports.validate_user_user_group = validate_user_user_group