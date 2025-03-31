const {formatResult} = require("../utils/imports");

function admin(req, res, next) {
  if (req.user.category.name !== 'ADMIN') return res.send(formatResult(403,'You Have no access ...'))
  next()
}
module.exports.admin = admin