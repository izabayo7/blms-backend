// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const QuizSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    target: {
        type: {
            type: String,
        },
        id: {
            type: String,
        }
    },
    duration: {
        type: Object,
        required: true
    },
    questions: {
        type: Array,
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    instructor: {
        type: String,
        required: true
    },
    published: {
        type: Boolean,
        default: false
    }
})
QuizSchema.plugin(timestamps);

// validate Quiz
function validateQuiz(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
        target: Joi.object(),
        // target: Joi.object().required(),
        duration: Joi.object().required(),
        questions: Joi.array().min(1).required(),
        instructor: Joi.ObjectId().required(),
        published: Joi.boolean()
    }
    return Joi.validate(credentials, schema)
}

// create Quizs model
const Quiz = mongoose.model('Quiz', QuizSchema)

// export the model and the validation function
module.exports.Quiz = Quiz
module.exports.validateQuiz = validateQuiz