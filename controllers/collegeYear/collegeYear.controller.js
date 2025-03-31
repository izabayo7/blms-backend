// import dependencies
const {
  express,
  CollegeYear,
  College,
  validateCollegeYear
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   CollegeYear:
 *     properties:
 *       _id:
 *         type: string
 *       digit:
 *         type: number
 *     required:
 *       - digit
 */

/**
 * @swagger
 * /kurious/college-year:
 *   get:
 *     tags:
 *       - CollegeYear
 *     description: Get all collegeYears
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', async (req, res) => {
  const collegeYears = await CollegeYear.find()
  try {
    if (collegeYears.length === 0)
      return res.status(404).send('CollegeYear list is empty')
    return res.status(200).send(collegeYears)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/college-year/college/{id}:
 *   get:
 *     tags:
 *       - CollegeYear
 *     description: Returns collegeYears in a specified college
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
router.get('/college/:id', async (req, res) => {
  const {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  let college = await College.findOne({
    _id: req.params.id
  })
  if (!college)
    return res.status(404).send(`College ${req.params.id} Not Found`)
  const collegeYears = await CollegeYear.find({
    college: req.params.id
  })
  try {
    if (collegeYears.length === 0)
      return res.status(404).send(`${college.name} collegeYear list is empty`)
    return res.status(200).send(collegeYears)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/college-year/{id}:
 *   get:
 *     tags:
 *       - CollegeYear
 *     description: Returns a specified collegeYear
 *     parameters:
 *       - name: id
 *         description: collegeYear's id
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
  const {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  const collegeYear = await CollegeYear.findOne({
    _id: req.params.id
  })
  try {
    if (!collegeYear)
      return res.status(404).send(`CollegeYear ${req.params.id} Not Found`)
    return res.status(200).send(collegeYear)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/college-year:
 *   post:
 *     tags:
 *       - CollegeYear
 *     description: Create collegeYear
 *     parameters:
 *       - name: body
 *         description: Fields for a collegeYear
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/CollegeYear'
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
  const {
    error
  } = validateCollegeYear(req.body)
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if collegeYear exist
  let collegeYear = await CollegeYear.findOne({
    digit: req.body.digit
  })
  if (collegeYear)
    return res.status(400).send(`CollegeYear ${req.body.digit} arleady exist`)

  let newDocument = new CollegeYear({
    digit: req.body.digit
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.status(201).send(saveDocument)
  return res.status(500).send('New CollegeYear not Registered')
})

/**
 * @swagger
 * /kurious/college-year/{id}:
 *   delete:
 *     tags:
 *       - CollegeYear
 *     description: Delete a collegeYear
 *     parameters:
 *       - name: id
 *         description: collegeYear's id
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
  const {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)

  let collegeYear = await CollegeYear.findOne({
    _id: req.params.id
  })
  if (!collegeYear)
    return res.status(404).send(`CollegeYear of Code ${req.params.id} Not Found`)

  let deletedCollegeYear = await CollegeYear.findOneAndDelete({
    _id: req.params.id
  })
  if (!deletedCollegeYear)
    return res.status(500).send('CollegeYear Not Deleted')
  return res.status(200).send(`CollegeYear ${deletedCollegeYear._id} Successfully deleted`)
})

// export the router
module.exports = router