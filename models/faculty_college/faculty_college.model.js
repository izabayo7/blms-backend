// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const leader_schema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    start_date: {
        type: Date
    },
    end_date: {
        type: Date
    },
    status: {
        type: Number,
        default: 1
    },
})
leader_schema.plugin(timestamps)

const faculty_college_schema = new mongoose.Schema({
    faculty: {
        type: String,
        required: true
    },
    college: {
        type: String,
        required: true
    },
    leaders: [leader_schema],
    status: {
        type: Number,
        default: 1
    },
})

faculty_college_schema.plugin(timestamps)

// validate faculty-college
function validate_faculty_college(credentials) {
    const schema = {
        faculty: Joi.ObjectId().required(),
        college: Joi.ObjectId().required(),
        leader: Joi.object({
            id: Joi.ObjectId().required(),
            start_date: Joi.date().required(),
            end_date: Joi.date().required()
        }),
        status: Joi.number().min(0).max(1)
    }
    return Joi.validate(credentials, schema)
}

// create faculty_college model
const faculty_college = mongoose.model('faculty_college', faculty_college_schema)

// export the model and the validation function
module.exports.faculty_college = faculty_college
module.exports.validate_faculty_college = validate_faculty_college