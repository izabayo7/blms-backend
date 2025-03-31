// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const status_enum = ['ACTIVE', 'INACTIVE']
const paginate = require('mongoose-paginate-v2')

const dailyLogSchema = new mongoose.Schema({
    online: {
        type: Boolean,
        default: false
    },
    accessed_course: {
        type: Number,
        default: 0
    },
    accessed_live_stream: {
        type: Number,
        default: 0
    },
},{timestamps: true})

const user_log_schema = new mongoose.Schema({
    user: {
        type: String,
        ref: 'user',
        required: true
    },
    // handle online status, course access, liveclass attendance for user every day
    logs: [dailyLogSchema],
}, { timestamps: true })

user_log_schema.plugin(paginate)

// create user_user_group model
const user_log = mongoose.model('user_log', user_log_schema)

// export the model and the validation function
module.exports.User_logs = user_log