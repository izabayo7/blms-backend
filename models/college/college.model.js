// import dependencies
const { mongoose, Joi } = require('../../utils/imports')

const collegeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    profile: {
        type: String,
        required: false
    }
});

// validate college
function validateCollege(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
        email: Joi.string().required(),
        logo: Joi.string()
    }
    return Joi.validate(credentials, schema)
}

// create Colleges model
const College = mongoose.model('College', collegeSchema)

// export the model and the validation function
module.exports.College = College
module.exports.validateCollege = validateCollege
