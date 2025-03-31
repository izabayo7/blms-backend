// import dependencies
const {
    mongoose,
    timestamps
} = require('../../utils/imports')

const user_attendance_schema = new mongoose.Schema({
    user: {
        type: String,
        ref: "user",
        required: true
    },
    live_session: {
        type: String,
        ref: "live_session",
        required: true
    },
    attendance: {
        type: Number,
        max: 100,
        default: 0
    },
})

user_attendance_schema.plugin(timestamps)

// create user_attendance model
const user_attendance = mongoose.model('user_attendance', user_attendance_schema)

// export the model and the validation function
module.exports.user_attendance = user_attendance