// import dependencies
const { express, FacilityCollege, College, Facility, auth, _superAdmin, _admin, validateFacilityCollege, validateObjectId, _student } = require('../../utils/imports')
// create router
const router = express.Router()

// Get all facilityColleges
router.get('/', async (req, res) => {
  const facilityColleges = await FacilityCollege.find()
  try {
    if (facilityColleges.length === 0)
      return res.send('facility-college list is empty').status(404)
    return res.send(facilityColleges).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// post an facility
router.post('/', async (req, res) => {
  try {
    const { error } = validateFacilityCollege(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)
    console.log('no error')
    // check if facility exist
    let facility = await Facility.findOne({ _id: req.body.facility })
    if (!facility)
      return res.send(`Facility with code ${req.body.facility} doens't exist`)

    // check if college exist
    let college = await College.findOne({ _id: req.body.college })
    if (!college)
      return res.send(`College with code ${req.body.college} doens't exist`)

    let facilityCollege = await FacilityCollege.findOne({
      facility: req.body.facility,
      college: req.body.college
    })
    if (facilityCollege)
      return res.send(`facilityCollege you want to create arleady exist`)

    let newDocument = new FacilityCollege({
      facility: req.body.facility,
      college: req.body.college
    })
    const saveDocument = await newDocument.save()
    if (saveDocument)
      return res.send(saveDocument).status(201)
    return res.send('New facilityCollege not Registered').status(500)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// delete a facility-college
router.delete('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)

  let facilityCollege = await FacilityCollege.findOne({ _id: req.params.id })
  if (!facilityCollege)
    return res.send(`facilityCollege of Code ${req.params.id} Not Found`)

  let deleteFacility = await FacilityCollege.findOneAndDelete({ _id: req.params.id })
  if (!deleteFacility)
    return res.send('facilityCollege Not Deleted').status(500)

  return res.send(`facilityCollege ${deleteFacility._id} Successfully deleted`).status(200)
})

// export the router
module.exports = router
