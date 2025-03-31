// import dependencies
const { express, FacilityCollegeYear, CollegeYear, FacilityCollege, auth, _superAdmin, _admin, validateFacilityCollegeYear, validateObjectId, _student } = require('../../utils/imports')
// create router
const router = express.Router()

// Get all facilityCollegeYears
router.get('/', async (req, res) => {
  const facilityCollegeYears = await FacilityCollegeYear.find()
  try {
    if (facilityCollegeYears.length === 0)
      return res.send('facility-college-years list is empty').status(404)
    return res.send(facilityCollegeYears).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// post an facilityCollege
router.post('/', async (req, res) => {
  try {
    const { error } = validateFacilityCollegeYear(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)

    // check if facilityCollege exist
    let facilityCollege = await FacilityCollege.findOne({ _id: req.body.facilityCollege })
    if (!facilityCollege)
      return res.send(`FacilityCollege with code ${req.body.facilityCollege} doens't exist`)

    // check if collegeYear exist
    let collegeYear = await CollegeYear.findOne({ _id: req.body.collegeYear })
    if (!collegeYear)
      return res.send(`CollegeYearwith code ${req.body.collegeYear} doens't exist`)

    let facilityCollegeYear = await FacilityCollegeYear.findOne({
      facilityCollege: req.body.facilityCollege,
      collegeYear: req.body.collegeYear
    })
    if (facilityCollegeYear)
      return res.send(`facilityCollegeYear you want to create arleady exist`)

    let newDocument = new FacilityCollegeYear({
      facilityCollege: req.body.facilityCollege,
      collegeYear: req.body.collegeYear
    })
    const saveDocument = await newDocument.save()
    if (saveDocument)
      return res.send(saveDocument).status(201)
    return res.send('New facilityCollegeYear not Registered').status(500)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// delete a facility-college-year
router.delete('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)

  let facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: req.params.id })
  if (!facilityCollegeYear)
    return res.send(`facilityCollegeYear of Code ${req.params.id} Not Found`)

  let deleteFacilityCollege = await FacilityCollegeYear.findOneAndDelete({ _id: req.params.id })
  if (!deleteFacilityCollege)
    return res.send('facilityCollegeYear Not Deleted').status(500)

  return res.send(`facilityCollegeYear ${deleteFacilityCollege._id} Successfully deleted`).status(200)
})

// export the router
module.exports = router
