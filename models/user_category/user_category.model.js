// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const user_category_schema = new mongoose.Schema({
    name: {
        type: String,
        unique: String,
        required: true
    },
    description: {
        type: String
    }
})

user_category_schema.plugin(timestamps)


// validate user_category
function validate_user_category(credentials) {
    const schema = {
        name: Joi.string().min(5).required(),
        description: Joi.string().min(10).required(),
    }
    return Joi.validate(credentials, schema)
}

// create user_categorys model
const user_category = mongoose.model('user_category', user_category_schema)

// export the model and the validation function
module.exports.user_category = user_category
module.exports.validate_user_category = validate_user_category