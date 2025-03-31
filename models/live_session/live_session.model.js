// import dependencies
const { Schema } = require('mongoose')
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')

const live_session_schema = new mongoose.Schema({
    target: {
        type: {
            type: String,
            required: true
        },
        id: {
            type: Schema.Types.ObjectId,
            required: true
        }
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    quiz: {
        type: Schema.Types.ObjectId
    }
})

live_session_schema.plugin(timestamps)

// validate live_session
function validate_live_session(credentials) {
    const schema = {
        target: Joi.object({
            type: Joi.string().required(),
            id: Joi.ObjectId().required()
        }).required(),
        date: Joi.date().required(),
        time: Joi.string().regex(/^([0-9]{2})\:([0-9]{2})$/).required(),
        quiz: Joi.ObjectId()
    }
    return Joi.validate(credentials, schema)
}

// create live_sessions model
const live_session = mongoose.model('live_session', live_session_schema)

// export the model and the validation function
module.exports.live_session = live_session
module.exports.validate_live_session = validate_live_session