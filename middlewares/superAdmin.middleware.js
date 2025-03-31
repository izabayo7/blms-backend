const {formatResult} = require("../utils/imports");

function superAdmin(req, res, next) {
  if (req.user.category.name !== 'SUPERADMIN') return res.send(formatResult(403, "You have no access ..."))
  next()
}
module.exports.superAdmin = superAdmin