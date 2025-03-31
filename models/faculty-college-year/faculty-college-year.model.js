// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const facultyCollegeYearSchema = new mongoose.Schema({
    facultyCollege: {
        type: String,
        required: true
    },
    collegeYear: {
        type: String,
        required: true
    },
})

facultyCollegeYearSchema.plugin(timestamps)

// validate faculty-collegeYear
function validateFacultyCollegeYear(credentials) {
    const schema = {
        facultyCollege: Joi.ObjectId().required(),
        collegeYear: Joi.ObjectId().required(),
    }
    return Joi.validate(credentials, schema)
}

// create facultyCollegeYear model
const facultyCollegeYear = mongoose.model('facultyCollegeYear', facultyCollegeYearSchema)

// export the model and the validation function
module.exports.facultyCollegeYear = facultyCollegeYear
module.exports.validateFacultyCollegeYear = validateFacultyCollegeYear 