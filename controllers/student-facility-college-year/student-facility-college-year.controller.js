// import dependencies
const { express, FacilityCollegeYear, StudentFacilityCollegeYear, Student, auth, _superAdmin, _admin, validateStudentFacilityCollegeYear, validateObjectId, _student } = require('../../utils/imports')
// create router
const router = express.Router()

// Get all studentFacilityCollegeYears
router.get('/', async (req, res) => {
  const studentFacilityCollegeYears = await StudentFacilityCollegeYear.find()
  try {
    if (studentFacilityCollegeYears.length === 0)
      return res.send('student-facility-college-years list is empty').status(404)
    return res.send(studentFacilityCollegeYears).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// post a studentFacilityCollegeYear
router.post('/', async (req, res) => {
  try {
    const { error } = validateStudentFacilityCollegeYear(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)

    // check if facilityCollegeYear exist
    let facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: req.body.facilityCollegeYear })
    if (!facilityCollegeYear)
      return res.send(`FacilityCollegeYear with code ${req.body.facilityCollegeYear} doens't exist`)

    // check if student exist
    let student = await Student.findOne({ _id: req.body.student })
    if (!student)
      return res.send(`Student with code ${req.body.student} doens't exist`)

    let activeStudentFacilliyCollegeYear = await StudentFacilityCollegeYear.findOne({ student: req.body.student, status: 1 })
    if (activeStudentFacilliyCollegeYear) {
      let updateDocument = await StudentFacilityCollegeYear.findOneAndUpdate({ student: req.body.student, status: 1 }, { status: 0 })
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

// delete a student-facility-college-year
router.delete('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)

  let studentFacilliyCollegeYear = await StudentFacilityCollegeYear.findOne({ _id: req.params.id })
  if (!studentFacilliyCollegeYear)
    return res.send(`studentFacilliyCollegeYear of Code ${req.params.id} Not Found`)

  let deleteDocument = await StudentFacilityCollegeYear.findOneAndDelete({ _id: req.params.id })
  if (!deleteDocument)
    return res.send('studentFacilliyCollegeYear Not Deleted').status(500)

  return res.send(`studentFacilliyCollegeYear ${deleteDocument._id} Successfully deleted`).status(200)
})

// export the router
module.exports = router
