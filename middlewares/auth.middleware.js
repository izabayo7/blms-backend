// import dependencies
const { jwt, config, formatResult } = require('../utils/imports')

function auth(req, res, next) {
    const token = req.header('authorization')
    if (!token)
        return res.send(formatResult(401, 'No Token Found'))

    try {
        const decoded = jwt.verify(token, config.get('auth_key'))
        req.user = decoded
        next()
    }
    catch (err) {
        res.send(formatResult(401, 'Invalid Token'))
    }
}
module.exports.auth = auth