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
    isCreator: {
        type: Boolean,
    },
    isAdmin: {
        type: Boolean,
        default: false,
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
    profile: {
        type: String
    },
    college: {
        type: String,
        required: true
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
        members: Joi.array().min(1).items({ _id: Joi.ObjectId(), isCreator: Joi.boolean(), status: Joi.boolean(), isAdmin: Joi.boolean(), id: Joi.ObjectId().required() }),
        desctiption: Joi.string(),
        college: Joi.ObjectId().required(),
        private: Joi.boolean(),
        status: Joi.boolean(),
    }
    return Joi.validate(credentials, schema)
}

// create chatGroups model
const chatGroup = mongoose.model('chatGroup', chatGroupSchema)

// export the model and the validation function
module.exports.chatGroup = chatGroup
module.exports.validatechatGroup = validatechatGroup