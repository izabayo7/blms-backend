// import dependencies
const {
  express,
  FacilityCollege,
  College,
  Facility,
  validateFacilityCollege,
  validateObjectId,
  removeDocumentVersion
} = require('../../utils/imports')
// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   FacilityCollege:
 *     properties:
 *       _id:
 *         type: string
 *       facility:
 *         type: string
 *       college:
 *         type: string
 *     required:
 *       - facility
 *       - college
 */

/**
 * @swagger
 * /kurious/facility-college:
 *   get:
 *     tags:
 *       - FacilityCollege
 *     description: Get all facilityColleges
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', async (req, res) => {
  let facilityColleges = await FacilityCollege.find().lean()
  try {
    if (facilityColleges.length === 0)
      return res.send('facility-college list is empty').status(404)
    facilityColleges = await injectDetails(facilityColleges)
    return res.send(facilityColleges).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/facility-college:
 *   post:
 *     tags:
 *       - FacilityCollege
 *     description: Create facilityCollege
 *     parameters:
 *       - name: body
 *         description: Fields for a facilityCollege
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/FacilityCollege'
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
    } = validateFacilityCollege(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)
    console.log('no error')
    // check if facility exist
    let facility = await Facility.findOne({
      _id: req.body.facility
    })
    if (!facility)
      return res.send(`Facility with code ${req.body.facility} doens't exist`)

    // check if college exist
    let college = await College.findOne({
      _id: req.body.college
    })
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

/**
 * @swagger
 * /kurious/facility-college/{id}:
 *   delete:
 *     tags:
 *       - FacilityCollege
 *     description: Delete as facilityCollege
 *     parameters:
 *       - name: id
 *         description: facilityCollege's id
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

  let facilityCollege = await FacilityCollege.findOne({
    _id: req.params.id
  })
  if (!facilityCollege)
    return res.send(`facilityCollege of Code ${req.params.id} Not Found`)

  let deleteFacility = await FacilityCollege.findOneAndDelete({
    _id: req.params.id
  })
  if (!deleteFacility)
    return res.send('facilityCollege Not Deleted').status(500)

  return res.send(`facilityCollege ${deleteFacility._id} Successfully deleted`).status(200)
})

// replace relation ids with their references
async function injectDetails(facilityColleges) {
  for (const i in facilityColleges) {

    const facility = await Facility.findOne({
      _id: facilityColleges[i].facility
    }).lean()
    facilityColleges[i].facility = removeDocumentVersion(facility)

    const college = await College.findOne({
      _id: facilityColleges[i].college
    }).lean()
    facilityColleges[i].college = removeDocumentVersion(college)
    if (facilityColleges[i].college.logo) {
      facilityColleges[i].college.logo = `${process.env.HOST}/kurious/file/collegeLogo/${college._id}`
    }
  }
  return facilityColleges
}

// export the router
module.exports = router