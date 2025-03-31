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
    instructor: {
        type: String,
        required: true
    },
    faculty_college_year: {
        type: String,
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
    published_on: {
        type: Date
    }
})

course_schema.plugin(timestamps)

// validate course
function validate_course(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
        instructor: Joi.ObjectId().required(),
        faculty_college_year: Joi.ObjectId().required(),
        description: Joi.string().max(500).min(10),
        cover_picture: Joi.string(),
        published: Joi.boolean()
    }
    return Joi.validate(credentials, schema)
}

// create courses model
const course = mongoose.model('course', course_schema)

// export the model and the validation function
module.exports.course = course
module.exports.validate_course = validate_course