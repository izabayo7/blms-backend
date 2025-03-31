// import dependencies
const { express, fs, Course, getCollege, College, Instructor, validateCourse, FacilityCollegeYear, auth, _instructor, validateObjectId, _student } = require('../../utils/imports')

// create router
const router = express.Router()

// Get all courses
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

// Get all courses in a specified college
router.get('/college/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  let college = await College.findOne({ _id: req.params.id })
  if (!college)
    return res.status(404).send(`College ${req.params.id} Not Found`)
  const courses = await Course.find({ college: req.params.id })
  try {
    if (courses.length === 0)
      return res.status(404).send(`${college.name} course list is empty`)
    return res.status(200).send(courses)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// Get all courses of a specified instructor
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

// Get all courses in a specified facilityCollegeYear
router.get('/facility-college-year/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)

  let facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: req.params.id })
  if (!facilityCollegeYear)
    return res.status(404).send(`facilityCollegeYear of Code ${req.params.id} Not Found`)

  const courses = await Course.find({ facilityCollegeYear: req.params.id })
  try {
    if (courses.length === 0)
      return res.status(404).send(`There are no courses with facilityCollegeYear ${req.params.id}`)
    return res.status(200).send(courses)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// Get specified course
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

// post an course
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

// updated a course
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

// delete a course
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
