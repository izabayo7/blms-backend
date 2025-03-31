// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const paginate = require('mongoose-paginate-v2')

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
    user_group: {
        type: mongoose.Types.ObjectId,
        ref: "user_group",
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
        enum: ['PENDING', 'ACCEPTED', 'DENIED'],
        default: 'PENDING',

    },
}, { timestamps: true })

user_invitation_schema.plugin(paginate)

// validate user_invitation
exports.validate_user_invitation = (credentials) => {
    const schema = {
        emails: Joi.array().min(1).items(Joi.string().email().required()).required(),
        user: Joi.ObjectId(),
        user_group: Joi.ObjectId(),
        college: Joi.ObjectId(),
        category: Joi.string().min(5).required()
    }
    return Joi.validate(credentials, schema)
}

// create users model
exports.User_invitation = mongoose.model('user_invitation', user_invitation_schema)