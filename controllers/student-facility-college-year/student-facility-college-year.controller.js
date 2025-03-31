// import dependencies
const {
  express,
  FacilityCollegeYear,
  StudentFacilityCollegeYear,
  Student,
  validateStudentFacilityCollegeYear,
  validateObjectId,
  CollegeYear,
  Facility,
  College,
  FacilityCollege,
  removeDocumentVersion,
  _
} = require('../../utils/imports')
// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   StudentFacilityCollegeYear:
 *     properties:
 *       _id:
 *         type: string
 *       student:
 *         type: string
 *       facilityCollegeYear:
 *         type: string
 *       status:
 *         type: number
 *     required:
 *       - student
 *       - faciltiyCollegeYear
 */

/**
 * @swagger
 * /kurious/student-facility-college-year:
 *   get:
 *     tags:
 *       - StudentFacilityCollegeYear
 *     description: Get all studentFacilityCollegeYears
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
    let studentFacilityCollegeYears = await StudentFacilityCollegeYear.find().lean()

    if (studentFacilityCollegeYears.length === 0)
      return res.send('student-student-facility-college-years list is empty').status(404)
    studentFacilityCollegeYears = await injectDetails(studentFacilityCollegeYears)
    return res.send(studentFacilityCollegeYears).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/student-facility-college-year/student/{id}:
 *   get:
 *     tags:
 *       - StudentFacilityCollegeYear
 *     description: Get a student's current studentFacilityCollegeYear
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

    let studentFacilityCollegeYear = await StudentFacilityCollegeYear.findOne({
      student: req.params.id,
      status: 1
    }).lean()

    if (!studentFacilityCollegeYear)
      return res.status(404).send(`student-student-facility-college-year for ${req.params.id} was not found`)
    studentFacilityCollegeYear = await injectDetails([studentFacilityCollegeYear])
    return res.send(studentFacilityCollegeYear[0]).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/student-facility-college-year:
 *   post:
 *     tags:
 *       - StudentFacilityCollegeYear
 *     description: Create studentFacilityCollegeYear
 *     parameters:
 *       - name: body
 *         description: Fields for a studentFacilityCollegeYear
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/StudentFacilityCollegeYear'
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
    } = validateStudentFacilityCollegeYear(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)

    // check if facilityCollegeYear exist
    let facilityCollegeYear = await FacilityCollegeYear.findOne({
      _id: req.body.facilityCollegeYear
    })
    if (!facilityCollegeYear)
      return res.send(`FacilityCollegeYear with code ${req.body.facilityCollegeYear} doens't exist`)

    // check if student exist
    let student = await Student.findOne({
      _id: req.body.student
    })
    if (!student)
      return res.send(`Student with code ${req.body.student} doens't exist`)

    let activeStudentFacilliyCollegeYear = await StudentFacilityCollegeYear.findOne({
      student: req.body.student,
      status: 1
    })
    if (activeStudentFacilliyCollegeYear) {
      let updateDocument = await StudentFacilityCollegeYear.findOneAndUpdate({
        student: req.body.student,
        status: 1
      }, {
        status: 0
      })
      if (!updateDocument)
        return res.send(`Error while inserting student facility`)
    }

    let studentFacilliyCollegeYear = await StudentFacilityCollegeYear.findOne({
      facilityCollegeYear: req.body.facilityCollegeYear,
      student: req.body.student
    })
    if (studentFacilliyCollegeYear)
      return res.send(`studentFacilliyCollegeYear you want to create arleady exist`)

    let newDocument = new StudentFacilityCollegeYear({
      facilityCollegeYear: req.body.facilityCollegeYear,
      student: req.body.student
    })
    const saveDocument = await newDocument.save()
    if (saveDocument)
      return res.send(saveDocument).status(201)
    return res.send('New studentFacilliyCollegeYear not Registered').status(500)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/student-facility-college-year/{id}:
 *   delete:
 *     tags:
 *       - StudentFacilityCollegeYear
 *     description: Delete a studentFacilityCollegeYear
 *     parameters:
 *       - name: id
 *         description: studentFacilityCollegeYear's id
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

  let studentFacilliyCollegeYear = await StudentFacilityCollegeYear.findOne({
    _id: req.params.id
  })
  if (!studentFacilliyCollegeYear)
    return res.send(`studentFacilliyCollegeYear of Code ${req.params.id} Not Found`)

  let deleteDocument = await StudentFacilityCollegeYear.findOneAndDelete({
    _id: req.params.id
  })
  if (!deleteDocument)
    return res.send('studentFacilliyCollegeYear Not Deleted').status(500)

  return res.send(`studentFacilliyCollegeYear ${deleteDocument._id} Successfully deleted`).status(200)
})

// link the student with his/her current college
async function injectDetails(studentsFacilityCollegeYears) {
  for (const i in studentsFacilityCollegeYears) {
    const facilityCollegeYear = await FacilityCollegeYear.findOne({
      _id: studentsFacilityCollegeYears[i].facilityCollegeYear
    }).lean()
    studentsFacilityCollegeYears[i].facilityCollegeYear = removeDocumentVersion(facilityCollegeYear)

    const collegeYear = await CollegeYear.findOne({
      _id: facilityCollegeYear.collegeYear
    }).lean()
    studentsFacilityCollegeYears[i].facilityCollegeYear.collegeYear = removeDocumentVersion(collegeYear)

    const facilityCollege = await FacilityCollege.findOne({
      _id: facilityCollegeYear.facilityCollege
    }).lean()
    studentsFacilityCollegeYears[i].facilityCollegeYear.facilityCollege = removeDocumentVersion(facilityCollege)

    const facility = await Facility.findOne({
      _id: facilityCollege.facility
    }).lean()
    studentsFacilityCollegeYears[i].facilityCollegeYear.facilityCollege.facility = removeDocumentVersion(facility)

    const college = await College.findOne({
      _id: facilityCollege.college
    }).lean()
    studentsFacilityCollegeYears[i].facilityCollegeYear.facilityCollege.college = removeDocumentVersion(college)
    if (studentsFacilityCollegeYears[i].facilityCollegeYear.facilityCollege.college.logo) {
      studentsFacilityCollegeYears[i].facilityCollegeYear.facilityCollege.college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}`
    }
    let student = await Student.findOne({
      _id: studentsFacilityCollegeYears[i].student
    }).lean()
    studentsFacilityCollegeYears[i].student = _.pick(student, ['_id', 'surName', 'otherNames', 'gender', 'phone', 'profile'])
    // add student profile media path
    if (student.profile) {
      studentsFacilityCollegeYears[i].student.profile = `http://${process.env.HOST}/kurious/file/studentProfile/${student._id}`
    }
  }
  return studentsFacilityCollegeYears
}

// export the router
module.exports = router