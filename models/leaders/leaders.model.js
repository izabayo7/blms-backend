// import dependencies
const { Types } = require('mongoose')
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const leader_schema = new mongoose.Schema({
    id: {
        type: String,
        ref: 'user',
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
    college: {
        type: Types.ObjectId,
        ref: 'college',
        required: true
    },
    description: {
        type: String,
        min: 20
    },
    name: {
        type: String,
        required: true
    },
    leaders: [leader_schema],
    createdBy: {
        type: Types.ObjectId,
        ref: 'user',
        required: true
    },
    status: {
        type: Number,
        default: 1
    },
})

faculty_college_schema.plugin(timestamps)

// validate faculty
function validate_faculty_college(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
        college: Joi.string().required(),
        description: Joi.string(),
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