// import dependencies
const { express, facilityCollege, College, Facility, validateFacility, auth, _superAdmin, _admin, validateObjectId, _facility, FacilityCollege } = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Facility:
 *     properties:
 *       _id:
 *         type: string
 *       name:
 *         type: string
 *     required:
 *       - name
 */

/**
 * @swagger
 * /kurious/facility:
 *   get:
 *     tags:
 *       - Facility
 *     description: Get all Facilities
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
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

/**
 * @swagger
 * /kurious/facility/college/{id}:
 *   get:
 *     tags:
 *       - Facility
 *     description: Returns facilities in a specified college
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
    const { error } = validateObjectId(req.params.id)
    if (error)
      return res.send(error.details[0].message).status(400)
    let college = await College.findOne({ _id: req.params.id })
    if (!college)
      return res.status(404).send(`College ${req.params.id} Not Found`)

    const facilityColleges = await FacilityCollege.find({ college: req.params.id })
    if (facilityColleges.length === 0)
      return res.send(`College ${college.name} has no faculties`).status(404)

    let foundFacilities = []

    for (const facilityCollege of facilityColleges) {
      const facilities = await Facility.find({ _id: facilityCollege.facility })
      if (facilities.length < 1)
        return res.send(`Facility ${facilityCollege.facility} Not Found`) // recheck use case
      for (const facility of facilities) {
        foundFacilities.push(facility)
      }
    }
    if (foundFacilities.length < 1)
      return res.status(404).send(`College ${college.name} has no faculties`)
    return res.send(foundFacilities).status(200)

  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/facility/{id}:
 *   get:
 *     tags:
 *       - Facility
 *     description: Returns a specified facility
 *     parameters:
 *       - name: id
 *         description: Facility's id
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

/**
 * @swagger
 * /kurious/facility:
 *   post:
 *     tags:
 *       - Facility
 *     description: Create Facility
 *     parameters:
 *       - name: body
 *         description: Fields for a Facility
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Facility'
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

/**
 * @swagger
 * /kurious/facility/{id}:
 *   put:
 *     tags:
 *       - Facility
 *     description: Update Facility
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Facility's Id
 *       - name: body
 *         description: Fields for a Facility
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Facility'
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

/**
 * @swagger
 * /kurious/facility/{id}:
 *   delete:
 *     tags:
 *       - Facility
 *     description: Delete as Facility
 *     parameters:
 *       - name: id
 *         description: Facility's id
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
