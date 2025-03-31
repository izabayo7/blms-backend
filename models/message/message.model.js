// import dependencies
const {
    mongoose,
    Joi,
} = require('../../utils/imports')

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    reciever: {
        type: String,
        required: true
    },
    content: {
        type: String,
    },
    attachments: {
        type: String,
    },
    read: {
        type: Boolean,
        default: false
    }
})

// validate message
function validateMessage(credentials) {
    const schema = {
        sender: Joi.ObjectId().required(),
        reciever: Joi.ObjectId().required(),
        content: Joi.string().max(9000),
        attachments: Joi.array(),
        read: Joi.boolean(),
    }
    return Joi.validate(credentials, schema)
}

// create messages model
const Message = mongoose.model('Message', messageSchema)

// export the model and the validation function
module.exports.Message = Message
module.exports.validateMessage = validateMessage