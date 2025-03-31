// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const QuizSubmissionSchema = new mongoose.Schema({
    quiz: {
        type: String,
        required: true
    },
    student: {
        type: String,
        required: true
    },
    usedTime: {
        type: Number,
        required: true
    },
    answers: {
        type: Array,
        required: true
    },
    totalMarks: {
        type: Number,
        default: 0
    },
    autoSubmitted: {
        type: Boolean,
        default: false
    },
    marked: {
        type: Boolean,
        default: false
    },
    published: {
        type: Boolean,
        default: false
    }
})

QuizSubmissionSchema.plugin(timestamps)

// validate QuizSubmission
function validateQuizSubmission(credentials) {
    const schema = {
        quiz: Joi.ObjectId().required(),
        usedTime: Joi.number().required(),
        answers: Joi.array().min(1).required(),
        student: Joi.ObjectId().required(),
        autoSubmitted: Joi.boolean(),
        marked: Joi.boolean(),
        published: Joi.boolean()
    }
    return Joi.validate(credentials, schema)
}

// create QuizSubmissions model
const QuizSubmission = mongoose.model('QuizSubmission', QuizSubmissionSchema)

// export the model and the validation function
module.exports.QuizSubmission = QuizSubmission
module.exports.validateQuizSubmission = validateQuizSubmission