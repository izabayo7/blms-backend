const {formatResult} = require("../utils/imports");

function instructor(req, res, next) {
  if (req.user.category.name !== 'INSTRUCTOR') return res.send(formatResult(403,'You Have no access ...'))
  next()
}
module.exports.instructor = instructor