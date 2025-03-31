const { exist } = require('joi')
// import dependencies
const {
  express,
  College,
  User,
  fs,
  validate_college,
  findDocument,
  findDocuments,
  formatResult,
  createDocument,
  updateDocument,
  deleteDocument,
  validateObjectId
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   College:
 *     properties:
 *       _id:
 *         type: string
 *       name:
 *         type: string
 *       email:
 *         type: string
 *       phone:
 *         type: string
 *       location:
 *         type: string
 *       logo:
 *         type: number
 *       disabled:
 *         type: string
 *     required:
 *       - name
 *       - email
 */

/**
 * @swagger
 * /college:
 *   get:
 *     tags:
 *       - College
 *     description: Get all Colleges
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
    let result = await findDocuments(College)
    if (result.data.length === 0)
      return res.send(formatResult(404, 'College list is empty'))
    result.data = await injectLogoMediaPaths(result.data)
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /college/name/{name}:
 *   get:
 *     tags:
 *       - College
 *     description: Returns a specified college by name
 *     parameters:
 *       - name: id
 *         description: College's name
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
router.get('/name/:name', async (req, res) => {
  try {
    let result = await findDocument(College, {
      name: req.params.name
    })
    if (!result.data)
      return res.send(formatResult(404, `College ${req.params.name} Not Found`))
    result.data = await injectLogoMediaPaths([result.data])
    result.data = result.data[0]
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /college/{id}:
 *   get:
 *     tags:
 *       - College
 *     description: Returns a specified college
 *     parameters:
 *       - name: id
 *         description: College's id
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
    let {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let result = await findDocument(College, {
      _id: req.params.id
    })
    if (!result.data)
      return res.status(404).send(`College ${req.params.id} Not Found`)
    result.data = await injectLogoMediaPaths([result.data])
    result.data = result.data[0]
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})


/**
 * @swagger
 * /college:
 *   post:
 *     tags:
 *       - College
 *     description: Create a college
 *     parameters:
 *       - name: body
 *         description: Fields for a college
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/College'
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server error
 */
router.post('/', async (req, res) => {
  try {
    const {
      error
    } = validate_college(req.body)
    if (error)
      return res.send(formatResult(404, error.details[0].message))

    // check if the name or email were not used
    let college = await findDocument(College, {
      $or: [{
        email: req.body.email
      }, {
        name: req.body.name
      }, {
        phone: req.body.phone
      }]
    })

    if (college.data) {
      const phoneFound = req.body.phone == college.data.phone
      const nameFound = req.body.name == college.data.name
      const emailFound = req.body.email == college.data.email
      return res.send(formatResult(400, `College with ${phoneFound ? 'same phone ' : emailFound ? 'same email ' : nameFound ? 'same name ' : ''} arleady exist`))
    }

    let result = await createDocument(College, {
      name: req.body.name,
      email: req.body.email,
      location: req.body.location,
      phone: req.body.phone
    })

    result.data = await injectLogoMediaPaths([result.data])
    result.data = result.data[0]
    return res.send(result)

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /college/{id}:
 *   put:
 *     tags:
 *       - College
 *     description: Update college
 *     parameters:
 *        - name: id
 *          in: path
 *          type: string
 *          description: college's Id
 *        - name: body
 *          description: Fields for a college
 *          in: body
 *          required: true
 *          schema:
 *            $ref: '#/definitions/College'
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

    error = validate_college(req.body, 'update')
    error = error.error

    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if college exist
    let college = await findDocument(College, { _id: req.params.id })
    if (!college.data)
      return res.send(formatResult(404, `College with code ${req.params.id} doens't exist`))

    // check if the name or email were not used
    college = await findDocument(College, {
      _id: {
        $ne: req.params.id
      },
      $or: [{
        email: req.body.email
      }, {
        name: req.body.name
      }, {
        phone: req.body.phone
      }]
    })

    if (college.data) {
      const phoneFound = req.body.phone == college.data.phone
      const nameFound = req.body.name == college.data.name
      const emailFound = req.body.email == college.data.email
      return res.send(formatResult(400, `College with ${phoneFound ? 'same phone ' : emailFound ? 'same email ' : nameFound ? 'same name ' : ''} arleady exist`))
    }

    const result = await updateDocument(College, req.params.id, req.body)
    result.data = await injectLogoMediaPaths([result.data])
    result.data = result.data[0]
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /college/{id}:
 *   delete:
 *     tags:
 *       - College
 *     description: Deletes a college
 *     parameters:
 *       - name: id
 *         description: college's id
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

    let college = await findDocument(College, { _id: req.params.id })
    if (!college.data)
      return res.send(formatResult(404, `College with code ${req.params.id} Not Found`))
    // check if the college is never used
    const user = await findDocument(User, {
      college: req.params.id
    })
    if (!user.data) {
      const result = await deleteDocument(College, req.params.id)

      // delete files if available
      const path = `./uploads/colleges/${req.params.id}`
      fs.exists(path, (exists) => {
        if (exists)
          fs.rmdir(path, { recursive: true })
      })

      return res.send(result)
    }

    const update_role = await updateDocument(College, req.params.id, {
      status: 0
    })
    return res.send(formatResult(200, `College ${college.name} couldn't be deleted because it was used, instead it was disabled`))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

async function injectLogoMediaPaths(colleges) {
  for (const i in colleges) {
    if (colleges[i].logo) {
      colleges[i].logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${colleges[i]._id}/${colleges[i].logo}`
    }
  }
  return colleges
}

// export the router
module.exports = router