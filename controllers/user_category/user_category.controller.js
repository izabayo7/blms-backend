// import dependencies
const { result } = require('lodash')
const {
  express,
  User_category,
  validate_user_category,
  formatResult,
  validateObjectId,
  createDocument,
  updateDocument,
  deleteDocument,
  findDocument,
  findDocuments,
  User,
  u,
  User_role,
  auth
} = require('../../utils/imports')
const {filterUsers} = require("../../middlewares/auth.middleware");

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
 *     security:
 *       - bearerAuth: -[]
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', auth, filterUsers(['SUPERADMIN']), async (req, res) => {
  try {
    const user_categories = await findDocuments(User_category)
    if (user_categories.length === 0)
      return res.send(formatResult(404, 'User_category list is empty'))

    return res.send(formatResult(u, u, user_categories))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})


/**
 * @swagger
 * /user_category/open:
 *   get:
 *     tags:
 *       - User_category
 *     description: Get all user_categories names
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/open', async (req, res) => {
  try {
    const user_categories = await findDocuments(User_category, {
      $and: [
        // {
        //   name: {
        //     $ne: 'ADMIN'
        //   }
        // },
        {
          name: {
            $ne: 'SUPER_ADMIN'
          }
        }
      ]
    })

    const result = []

    for (const i in user_categories) {
      result.push(user_categories[i].name)
    }

    return res.send(formatResult(u, u, result))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user_category/id/{id}:
 *   get:
 *     tags:
 *       - User_category
 *     description: Returns a specified user_category
 *     security:
 *       - bearerAuth: -[]
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
router.get('/id/:id', auth, async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const user_category = await findDocument(User_category, {
      _id: req.params.id
    })
    if (!user_category)
      return res.send(formatResult(404, 'User_category not found'))

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
 *     security:
 *       - bearerAuth: -[]
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
router.post('/', auth, filterUsers(['SUPERADMIN']), async (req, res) => {
  try {
    const {
      error
    } = validate_user_category(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if user_category exist
    let user_category = await findDocument(User_category, {
      name: req.body.name
    })
    if (user_category)
      return res.send(formatResult(400, 'User_category arleady exist'))

    for (const i in req.body.user_roles) {
      // check if user_role exist
      let user_role = await findDocument(User_role, {
        _id: req.body.user_roles[i].id
      })
      if (!user_role)
        return res.send(formatResult(404, `Use_role ${req.body.user_roles[i].id} doesn't exist`))
    }

    let result = await createDocument(User_category, {
      name: req.body.name,
      description: req.body.description,
      user_roles: req.body.user_roles
    })
    return res.send(result)
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
 *     security:
 *       - bearerAuth: -[]
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
router.put('/:id', auth, filterUsers(['SUPERADMIN']), async (req, res) => {
  try {
    let {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    error = validate_user_category(req.body)
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if user_category exist
    let user_category = await findDocument(User_category, {
      _id: req.params.id
    })
    if (!user_category)
      return res.send(formatResult(404, 'User_category not found'))

    // check if user_category name is available
    user_category = await findDocument(User_category, {
      _id: { $ne: req.params.id },
      name: req.body.name
    })
    if (user_category)
      return res.send(formatResult(400, 'User_category arleady exist'))

    for (const i in req.body.user_roles) {
      // check if user_role exist
      let user_role = await findDocument(User_role, {
        _id: req.body.user_roles[i].id
      })
      if (!user_role)
        return res.send(formatResult(404, `Use_role ${req.body.user_roles[i].id} doesn't exist`))
    }

    const result = await updateDocument(User_category, req.params.id, req.body)
    return res.send(result)
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
 *     security:
 *       - bearerAuth: -[]
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
router.delete('/:id', auth, filterUsers(['SUPERADMIN']), async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))
    let user_category = await findDocument(User_category, {
      _id: req.params.id
    })
    if (!user_category)
      return res.send(formatResult(404, 'User_category not found'))

    // check if the user_category is never used
    const user = await findDocument(User, {
      category: req.params.id
    })
    if (!user) {
      const result = await deleteDocument(User_category, req.params.id)
      return res.send(result)
    }

    const update_category = await updateDocument(User_category, req.params.id, {
      status: 0
    })
    return res.send(formatResult(200, `User_category ${user_category.name} couldn't be deleted because it was used, instead it was disabled`, update_category.data))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// export the router
module.exports = router