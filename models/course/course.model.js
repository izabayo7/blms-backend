const {
    date
} = require('joi')
// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const course_schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    user: {
        type: String,
        ref: 'user',
        required: true
    },
    user_group: {
        type: String,
        ref: 'user_group',
        required: true
    },
    description: {
        type: String,
    },
    cover_picture: {
        type: String,
    },
    published: {
        type: Boolean,
        default: false
    },
    maximum_marks: {
        type: Number,
        required: true
    },
    published_on: {
        type: Date
    },
    status: {
        type: Number,
        default: 1
    },
    haveCertificate: {
        type: Boolean,
        default: false
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
    },
    duration: {
        type: Number,
    },
})

course_schema.plugin(timestamps)

// validate course
function validate_course(credentials) {
    const schema = {
        name: Joi.string().min(3).max(100).required(),
        // user: Joi.string().min(3).max(100).required(),
        user_group: Joi.ObjectId(),
        faculty: Joi.ObjectId(),
        description: Joi.string().max(1000).min(10),
        maximum_marks: Joi.number().min(1).required(),
        cover_picture: Joi.string(),
        published: Joi.boolean(),
        status: Joi.number().min(0).max(1),
        haveCertificate: Joi.boolean(),
        isPublic: Joi.boolean(),
        price: Joi.number().min(0),
        duration: Joi.number().min(0).max(12),
    }
    return Joi.validate(credentials, schema)
}

// create courses model
const course = mongoose.model('course', course_schema)

// export the model and the validation function
module.exports.course = course
module.exports.validate_course = validate_course