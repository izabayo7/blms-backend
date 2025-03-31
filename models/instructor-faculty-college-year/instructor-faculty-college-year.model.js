// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const instructorFacultyCollegeYearSchema = new mongoose.Schema({
    instructor: {
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

instructorFacultyCollegeYearSchema.plugin(timestamps)

// validate instructor-faculty-college-year
function validateInstructorFacultyCollegeYear(credentials) {
    const schema = {
        instructor: Joi.ObjectId().required(),
        facultyCollegeYear: Joi.ObjectId().required(),
    }
    return Joi.validate(credentials, schema)
}

// create instructorFacultyCollegeYear model
const instructorFacultyCollegeYear = mongoose.model('instructorFacultyCollegeYear', instructorFacultyCollegeYearSchema)

// export the model and the validation function
module.exports.instructorFacultyCollegeYear = instructorFacultyCollegeYear
module.exports.validateInstructorFacultyCollegeYear = validateInstructorFacultyCollegeYear