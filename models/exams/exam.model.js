// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

/**
 * @swagger
 * definitions:
 *   Exam:
 *     properties:
 *       name:
 *         type: string
 *       instructions:
 *         type: string
 *       duration:
 *         type: number
 *       total_marks:
 *         type: number
 *       user:
 *         type: string
 *       questions  :
 *         type: array
 *         items:
 *            type: object
 *            properties:
 *              type:
 *                type: string
 *              marks:
 *                type: number
 *              details:
 *                type: string
 *              options  :
 *                type: object
 *                properties:
 *                  list_style_type:
 *                    type: string
 *                  choices:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        text:
 *                          type: string
 *                        src:
 *                          type: string
 *                        right:
 *                          type: boolean
 *       course:
 *         type: String
 *         required: true
 *       type:
 *         type: String
 *         required: true
 *         enum: ['Open-book examination','Closed-book examination']
 *       status:
 *         type: String
 *         required: true
 *         enum: ['DRAFT','PUBLISHED','RELEASED']
 *     required:
 *       - name
 *       - user
 *       - duration
 *       - questions
 */

const statuses = ['DRAFT','PUBLISHED','RELEASED']
const types = ['Open-book examination','Closed-book examination']
const exam_schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    instructions: {
        type: String
    },
    type: {
        type: String,
        enum: types,
        default: types[0]
    },
    // percentage which students will be graded on
    passMarks: {
        type: Number,
        default: 50
    },
    course: {
        type: String,
        ref: 'course'
    },
    duration: {
        type: Number,
        required: true
    },
    questions: [{
        type: {
            type: String,
            required: true
        },
        marks: {
            type: Number,
            required: true
        },
        details: {
            type: String,
            require: true
        },
        required: {
            type: Boolean,
            default: false
        },
        allowed_files: {
            type: Array
        },
        options: {
            list_style_type: {
                type: String
            },
            choices: [{
                text: {
                    type: String
                },
                src: {
                    type: String
                },
                right: {
                    type: Boolean,
                    default: false
                }
            }],
        },
    }],
    total_marks: {
        type: Number,
        required: true
    },
    user: {
        type: String,
        ref: 'user',
        required: true
    },
    status: {
        type: String,
        default: 'DRAFT',
        enum: statuses
    },
})
exam_schema.plugin(timestamps);

// validate exam
function validate_exam(body) {
    const schema = {
        name: Joi.string().min(3).required(),
        instructions: Joi.string().min(3),
        passMarks: Joi.number().min(1).required(),
        course: Joi.ObjectId().required(),
        duration: Joi.number().min(1).required(),
        questions: Joi.array().min(1).items(Joi.object({
            _id: Joi.ObjectId(),
            type: Joi.string().required(),
            marks: Joi.number().required(),
            details: Joi.string().min(5).required(),
            required: Joi.boolean(),
            allowed_files: Joi.array(),
            options: {
                list_style_type: Joi.string(),
                choices: Joi.array().items(Joi.object({
                    _id: Joi.ObjectId(),
                    text: Joi.string(),
                    src: Joi.string(),
                    right: Joi.boolean()
                })).required(),
            },
        })).required(),
        total_marks: Joi.number(),
        user: Joi.string().min(3).max(100).required(),
        status: Joi.string().valid(statuses),
        type: Joi.string().valid(types)
    }
    return Joi.validate(body, schema)
}

// create exams model
const exam = mongoose.model('exam', exam_schema)

// export the model and the validation function
module.exports.Exam = exam
module.exports.validate_exam = validate_exam