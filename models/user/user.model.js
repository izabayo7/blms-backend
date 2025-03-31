// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

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
        ref: "user_category",
        required: true
    },
    college: {
        type: String
    },
    status: {
        // disabled status 0(enabled) 1(disabled)
        disabled: {
            type: Number,
            default: 0,
        },
        // disabled status 0(offline) 1(set to away but active) 2(active)
        active: {
            type: Number,
            default: 0,
        }
    },
    profile: {
        type: String,
    }
})
userSchema.plugin(timestamps)

// validate user
exports.validate_user = (credentials, method = 'create') => {
    const schema = method = 'create' ? {
        sur_name: Joi.string().min(3).max(100).required(),
        other_names: Joi.string().min(3).max(100).required(),
        user_name: method == 'create' ? Joi.string().min(3).max(100) : Joi.string().min(3).max(100).required(), // regex needed
        national_id: Joi.string().length(16).required(), // regex needed
        gender: Joi.string().min(4).max(6).required(), // regex needed
        password: Joi.string().min(8),
        phone: Joi.string().max(10).min(10).required(), // regex needed
        email: Joi.string().email().required(),
        profile: Joi.string(), // regex needed
        date_of_birth: Joi.date(),
        college: Joi.ObjectId(),
        category: Joi.ObjectId().required(),
        status: Joi.object({ disabled: Joi.number().min(0).max(1).required(), active: Joi.number().min(0).max(2).required() })
    } : {
            sur_name: Joi.string().min(3).max(100).required(),
            other_names: Joi.string().min(3).max(100).required(),
            user_name: method == 'create' ? Joi.string().min(3).max(100) : Joi.string().min(3).max(100).required(), // regex needed
            national_id: Joi.string().length(16).required(), // regex needed
            gender: Joi.string().min(4).max(6).required(), // regex needed
            // password: Joi.string().min(8),
            phone: Joi.string().max(10).min(10).required(), // regex needed
            email: Joi.string().email().required(),
            // profile: Joi.string(), // regex needed
            date_of_birth: Joi.date(),
            // college: Joi.ObjectId(),
            // category: Joi.ObjectId().required(),
            // status: Joi.object({disabled: Joi.number().min(0).max(1).required(), active: Joi.number().min(0).max(2).required()})
        }
    return Joi.validate(credentials, schema)
}

exports.validateUserPasswordUpdate = (data) => {
    const schema = {
        current_password: Joi.string().min(8).required(),
        new_password: Joi.string().min(8).required()
    }
    return Joi.validate(data, schema)
}

// create users model
exports.user = mongoose.model('user', userSchema)