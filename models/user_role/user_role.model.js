// import dependencies
const {
    mongoose,
    Joi,
    jwt,
    config,
    timestamps
} = require('../../utils/imports')

const user_role_schema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
})

user_role_schema.plugin(timestamps)

// validate user_role
function validate_user_role(credentials) {
    const schema = {
        name: Joi.string().min(5).required(),
    }
    return Joi.validate(credentials, schema)
}

// create user_roles model
const user_role = mongoose.model('user_role', user_role_schema)

// export the model and the validation function
module.exports.user_role = user_role
module.exports.validate_user_role = validate_user_role