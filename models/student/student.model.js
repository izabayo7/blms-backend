// import dependencies
const {
    mongoose,
    Joi,
    jwt,
    config,
    timestamps
} = require('../../utils/imports')

const studentSchema = new mongoose.Schema({
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
    DOB: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'Student'
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
})

studentSchema.plugin(timestamps)

// generate login token
studentSchema.methods.generateAuthToken = function () {
    const ONE_DAY = 60 * 60 * 24
    return jwt.sign({
        _id: this._id,
        surName: this.surName,
        otherNames: this.otherNames,
        nationalId: this.nationalId,
        gender: this.gender,
        DOB: this.DOB,
        phone: this.phone,
        email: this.email,
        password: this.password,
        category: this.category,
        college: this.college,
        profile: this.profile,
    }, config.get('KuriousKey'), {
        expiresIn: ONE_DAY
    })
}

// validate student
function validateStudent(credentials) {
    const schema = {
        surName: Joi.string().min(3).required(),
        otherNames: Joi.string().min(3).required(),
        nationalId: Joi.string().required().min(16).max(16),
        gender: Joi.string().min(4).max(6).required(),
        password: Joi.string().min(8),
        phone: Joi.string().max(10).min(10).required(),
        email: Joi.string().required(),
        college: Joi.string().required(),
        profile: Joi.string(),
        DOB: Joi.date().required()
    }
    return Joi.validate(credentials, schema)
}

// create Students model
const Student = mongoose.model('Student', studentSchema)

// export the model and the validation function
module.exports.Student = Student
module.exports.validateStudent = validateStudent