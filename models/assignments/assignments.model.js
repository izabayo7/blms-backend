// import dependencies
const {
    mongoose,
    Joi,
} = require('../../utils/imports')

/**
 * @swagger
 * definitions:
 *   Assignment:
 *     properties:
 *       title:
 *         type: string
 *       details:
 *         type: string
 *       dueDate:
 *         type: string
 *         format: date
 *       total_marks:
 *         type: number
 *       user:
 *         type: string
 *       status:
 *         type: string
 *         enum: ["DRAFT","PUBLISHED","RELEASED"]
 *       target:
 *         type: object
 *         properties:
 *           type:
 *             type: string
 *           id:
 *             type: string
 *     required:
 *       - title
 *       - details
 *       - dueDate
 *       - target
 */

const schema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    details: {
        type: String
    },
    // percentage which students will be graded on
    passMarks: {
        type: Number,
        default: 50
    },
    target: {
        type: {
            type: String,
        },
        id: {
            type: String,
        }
    },
    dueDate: {
        type: Date,
        required: true
    },
    attachments: [{
        src: {
            type: String,
            required: true
        }
    }],
    total_marks: {
        type: Number,
        default: 100
    },
    allowed_files: {
        type: Array,
    },
    user: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["DRAFT", "PUBLISHED", "RELEASED", "DELETED"],
        default: "DRAFT"
    },
    submissionMode: {
        type: String,
        enum: ["textInput", "fileUpload"],
        default: "textInput"
    },
    allowMultipleFilesSubmission: {
        type: Boolean,
        default: false,
    }
}, {timestamps: true})

// validate quiz
function validate_assignment(body) {
    const schema = {
        title: Joi.string().min(3).required(),
        details: Joi.string(),
        passMarks: Joi.number().min(1).required(),
        target: Joi.object({
            type: Joi.string().required(),
            id: Joi.ObjectId().required()
        }),
        dueDate: Joi.date().required(),
        total_marks: Joi.number().required(),
        allowMultipleFilesSubmission: Joi.boolean(),
        submissionMode: Joi.string().valid(["textInput", "fileUpload"]).required(),
        allowed_files: Joi.array(),
        attachments: Joi.array().items(Joi.object({
            src: Joi.string().required()
        })),
    }
    return Joi.validate(body, schema)
}

// export the model and the validation function
module.exports.Assignment = mongoose.model('assignment', schema)
module.exports.validate_assignment = validate_assignment