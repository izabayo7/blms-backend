
// leaders mukanya
// import dependencies
const {
  express,
  findDocuments,
  Faculty_college,
  formatResult,
  findDocument,
  College,
  Faculty,
  createDocument,
  deleteDocument,
  validate_faculty_college,
  Faculty_college_year,
  validateObjectId,
  updateDocument,
} = require('../../utils/imports')
// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Faculty_college:
 *     properties:
 *       faculty:
 *         type: string
 *       college:
 *         type: string
 *     required:
 *       - faculty
 *       - college
 */

/**
 * @swagger
 * /faculty_college:
 *   get:
 *     tags:
 *       - Faculty_college
 *     description: Get all faculty_colleges
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
    let result = await findDocuments(Faculty_college)

    if (result.length === 0)
      return res.send(formatResult(404, 'faculty_college list is empty'))

    // result = await injectDetails(result)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})


/**
 * @swagger
 * /faculty_college:
 *   post:
 *     tags:
 *       - Faculty_college
 *     description: Create faculty_college
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a faculty_college
 *         in: body
 *         required: true
 *         type: object
 *         properties:
 *           faculty:
 *             type: string
 *             description: faculty name
 *           college:
 *             description: college name
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
    } = validate_faculty_college(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if faculty exist
    let faculty = await findDocument(Faculty, {
      name: req.body.faculty
    })
    if (!faculty)
      return res.send(formatResult(404, 'faculty not found'))

    // check if college exist
    let college = await findDocument(College, {
      name: req.body.college
    })
    if (!college)
      return res.send(formatResult(404, 'college not found'))

    let faculty_college = await findDocument(Faculty_college, {
      faculty: faculty._id,
      college: college._id
    })
    if (faculty_college)
      return res.send(formatResult(403, 'faculty_college arleady exist'))

    let result = await createDocument(Faculty_college, {
      faculty: faculty._id,
      college: college._id
    })

    // result = await injectDetails([simplifyObject(result)])
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /faculty_college/{id}:
 *   delete:
 *     tags:
 *       - Faculty_college
 *     description: Delete as faculty_college
 *     parameters:
 *       - name: id
 *         description: faculty_college's id
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

    let faculty_college = await findDocument(Faculty_college, {
      _id: req.params.id
    })
    if (!faculty_college)
      return res.send(formatResult(404, `faculty_college of Code ${req.params.id} Not Found`))

    // check if the faculty_college is never used
    const faculty_college_found = await findDocument(Faculty_college_year, {
      faculty_college: req.params.id
    })
    if (!faculty_college_found) {
      let result = await deleteDocument(Faculty_college, req.params.id)
      return res.send(result)
    }

    const update_faculty_college = await updateDocument(Faculty_college, req.params.id, {
      status: 0
    })
    return res.send(formatResult(200, `Faculty_college ${update_faculty_college.data._id} couldn't be deleted because it was used, instead it was disabled`, update_faculty_college.data))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// replace relation ids with their references
async function injectDetails(faculty_colleges) {
  for (const i in faculty_colleges) {

    const faculty = await Faculty.findOne({
      _id: faculty_colleges[i].faculty
    }).lean()
    faculty_colleges[i].faculty = removeDocumentVersion(faculty)

    const college = await College.findOne({
      _id: faculty_colleges[i].college
    }).lean()
    faculty_colleges[i].college = removeDocumentVersion(college)
    if (faculty_colleges[i].college.logo) {
      faculty_colleges[i].college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}/${college.logo}`
    }
  }
  return faculty_colleges
}

// export the router
module.exports = router