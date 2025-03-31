// import dependencies
const { express, bcrypt, fs, Student, StudentProgress, Course, Chapter, validateStudentProgress, validateUserLogin, hashPassword, auth, _superAdmin, defaulPassword, _admin, validateObjectId, _student, checkRequirements } = require('../../utils/imports')

// create router
const router = express.Router()


// Get all studentProgress
router.get('/', async (req, res) => {
  const studentProgress = await StudentProgress.find()
  try {
    if (studentProgress.length === 0)
      return res.status(404).send('StudentProgress list is empty')
    return res.status(200).send(studentProgress)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// Get specified studentProgress
router.get('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  const studentProgress = await StudentProgress.findOne({ _id: req.params.id })
  try {
    if (!studentProgress)
      return res.status(404).send(`StudentProgress ${req.params.id} Not Found`)
    return res.status(200).send(studentProgress)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// Get studentProgress in a course
router.get('/:student/:course', async (req, res) => {
  let { error } = validateObjectId(req.params.student)
  if (error)
    return res.status(400).send(error.details[0].message)

  error = validateObjectId(req.params.course)
  error = error.error
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if student exist
  let student = await Student.findOne({ _id: req.params.student })
  if (!student)
    return res.status(404).send(`Student with code ${req.params.student} doens't exist`)

  // check if course exist
  let course = await Course.findOne({ _id: req.params.course })
  if (!course)
    return res.status(404).send(`Course with code ${req.params.course} doens't exist`)

  const studentProgress = await StudentProgress.findOne({ student: req.params.student, course: req.params.course })
  try {
    if (!studentProgress)
      return res.status(404).send(`StudentProgress Was Not Found`)
    return res.status(200).send(studentProgress)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// get in chapter, course

// post an studentProgresss
router.post('/', async (req, res) => {
  const { error } = validateStudentProgress(req.body)
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if student exist
  let student = await Student.findOne({ _id: req.body.student })
  if (!student)
    return res.status(404).send(`Student with code ${req.body.student} doens't exist`)

  // check if course exist
  let course = await Course.findOne({ _id: req.body.course })
  if (!course)
    return res.status(404).send(`Course with code ${req.body.course} doens't exist`)

  // check if studentProgress exist
  let studentProgress = await StudentProgress.findOne({ student: req.body.student, course: req.body.course })
  if (studentProgress)
    return res.status(400).send(`StudentProgress arleady exist`)

  // check if chapter exist
  let chapter = await Chapter.findOne({ _id: req.body.chapter })
  if (!chapter)
    return res.status(404).send(`Chapter with code ${req.body.chapter} doens't exist`)
  if (chapter.course !== req.body.course)
    return res.status(403).send(`${chapter.name} doesn't belong in ${course.name}`)

  const chapters = await Chapter.find({ course: req.body.course })

  const progress = (chapter.number / chapters.length) * 100

  let newDocument = new StudentProgress({
    student: req.body.student,
    course: req.body.course,
    progress: progress,
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.status(201).send(saveDocument)
  return res.status(500).send('New StudentProgress not Registered')
})

// updated a studentProgress
router.put('/:id', async (req, res) => {
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)

  error = validateStudentProgress(req.body)
  error = error.error
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if studentProgress exist
  let studentProgress = await StudentProgress.findOne({ _id: req.params.id })
  if (!studentProgress)
    return res.status(404).send(`StudentProgress with code ${req.params.id} doens't exist`)

  // check if student exist
  let student = await Student.findOne({ _id: req.body.student })
  if (!student)
    return res.status(404).send(`Student with code ${req.body.student} doens't exist`)

  // check if course exist
  let course = await Course.findOne({ _id: req.body.course })
  if (!course)
    return res.status(404).send(`Course with code ${req.body.course} doens't exist`)

  // check if chapter exist
  let chapter = await Chapter.findOne({ _id: req.body.chapter })
  if (!chapter)
    return res.status(404).send(`Chapter with code ${req.body.chapter} doens't exist`)
  if (chapter.course !== req.body.course)
    return res.status(403).send(`${chapter.name} doesn't belong in ${course.name}`)

  const chapters = await Chapter.find({ course: req.body.course })

  const progress = (chapter.number / chapters.length) * 100

  let updateObject = {
    student: req.body.student,
    course: req.body.course,
    progress: progress,
  }

  const updateDocument = await StudentProgress.findOneAndUpdate({ _id: req.params.id }, updateObject, { new: true })
  if (updateDocument)
    return res.status(201).send(updateDocument)
  return res.status(500).send("Error ocurred")

})

// export the router
module.exports = router
