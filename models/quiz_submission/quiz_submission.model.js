// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const quiz_submission_schema = new mongoose.Schema({
    quiz: {
        type: String,
        ref: 'quiz',
        required: true
    },
    user: {
        type: String,
        ref: 'user',
        required: true
    },
    used_time: {
        type: Number,
        required: true
    },
    answers: [{
        not_done: {
          type: Boolean
        },
        text: {
            type: String
        },
        marks: {
            type: Number
        },
        feedback_src: {
            type: String
        },
        src: {
            type: String
        },
        choosed_options: [{
            text: {
                type: String
            },
            src: {
                type: String
            }
        }]
    }],
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
    results_seen: {
        type: Boolean,
        default: false
    },
    published: {
        type: Boolean,
        default: false
    },
    time_started: {
        type: Date
    },
    time_submitted: {
        type: Date
    }
})

quiz_submission_schema.plugin(timestamps)

// validate quiz_submision
function validate_quiz_submission(credentials) {
    const schema = {
        quiz: Joi.ObjectId().required(),
        used_time: Joi.number().required(),
        answers: Joi.array().min(1).items(Joi.object({
            _id: Joi.ObjectId(),
            text: Joi.string(),
            marks: Joi.number(),
            not_done: Joi.boolean(),
            src: Joi.string().min(0),
            feedback_src: Joi.string(),
            choosed_options: Joi.array().items(Joi.object({
                _id: Joi.ObjectId(),
                text: Joi.string(),
                src: Joi.string()
            })),
        })).required(),
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