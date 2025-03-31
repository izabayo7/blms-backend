// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
} = require('../../utils/imports')
const member_schema = new mongoose.Schema({
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
member_schema.plugin(timestamps)
const chat_group_schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    members: [member_schema],
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

chat_group_schema.plugin(timestamps)

// validate chat_group
function validate_chat_group(credentials) {
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

// create chat_groups model
const chat_group = mongoose.model('chat_group', chat_group_schema)

// export the model and the validation function
module.exports.chat_group = chat_group
module.exports.validate_chat_group = validate_chat_group