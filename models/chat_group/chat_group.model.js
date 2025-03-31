// import dependencies
const {
    mongoose,
    Joi,
    timestamps,
    base64EncodedImage,
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
    code: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    members: [member_schema],
    profile: {
        type: String
    },
    college: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        default: 1
    }
})

chat_group_schema.plugin(timestamps)

// validate chat_group
function validate_chat_group(credentials, method = 'create') {
    const schema = method == 'create' ? {
        name: Joi.string().required(), // regex needed
        members: Joi.array().min(3).items({
            _id: Joi.ObjectId(),
            isCreator: Joi.boolean(),
            status: Joi.boolean(),
            isAdmin: Joi.boolean(),
            user_name: Joi.string().required()
        }).required(),
        description: Joi.string(),
        college: Joi.ObjectId().required(),
        status: Joi.number(),
    } : method == 'add_members' ? {
        members: Joi.array().min(1).items({
            _id: Joi.ObjectId(),
            isCreator: Joi.boolean(),
            status: Joi.boolean(),
            isAdmin: Joi.boolean(),
            user_name: Joi.string().required()
        }).required()
    } : {
                name: Joi.string().required(), // regex needed
                desctiption: Joi.string(),
                status: Joi.number(),
            }
    return Joi.validate(credentials, schema)
}

function validate_chat_group_profile_udpate(credentials) {
    const schema = {
        profile: Joi.string().regex(/^data:([A-Za-z-+\/]+);base64,(.+)$/).required()
    }
    return Joi.validate(credentials, schema)
}

// create chat_groups model
const chat_group = mongoose.model('chat_group', chat_group_schema)

// export the model and the validation function
module.exports.chat_group = chat_group
module.exports.validate_chat_group = validate_chat_group
exports.validate_chat_group_profile_udpate = validate_chat_group_profile_udpate