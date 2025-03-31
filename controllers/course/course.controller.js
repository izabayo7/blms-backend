// import dependencies
const { express, fs, Course, getCollege, College, Instructor, validateCourse, FacilityCollegeYear, auth, _instructor, validateObjectId, _student } = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Course:
 *     properties:
 *       _id:
 *         type: string
 *       name:
 *         type: string
 *       instructor:
 *         type: string
 *       facilityCollegeYear:
 *         type: string
 *       description:
 *         type: string
 *       coverPicture:
 *         type: string
 *       published:
 *         type: boolean
 *     required:
 *       - name
 *       - instructor
 *       - facilityCollegeYear
 *       - description
 */

/**
 * @swagger
 * /kurious/course:
 *   get:
 *     tags:
 *       - Course
 *     description: Get all courses
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', async (req, res) => {
  const courses = await Course.find()
  try {
    if (courses.length === 0)
      return res.status(404).send('Course list is empty')
    return res.status(200).send(courses)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/course/college/{id}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns courses in a specified college
 *     parameters:
 *       - name: id
 *         description: College id
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
      return res.status(400).send(error.details[0].message)
    let college = await College.findOne({ _id: req.params.id })
    if (!college)
      return res.status(404).send(`College ${req.params.id} Not Found`)

    let instructors = await Instructor.find({ college: req.params.id })
    if (!instructors)
      return res.status(404).send(`Courses in ${college.name} Not Found`)

    let foundCourses = []

    for (const instructor of instructors) {
      const courses = await Course.find({ instructor: instructor._id })
      if (courses, length > 0) {
        for (const course of courses) {
          foundCourses.push(course)
        }
      }
    }
    if (foundCourses.length === 0)
      return res.status(404).send(`${college.name} course list is empty`)
    return res.status(200).send(foundCourses)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/course/instructor/{id}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns courses of a specified instructor
 *     parameters:
 *       - name: id
 *         description: Instructor id
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
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(500).send(error.details[0].message)
  let instructor = await Instructor.findOne({ _id: req.params.id })
  if (!instructor)
    return res.status(404).send(`Instructor ${req.params.id} Not Found`)
  const courses = await Course.find({ instructor: req.params.id })
  try {
    if (courses.length === 0)
      return res.status(404).send(`${instructor.name} have No courses`)
    return res.status(200).send(courses)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/course/facility-college-year/{id}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns courses of a specified facilityCOllegeYear
 *     parameters:
 *       - name: id
 *         description: FacilityCollegeYear id
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
router.get('/facility-college-year/:id', async (req, res) => {
  try {
    const { error } = validateObjectId(req.params.id)
    if (error)
      return res.status(400).send(error.details[0].message)

    let facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: req.params.id })
    if (!facilityCollegeYear)
      return res.status(404).send(`facilityCollegeYear of Code ${req.params.id} Not Found`)

    const courses = await Course.find({ facilityCollegeYear: req.params.id })

    if (courses.length === 0)
      return res.status(404).send(`There are no courses with facilityCollegeYear ${req.params.id}`)
    return res.status(200).send(courses)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/course/{id}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns a specific course
 *     parameters:
 *       - name: id
 *         description: Course id
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
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  const course = await Course.findOne({ _id: req.params.id })
  try {
    if (!course)
      return res.status(404).send(`Course ${req.params.id} Not Found`)
    return res.status(200).send(course)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/course:
 *   post:
 *     tags:
 *       - Course
 *     description: Create course
 *     parameters:
 *       - name: body
 *         description: Fields for a course
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Course'
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
  const { error } = validateCourse(req.body)
  if (error)
    return res.status(400).send(error.details[0].message)

  let facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: req.body.facilityCollegeYear })
  if (!facilityCollegeYear)
    return res.status(404).send(`facilityCollegeYear of Code ${req.body.facilityCollegeYear} Not Found`)

  let newDocument = new Course({
    name: req.body.name,
    instructor: req.body.instructor,
    facilityCollegeYear: req.body.facilityCollegeYear,
    description: req.body.description,
    coverPicture: req.file === undefined ? undefined : req.file.filename
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.status(201).send(saveDocument)
  return res.status(500).send('New Course not Registered')
})

/**
 * @swagger
 * /kurious/course/{id}:
 *   put:
 *     tags:
 *       - Course
 *     description: Update course
 *     parameters:
 *       - name: id
 *         description: Course id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: Fields for a course
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Course'
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
    return res.status(400).send(error.details[0].message)
  error = validateCourse(req.body)
  error = error.error
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if course exist
  let course = await Course.findOne({ _id: req.params.id })
  if (!course)
    return res.status(404).send(`Course with code ${req.params.id} doens't exist`)

  const updateDocument = await Course.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.status(201).send(updateDocument)
  return res.status(500).send("Error ocurred")

})

/**
 * @swagger
 * /kurious/course/{id}:
 *   delete:
 *     tags:
 *       - Course
 *     description: Delete a course
 *     parameters:
 *       - name: id
 *         description: College id
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
    return res.status(400).send(error.details[0].message)
  let course = await Course.findOne({ _id: req.params.id })
  if (!course)
    return res.status(404).send(`Course of Code ${req.params.id} Not Found`)
  let deletedCourse = await Course.findOneAndDelete({ _id: req.params.id })
  if (!deletedCourse)
    return res.status(500).send('Course Not Deleted')
  const college = getCollege(course.facilityCollegeYear)
  const dir = `./uploads/schools/${college}/courses/${req.params.id}`
  fs.exists(dir, (err) => {
    if (err)
      return res.status(500).send(err)
    fs.remove(dir, (err) => {
      if (err)
        return res.status(500).send(err)
    })
  })
  return res.status(200).send(`Course ${deletedCourse._id} Successfully deleted`)
})


// export the router
module.exports = router
