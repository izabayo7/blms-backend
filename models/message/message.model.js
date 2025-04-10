// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')
const receiver_schema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
})
receiver_schema.plugin(timestamps)
const message_schema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    receivers: [receiver_schema],
    content: {
        type: String,
    },
    group: {
        type: String,
    },
    forwarded: {
        type: Boolean,
    },
    reply: {
        type: String,
        ref: 'message'
    },
    attachments: [{
        src: {
            type: String,
            required: true
        }
    }]
})

message_schema.plugin(timestamps)

// validate message
function validate_message(credentials) {
    let requireContent = true

    if (credentials.attachments)
        if (credentials.attachments.length)
            requireContent = false

    const schema = {
        sender: Joi.string().required(),
        receiver: Joi.string().required(),
        content: requireContent ? Joi.string().max(9000).required() : Joi.string().max(9000),
        attachments: Joi.array().min(1).items({src: Joi.string().required()}),
        read: Joi.boolean(),
        reply: Joi.ObjectId()
    }
    return Joi.validate(credentials, schema)
}

// create messages model
const message = mongoose.model('message', message_schema)

// export the model and the validation function
module.exports.message = message
module.exports.validate_message = validate_message