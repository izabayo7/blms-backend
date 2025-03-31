// import dependencies
const { mongoose, Joi, jwt, config } = require('../../utils/imports')

const superSuperAdminSchema = new mongoose.Schema({
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
        default: 'SuperAdmin'
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
    profile: {
        type: String,
    }
});

// generate login token
superSuperAdminSchema.methods.generateAuthToken = function () {
    const ONE_DAY = 60 * 60 * 24;
    return jwt.sign(
        {
            _id: this._id,
            surName: this.surName,
            otherNames: this.otherNames,
            nationalId: this.nationalId,
            gender: this.gender,
            phone: this.phone,
            email: this.email,
            password: this.password,
            category: this.type,
            profile: this.profile,
        }
        , config.get('KuriousKey'), {
        expiresIn: ONE_DAY
    })
}

// validate superSuperAdmin
function validateSuperAdmin(credentials) {
    const schema = {
        surName: Joi.string().min(3).required(),
        otherNames: Joi.string().min(3).required(),
        nationalId: Joi.string().required().min(16).max(16),
        gender: Joi.string().min(4).max(6).required(),
        password: Joi.string().min(8),
        phone: Joi.string().max(10).min(10).required(),
        email: Joi.string().required(),
        profile: Joi.string(),
    }
    return Joi.validate(credentials, schema)
}

// create SuperAdmins model
const SuperAdmin = mongoose.model('SuperAdmin', superSuperAdminSchema)

// export the model and the validation function
module.exports.SuperAdmin = SuperAdmin
module.exports.validateSuperAdmin = validateSuperAdmin
