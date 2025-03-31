// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const quiz_submission_schema = new mongoose.Schema({
    quiz: {
        type: String,
        required: true
    },
    student: {
        type: String,
        required: true
    },
    used_time: {
        type: Number,
        required: true
    },
    answers: {
        type: Array,
        required: true
    },
    total_marks: {
        type: Number,
        default: 0
    },
    auto_submitted: {
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

quiz_submission_schema.plugin(timestamps)

// validate quiz_submision
function validate_quiz_submission(credentials) {
    const schema = {
        quiz: Joi.ObjectId().required(),
        used_time: Joi.number().required(),
        answers: Joi.array().min(1).required(),
        student: Joi.ObjectId().required(),
        auto_submitted: Joi.boolean(),
        marked: Joi.boolean(),
        published: Joi.boolean()
    }
    return Joi.validate(credentials, schema)
}

// create quiz_submisions model
const quiz_submision = mongoose.model('quiz_submision', quiz_submission_schema)

// export the model and the validation function
module.exports.quiz_submision = quiz_submision
module.exports.validate_quiz_submission = validate_quiz_submission