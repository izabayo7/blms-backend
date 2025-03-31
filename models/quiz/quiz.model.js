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
    instructions: {
        type: String
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
        type: { type: String, required: true },
        marks: { type: Number, required: true },
        details: { type: String, require: true },
        options: {
            list_style_type: { type: String },
            choices: [{ text: { type: String }, src: { type: String } }],
        },
    }],
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
function validateQuiz(body) {
    const schema = {
        name: Joi.string().min(3).required(),
        instructions: Joi.string().min(3),
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
            options: {
                list_style_type: Joi.string(),
                choices: Joi.array().items(Joi.object({ _id: Joi.ObjectId(), text: Joi.string(), src: Joi.string() })).required(),
            },
        })).required(),
        totalMarks: Joi.number(),
        instructor: Joi.ObjectId().required(),
        published: Joi.boolean()
    }
    return Joi.validate(body, schema)
}

// create Quizs model
const Quiz = mongoose.model('Quiz', QuizSchema)

// export the model and the validation function
module.exports.Quiz = Quiz
module.exports.validateQuiz = validateQuiz