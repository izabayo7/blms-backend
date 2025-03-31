// import dependencies
const { mongoose, Joi, jwt, config } = require('../../utils/imports')

const adminSchema = new mongoose.Schema({
    surName: {
        type: String,
        required: true
    },
    otherNames: {
        type: String,
        required: true
    },
    nationalId: {
        type: String,
        unique: true,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'Admin'
    },
    password: {
        type: String,
        min: 8,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    college: {
        type: String,
        required: true
    },
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
});

// generate login token
adminSchema.methods.generateAuthToken = function () {
    const ONE_DAY = 60 * 60 * 24;
    return jwt.sign(
        {
            _id: this._id,
            surName: this.surName,
            otherNames: this.otherNames,
            nationalId: this.nationalId,
            gender: this.gender,
            phone: this.phone,
            password: this.password,
            email: this.email,
            college: this.college,
            category: this.category,
            profile: this.profile,
        }
        , config.get('KuriousKey'), {
            expiresIn: ONE_DAY
        })
}

// validate admin
function validateAdmin(credentials) {
    const schema = {
        surName: Joi.string().min(3).required(),
        otherNames: Joi.string().min(3).required(),
        nationalId: Joi.string().required().min(16).max(16),
        gender: Joi.string().min(4).max(6).required(),
        password: Joi.string().min(8),
        college: Joi.string().required(),
        email: Joi.string().required(),
        phone: Joi.string().max(10).min(10).required(),
        profile: Joi.string(),
    };
    return Joi.validate(credentials, schema)
}

// create Admins model
const Admin = mongoose.model('Admin', adminSchema)

// export the model and the validation function
module.exports.Admin = Admin
module.exports.validateAdmin = validateAdmin
