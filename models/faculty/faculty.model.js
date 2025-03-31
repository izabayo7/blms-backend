// import dependencies
const { Types } = require('mongoose')
const {
    mongoose,
    Joi
} = require('../../utils/imports')

const paginate = require('mongoose-paginate-v2')

/**
 * @swagger
 * definitions:
 *   Faculty:
 *     properties:
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       college:
 *         type: string
 *       created_by:
 *         type: string
 *       status:
 *         type: string
 *         enum: ['ACTIVE', 'INACTIVE']
 *     required:
 *       - name
 *       - college
 *       - created_by
 *       - description
 */

const faculty_schema = new mongoose.Schema({
    college: {
        type: Types.ObjectId,
        ref: 'college',
        required: true
    },
    description: {
        type: String,
        min: 20
    },
    name: {
        type: String,
        required: true
    },
    created_by: {
        type: Types.ObjectId,
        ref: 'user',
        required: true
    },
    status: {
        type: String,
        default: 'ACTIVE',
        enum: ['ACTIVE', 'INACTIVE']
    },
}, { timestamps: true })

faculty_schema.plugin(paginate)

// validate faculty
function validate_faculty(credentials) {
    const schema = {
        name: Joi.string().min(3).required(),
        // college: Joi.string().required(),
        description: Joi.string()
    }
    return Joi.validate(credentials, schema)
}

// create faculty model
const faculty = mongoose.model('faculty', faculty_schema)

// export the model and the validation function
module.exports.Faculty = faculty
module.exports.validate_faculty = validate_faculty