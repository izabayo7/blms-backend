// import dependencies
const {
  express,
  FacultyCollege,
  College,
  Faculty,
  validateFacultyCollege,
  validateObjectId,
  removeDocumentVersion
} = require('../../utils/imports')
// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   FacultyCollege:
 *     properties:
 *       _id:
 *         type: string
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
 *       - FacultyCollege
 *     description: Get all facultyColleges
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', async (req, res) => {
  let facultyColleges = await FacultyCollege.find().lean()
  try {
    if (facultyColleges.length === 0)
      return res.send('faculty-college list is empty').status(404)
    facultyColleges = await injectDetails(facultyColleges)
    return res.send(facultyColleges).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /faculty-college:
 *   post:
 *     tags:
 *       - FacultyCollege
 *     description: Create facultyCollege
 *     parameters:
 *       - name: body
 *         description: Fields for a facultyCollege
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/FacultyCollege'
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
    } = validateFacultyCollege(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)
    console.log('no error')
    // check if faculty exist
    let faculty = await Faculty.findOne({
      _id: req.body.faculty
    })
    if (!faculty)
      return res.send(`Faculty with code ${req.body.faculty} doens't exist`)

    // check if college exist
    let college = await College.findOne({
      _id: req.body.college
    })
    if (!college)
      return res.send(`College with code ${req.body.college} doens't exist`)

    let facultyCollege = await FacultyCollege.findOne({
      faculty: req.body.faculty,
      college: req.body.college
    })
    if (facultyCollege)
      return res.send(`facultyCollege you want to create arleady exist`)

    let newDocument = new FacultyCollege({
      faculty: req.body.faculty,
      college: req.body.college
    })
    const saveDocument = await newDocument.save()
    if (saveDocument)
      return res.send(saveDocument).status(201)
    return res.send('New facultyCollege not Registered').status(500)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /faculty-college/{id}:
 *   delete:
 *     tags:
 *       - FacultyCollege
 *     description: Delete as facultyCollege
 *     parameters:
 *       - name: id
 *         description: facultyCollege's id
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
    return res.send(error.details[0].message).status(400)

  let facultyCollege = await FacultyCollege.findOne({
    _id: req.params.id
  })
  if (!facultyCollege)
    return res.send(`facultyCollege of Code ${req.params.id} Not Found`)

  let deleteFaculty = await FacultyCollege.findOneAndDelete({
    _id: req.params.id
  })
  if (!deleteFaculty)
    return res.send('facultyCollege Not Deleted').status(500)

  return res.send(`facultyCollege ${deleteFaculty._id} Successfully deleted`).status(200)
})

// replace relation ids with their references
async function injectDetails(facultyColleges) {
  for (const i in facultyColleges) {

    const faculty = await Faculty.findOne({
      _id: facultyColleges[i].faculty
    }).lean()
    facultyColleges[i].faculty = removeDocumentVersion(faculty)

    const college = await College.findOne({
      _id: facultyColleges[i].college
    }).lean()
    facultyColleges[i].college = removeDocumentVersion(college)
    if (facultyColleges[i].college.logo) {
      facultyColleges[i].college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}/${college.logo}`
    }
  }
  return facultyColleges
}

// export the router
module.exports = router