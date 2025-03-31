// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const facilityCollegeYearSchema = new mongoose.Schema({
    facilityCollege: {
        type: String,
        required: true
    },
    collegeYear: {
        type: String,
        required: true
    },
})

facilityCollegeYearSchema.plugin(timestamps)

// validate facility-collegeYear
function validateFacilityCollegeYear(credentials) {
    const schema = {
        facilityCollege: Joi.ObjectId().required(),
        collegeYear: Joi.ObjectId().required(),
    }
    return Joi.validate(credentials, schema)
}

// create facilityCollegeYear model
const facilityCollegeYear = mongoose.model('facilityCollegeYear', facilityCollegeYearSchema)

// export the model and the validation function
module.exports.facilityCollegeYear = facilityCollegeYear
module.exports.validateFacilityCollegeYear = validateFacilityCollegeYear 