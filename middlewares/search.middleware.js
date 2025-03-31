function search(model, query) {
  console.log(query)
  return async (req, res, next) => {
    console.log('aaaaaaaaaaaaaaaaaaaaa')
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    console.log(page, limit)
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    const results = {}

    if (endIndex < await model.countDocuments().exec()) {
      results.next = {
        page: page + 1,
        limit: limit
      }
    }

    if (startIndex > 0) {
      results.previous = {
        page: page - 1,
        limit: limit
      }
    }
    try {
      results.results = await model.find(query).limit(limit).skip(startIndex).exec()
      res.paginatedResults = results
      next()
    } catch (e) {
      res.status(500).json({
        message: e.message
      })
    }
  }
}
module.exports.search = search