// import dependencies
const {
  express,
  User_category,
  validate_user_category,
  formatResult,
  validateObjectId,
  User,
  u
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   User_category:
 *     properties:
 *       name:
 *         type: string
 *       description:
 *         type: string
 *     required:
 *       - name
 */

/**
 * @swagger
 * /user_category:
 *   get:
 *     tags:
 *       - User_category
 *     description: Get all user_categories
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', async (req, res) => {
  try {
    const user_categories = await User_category.find()
    if (user_categories.length === 0)
      return res.send(formatResult(404, 'User_category list is empty'))
    return res.send(formatResult(u, u, user_categories))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})


/**
 * @swagger
 * /user_category/{id}:
 *   get:
 *     tags:
 *       - User_category
 *     description: Returns a specified user_category
 *     parameters:
 *       - name: id
 *         description: User_category's id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))
    const user_category = await User_category.findOne({
      _id: req.params.id
    })
    if (!user_category)
      return res.send(formatResult(404, `User_category ${req.params.id} Not Found`))
    return res.send(formatResult(u, u, user_category))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user_category:
 *   post:
 *     tags:
 *       - User_category
 *     description: Create User_category
 *     parameters:
 *       - name: body
 *         description: Fields for a User_category
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/User_category'
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.post('/', async (req, res) => {
  try {
    const {
      error
    } = validate_user_category(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if user_category exist
    let user_category = await User_category.findOne({
      name: req.body.name
    })
    if (user_category)
      return res.send(formatResult(404, `User_category ${req.body.name} arleady exist`))

    let newDocument = new User_category({
      name: req.body.name,
    })
    const saveDocument = await newDocument.save()
    if (saveDocument)
      return res.send(formatResult(201, u, saveDocument))
    return res.send(500, 'New User_category not Registered')
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user_category/{id}:
 *   put:
 *     tags:
 *       - User_category
 *     description: Update User_category
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: User_category's Id
 *         schema:
 *           $ref: '#/definitions/User_category'
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.put('/:id', async (req, res) => {
  try {
    let {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if user_category exist
    let user_category = await User_category.findOne({
      _id: req.params.id
    })
    if (!user_category)
      return res.send(formatResult(404, `User_category with code ${req.params.id} doens't exist`))

    const updateDocument = await User_category.findOneAndUpdate({
      _id: req.params.id
    }, req.body, {
      new: true
    })
    if (updateDocument)
      return res.send(formatResult(u, u, updateDocument)).status(201)
    return res.send("Error ocurred").status(500)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user_category/{id}:
 *   delete:
 *     tags:
 *       - User_category
 *     description: Delete as User_category
 *     parameters:
 *       - name: id
 *         description: User_category's id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))
    let user_category = await User_category.findOne({
      _id: req.params.id
    })
    if (!user_category)
      return res.send(formatResult(404, `User_category of Code ${req.params.id} Not Found`))

    // check if the user_category is never used
    const user = await User.findOne({ category: req.params.id })
    if (!user) {
      const deleteUser_category = await User_category.findOneAndDelete({
        _id: req.params.id
      })
      if (!deleteUser_category)
        return res.send(formatResult(500, 'User_category Not Deleted'))
      return res.send(formatResult(500, `User_category ${deleteUser_category._id} Successfully deleted`))
    }
    console.log(user)
    user_category.status = 0
    const update_category = await user_category.save()
    if (!update_category)
      return res.send(formatResult(500, 'User_category Not Deleted'))
    return res.send(formatResult(500, `User_category ${user_category.name} couldn't be deleted because it was used, instead it was disabled`))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// export the router
module.exports = router