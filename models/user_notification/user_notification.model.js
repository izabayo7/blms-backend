// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')
const notificationSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    // notification status 3(not seen) 2(seen but not marked as read) 1(read but not deleted) 0(deleted (this wont be shown but will still be kept))
    status: {
        type: Number,
        default: 3
    },
})
notificationSchema.plugin(timestamps)

const userNotificationSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    notifications: [notificationSchema],
})

userNotificationSchema.plugin(timestamps)

// validate notification
function validatUserNotification(credentials) {
    const schema = {
        user_id: Joi.ObjectId().required(),
        notification_id: Joi.ObjectId().required(),
        status: Joi.number().min(0).max(3)
    }
    return Joi.validate(credentials, schema)
}

// create notifications model
const UserNotification = mongoose.model('User_Notification', userNotificationSchema)

// export the model and the validation function
module.exports.UserNotification = UserNotification
module.exports.validateUserNotification = validatUserNotification