// import dependencies
const { Schema } = require('mongoose')
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const post_schema = new mongoose.Schema({
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    cover_picture: {
        type: String
    },
    content: {
        type: String,
        required: true
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'user'
    }],
    dislikes: [{
        type: Schema.Types.ObjectId,
        ref: 'user'
    }],
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    }
}, { timestamps: true })

// validate post
function validate_post(credentials) {
    const schema = {
        title: Joi.string().required(),
        content: Joi.string().min(30).max(10000).required()
    }
    return Joi.validate(credentials, schema)
}

// create posts model
const post = mongoose.model('post', post_schema)

// export the model and the validation function
module.exports.Post = post
module.exports.validate_post = validate_post