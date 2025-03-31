// import dependencies
const {
  express,
  FacilityCollegeYear,
  CollegeYear,
  College,
  FacilityCollege,
  validateFacilityCollegeYear,
  validateObjectId,
  removeDocumentVersion
} = require('../../utils/imports')
const {
  Facility
} = require('../../models/facility/facility.model')
// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   FacilityCollegeYear:
 *     properties:
 *       _id:
 *         type: string
 *       facilityCollege:
 *         type: string
 *       collegeYear:
 *         type: string
 *     required:
 *       - facilityCollege
 *       - collegeYear
 */

/**
 * @swagger
 * /kurious/facility-college-year:
 *   get:
 *     tags:
 *       - FacilityCollegeYear
 *     description: Get all facilityCollegeYears
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
    let facilityCollegeYears = await FacilityCollegeYear.find().lean()

    if (facilityCollegeYears.length === 0)
      return res.send('facility-facility-college-years list is empty').status(404)

    facilityCollegeYears = await injectDetails(facilityCollegeYears)

    return res.send(facilityCollegeYears).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/facility-college-year/college/{id}:
 *   get:
 *     tags:
 *       - FacilityCollegeYear
 *     description: Returns facilityCollegeYears in a specified college
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
    // check if college exist
    let college = await College.findOne({
      _id: req.params.id
    })
    if (!college)
      return res.status(404).send(`College with code ${req.params.id} doens't exist`)

    let facilityCollegeYears = await FacilityCollege.find({
      college: req.params.id
    })
    if (facilityCollegeYears.length < 1)
      return res.send(`facilityCollege in ${college.name} Not Found`)

    let foundFacilityCollegeYears = []

    for (const facilityCollege of facilityCollegeYears) {
      const facilityDetails = await Facility.findOne({
        _id: facilityCollege.facility
      })
      const response = await FacilityCollegeYear.find({
        facilityCollege: facilityCollege._id
      })
      for (const newFacilityCollegeYear of response) {
        const yearDetails = await CollegeYear.findOne({
          _id: newFacilityCollegeYear.collegeYear
        })
        foundFacilityCollegeYears.push({
          _id: newFacilityCollegeYear._id,
          facilityCollege: newFacilityCollegeYear.facilityCollege,
          collegeYear: newFacilityCollegeYear.collegeYear,
          name: `${facilityDetails.name} Year ${yearDetails.digit}`
        })
      }
    }
    if (foundFacilityCollegeYears.length < 1)
      return res.status(404).send(`There are no Facility College Years in ${college.name}`)

      foundFacilityCollegeYears = await injectDetails(foundFacilityCollegeYears)

    return res.send(foundFacilityCollegeYears).status(200)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/facility-college-year:
 *   post:
 *     tags:
 *       - FacilityCollegeYear
 *     description: Create facilityCollegeYear
 *     parameters:
 *       - name: body
 *         description: Fields for a facilityCollegeYear
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/FacilityCollegeYear'
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
    } = validateFacilityCollegeYear(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)

    // check if facilityCollege exist
    let facilityCollege = await FacilityCollege.findOne({
      _id: req.body.facilityCollege
    })
    if (!facilityCollege)
      return res.send(`FacilityCollege with code ${req.body.facilityCollege} doens't exist`)

    // check if collegeYear exist
    let collegeYear = await CollegeYear.findOne({
      _id: req.body.collegeYear
    })
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

/**
 * @swagger
 * /kurious/facility-college-year/{id}:
 *   delete:
 *     tags:
 *       - FacilityCollegeYear
 *     description: Delete a facilityCollegeYear
 *     parameters:
 *       - name: id
 *         description: facilityCollegeYear's id
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

  let facilityCollegeYear = await FacilityCollegeYear.findOne({
    _id: req.params.id
  })
  if (!facilityCollegeYear)
    return res.send(`facilityCollegeYear of Code ${req.params.id} Not Found`)

  let deleteFacilityCollege = await FacilityCollegeYear.findOneAndDelete({
    _id: req.params.id
  })
  if (!deleteFacilityCollege)
    return res.send('facilityCollegeYear Not Deleted').status(500)

  return res.send(`facilityCollegeYear ${deleteFacilityCollege._id} Successfully deleted`).status(200)
})

// link the student with his/her current college
async function injectDetails(facilityCollegeYears) {
  for (const i in facilityCollegeYears) {

    const facilityCollege = await FacilityCollege.findOne({
      _id: facilityCollegeYears[i].facilityCollege
    }).lean()
    facilityCollegeYears[i].facilityCollege = removeDocumentVersion(facilityCollege)

    const facility = await Facility.findOne({
      _id: facilityCollegeYears[i].facilityCollege.facility
    }).lean()
    facilityCollegeYears[i].facilityCollege.facility = removeDocumentVersion(facility)

    const college = await College.findOne({
      _id: facilityCollegeYears[i].facilityCollege.college
    }).lean()
    facilityCollegeYears[i].facilityCollege.college = removeDocumentVersion(college)
    if (facilityCollegeYears[i].facilityCollege.college.logo) {
      facilityCollegeYears[i].facilityCollege.college.logo = `${process.env.HOST}/kurious/file/collegeLogo/${college._id}`
    }

    const collegeYear = await CollegeYear.findOne({
      _id: facilityCollegeYears[i].collegeYear
    }).lean()
    facilityCollegeYears[i].collegeYear = removeDocumentVersion(collegeYear)
  }
  return facilityCollegeYears
}

// export the router
module.exports = router