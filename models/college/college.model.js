// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const college_schema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
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
    // college status 1(active) 0(inactive)
    status: {
        type: Number,
        default: 1
    },
})

// validate college
function validate_college(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
        email: Joi.string().email().required(), 
        logo: Joi.string(),
        phone: Joi.string().max(15).required(),
        location: Joi.string().required(), // regex needed
        status: Joi.number().min(0).max(1)
    }
    return Joi.validate(credentials, schema)
}

college_schema.plugin(timestamps)

// create college model
const college = mongoose.model('college', college_schema)

// export the model and the validation function
module.exports.college = college
module.exports.validate_college = validate_college