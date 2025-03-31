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
    starting_time: {
        type: Date,
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
        }),
        starting_time: Joi.date().required(),
        quiz: Joi.ObjectId()
    }
    return Joi.validate(credentials, schema)
}

// create live_sessions model
const live_session = mongoose.model('live_session', live_session_schema)

// export the model and the validation function
module.exports.live_session = live_session
module.exports.validate_live_session = validate_live_session