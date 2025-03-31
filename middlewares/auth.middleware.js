// import dependencies
const { jwt, config } = require('../utils/imports')

function auth(req, res, next){
    const token = req.header('authorization');
    if(!token)
        return res.send('No Token Found').status(401)

    try{
        const decoded = jwt.verify(token, config.get('rcaKey'))
        req.user = decoded;
        next();
    }
    catch(err){
           res.send('Invalid Token').status(401)
    }
}
module.exports.auth = auth;