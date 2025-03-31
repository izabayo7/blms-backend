// import dependencies
const {jwt, config, formatResult, User} = require('../utils/imports')

async function auth(req, res, next) {
    const header = req.header('authorization')
    const token = header ? header.split(' ')[1] : req.query.token
    if (!token)
        return res.send(formatResult(401, 'No Token Found'))
    try {
        const decoded = jwt.verify(token, config.get('auth_key'))
        const user = await User.findOne({
            user_name: decoded.user_name
        }).populate('category')
        if (!user)
            return res.send(formatResult(401, 'Invalid Token'))
        req.user = user
        next()
    } catch (err) {
        res.send(formatResult(401, 'Invalid Token', err))
    }
}

function filterUsers(allowed_users) {
    return (req, res, next) => {
        if (!allowed_users.includes(req.user.category.name)) return res.send(formatResult(403, "You have no access ..."))
        next()
    }
}

module.exports = {
    auth,
    filterUsers
}