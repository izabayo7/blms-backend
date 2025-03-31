// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const schema = new mongoose.Schema({
    assignment: {
        type: String,
        ref: 'assignment',
        required: true
    },
    user: {
        type: String,
        ref: 'user',
        required: true
    },
    details: {
        type: String
    },
    attachments: [{
        src: {
            type: String,
            required: true
        }
    }],
    feedback_attachments: [{
        src: {
            type: String,
            required: true
        }
    }],
    total_marks: {
        type: Number,
        default: 0
    },
    marked: {
        type: Boolean,
        default: false
    },
    results_seen: {
        type: Boolean,
        default: false
    },
})

// validate assignment_submision
function validate_assignment_submission(credentials) {
    const schema = {
        assignment: Joi.ObjectId().required(),
        details: Joi.string(),
        attachments: Joi.array().items(Joi.object({
            src: Joi.string().required()
        })),
        feedback_attachments: Joi.array().items(Joi.object({
            src: Joi.string().required()
        })),
    }
    return Joi.validate(credentials, schema)
}

// export the model and the validation function
module.exports.Assignment_submission = mongoose.model('assignment_submission', schema)
module.exports.validate_assignment_submission = validate_assignment_submission