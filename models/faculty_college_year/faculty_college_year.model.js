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

const faculty_college_year_schema = new mongoose.Schema({
    faculty_college: {
        type: String,
        required: true
    },
    college_year: {
        type: String,
        required: true
    },
    leaders: [leader_schema]
})

faculty_college_year_schema.plugin(timestamps)

// validate faculty-college_year
function validate_faculty_college_year(credentials) {
    const schema = {
        faculty_college: Joi.ObjectId().required(),
        college_year: Joi.ObjectId().required(),
        leader: Joi.object({
            id: Joi.ObjectId().required(),
            start_date: Joi.date().required(),
            end_date: Joi.date().required()
        })
    }
    return Joi.validate(credentials, schema)
}

// create faculty_college_year model
const faculty_college_year = mongoose.model('faculty_college_year', faculty_college_year_schema)

// export the model and the validation function
module.exports.faculty_college_year = faculty_college_year
module.exports.validate_faculty_college_year = validate_faculty_college_year