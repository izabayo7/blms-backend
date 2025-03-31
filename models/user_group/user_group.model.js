// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const paginate = require('mongoose-paginate-v2')

const status_enum = ['ACTIVE', 'INACTIVE']

const user_group_schema = new mongoose.Schema({
    faculty: {
        type: String,
        ref: 'faculty',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'ACTIVE',
        enum: status_enum
    },
}, {timestamps: true})

user_group_schema.plugin(paginate)

// validate faculty-college_year
function validate_user_group(credentials, isEditing = false) {
    const schema = isEditing ? {
        name: Joi.string().required()
    } : {
        faculty: Joi.ObjectId().required(),
        name: Joi.string().required()
    }
    return Joi.validate(credentials, schema)
}

// create user_group model
const user_group = mongoose.model('user_group', user_group_schema)

// export the model and the validation function
module.exports.User_group = user_group
module.exports.validate_user_group = validate_user_group