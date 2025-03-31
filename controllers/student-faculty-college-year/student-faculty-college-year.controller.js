// import dependencies
const {
  express,
  FacultyCollegeYear,
  StudentFacultyCollegeYear,
  Student,
  validateStudentFacultyCollegeYear,
  validateObjectId,
  CollegeYear,
  Faculty,
  College,
  FacultyCollege,
  removeDocumentVersion,
  simplifyObject,
  _
} = require('../../utils/imports')
// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   StudentFacultyCollegeYear:
 *     properties:
 *       _id:
 *         type: string
 *       student:
 *         type: string
 *       facultyCollegeYear:
 *         type: string
 *       status:
 *         type: number
 *     required:
 *       - student
 *       - faciltiyCollegeYear
 */

/**
 * @swagger
 * /kurious/student-faculty-college-year:
 *   get:
 *     tags:
 *       - StudentFacultyCollegeYear
 *     description: Get all studentFacultyCollegeYears
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
    let studentFacultyCollegeYears = await StudentFacultyCollegeYear.find().lean()

    if (studentFacultyCollegeYears.length === 0)
      return res.send('student-student-faculty-college-years list is empty').status(404)
    studentFacultyCollegeYears = await injectDetails(studentFacultyCollegeYears)
    return res.send(studentFacultyCollegeYears).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/student-faculty-college-year/student/{id}:
 *   get:
 *     tags:
 *       - StudentFacultyCollegeYear
 *     description: Get a student's current studentFacultyCollegeYear
 *     parameters:
 *       - name: id
 *         description: Student's id
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
router.get('/student/:id', async (req, res) => {
  try {

    let studentFacultyCollegeYear = await StudentFacultyCollegeYear.findOne({
      student: req.params.id,
      status: 1
    }).lean()

    if (!studentFacultyCollegeYear)
      return res.status(404).send(`student-student-faculty-college-year for ${req.params.id} was not found`)
    studentFacultyCollegeYear = await injectDetails([studentFacultyCollegeYear])
    return res.send(studentFacultyCollegeYear[0]).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/student-faculty-college-year:
 *   post:
 *     tags:
 *       - StudentFacultyCollegeYear
 *     description: Create studentFacultyCollegeYear
 *     parameters:
 *       - name: body
 *         description: Fields for a studentFacultyCollegeYear
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/StudentFacultyCollegeYear'
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
    } = validateStudentFacultyCollegeYear(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)

    // check if facultyCollegeYear exist
    let facultyCollegeYear = await FacultyCollegeYear.findOne({
      _id: req.body.facultyCollegeYear
    })
    if (!facultyCollegeYear)
      return res.send(`FacultyCollegeYear with code ${req.body.facultyCollegeYear} doens't exist`)

    // check if student exist
    let student = await Student.findOne({
      _id: req.body.student
    })
    if (!student)
      return res.send(`Student with code ${req.body.student} doens't exist`)

    let activeStudentFacilliyCollegeYear = await StudentFacultyCollegeYear.findOne({
      student: req.body.student,
      status: 1
    })
    if (activeStudentFacilliyCollegeYear) {
      let updateDocument = await StudentFacultyCollegeYear.findOneAndUpdate({
        student: req.body.student,
        status: 1
      }, {
        status: 0
      })
      if (!updateDocument)
        return res.send(`Error while inserting student faculty`)
    }

    let studentFacilliyCollegeYear = await StudentFacultyCollegeYear.findOne({
      facultyCollegeYear: req.body.facultyCollegeYear,
      student: req.body.student
    })
    if (studentFacilliyCollegeYear)
      return res.send(`studentFacilliyCollegeYear you want to create arleady exist`)

    let newDocument = new StudentFacultyCollegeYear({
      facultyCollegeYear: req.body.facultyCollegeYear,
      student: req.body.student
    })
    let saveDocument = await newDocument.save()
    if (saveDocument){
      saveDocument = await simplifyObject(saveDocument)
      saveDocument = await injectDetails([saveDocument])
      return res.send(saveDocument[0]).status(201)
    }
    return res.send('New studentFacilliyCollegeYear not Registered').status(500)
  } catch (error) {
    console.log(error)
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/student-faculty-college-year/{id}:
 *   delete:
 *     tags:
 *       - StudentFacultyCollegeYear
 *     description: Delete a studentFacultyCollegeYear
 *     parameters:
 *       - name: id
 *         description: studentFacultyCollegeYear's id
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

  let studentFacilliyCollegeYear = await StudentFacultyCollegeYear.findOne({
    _id: req.params.id
  })
  if (!studentFacilliyCollegeYear)
    return res.send(`studentFacilliyCollegeYear of Code ${req.params.id} Not Found`)

  let deleteDocument = await StudentFacultyCollegeYear.findOneAndDelete({
    _id: req.params.id
  })
  if (!deleteDocument)
    return res.send('studentFacilliyCollegeYear Not Deleted').status(500)

  return res.send(`studentFacilliyCollegeYear ${deleteDocument._id} Successfully deleted`).status(200)
})

// link the student with his/her current college
async function injectDetails(studentsFacultyCollegeYears) {
  for (const i in studentsFacultyCollegeYears) {
    const facultyCollegeYear = await FacultyCollegeYear.findOne({
      _id: studentsFacultyCollegeYears[i].facultyCollegeYear
    }).lean()
    studentsFacultyCollegeYears[i].facultyCollegeYear = removeDocumentVersion(facultyCollegeYear)

    const collegeYear = await CollegeYear.findOne({
      _id: facultyCollegeYear.collegeYear
    }).lean()
    studentsFacultyCollegeYears[i].facultyCollegeYear.collegeYear = removeDocumentVersion(collegeYear)

    const facultyCollege = await FacultyCollege.findOne({
      _id: facultyCollegeYear.facultyCollege
    }).lean()
    studentsFacultyCollegeYears[i].facultyCollegeYear.facultyCollege = removeDocumentVersion(facultyCollege)

    const faculty = await Faculty.findOne({
      _id: facultyCollege.faculty
    }).lean()
    studentsFacultyCollegeYears[i].facultyCollegeYear.facultyCollege.faculty = removeDocumentVersion(faculty)

    const college = await College.findOne({
      _id: facultyCollege.college
    }).lean()
    studentsFacultyCollegeYears[i].facultyCollegeYear.facultyCollege.college = removeDocumentVersion(college)
    if (studentsFacultyCollegeYears[i].facultyCollegeYear.facultyCollege.college.logo) {
      studentsFacultyCollegeYears[i].facultyCollegeYear.facultyCollege.college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}`
    }
    let student = await Student.findOne({
      _id: studentsFacultyCollegeYears[i].student
    }).lean()
    studentsFacultyCollegeYears[i].student = _.pick(student, ['_id', 'surName', 'otherNames', 'gender', 'phone', 'profile'])
    // add student profile media path
    if (student.profile) {
      studentsFacultyCollegeYears[i].student.profile = `http://${process.env.HOST}/kurious/file/studentProfile/${student._id}`
    }
  }
  return studentsFacultyCollegeYears
}

// export the router
module.exports = router