// import dependencies
const {
    mongoose,
    Joi,
} = require('../../utils/imports')

const AttachmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    Attachment: {
        type: String,
        required: true
    }
});

// validate Attachment
function validateAttachment(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
        chapter: Joi.ObjectId().required()
    }
    return Joi.validate(credentials, schema)
}

// create courses model
const Attachment = mongoose.model('Attachment', AttachmentSchema)

// export the model and the validation function
module.exports.Attachment = Attachment
module.exports.validateAttachment = validateAttachment