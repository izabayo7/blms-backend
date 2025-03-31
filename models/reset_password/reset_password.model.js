const mongoose = require('mongoose');

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

exports.Reset_password = mongoose.model('reset_password', resetPassword);
