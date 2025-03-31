// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const paginate = require('mongoose-paginate-v2')

const dailyLogSchema = new mongoose.Schema({
    online: {
        type: Boolean,
        default: false
    },
    accessed_course: [{
        type: String,
        ref: 'course',
    }],
    accessed_live_stream: [{
        type: String,
        ref: 'live_session',
    }],
},{timestamps: true})

const user_log_schema = new mongoose.Schema({
    user: {
        type: String,
        ref: 'user',
        unique: true,
        required: true
    },
    // handle online status, course access, liveclass attendance for user every day
    logs: [dailyLogSchema],
}, { timestamps: true })

user_log_schema.plugin(paginate)

// create user_user_group model
const user_log = mongoose.model('user_log', user_log_schema)

// validate user_user_group
function validate_user_log(credentials) {
    const schema = {
        online: Joi.boolean(),
        course_id: Joi.ObjectId(),
        live_session_id: Joi.ObjectId(),
    }
    return Joi.validate(credentials, schema)
}

// export the model and the validation function
module.exports.User_logs = user_log
module.exports.validate_user_log = validate_user_log