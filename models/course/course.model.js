// import dependencies
const {
    mongoose,
    Joi,
} = require('../../utils/imports');

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    instructor: {
        type: String,
        required: true
    },
    facilityCollegeYear: {
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
    }
});

// validate course
function validateCourse(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
        instructor: Joi.ObjectId().required(),
        facilityCollegeYear: Joi.ObjectId().required(),
        description: Joi.string().max(100).min(10).required(),
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