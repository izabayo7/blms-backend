// import dependencies
const { Schema } = require('mongoose')
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

/**
 * @swagger
 * definitions:
 *   Announcements:
 *     properties:
 *       sender:
 *         type: string
 *       target  :
 *         type: object
 *         properties:
 *           type:
 *             type: string
 *           id:
 *             type: string
 *       content:
 *         type: string
 *       views:
 *         type: string
 *     required:
 *       - sender
 *       - target
 *       - content
 */

const announcement_schema = new mongoose.Schema({
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
    views: {
        type: Number,
        default: 0
    }
}, {timestamps: true})

// validate announcement
function validate_announcement(credentials, action = 'create') {
    const schema = action == 'create' ? {
        sender: Joi.string().min(3).max(100).required(),
        target: Joi.object({
            type: Joi.string().required(),
            id: Joi.ObjectId().required()
        }).required(),
        content: Joi.string().max(9000).required()
    } : {
            content: Joi.string().max(9000).required()
        }
    return Joi.validate(credentials, schema)
}

// create announcements model
const announcement = mongoose.model('announcement', announcement_schema)

// export the model and the validation function
module.exports.Announcement = announcement
module.exports.validate_announcement = validate_announcement