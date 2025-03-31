// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const collegeYearSchema = new mongoose.Schema({
    digit: {
        type: Number,
        unique: true,
        required: true
    },
})

collegeYearSchema.plugin(timestamps)

// validate collegeYear
function validateCollegeYear(credentials) {
    const schema = {
        digit: Joi.number().min(1).required(),
    }
    return Joi.validate(credentials, schema)
}

// create collegeYears model
const CollegeYear = mongoose.model('CollegeYear', collegeYearSchema)

// export the model and the validation function
module.exports.CollegeYear = CollegeYear
module.exports.validateCollegeYear = validateCollegeYear