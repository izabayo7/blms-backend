// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')
const notificationSchema = new mongoose.Schema({
    doer_type: {
        type: String,
        required: true
    },
    doer_id: {
        type: String,
    },
    link: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
})
notificationSchema.plugin(timestamps)

// validate notification
function validateNotification(credentials) {
    const schema = {
        doer_id: Joi.ObjectId().required(),
        doer_type: Joi.string().required(),
        link: Joi.string().required(),
        content: Joi.string().required()
    }
    return Joi.validate(credentials, schema)
}

// create notifications model
const Notification = mongoose.model('Notification', notificationSchema)

// export the model and the validation function
module.exports.Notification = Notification
module.exports.validateNotification = validateNotification