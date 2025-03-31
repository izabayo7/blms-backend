// import dependencies
const {Schema} = require('mongoose')
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
 *       title:
 *         type: string
 *       target  :
 *         type: object
 *         properties:
 *           type:
 *             type: string
 *           id:
 *             type: string
 *       specific_receivers:
 *         type: array
 *         items:
 *            type: string
 *       content:
 *         type: string
 *       viewers:
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
        },
        id: {
            type: Schema.Types.ObjectId,
        }
    },
    content: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    viewers: [{
        type: String,
        ref: 'user'
    }],
    specific_receivers: [{
        type: String,
        ref: 'user'
    }]
}, {timestamps: true})

// validate announcement
function validate_announcement(credentials, action = 'create', type) {
    const schema = action === 'create' ? type === 'specific_users' ? {
        title: Joi.string().required(),
        content: Joi.string().max(9000).required(),
        specific_receivers: Joi.array().min(1).items(Joi.string())
    } : {
        title: Joi.string().required(),
        target: Joi.object({
            type: Joi.string().required(),
            id: Joi.ObjectId().required()
        }).required(),
        content: Joi.string().max(9000).required()
    } : {
        title: Joi.string().required(),
        content: Joi.string().max(9000).required()
    }
    return Joi.validate(credentials, schema)
}

// create announcements model
const announcement = mongoose.model('announcement', announcement_schema)

// export the model and the validation function
module.exports.Announcement = announcement
module.exports.validate_announcement = validate_announcement