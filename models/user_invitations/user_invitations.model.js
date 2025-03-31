// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

/**
 * @swagger
 * definitions:
 *   User_invitation:
 *     properties:
 *       email:
 *         type: string
 *         description: email of the invited user
 *       user:
 *         type: string
 *         description: inviters id
 *       college:
 *         type: string
 *       category:
 *         type: string
 *       token:
 *         type: string
 *       expiration_date:
 *         type: string
 *       status:
 *         type: string
 *         enum: ['PENDING', 'ACCEPTED', 'DENIED', 'EXPIRED']
 *     required:
 *       - email
 *       - user
 *       - category
 *       - token
 *       - expiration_date
 */

const user_invitation_schema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true
    },
    college: {
        type: mongoose.Types.ObjectId,
        ref: "college",
        required: true
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: "user_category",
        required: true
    },
    email: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    expiration_date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'DENIED', 'EXPIRED'],
        default: 'PENDING',

    },
}, { timestamps: true })

// validate user_invitation
exports.validate_user_invitation = (credentials) => {
    const schema = {
        email: Joi.string().email().required(),
        user: Joi.ObjectId(),
        college: Joi.ObjectId(),
        category: Joi.ObjectId().required()
    }
    return Joi.validate(credentials, schema)
}

// create users model
exports.User_invitation = mongoose.model('user_invitation', user_invitation_schema)