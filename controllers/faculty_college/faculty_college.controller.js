
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
  simplifyObject,
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
 * /faculty-college:
 *   get:
 *     tags:
 *       - Faculty_college
 *     description: Get all faculty_colleges
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

    if (result.data.length === 0)
      return res.send(formatResult(404, 'faculty-college list is empty'))

    // result.data = await injectDetails(result.data)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})


/**
 * @swagger
 * /faculty-college:
 *   post:
 *     tags:
 *       - Faculty_college
 *     description: Create faculty_college
 *     parameters:
 *       - name: body
 *         description: Fields for a faculty_college
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Faculty_college'
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
      _id: req.body.faculty
    })
    if (!faculty.data)
      return res.send(formatResult(404, `Faculty with code ${req.body.faculty} doens't exist`))

    // check if college exist
    let college = await findDocument(College, {
      _id: req.body.college
    })
    if (!college.data)
      return res.send(formatResult(404, `College with code ${req.body.college} doens't exist`))

    let faculty_college = await findDocument(Faculty_college, {
      faculty: req.body.faculty,
      college: req.body.college
    })
    if (faculty_college.data)
      return res.send(formatResult(400, `faculty_college you want to create arleady exist`))

    let result = await createDocument(Faculty_college, {
      faculty: req.body.faculty,
      college: req.body.college
    })

    // result.data = await injectDetails([simplifyObject(result.data)])
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /faculty-college/{id}:
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
    if (!faculty_college.data)
      return res.send(formatResult(404, `faculty_college of Code ${req.params.id} Not Found`))

    // check if the faculty_college is never used
    const faculty_college_found = await findDocument(Faculty_college_year, {
      faculty_college: req.params.id
    })
    if (!faculty_college_found.data) {
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