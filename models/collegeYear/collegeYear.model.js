// import dependencies
const {
    mongoose,
    Joi,
} = require('../../utils/imports')

const courseSchema = new mongoose.Schema({
    digit: {
        type: Number,
        unique: true,
        required: true
    },
});

// validate course
function validateCollegeYear(credentials) {
    const schema = {
        digit: Joi.number().min(1).required(),
    }
    return Joi.validate(credentials, schema)
}

// create collegeYears model
const CollegeYear = mongoose.model('CollegeYear', courseSchema)

// export the model and the validation function
module.exports.CollegeYear = CollegeYear
module.exports.validateCollegeYear = validateCollegeYear