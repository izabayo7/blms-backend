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
        type: String
    },
    maximum_users: {
        type: Number,
        required: true
    },
    location: {
        type: String,
    },
    phone: {
        type: String,
    },
    motto: {
        type: String,
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
        name: Joi.string().min(3),
        email: Joi.string().email(),
        motto: Joi.string(),
        phone: Joi.string().max(15),
        location: Joi.string()
    }
    return Joi.validate(credentials, schema)
}

college_schema.plugin(timestamps)

// create college model
const college = mongoose.model('college', college_schema)

// export the model and the validation function
module.exports.college = college
module.exports.validate_college = validate_college