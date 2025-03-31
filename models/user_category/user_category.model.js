// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const role_schema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true
    },
    // role status 1(active) 0(inactive)
    status: {
        type: Number,
        default: 1
    },
})
role_schema.plugin(timestamps)

const user_category_schema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    description: {
        type: String
    },
    // category status 1(active) 0(inactive)
    status: {
        type: Number,
        default: 1
    },
    user_roles: [role_schema]
})

user_category_schema.plugin(timestamps)


// validate user_category
function validate_user_category(credentials) {
    const schema = {
        name: Joi.string().min(5).required(),
        description: Joi.string().min(10),
        user_roles: Joi.array().min(1).items({
            id: Joi.ObjectId().required(),
            status: Joi.number().min(0).max(1)
        })
    }
    return Joi.validate(credentials, schema)
}

// create user_categorys model
const user_category = mongoose.model('user_category', user_category_schema)

// export the model and the validation function
module.exports.user_category = user_category
module.exports.validate_user_category = validate_user_category