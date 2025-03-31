// import dependencies
const { express, facilityCollege, Facility, validateFacility, auth, _superAdmin, _admin, validateObjectId, _student } = require('../../utils/imports')

// create router
const router = express.Router()

// Get all facilities
router.get('/', async (req, res) => {
  const facilities = await Facility.find()
  try {
    if (facilities.length === 0)
      return res.send('Facility list is empty').status(404)
    return res.send(facilities).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get all facilities in a specified college
router.get('/college/:id', async (req, res) => {
  try {
    const { error } = validateObjectId(req.params.id)
    if (error)
      return res.send(error.details[0].message).status(400)
    let college = await Facility.findOne({ _id: req.params.id })
    if (!college)
      return res.send(`College ${req.params.id} Not Found`)
    const facilityColleges = await facilityCollege.find({ college: req.params.id })
    if (facilityColleges.length === 0)
      return res.send(`College ${req.params.id} facility list is empty`).status(404)
    let foundFacilities = []
    for (const facilityCollege of facilityColleges) {
      const facility = await Facility.find({ _id: facilityCollege.facility })
      if (!facility)
        return res.send(`Facility ${facilityCollege.facility} Not Found`)
      foundFacilities.push(facility)
    }
    return res.send(foundFacilities).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get specified facility
router.get('/:id', async (req, res) => {
  try {
    const { error } = validateObjectId(req.params.id)
    if (error)
      return res.send(error.details[0].message).status(400)
    const facility = await Facility.findOne({ _id: req.params.id })
    if (!facility)
      return res.send(`Facility ${req.params.id} Not Found`).status(404)
    return res.send(facility).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// post an facility
router.post('/', async (req, res) => {
  try {
    const { error } = validateFacility(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)

  // check if facility exist
  let facility = await Facility.findOne({ name: req.body.name })
  if (facility)
    return res.send(`Facility with code ${req.body.name} arleady exist`)

    let newDocument = new Facility({
      name: req.body.name,
    })
    const saveDocument = await newDocument.save()
    if (saveDocument)
      return res.send(saveDocument).status(201)
    return res.send('New Facility not Registered').status(500)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// updated a facility
router.put('/:id', async (req, res) => {
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if facility exist
  let facility = await Facility.findOne({ _id: req.params.id })
  if (!facility)
    return res.send(`Facility with code ${req.params.id} doens't exist`)

  const updateDocument = await Facility.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201)
  return res.send("Error ocurred").status(500)

})

// delete a facility
router.delete('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let facility = await Facility.findOne({ _id: req.params.id })
  if (!facility)
    return res.send(`Facility of Code ${req.params.id} Not Found`)
  let deleteFacility = await Facility.findOneAndDelete({ _id: req.params.id })
  if (!deleteFacility)
    return res.send('Facility Not Deleted').status(500)
  return res.send(`Facility ${deleteFacility._id} Successfully deleted`).status(200)
})

// export the router
module.exports = router
