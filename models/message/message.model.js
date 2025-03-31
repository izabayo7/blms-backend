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
    const schema = {
        sender: Joi.ObjectId().required(),
        receivers: Joi.array().min(1).items({ id: Joi.ObjectId().required() }).required(),
        content: Joi.string().max(9000),
        group: Joi.ObjectId(),
        attachments: Joi.array().min(1).items({ src: Joi.string().required() }),
        read: Joi.boolean(),
    }
    return Joi.validate(credentials, schema)
}

// create messages model
const message = mongoose.model('message', message_schema)

// export the model and the validation function
module.exports.message = message
module.exports.validate_message = validate_message