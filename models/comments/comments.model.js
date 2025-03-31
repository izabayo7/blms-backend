// import dependencies
const { Schema } = require('mongoose')
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const comment_schema = new mongoose.Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    target: {
        type: {
            type: String,
            required: true
        },
        id: {
            type: Schema.Types.ObjectId,
            required: true
        }
    },
    content: {
        type: String,
        required: true
    },
    reply: {
        type: Schema.Types.ObjectId
    }
})

comment_schema.plugin(timestamps)

// validate comment
function validate_comment(credentials, action = 'create') {
    const schema = action == 'create' ? {
        sender: Joi.string().min(3).max(100).required(),
        target: Joi.object({
            type: Joi.string().required(),
            id: Joi.ObjectId().required()
        }).required(),
        content: Joi.string().max(9000).required(),
        reply: Joi.ObjectId(),
    } : {
            content: Joi.string().max(9000).required()
        }
    return Joi.validate(credentials, schema)
}

// create comments model
const comment = mongoose.model('comment', comment_schema)

// export the model and the validation function
module.exports.comment = comment
module.exports.validate_comment = validate_comment