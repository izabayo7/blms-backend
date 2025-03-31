// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')
const notification_schema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    // notification status 3(not seen) 2(seen but not marked as read) 1(read but not deleted) 0(deleted (this wont be shown but will still be kept))
    status: {
        type: Number,
        default: 3
    },
})
notification_schema.plugin(timestamps)

const user_notification_schema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    notifications: [notification_schema],
})

user_notification_schema.plugin(timestamps)

// validate notification
function validat_user_notification(credentials) {
    const schema = {
        // user: Joi.ObjectId().required(),
        notification: Joi.ObjectId().required(),
        status: Joi.number().min(0).max(3)
    }
    return Joi.validate(credentials, schema)
}

// create notifications model
const user_notification = mongoose.model('User_Notification', user_notification_schema)

// export the model and the validation function
module.exports.user_notification = user_notification
module.exports.validate_user_notification = validat_user_notification