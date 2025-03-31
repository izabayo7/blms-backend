const {formatResult} = require("../utils/imports");

function student(req, res, next) {
  if (req.user.category.name === 'STUDENT') return res.send(formatResult(403, 'You Have no access ...'))
  next()
}
module.exports.student = student