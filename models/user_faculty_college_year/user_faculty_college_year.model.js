// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const user_faculty_college_year_schema = new mongoose.Schema({
    user: {
        type: String,
        ref: 'user',
        required: true
    },
    faculty_college_year: {
        type: String,
        ref: 'faculty_college_year',
        required: true
    },
    status: {
        type: Number,
        default: 1
    },
})

user_faculty_college_year_schema.plugin(timestamps)

// validate user_faculty_college_year
function validate_user_faculty_college_year(credentials) {
    const schema = {
        user: Joi.string().min(3).max(100).required(),
        faculty_college_year: Joi.ObjectId().required(),
        status: Joi.number().min(0).max(1)
    }
    return Joi.validate(credentials, schema)
}

// create user_faculty_college_year model
const user_faculty_college_year = mongoose.model('user_faculty_college_year', user_faculty_college_year_schema)

// export the model and the validation function
module.exports.user_faculty_college_year = user_faculty_college_year
module.exports.validate_user_faculty_college_year = validate_user_faculty_college_year