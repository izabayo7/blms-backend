// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

Joi.ObjectId = require('joi-objectid')(Joi)

const facultyCollegeSchema = new mongoose.Schema({
    faculty: {
        type: String,
        required: true
    },
    college: {
        type: String,
        required: true
    },
})

facultyCollegeSchema.plugin(timestamps)

// validate faculty-college
function validateFacultyCollege(credentials) {
    const schema = {
        faculty: Joi.ObjectId().required(),
        college: Joi.ObjectId().required(),
    }
    return Joi.validate(credentials, schema)
}

// create facultyCollege model
const facultyCollege = mongoose.model('facultyCollege', facultyCollegeSchema)

// export the model and the validation function
module.exports.facultyCollege = facultyCollege
module.exports.validateFacultyCollege = validateFacultyCollege 