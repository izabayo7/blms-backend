// import dependencies
const { Schema } = require('mongoose')
const paginate = require('mongoose-paginate-v2')
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

/**
 * @swagger
 * definitions:
 *   Post:
 *     properties:
 *       creator:
 *         type: string
 *       title:
 *         type: string
 *         description: post title
 *       content:
 *         type: string
 *         description: inviters id
 *       cover_picture:
 *         type: string
 *       likes:
 *         type: array
 *         items:
 *           type: string
 *       dislikes:
 *         type: array
 *         items:
 *           type: string
 *       status:
 *         type: string
 *         enum: ['DRAFT', 'PUBLISHED', 'DELETED']
 *     required:
 *       - creator
 *       - title
 *       - content
 */

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
        enum: ['DRAFT', 'PUBLISHED', 'DELETED'],
        default: 'DRAFT'
    }
}, { timestamps: true })

post_schema.plugin(paginate)

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