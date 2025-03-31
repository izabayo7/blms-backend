function admin(req, res, next) {
  if (!req.user.category.name === 'ADMIN') return res.send('You Have no access ...').status(403)
  next()
}
module.exports.admin = admin