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
        // unique: true,
        // required: true
    },
    date_of_birth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: true
    },
    password: {
        type: String,
        min: 8,
        required: true
    },
    phone: {
        type: String
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
        type: String,
        ref: "college",
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

exports.PasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/

// validate user
exports.validate_user = (credentials, method = 'create') => {
    const schema = method == 'create' ? {
        sur_name: Joi.string().min(3).max(100).required(),
        other_names: Joi.string().min(3).max(100).required(),
        user_name: Joi.string().min(3).max(100).required(), // regex needed
        gender: Joi.string().min(4).max(6).valid('male', 'female').required(),
        password: Joi.string().max(100).regex(this.PasswordRegex).required(),
        email: Joi.string().email().required(),
        date_of_birth: Joi.date(),
        college: Joi.string(),
        category: Joi.string().required(),
        status: Joi.object({ disabled: Joi.number().min(0).max(1).required(), active: Joi.number().min(0).max(2).required() })
    } : {
            sur_name: Joi.string().min(3).max(100),
            other_names: Joi.string().min(3).max(100),
            user_name: Joi.string().min(3).max(100), // regex needed
            national_id: Joi.string().min(16).max(16), // regex needed
            gender: Joi.string().min(4).max(6).valid('male', 'female'),
            phone: Joi.string().max(10).min(10), // regex needed
            email: Joi.string().email(),
            date_of_birth: Joi.date()
        }
    return Joi.validate(credentials, schema)
}

// validate admin
exports.validate_admin = (credentials, method = 'create') => {
    const schema = {
        sur_name: Joi.string().min(3).max(100).required(),
        other_names: Joi.string().min(3).max(100).required(),
        user_name: Joi.string().min(3).max(100).required(),
        gender: Joi.string().min(4).max(6).valid('male', 'female').required(),
        password: Joi.string().max(100).regex(PasswordRegex).required(),
        email: Joi.string().email().required(),
        maximum_users: Joi.number().required(),
        college: Joi.string().min(3).max(200),
        position: Joi.string().min(3).max(50).required()
    }
    return Joi.validate(credentials, schema)
}

exports.validateUserPasswordUpdate = (data) => {
    const schema = {
        current_password: Joi.string().max(100).regex(PasswordRegex).required(),
        new_password: Joi.string().max(100).regex(PasswordRegex).required()
    }
    return Joi.validate(data, schema)
}

// create users model
exports.user = mongoose.model('user', userSchema)