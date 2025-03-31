// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const college_year_schema = new mongoose.Schema({
    digit: {
        type: Number,
        unique: true,
        required: true
    },
})

college_year_schema.plugin(timestamps)

// validate college_year
function validate_college_year(credentials) {
    const schema = {
        digit: Joi.number().min(1).required(),
    }
    return Joi.validate(credentials, schema)
}

// create college_years model
const college_year = mongoose.model('college_year', college_year_schema)

// export the model and the validation function
module.exports.college_year = college_year
module.exports.validate_college_year = validate_college_year