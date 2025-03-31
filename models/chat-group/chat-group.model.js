// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')
const memberSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
})
memberSchema.plugin(timestamps)
const chatGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    members: [memberSchema],
    private: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: true
    }
})

chatGroupSchema.plugin(timestamps)

// validate chatGroup
function validatechatGroup(credentials) {
    const schema = {
        name: Joi.string().required(),
        members: Joi.array().min(1).items({ id: Joi.ObjectId().required() }),
        desctiption: Joi.string(),
        private: Joi.boolean().required()
    }
    return Joi.validate(credentials, schema)
}

// create chatGroups model
const chatGroup = mongoose.model('chatGroup', chatGroupSchema)

// export the model and the validation function
module.exports.chatGroup = chatGroup
module.exports.validatechatGroup = validatechatGroup