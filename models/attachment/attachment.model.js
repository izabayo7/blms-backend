// import dependencies
const {
    mongoose,
    Joi,
} = require('../../utils/imports')

const attachment_schema = new mongoose.Schema({
    target: {
        type: {
            type: String,
        },
        id: {
            type: String,
        }
    },
    files: [{
        file_name: {
            type: String,
            required: true
        },
    }],

})

// validate attachment
function validate_attachment(credentials) {
    const schema = {
        target: Joi.object({
            type: Joi.string().required(),
            id: Joi.ObjectId().required()
        }),
        files: Joi.array().items(Joi.object({
            file_name: Joi.string().required()
        })).required(),
    }
    return Joi.validate(credentials, schema)
}

// create courses model
const attachment = mongoose.model('attachment', attachment_schema)

// export the model and the validation function
module.exports.attachment = attachment
module.exports.validate_attachment = validate_attachment