const mongoose = require('mongoose');
const { Joi } = require('../../utils/imports');
const { PasswordRegex } = require('../user/user.model');

const resetPassword = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true
    },
    token: {
        type: String,
        required: true
    },
    expiration: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'CLOSED'],
        default: 'OPEN'
    }
}, { timestamps: true })

exports.validatePasswordReset = (data, action = 'create') => {
    const schema = action == 'create' ? Joi.object({
        email: Joi.string().email().required(),
    }) : Joi.object({
        password: Joi.string().min(8).regex(PasswordRegex).required(),
        email: Joi.string().email().required(),
        token: Joi.string().required()
    })
    return schema.validate(data)
}

exports.Reset_password = mongoose.model('reset_password', resetPassword);
