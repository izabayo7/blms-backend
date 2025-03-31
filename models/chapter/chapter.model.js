// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const chapter_schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    course: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    number: {
        type: Number,
        required: true
    },
    mainVideo: {
        type: String,
    },
    liveVideo: {
        type: String,
    },
    status: {
        type: Number,
        default: 1
    },
})

chapter_schema.plugin(timestamps)

// validate chapter
function validate_chapter(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
        number: Joi.number().min(1),
        course: Joi.ObjectId().required(),
        description: Joi.string().max(500).min(10),
        document: Joi.string(),
        status: Joi.number().min(0).max(1)
    }
    return Joi.validate(credentials, schema)
}

// create chapter model
const chapter = mongoose.model('chapter', chapter_schema)

// export the model and the validation function
module.exports.chapter = chapter
module.exports.validate_chapter = validate_chapter