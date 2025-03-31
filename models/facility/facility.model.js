// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const facilitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
})

facilitySchema.plugin(timestamps)

// validate facility
function validateFacility(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
    }
    return Joi.validate(credentials, schema)
}

// create facilities model
const Facility = mongoose.model('Facility', facilitySchema)

// export the model and the validation function
module.exports.Facility = Facility
module.exports.validateFacility = validateFacility