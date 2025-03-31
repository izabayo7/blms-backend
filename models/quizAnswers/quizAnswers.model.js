// import dependencies
const {
    mongoose,
    Joi,
} = require('../../utils/imports')

const QuizAnswersSchema = new mongoose.Schema({
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
    autoSubbmitted: {
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

// validate QuizAnswers
function validateQuizAnswers(credentials) {
    const schema = {
        quiz: Joi.ObjectId().required(),
        usedTime: Joi.number().required(),
        answers: Joi.array().min(1).required(),
        student: Joi.ObjectId().required(),
        autoSubbmitted: Joi.boolean(),
        marked: Joi.boolean(),
        published: Joi.boolean()
    }
    return Joi.validate(credentials, schema)
}

// create QuizAnswerss model
const QuizAnswers = mongoose.model('QuizAnswers', QuizAnswersSchema)

// export the model and the validation function
module.exports.QuizAnswers = QuizAnswers
module.exports.validateQuizAnswers = validateQuizAnswers