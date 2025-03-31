// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')
const recieverSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
})
recieverSchema.plugin(timestamps)
const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    receivers: [recieverSchema],
    content: {
        type: String,
    },
    group: {
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

messageSchema.plugin(timestamps)

// validate message
function validateMessage(credentials) {
    const schema = {
        sender: Joi.ObjectId().required(),
        receivers: Joi.array().min(1).items({ id: Joi.ObjectId().required() }),
        content: Joi.string().max(9000),
        group: Joi.ObjectId(),
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