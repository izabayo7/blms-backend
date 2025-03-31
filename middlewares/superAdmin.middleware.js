function superAdmin(req, res, next) {
  if (!req.user.category === 'SuperAdmin') return res.send('You Have no access ...').status(403)
  next()
}
module.exports.superAdmin = superAdmin