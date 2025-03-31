// import dependencies
const { express, multer, fs, Course, getCollege, College, Instructor, validateCourse, FacilityCollegeYear, normaliseDate, fileFilter, auth, _superCourse, defaulPassword, _Course, validateObjectId, _student } = require('../../utils/imports')

// create router
const router = express.Router()

// configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const college = getCollege(req.body.facilityCollegeYear)
    let dir = `./uploads/schools/${college}/courses`
    fs.exists(dir, exist => {
      if (!exist) {
        fs.mkdir(dir, error => cb(error, dir))
      }
      dir = `./uploads/schools/${req.body.college}/courses/${req.params.id}`
      fs.exists(dir, exist => {
        if (!exist) {
          fs.mkdir(dir, error => cb(error, dir))
        }
        return cb(null, dir)
      })

    })
  },
  filename: (req, file, cb) => {
    cb(null, `course-${normaliseDate(new Date().toISOString())}.${file.originalname.split('.')[file.originalname.split('.').length - 1]}`)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
})


// Get all courses
router.get('/', async (req, res) => {
  const courses = await Course.find()
  try {
    if (courses.length === 0)
      return res.send('Course list is empty').status(404)
    return res.send(courses).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get all courses in a specified college
router.get('/college/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let college = await College.findOne({ _id: req.params.id })
  if (!college)
    return res.send(`College ${req.params.id} Not Found`)
  const courses = await Course.find({ college: req.params.id })
  try {
    if (courses.length === 0)
      return res.send(`${college.name} course list is empty`).status(404)
    return res.send(courses).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get all courses of a specified instructor
router.get('/instructor/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let instructor = await Instructor.findOne({ _id: req.params.id })
  if (!instructor)
    return res.send(`Instructor ${req.params.id} Not Found`)
  const courses = await Course.find({ instructor: req.params.id })
  try {
    if (courses.length === 0)
      return res.send(`${instructor.name} have No courses`).status(404)
    return res.send(courses).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get all courses in a specified facilityCollegeYear
router.get('/facility-college-year/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)

  let facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: req.params.id })
  if (!facilityCollegeYear)
    return res.send(`facilityCollegeYear of Code ${req.params.id} Not Found`)

  const courses = await Course.find({ facilityCollegeYear: req.params.id })
  try {
    if (courses.length === 0)
      return res.send(`There are no courses with facilityCollegeYear ${req.params.id}`).status(404)
    return res.send(courses).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get specified course
router.get('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  const course = await Course.findOne({ _id: req.params.id })
  try {
    if (!course)
      return res.send(`Course ${req.params.id} Not Found`).status(404)
    return res.send(course).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// post an course
router.post('/', async (req, res) => {
  const { error } = validateCourse(req.body)
  if (error)
    return res.send(error.details[0].message).status(400)

  let facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: req.body.facilityCollegeYear })
  if (!facilityCollegeYear)
    return res.send(`facilityCollegeYear of Code ${req.body.facilityCollegeYear} Not Found`)

  let newDocument = new Course({
    name: req.body.name,
    instructor: req.body.instructor,
    facilityCollegeYear: req.body.facilityCollegeYear,
    description: req.body.description,
    coverPicture: req.file === undefined ? undefined : req.file.filename
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.send(saveDocument).status(201)
  return res.send('New Course not Registered').status(500)
})

// updated a course
router.put('/:id', upload.single('coverPicture'), async (req, res) => {
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  error = validateCourse(req.body)
  error = error.error
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if course exist
  let course = await Course.findOne({ _id: req.params.id })
  if (!course)
    return res.send(`Course with code ${req.params.id} doens't exist`)

  if (req.file && course.coverPicture) {
    const college = getCollege(course.facilityCollegeYear)
    fs.unlink(`./uploads/schools/${college}/courses/${req.params.id}/${course.coverPicture}`, (err) => {
      if (err)
        return res.send(err).status(500)
    })
  }
  if (req.file)
    req.body.coverPicture = req.file.filename

  const updateDocument = await Course.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201)
  return res.send("Error ocurred").status(500)

})

// delete a course
router.delete('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let course = await Course.findOne({ _id: req.params.id })
  if (!course)
    return res.send(`Course of Code ${req.params.id} Not Found`)
  let deletedCourse = await Course.findOneAndDelete({ _id: req.params.id })
  if (!deletedCourse)
    return res.send('Course Not Deleted').status(500)
  if (course.coverPicture) {
    const college = getCollege(course.facilityCollegeYear)
    fs.unlink(`./uploads/schools/${college}/courses/${req.params.id}/${course.coverPicture}`, (err) => {
      if (err)
        return res.send(err).status(500)
    })
  }
  return res.send(`Course ${deletedCourse._id} Successfully deleted`).status(200)
})


// export the router
module.exports = router
