// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const role_schema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    // role status 1(active) 0(inactive)
    status: {
        type: Number,
        default: 1
    },
})
role_schema.plugin(timestamps)

const userSchema = new mongoose.Schema({
    sur_name: {
        type: String,
        required: true
    },
    other_names: {
        type: String,
        required: true
    },
    user_name: {
        type: String,
        unique: true,
        required: true
    },
    national_id: {
        type: String,
        unique: true,
        required: true
    },
    date_of_birth: {
        type: Date
    },
    gender: {
        type: String,
        required: true
    },
    password: {
        type: String,
        min: 8,
        required: true
    },
    phone: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    college: {
        type: String,
        required: true
    },
    roles: [role_schema],
    status: {
        stillMember: {
            type: Boolean,
            default: true,
        },
        active: {
            type: Boolean,
            default: false,
        }
    },
    profile: {
        type: String,
    }
})
userSchema.plugin(timestamps)

// validate user
function validate_user(credentials) {
    const schema = {
        sur_name: Joi.string().min(3).required(),
        other_names: Joi.string().min(3).required(),
        user_name: Joi.string().min(3).required(), // regex needed
        national_id: Joi.string().length(16).required(), // regex needed
        gender: Joi.string().min(4).max(6).required(), // regex needed
        password: Joi.string().min(8),
        phone: Joi.string().max(10).min(10).required(), // regex needed
        email: Joi.string().required(), // regex needed
        profile: Joi.string(), // regex needed
        date_of_birth: Joi.date().required(),
        college: Joi.ObjectId().required(),
        category: Joi.ObjectId().required(),
        roles: Joi.array().items({
            id: Joi.ObjectId().required(),
            status: Joi.number().min(0).max(1)
        })
    }
    return Joi.validate(credentials, schema)
}

// create users model
const user = mongoose.model('user', userSchema)

// export the model and the validation function
module.exports.user = user
module.exports.validate_user = validate_user