// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const finished_chapter_schema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    }
})
finished_chapter_schema.plugin(timestamps)

const user_progress_schema = new mongoose.Schema({
    user: {
        type: String,
        ref: "user",
        required: true
    },
    course: {
        type: String,
        required: true
    },
    finished_chapters: [
        finished_chapter_schema
    ],
    progress: {
        type: Number,
        max: 100,
        default: 0
    },
})

user_progress_schema.plugin(timestamps)

// validate user
function validate_user_progress(credentials, method = 'put') {
    const schema = {
        user: Joi.string().required(),
        course: Joi.ObjectId().required(),
        chapter: method == 'put' ? Joi.ObjectId().required() : Joi.ObjectId(),
    }
    return Joi.validate(credentials, schema)
}

// create user_progress model
const user_progress = mongoose.model('user_progress', user_progress_schema)

// export the model and the validation function
module.exports.user_progress = user_progress
module.exports.validate_user_progress = validate_user_progress