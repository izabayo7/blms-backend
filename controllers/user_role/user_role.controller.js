// import dependencies
const {
  express,
  User_role,
  validate_user_role,
  formatResult,
  validateObjectId,
  createDocument,
  updateDocument,
  deleteDocument,
  findDocument,
  findDocuments,
  User,
  u
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   User_role:
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
 * /user_role:
 *   get:
 *     tags:
 *       - User_role
 *     description: Get all user_roles
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
    const result = await findDocuments(User_role)
    if (result.data.length === 0)
      return res.send(formatResult(404, 'User_role list is empty'))
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})


/**
 * @swagger
 * /user_role/{id}:
 *   get:
 *     tags:
 *       - User_role
 *     description: Returns a specified user_role
 *     parameters:
 *       - name: id
 *         description: User_role's id
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
    const result = await findDocument(User_role, {
      _id: req.params.id
    })
    if (!result.data)
      return res.send(formatResult(404, `User_role ${req.params.id} Not Found`))
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user_role:
 *   post:
 *     tags:
 *       - User_role
 *     description: Create User_role
 *     parameters:
 *       - name: body
 *         description: Fields for a User_role
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/User_role'
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
    } = validate_user_role(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if user_role exist
    let user_role = await findDocument(User_role, {
      name: req.body.name
    })
    if (user_role.data)
      return res.send(formatResult(400, `User_role ${req.body.name} arleady exist`))

    let result = await createDocument(User_role, {
      name: req.body.name,
      description: req.body.description
    })
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user_role/{id}:
 *   put:
 *     tags:
 *       - User_role
 *     description: Update User_role
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: User_role's Id
 *         schema:
 *           $ref: '#/definitions/User_role'
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

    error = validate_user_role(req.body)
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if user_role exist
    let user_role = await findDocument(User_role, {
      _id: req.params.id
    })
    if (!user_role.data)
      return res.send(formatResult(404, `User_role with code ${req.params.id} doens't exist`))

    // check if user_role name is available
    user_role = await findDocument(User_role, {
      _id: { $ne: req.params.id },
      name: req.body.name
    })
    if (user_role.data)
      return res.send(formatResult(400, `User_role ${req.body.name} arleady exist`))

    const result = await updateDocument(User_role, req.params.id, req.body)
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user_role/{id}:
 *   delete:
 *     tags:
 *       - User_role
 *     description: Delete as User_role
 *     parameters:
 *       - name: id
 *         description: User_role's id
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
    let user_role = await findDocument(User_role, {
      _id: req.params.id
    })
    if (!user_role)
      return res.send(formatResult(404, `User_role of Code ${req.params.id} Not Found`))

    // check if the user_role is never used
    const user = await findDocument(User, {
      roles: {
        $elemMatch: {
          id: req.params.id
        }
      }
    })
    if (!user.data) {
      const result = await deleteDocument(User_role, req.params.id)
      return res.send(result)
    }

    const update_role = await updateDocument(User_role, req.params.id, {
      status: 0
    })
    return res.send(formatResult(200, `User_role ${user_role.name} couldn't be deleted because it was used, instead it was disabled`))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// export the router
module.exports = router