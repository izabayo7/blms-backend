// import dependencies
const {
    mongoose,
    Joi,
    jwt,
    config
} = require('../../utils/imports')

const studentProgressSchema = new mongoose.Schema({
    student: {
        type: String,
        required: true
    },
    course: {
        type: String,
        required: true
    },
    progress: {
        type: Number,
        max: 100,
        default: 0
    },
})

// validate student
function validateStudentProgress(credentials) {
    const schema = {
        student: Joi.ObjectId().required(),
        course: Joi.ObjectId().required(),
        chapter: Joi.ObjectId().required(),
    }
    return Joi.validate(credentials, schema)
}

// create StudentProgress model
const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema)

// export the model and the validation function
module.exports.StudentProgress = StudentProgress
module.exports.validateStudentProgress = validateStudentProgress