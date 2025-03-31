// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')
const notification_schema = new mongoose.Schema({
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
notification_schema.plugin(timestamps)

// validate notification
function validate_notification(credentials) {
    const schema = {
        doer_id: Joi.ObjectId().required(),
        doer_type: Joi.string().required(),
        link: Joi.string().required(),
        content: Joi.string().required()
    }
    return Joi.validate(credentials, schema)
}

// create notifications model
const notification = mongoose.model('notification', notification_schema)

// export the model and the validation function
module.exports.notification = notification
module.exports.validate_notification = validate_notification