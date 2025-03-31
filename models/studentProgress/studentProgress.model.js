// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const finishedChaptersSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    }
})
finishedChaptersSchema.plugin(timestamps)

const studentProgressSchema = new mongoose.Schema({
    student: {
        type: String,
        required: true
    },
    course: {
        type: String,
        required: true
    },
    finishedChapters: [
        finishedChaptersSchema
    ],
    progress: {
        type: Number,
        max: 100,
        default: 0
    },
})

studentProgressSchema.plugin(timestamps)

// validate student
function validateStudentProgress(credentials, method = 'put') {
    const schema = {
        student: Joi.ObjectId().required(),
        course: Joi.ObjectId().required(),
        chapter: method == 'put' ? Joi.ObjectId().required() : Joi.ObjectId(),
    }
    return Joi.validate(credentials, schema)
}

// create StudentProgress model
const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema)

// export the model and the validation function
module.exports.StudentProgress = StudentProgress
module.exports.validateStudentProgress = validateStudentProgress