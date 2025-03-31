// import dependencies
const {
  express,
  Student
} = require('../../utils/imports')

const {
  search
} = require('../../middlewares/search.middleware')

// create router
const router = express.Router()

/**
 * @swagger
 * /users/search:
 *   get:
 *     tags:
 *       - Student
 *     description: Search users
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.post('/', search(Student, {
  $or: [{
    surName: {
      $regex: 'a',
      $options: '$i'
    }
  }, {
    otherNames: {
      $regex: 'a',
      $options: '$i'
    }
  }]
}), (req, res) => {
  res.json(res.paginatedResults)
})

// export the router
module.exports = router