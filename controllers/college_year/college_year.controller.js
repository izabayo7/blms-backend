// import dependencies
const {
  express,
  College_year,
  findDocument,
  findDocuments,
  validate_college_year,
  formatResult,
  createDocument,
  deleteDocument,
  validateObjectId,
  Faculty_college_year
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   College_year:
 *     properties:
 *       digit:
 *         type: number
 *     required:
 *       - digit
 */

/**
 * @swagger
 * /college_year:
 *   get:
 *     tags:
 *       - College_year
 *     description: Get all college_years
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
router.get('/', async (req, res) => {
  try {
    const result = await findDocuments(College_year)
    if (result.length === 0)
      return res.send(formatResult(404, 'College_year list is empty'))
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /college_year/{id}:
 *   get:
 *     tags:
 *       - College_year
 *     description: Returns a specified college_year
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: college_year's id
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

    const result = await findDocument(College_year, {
      _id: req.params.id
    })

    if (!result)
      return res.send(formatResult(404, `College_year ${req.params.id} Not Found`))

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /college_year:
 *   post:
 *     tags:
 *       - College_year
 *     description: Create college_year
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a college_year
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/College_year'
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
    } = validate_college_year(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if college_year exist
    let college_year = await findDocument(College_year, {
      digit: req.body.digit
    })
    if (college_year)
      return res.send(formatResult(404, `College_year ${req.body.digit} arleady exist`))

    let result = await createDocument(College_year, {
      digit: req.body.digit
    })

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /college_year/{id}:
 *   delete:
 *     tags:
 *       - College_year
 *     description: Delete a college_year
 *     parameters:
 *       - name: id
 *         description: college_year's id
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

    let college_year = await findDocument(College_year, {
      _id: req.params.id
    })
    if (!college_year)
      return res.send(formatResult(404, `College_year of Code ${req.params.id} Not Found`))

    // check if the college_year is never used
    const year_found = await findDocument(Faculty_college_year, {
      college_year: req.params.id
    })
    if (!year_found) {
      let result = await deleteDocument(College_year, req.params.id)
      return res.send(result)
    }

    return res.send(formatResult(200, `College_year ${req.params.id} couldn't be deleted because it was used`))

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// export the router
module.exports = router