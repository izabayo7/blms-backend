// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const faculty_schema = new mongoose.Schema({
    name: {
        type: String,
        unique:true,
        required: true
    },
})

faculty_schema.plugin(timestamps)

// validate faculty
function validate_faculty(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
    }
    return Joi.validate(credentials, schema)
}

// create faculties model
const faculty = mongoose.model('faculty', faculty_schema)

// export the model and the validation function
module.exports.faculty = faculty
module.exports.validate_faculty = validate_faculty