// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const quiz_schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    instructions: {
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
        allowed_files:{
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
        required: true
    },
    published: {
        type: Boolean,
        default: false
    },
    status: {
        type: Number,
        default: 1
    },
})
quiz_schema.plugin(timestamps);

// validate quiz
function validate_quiz(body, target = false) {
    const schema = target ? {
        type: Joi.string().required(),
        id: Joi.ObjectId().required()
    } : {
            name: Joi.string().min(3).required(),
            instructions: Joi.string().min(3),
            passMarks: Joi.number().min(1).required(),
            target: Joi.object({
                type: Joi.string().required(),
                id: Joi.ObjectId().required()
            }),
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
            published: Joi.boolean(),
            status: Joi.number().min(0).max(1)
        }
    return Joi.validate(body, schema)
}

// create quizs model
const quiz = mongoose.model('quiz', quiz_schema)

// export the model and the validation function
module.exports.quiz = quiz
module.exports.validate_quiz = validate_quiz