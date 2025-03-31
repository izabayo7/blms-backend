function student(req, res, next) {
  if (!req.user.category === 'Student') return res.send('You Have no access ...').status(403)
  next()
}
module.exports.student = student