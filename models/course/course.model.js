const { date } = require('joi')
// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    instructor: {
        type: String,
        required: true
    },
    facultyCollegeYear: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    coverPicture: {
        type: String,
    },
    published: {
        type: Boolean,
        default: false
    },
    publishedOn: {
        type: Date
    }
})

courseSchema.plugin(timestamps)

// validate course
function validateCourse(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
        instructor: Joi.ObjectId().required(),
        facultyCollegeYear: Joi.ObjectId().required(),
        description: Joi.string().max(500).min(10).required(),
        coverPicture: Joi.string(),
        published: Joi.boolean()
    }
    return Joi.validate(credentials, schema)
}

// create courses model
const Course = mongoose.model('Course', courseSchema)

// export the model and the validation function
module.exports.Course = Course
module.exports.validateCourse = validateCourse