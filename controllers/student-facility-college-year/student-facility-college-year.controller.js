// import dependencies
const {
  express,
  FacilityCollegeYear,
  StudentFacilityCollegeYear,
  Student,
  validateStudentFacilityCollegeYear,
  validateObjectId,
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
  const studentFacilityCollegeYears = await StudentFacilityCollegeYear.find()
  try {
    if (studentFacilityCollegeYears.length === 0)
      return res.send('student-student-facility-college-years list is empty').status(404)
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

    const studentFacilityCollegeYear = await StudentFacilityCollegeYear.findOne({ student: req.params.id, status: 1 })

    if (!studentFacilityCollegeYear)
      return res.status(404).send(`student-student-facility-college-year for ${req.params.id} was not found`)
    
      return res.send(studentFacilityCollegeYear).status(200)
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

// export the router
module.exports = router