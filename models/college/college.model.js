// import dependencies
const {
    mongoose,
    Joi,
    timestamps
} = require('../../utils/imports')

const college_schema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String
    },
    maximum_users: {
        type: Number,
        required: true
    },
    location: {
        type: String,
    },
    phone: {
        type: String,
    },
    motto: {
        type: String,
    },
    logo: {
        type: String,
    },
    banner: {
        type: String,
    },
    abbreviation: {
        type: String,
        unique: true,
    },
    users_verification_link: {
        type: String,
    },
    // college status 1(active) 0(inactive)
    status: {
        type: Number,
        default: 1
    },
})
const urlRegex = /((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/
// validate college
function validate_college(credentials) {
    const schema = {
        name: Joi.string().min(3),
        email: Joi.string().email(),
        motto: Joi.string(),
        abbreviation: Joi.string(),
        phone: Joi.string().max(15),
        location: Joi.string(),
        users_verification_link: Joi.string().regex(urlRegex)
    }
    return Joi.validate(credentials, schema)
}

college_schema.plugin(timestamps)

// create college model
const college = mongoose.model('college', college_schema)

// export the model and the validation function
module.exports.college = college
module.exports.validate_college = validate_college