// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

/**
 * @swagger
 * definitions:
 *   Exam_submission:
 *     properties:
 *       quiz:
 *         type: string
 *       user:
 *         type: string
 *       used_time:
 *         type: number
 *       auto_submitted:
 *         type: boolean
 *       marked:
 *         type: boolean
 *       published:
 *         type: boolean
 *       total_marks:
 *         type: number
 *       answers:
 *         type: array
 *         items:
 *            type: object
 *            properties:
 *              text:
 *                type: string
 *              marks:
 *                type: number
 *              src:
 *                type: string
 *              choosed_options:
 *                type: array
 *                items:
 *                  type: object
 *                  properties:
 *                    text:
 *                      type: string
 *                    src:
 *                      type: string
 *     required:
 *       - quiz
 *       - user
 *       - used_time
 *       - answers
 */

const exam_submission_schema = new mongoose.Schema({
    exam: {
        type: String,
        ref: 'exam',
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

exam_submission_schema.plugin(timestamps)

// validate exam_submission
function validate_exam_submission(credentials) {
    const schema = {
        exam: Joi.ObjectId().required(),
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
        user: Joi.string().min(3).max(100).required(),
        auto_submitted: Joi.boolean(),
        marked: Joi.boolean(),
        published: Joi.boolean()
    }
    return Joi.validate(credentials, schema)
}

// create exam_submissions model
const exam_submission = mongoose.model('exam_submission', exam_submission_schema)

// export the model and the validation function
module.exports.Exam_submission = exam_submission
module.exports.validate_exam_submission = validate_exam_submission