// import dependencies
const { express, facultyCollege, College, Faculty, validateFaculty, auth, _superAdmin, _admin, validateObjectId, _faculty, FacultyCollege } = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Faculty:
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
 * /kurious/faculty:
 *   get:
 *     tags:
 *       - Faculty
 *     description: Get all Faculties
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', async (req, res) => {
  const faculties = await Faculty.find()
  try {
    if (faculties.length === 0)
      return res.send('Faculty list is empty').status(404)
    return res.send(faculties).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/faculty/college/{id}:
 *   get:
 *     tags:
 *       - Faculty
 *     description: Returns faculties in a specified college
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

    const facultyColleges = await FacultyCollege.find({ college: req.params.id })
    if (facultyColleges.length === 0)
      return res.send(`College ${college.name} has no faculties`).status(404)

    let foundFaculties = []

    for (const facultyCollege of facultyColleges) {
      const faculties = await Faculty.find({ _id: facultyCollege.faculty })
      if (faculties.length < 1)
        return res.send(`Faculty ${facultyCollege.faculty} Not Found`) // recheck use case
      for (const faculty of faculties) {
        foundFaculties.push(faculty)
      }
    }
    if (foundFaculties.length < 1)
      return res.status(404).send(`College ${college.name} has no faculties`)
    return res.send(foundFaculties).status(200)

  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/faculty/{id}:
 *   get:
 *     tags:
 *       - Faculty
 *     description: Returns a specified faculty
 *     parameters:
 *       - name: id
 *         description: Faculty's id
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
    const faculty = await Faculty.findOne({ _id: req.params.id })
    if (!faculty)
      return res.send(`Faculty ${req.params.id} Not Found`).status(404)
    return res.send(faculty).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/faculty:
 *   post:
 *     tags:
 *       - Faculty
 *     description: Create Faculty
 *     parameters:
 *       - name: body
 *         description: Fields for a Faculty
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Faculty'
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
    const { error } = validateFaculty(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)

    // check if faculty exist
    let faculty = await Faculty.findOne({ name: req.body.name })
    if (faculty)
      return res.send(`Faculty with code ${req.body.name} arleady exist`)

    let newDocument = new Faculty({
      name: req.body.name,
    })
    const saveDocument = await newDocument.save()
    if (saveDocument)
      return res.send(saveDocument).status(201)
    return res.send('New Faculty not Registered').status(500)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/faculty/{id}:
 *   put:
 *     tags:
 *       - Faculty
 *     description: Update Faculty
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Faculty's Id
 *       - name: body
 *         description: Fields for a Faculty
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Faculty'
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

  // check if faculty exist
  let faculty = await Faculty.findOne({ _id: req.params.id })
  if (!faculty)
    return res.send(`Faculty with code ${req.params.id} doens't exist`)

  const updateDocument = await Faculty.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201)
  return res.send("Error ocurred").status(500)

})

/**
 * @swagger
 * /kurious/faculty/{id}:
 *   delete:
 *     tags:
 *       - Faculty
 *     description: Delete as Faculty
 *     parameters:
 *       - name: id
 *         description: Faculty's id
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
  let faculty = await Faculty.findOne({ _id: req.params.id })
  if (!faculty)
    return res.send(`Faculty of Code ${req.params.id} Not Found`)
  let deleteFaculty = await Faculty.findOneAndDelete({ _id: req.params.id })
  if (!deleteFaculty)
    return res.send('Faculty Not Deleted').status(500)
  return res.send(`Faculty ${deleteFaculty._id} Successfully deleted`).status(200)
})

// export the router
module.exports = router
