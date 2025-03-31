// import dependencies
const {
  express,
  FacilityCollegeYear,
  InstructorFacilityCollegeYear,
  Instructor,
  validateInstructorFacilityCollegeYear,
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
 *   InstructorFacilityCollegeYear:
 *     properties:
 *       _id:
 *         type: string
 *       instructor:
 *         type: string
 *       facilityCollegeYear:
 *         type: string
 *       status:
 *         type: number
 *     required:
 *       - instructor
 *       - faciltiyCollegeYear
 */

/**
 * @swagger
 * /kurious/instructor-facility-college-year:
 *   get:
 *     tags:
 *       - InstructorFacilityCollegeYear
 *     description: Get all instructorFacilityCollegeYears
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
    let instructorFacilityCollegeYears = await InstructorFacilityCollegeYear.find().lean()

    if (instructorFacilityCollegeYears.length === 0)
      return res.send('instructor-instructor-facility-college-years list is empty').status(404)
    instructorFacilityCollegeYears = await injectDetails(instructorFacilityCollegeYears)
    return res.send(instructorFacilityCollegeYears).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/instructor-facility-college-year/instructor/{id}:
 *   get:
 *     tags:
 *       - InstructorFacilityCollegeYear
 *     description: Get a instructor's current instructorFacilityCollegeYear
 *     parameters:
 *       - name: id
 *         description: Instructor's id
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
router.get('/instructor/:id', async (req, res) => {
  try {

    let instructorFacilityCollegeYear = await InstructorFacilityCollegeYear.findOne({
      instructor: req.params.id,
      status: 1
    }).lean()

    if (!instructorFacilityCollegeYear)
      return res.status(404).send(`instructor-instructor-facility-college-year for ${req.params.id} was not found`)
    instructorFacilityCollegeYear = await injectDetails([instructorFacilityCollegeYear])
    return res.send(instructorFacilityCollegeYear[0]).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/instructor-facility-college-year:
 *   post:
 *     tags:
 *       - InstructorFacilityCollegeYear
 *     description: Create instructorFacilityCollegeYear
 *     parameters:
 *       - name: body
 *         description: Fields for a instructorFacilityCollegeYear
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/InstructorFacilityCollegeYear'
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
    } = validateInstructorFacilityCollegeYear(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)

    // check if facilityCollegeYear exist
    let facilityCollegeYear = await FacilityCollegeYear.findOne({
      _id: req.body.facilityCollegeYear
    })
    if (!facilityCollegeYear)
      return res.send(`FacilityCollegeYear with code ${req.body.facilityCollegeYear} doens't exist`)

    // check if instructor exist
    let instructor = await Instructor.findOne({
      _id: req.body.instructor
    })
    if (!instructor)
      return res.send(`Instructor with code ${req.body.instructor} doens't exist`)

    let activeInstructorFacilliyCollegeYear = await InstructorFacilityCollegeYear.findOne({
      instructor: req.body.instructor,
      status: 1
    })
    if (activeInstructorFacilliyCollegeYear) {
      let updateDocument = await InstructorFacilityCollegeYear.findOneAndUpdate({
        instructor: req.body.instructor,
        status: 1
      }, {
        status: 0
      })
      if (!updateDocument)
        return res.send(`Error while inserting instructor facility`)
    }

    let instructorFacilliyCollegeYear = await InstructorFacilityCollegeYear.findOne({
      facilityCollegeYear: req.body.facilityCollegeYear,
      instructor: req.body.instructor
    })
    if (instructorFacilliyCollegeYear)
      return res.send(`instructorFacilliyCollegeYear you want to create arleady exist`)

    let newDocument = new InstructorFacilityCollegeYear({
      facilityCollegeYear: req.body.facilityCollegeYear,
      instructor: req.body.instructor
    })
    const saveDocument = await newDocument.save()
    if (saveDocument)
      return res.send(saveDocument).status(201)
    return res.send('New instructorFacilliyCollegeYear not Registered').status(500)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/instructor-facility-college-year/{id}:
 *   delete:
 *     tags:
 *       - InstructorFacilityCollegeYear
 *     description: Delete a instructorFacilityCollegeYear
 *     parameters:
 *       - name: id
 *         description: instructorFacilityCollegeYear's id
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

  let instructorFacilliyCollegeYear = await InstructorFacilityCollegeYear.findOne({
    _id: req.params.id
  })
  if (!instructorFacilliyCollegeYear)
    return res.send(`instructorFacilliyCollegeYear of Code ${req.params.id} Not Found`)

  let deleteDocument = await InstructorFacilityCollegeYear.findOneAndDelete({
    _id: req.params.id
  })
  if (!deleteDocument)
    return res.send('instructorFacilliyCollegeYear Not Deleted').status(500)

  return res.send(`instructorFacilliyCollegeYear ${deleteDocument._id} Successfully deleted`).status(200)
})

// link the instructor with his/her current college
async function injectDetails(instructorsFacilityCollegeYears) {
  for (const i in instructorsFacilityCollegeYears) {
    const facilityCollegeYear = await FacilityCollegeYear.findOne({
      _id: instructorsFacilityCollegeYears[i].facilityCollegeYear
    }).lean()
    instructorsFacilityCollegeYears[i].facilityCollegeYear = removeDocumentVersion(facilityCollegeYear)

    const collegeYear = await CollegeYear.findOne({
      _id: facilityCollegeYear.collegeYear
    }).lean()
    instructorsFacilityCollegeYears[i].facilityCollegeYear.collegeYear = removeDocumentVersion(collegeYear)

    const facilityCollege = await FacilityCollege.findOne({
      _id: facilityCollegeYear.facilityCollege
    }).lean()
    instructorsFacilityCollegeYears[i].facilityCollegeYear.facilityCollege = removeDocumentVersion(facilityCollege)

    const facility = await Facility.findOne({
      _id: facilityCollege.facility
    }).lean()
    instructorsFacilityCollegeYears[i].facilityCollegeYear.facilityCollege.facility = removeDocumentVersion(facility)

    const college = await College.findOne({
      _id: facilityCollege.college
    }).lean()
    instructorsFacilityCollegeYears[i].facilityCollegeYear.facilityCollege.college = removeDocumentVersion(college)
    if (instructorsFacilityCollegeYears[i].facilityCollegeYear.facilityCollege.college.logo) {
      instructorsFacilityCollegeYears[i].facilityCollegeYear.facilityCollege.college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}`
    }
    let instructor = await Instructor.findOne({
      _id: instructorsFacilityCollegeYears[i].instructor
    }).lean()
    instructorsFacilityCollegeYears[i].instructor = _.pick(instructor, ['_id', 'surName', 'otherNames', 'gender', 'phone', 'profile'])
    // add instructor profile media path
    if (instructor.profile) {
      instructorsFacilityCollegeYears[i].instructor.profile = `http://${process.env.HOST}/kurious/file/instructorProfile/${instructor._id}`
    }
  }
  return instructorsFacilityCollegeYears
}

// export the router
module.exports = router