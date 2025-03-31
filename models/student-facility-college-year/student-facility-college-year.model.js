// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const studentFacilityCollegeYearSchema = new mongoose.Schema({
    student: {
        type: String,
        required: true
    },
    facilityCollegeYear: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        default: 1
    },
})

studentFacilityCollegeYearSchema.plugin(timestamps)

// validate student-facility-college-year
function validateStudentFacilityCollegeYear(credentials) {
    const schema = {
        student: Joi.ObjectId().required(),
        facilityCollegeYear: Joi.ObjectId().required(),
    }
    return Joi.validate(credentials, schema)
}

// create studentFacilityCollegeYear model
const studentFacilityCollegeYear = mongoose.model('studentFacilityCollegeYear', studentFacilityCollegeYearSchema)

// export the model and the validation function
module.exports.studentFacilityCollegeYear = studentFacilityCollegeYear
module.exports.validateStudentFacilityCollegeYear = validateStudentFacilityCollegeYear