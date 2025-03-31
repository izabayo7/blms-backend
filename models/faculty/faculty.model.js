// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const facultySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
})

facultySchema.plugin(timestamps)

// validate faculty
function validateFaculty(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
    }
    return Joi.validate(credentials, schema)
}

// create faculties model
const Faculty = mongoose.model('Faculty', facultySchema)

// export the model and the validation function
module.exports.Faculty = Faculty
module.exports.validateFaculty = validateFaculty