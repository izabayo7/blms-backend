function instructor(req, res, next) {
    if (!req.user.category === 'Instructor') return res.send('You Have no access ...').status(403)
    next()
  }
  module.exports.instructor = instructor;