// import dependencies
const { mongoose, Joi, timestamps } = require('../../utils/imports')

const college_schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        unique: true,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    logo: {
        type: String,
    },
    disabled: {
        type: Boolean,
        default: false,
    }
})

// validate college
function validate_college(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
        email: Joi.string().required(),
        logo: Joi.string(),
        phone: Joi.string().max(15).required(),
        location: Joi.string().required(),
        disabled: Joi.boolean()
    }
    return Joi.validate(credentials, schema)
}

college_schema.plugin(timestamps)

// create college model
const college = mongoose.model('college', college_schema)

// export the model and the validation function
module.exports.college = college
module.exports.validate_college = validate_college
