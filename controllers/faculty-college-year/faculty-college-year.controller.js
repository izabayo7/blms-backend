// import dependencies
const {
  express,
  FacultyCollegeYear,
  CollegeYear,
  College,
  FacultyCollege,
  validateFacultyCollegeYear,
  validateObjectId,
  removeDocumentVersion,
  StudentFacultyCollegeYear,
  simplifyObject
} = require('../../utils/imports')
const {
  Faculty
} = require('../../models/faculty/faculty.model')
// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   FacultyCollegeYear:
 *     properties:
 *       _id:
 *         type: string
 *       facultyCollege:
 *         type: string
 *       collegeYear:
 *         type: string
 *     required:
 *       - facultyCollege
 *       - collegeYear
 */

/**
 * @swagger
 * /faculty-college-year:
 *   get:
 *     tags:
 *       - FacultyCollegeYear
 *     description: Get all facultyCollegeYears
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
    let facultyCollegeYears = await FacultyCollegeYear.find().lean()

    if (facultyCollegeYears.length === 0)
      return res.send('faculty-faculty-college-years list is empty').status(404)

    facultyCollegeYears = await injectDetails(facultyCollegeYears)

    return res.send(facultyCollegeYears).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /faculty-college-year/college/{id}:
 *   get:
 *     tags:
 *       - FacultyCollegeYear
 *     description: Returns facultyCollegeYears in a specified college
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
  try {
    // check if college exist
    let college = await College.findOne({
      _id: req.params.id
    })
    if (!college)
      return res.status(404).send(`College with code ${req.params.id} doens't exist`)

    let facultyCollegeYears = await FacultyCollege.find({
      college: req.params.id
    })
    if (facultyCollegeYears.length < 1)
      return res.send(`facultyCollege in ${college.name} Not Found`)

    let foundFacultyCollegeYears = []

    for (const facultyCollege of facultyCollegeYears) {
      const facultyDetails = await Faculty.findOne({
        _id: facultyCollege.faculty
      })
      const response = await FacultyCollegeYear.find({
        facultyCollege: facultyCollege._id
      })
      for (const newFacultyCollegeYear of response) {
        const yearDetails = await CollegeYear.findOne({
          _id: newFacultyCollegeYear.collegeYear
        })
        foundFacultyCollegeYears.push({
          _id: newFacultyCollegeYear._id,
          facultyCollege: newFacultyCollegeYear.facultyCollege,
          collegeYear: newFacultyCollegeYear.collegeYear,
          name: `${facultyDetails.name} Year ${yearDetails.digit}`
        })
      }
    }
    if (foundFacultyCollegeYears.length < 1)
      return res.status(404).send(`There are no Faculty College Years in ${college.name}`)

      foundFacultyCollegeYears = await injectDetails(foundFacultyCollegeYears)

    return res.send(foundFacultyCollegeYears).status(200)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /faculty-college-year:
 *   post:
 *     tags:
 *       - FacultyCollegeYear
 *     description: Create facultyCollegeYear
 *     parameters:
 *       - name: body
 *         description: Fields for a facultyCollegeYear
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/FacultyCollegeYear'
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
    } = validateFacultyCollegeYear(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)

    // check if facultyCollege exist
    let facultyCollege = await FacultyCollege.findOne({
      _id: req.body.facultyCollege
    })
    if (!facultyCollege)
      return res.send(`FacultyCollege with code ${req.body.facultyCollege} doens't exist`)

    // check if collegeYear exist
    let collegeYear = await CollegeYear.findOne({
      _id: req.body.collegeYear
    })
    if (!collegeYear)
      return res.send(`CollegeYearwith code ${req.body.collegeYear} doens't exist`)

    let facultyCollegeYear = await FacultyCollegeYear.findOne({
      facultyCollege: req.body.facultyCollege,
      collegeYear: req.body.collegeYear
    })
    if (facultyCollegeYear)
      return res.send(`facultyCollegeYear you want to create arleady exist`)

    let newDocument = new FacultyCollegeYear({
      facultyCollege: req.body.facultyCollege,
      collegeYear: req.body.collegeYear
    })
    let saveDocument = await newDocument.save()
    if (saveDocument){
      saveDocument = await injectDetails([simplifyObject(saveDocument)])
      return res.send(saveDocument[0]).status(201)
  }
    return res.send('New facultyCollegeYear not Registered').status(500)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /faculty-college-year/{id}:
 *   delete:
 *     tags:
 *       - FacultyCollegeYear
 *     description: Delete a facultyCollegeYear
 *     parameters:
 *       - name: id
 *         description: facultyCollegeYear's id
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

  let facultyCollegeYear = await FacultyCollegeYear.findOne({
    _id: req.params.id
  })
  if (!facultyCollegeYear)
    return res.send(`facultyCollegeYear of Code ${req.params.id} Not Found`)

  let deleteFacultyCollege = await FacultyCollegeYear.findOneAndDelete({
    _id: req.params.id
  })
  if (!deleteFacultyCollege)
    return res.send('facultyCollegeYear Not Deleted').status(500)

  return res.send(`facultyCollegeYear ${deleteFacultyCollege._id} Successfully deleted`).status(200)
})

// link the student with his/her current college
async function injectDetails(facultyCollegeYears) {
  for (const i in facultyCollegeYears) {

    const facultyCollege = await FacultyCollege.findOne({
      _id: facultyCollegeYears[i].facultyCollege
    }).lean()
    facultyCollegeYears[i].facultyCollege = removeDocumentVersion(facultyCollege)

    const faculty = await Faculty.findOne({
      _id: facultyCollegeYears[i].facultyCollege.faculty
    }).lean()
    facultyCollegeYears[i].facultyCollege.faculty = removeDocumentVersion(faculty)

    const college = await College.findOne({
      _id: facultyCollegeYears[i].facultyCollege.college
    }).lean()
    facultyCollegeYears[i].facultyCollege.college = removeDocumentVersion(college)
    if (facultyCollegeYears[i].facultyCollege.college.logo) {
      facultyCollegeYears[i].facultyCollege.college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}/${college.logo}`
    }

    const collegeYear = await CollegeYear.findOne({
      _id: facultyCollegeYears[i].collegeYear
    }).lean()
    facultyCollegeYears[i].collegeYear = removeDocumentVersion(collegeYear)

    // add the number of students
    const attendants = await StudentFacultyCollegeYear.find({ facultyCollegeYear: facultyCollegeYears[i]._id }).countDocuments()
    facultyCollegeYears[i].attendants = attendants
  }
  return facultyCollegeYears
}

// export the router
module.exports = router