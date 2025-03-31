// import dependencies
const { express, bcrypt, fs, Student, StudentProgress, Course, Chapter, validateStudentProgress, validateUserLogin, hashPassword, auth, _superAdmin, defaulPassword, _admin, validateObjectId, _student, checkRequirements } = require('../../utils/imports')

// create router
const router = express.Router()


// Get all studentProgress
router.get('/', async (req, res) => {
  const studentProgress = await StudentProgress.find()
  try {
    if (studentProgress.length === 0)
      return res.send('StudentProgress list is empty').status(404)
    return res.send(studentProgress).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get specified studentProgress
router.get('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  const studentProgress = await StudentProgress.findOne({ _id: req.params.id })
  try {
    if (!studentProgress)
      return res.send(`StudentProgress ${req.params.id} Not Found`).status(404)
    return res.send(studentProgress).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// get in chapter, course

// post an studentProgresss
router.post('/', async (req, res) => {
  const { error } = validateStudentProgress(req.body)
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if student exist
  let student = await Student.findOne({ _id: req.body.student })
  if (!student)
    return res.send(`Student with code ${req.body.student} doens't exist`)

  // check if course exist
  let course = await Course.findOne({ _id: req.body.course })
  if (!course)
    return res.send(`Course with code ${req.body.course} doens't exist`)

  // check if studentProgress exist
  let studentProgress = await StudentProgress.findOne({ student: req.body.student, course: req.body.course })
  if (studentProgress)
    return res.status(400).send(`StudentProgress arleady exist`)

  // check if chapter exist
  let chapter = await Chapter.findOne({ _id: req.body.chapter })
  if (!chapter)
    return res.send(`Chapter with code ${req.body.chapter} doens't exist`)
  if (chapter.course !== req.body.course)
    return res.send(`${chapter.name} doesn't belong in ${course.name}`)

  const chapters = await Chapter.find({ course: req.body.course })

  const progress = (chapter.number / chapters.length) * 100

  let newDocument = new StudentProgress({
    student: req.body.student,
    course: req.body.course,
    progress: progress,
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.send(saveDocument).status(201)
  return res.send('New StudentProgress not Registered').status(500)
})

// updated a studentProgress
router.put('/:id', async (req, res) => {
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)

  error = validateStudentProgress(req.body)
  error = error.error
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if studentProgress exist
  let studentProgress = await StudentProgress.findOne({ _id: req.params.id })
  if (!studentProgress)
    return res.send(`StudentProgress with code ${req.params.id} doens't exist`)

  // check if student exist
  let student = await Student.findOne({ _id: req.body.student })
  if (!student)
    return res.send(`Student with code ${req.body.student} doens't exist`)

  // check if course exist
  let course = await Course.findOne({ _id: req.body.course })
  if (!course)
    return res.send(`Course with code ${req.body.course} doens't exist`)

  // check if chapter exist
  let chapter = await Chapter.findOne({ _id: req.body.chapter })
  if (!chapter)
    return res.send(`Chapter with code ${req.body.chapter} doens't exist`)
  if (chapter.course !== req.body.course)
    return res.send(`${chapter.name} doesn't belong in ${course.name}`)

  const chapters = await Chapter.find({ course: req.body.course })

  const progress = (chapter.number / chapters.length) * 100

  let updateObject = {
    student: req.body.student,
    course: req.body.course,
    progress: progress,
  }

  const updateDocument = await StudentProgress.findOneAndUpdate({ _id: req.params.id }, updateObject, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201)
  return res.send("Error ocurred").status(500)

})

// export the router
module.exports = router
