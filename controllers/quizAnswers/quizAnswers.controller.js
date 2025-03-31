// import dependencies
const { express, fs, QuizAnswers, getCollege, Chapter, Course, Student, validateQuizAnswers, FacilityCollegeYear, auth, _student, validateObjectId, _student } = require('../../utils/imports')

// create router
const router = express.Router()

// Get all quizAnswers
router.get('/', async (req, res) => {
  const quizAnswers = await QuizAnswers.find()
  try {
    if (quizAnswers.length === 0)
      return res.send('QuizAnswers list is empty').status(404)
    return res.send(quizAnswers).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// do it now brabra

// Get specified quizAnswers
router.get('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  const quizAnswers = await QuizAnswers.findOne({ _id: req.params.id })
  try {
    if (!quizAnswers)
      return res.send(`QuizAnswers ${req.params.id} Not Found`).status(404)
    return res.send(quizAnswers).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// post an quizAnswers
router.post('/', async (req, res) => {
  try {

    let { error } = validateQuizAnswers(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)

    let student = await Student.findOne({ _id: req.body.student })
    if (!student)
      return res.send(`Student of Code ${req.body.student} Not Found`)

    // check if quiz exist
    let quiz = await Quiz.findOne({ _id: req.params.id })
    if (!quiz)
      return res.send(`Quiz with code ${req.params.id} doens't exist`)

    const validAnswers = validateAnswers(req.body.answers, 'anwsering')
    if (validAnswers.status !== true)
      return res.status(400).send(validAnswers.error)

    let newDocument = new QuizAnswers({
      name: req.body.name,
      target: req.body.target,
      duration: req.body.duration,
      description: req.body.description,
      student: req.body.student,
      answers: req.body.answers,
      totalMarks: validAnswers.totalMarks
    })

    const saveDocument = await newDocument.save()
    if (saveDocument)
      return res.send(saveDocument).status(201)
    return res.send('New QuizAnswers not Registered').status(500)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// updated a quizAnswers
router.put('/:id', async (req, res) => {
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  error = validateQuizAnswers(req.body)
  error = error.error
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if quizAnswers exist
  let quizAnswers = await QuizAnswers.findOne({ _id: req.params.id })
  if (!quizAnswers)
    return res.send(`QuizAnswers with code ${req.params.id} doens't exist`)

  let student = await Student.findOne({ _id: req.body.student })
  if (!student)
    return res.send(`Student of Code ${req.body.student} Not Found`)

  req.body.target.type = req.body.target.type.toLowerCase()

  const allowedTargets = ['chapter', 'course', 'facilitycollegeyear']

  if (!allowedTargets.includes(req.body.target))
    return res.send(`QuizAnswers target type ${req.body.target.type} doens't exist`)

  let Target

  switch (req.body.target.type) {
    case 'chapter':
      Target = await Chapter.find({ _id: req.body.target.id })
      break;

    case 'course':
      Target = await Course.find({ _id: req.body.target.id })
      break;

    case 'facilitycollegeyear':
      Target = await FacilityCollegeYear.find({ _id: req.body.target.id })
      break;

    default:
      break;
  }

  if (!Target)
    return res.status(400).send(`QuizAnswers target id ${req.body.target.id} doens't exist`)

  const validAnswers = validateAnswers(req.body.answers, 'marking')
  if (validAnswers.status !== true)
    return res.status(400).send(validAnswers.error)


  const updateDocument = await QuizAnswers.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201)
  return res.send("Error ocurred").status(500)

})


function validateAnswers(questions,answers, mode) {
  const allowedQuestionTypes = ['open-ended', 'single-select', 'multi-select', 'file-select', 'file-upload']
  let message = ''
  let marks = 0
  for (const i in answers) {
    if (!allowedQuestionTypes.includes(answers[i].type)) {
      message = `${answers[i].type} is not supported`
      break;
    }
    if (!answers[i].details) {
      message = `question ${i + 1} must have details`
      break;
    }
    if (!answers[i].marks) {
      message = `question ${i + 1} must have marks`
      break;
    }
    if (answers[i].type.includes('select')) {
      if (!answers[i].options) {
        message = `question ${i + 1} must have select options`
        break;
      } else {
        if (!answers[i].options.listStyleType) {
          message = `question ${i + 1} must have select a list style type`
          break;
        }
        if (!answers[i].options) {
          message = `question ${i + 1} must have options`
          break;
        }
      }
    }
    marks += answers[i].marks
    // more validations later
  }
  return message === '' ? { status: true, totalMarks: marks } : { status: false, error: message }
}

// export the router
module.exports = router
