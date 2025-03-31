// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

Joi.ObjectId = require('joi-objectid')(Joi)

const facilityCollegeSchema = new mongoose.Schema({
    facility: {
        type: String,
        required: true
    },
    college: {
        type: String,
        required: true
    },
})

facilityCollegeSchema.plugin(timestamps)

// validate facility-college
function validateFacilityCollege(credentials) {
    const schema = {
        facility: Joi.ObjectId().required(),
        college: Joi.ObjectId().required(),
    }
    return Joi.validate(credentials, schema)
}

// create facilityCollege model
const facilityCollege = mongoose.model('facilityCollege', facilityCollegeSchema)

// export the model and the validation function
module.exports.facilityCollege = facilityCollege
module.exports.validateFacilityCollege = validateFacilityCollege 