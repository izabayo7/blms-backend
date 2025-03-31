// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const studentFacultyCollegeYearSchema = new mongoose.Schema({
    student: {
        type: String,
        required: true
    },
    facultyCollegeYear: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        default: 1
    },
})

studentFacultyCollegeYearSchema.plugin(timestamps)

// validate student-faculty-college-year
function validateStudentFacultyCollegeYear(credentials) {
    const schema = {
        student: Joi.ObjectId().required(),
        facultyCollegeYear: Joi.ObjectId().required(),
    }
    return Joi.validate(credentials, schema)
}

// create studentFacultyCollegeYear model
const studentFacultyCollegeYear = mongoose.model('studentFacultyCollegeYear', studentFacultyCollegeYearSchema)

// export the model and the validation function
module.exports.studentFacultyCollegeYear = studentFacultyCollegeYear
module.exports.validateStudentFacultyCollegeYear = validateStudentFacultyCollegeYear