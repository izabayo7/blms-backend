// import dependencies
const { mongoose, Joi, timestamps } = require('../../utils/imports')

const collegeSchema = new mongoose.Schema({
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
function validateCollege(credentials) {
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

collegeSchema.plugin(timestamps)

// create Colleges model
const College = mongoose.model('College', collegeSchema)

// export the model and the validation function
module.exports.College = College
module.exports.validateCollege = validateCollege
