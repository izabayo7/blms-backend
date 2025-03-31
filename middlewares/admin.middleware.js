function admin(req, res, next) {
  if (!req.user.category === 'Admin') return res.send('You Have no access ...').status(403)
  next()
}
module.exports.admin = admin;