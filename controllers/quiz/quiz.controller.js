// import dependencies
const { express, fs, Quiz, getCollege, Chapter, Course, Instructor, validateQuiz, FacilityCollegeYear, auth, _instructor, validateObjectId, _student } = require('../../utils/imports')
const { parseInt } = require('lodash')

// create router
const router = express.Router()

// Get all quiz
router.get('/', async (req, res) => {
  const quiz = await Quiz.find()
  try {
    if (quiz.length === 0)
      return res.status(404).send('Quiz list is empty')
    return res.status(200).send(quiz)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// do it now brabra

// Get specified quiz
router.get('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  const quiz = await Quiz.findOne({ _id: req.params.id })
  try {
    if (!quiz)
      return res.status(404).send(`Quiz ${req.params.id} Not Found`)
    return res.status(200).send(quiz)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// post an quiz
router.post('/', async (req, res) => {
  try {
    let { error } = validateQuiz(req.body)
    if (error)
      return res.status(400).send(error.details[0].message)

    // let instructor = await Instructor.findOne({ _id: req.body.instructor })
    // if (!instructor)
    //   return res.status(404).send(`Instructor of Code ${req.body.instructor} Not Found`)

    if (req.body.target) {
      req.body.target.type = req.body.target.type.toLowerCase()

      const allowedTargets = ['chapter', 'course', 'facilitycollegeyear']

      if (!allowedTargets.includes(req.body.target.type))
        return res.status(404).send(`Quiz target type ${req.body.target.type} doens't exist`)


      error = validateObjectId(req.body.target.id, 'POST')
      error = error.error
      if (error)
        return res.status(400).send(error.details[0].message)

      let Target = undefined

      switch (req.body.target.type) {
        case 'chapter':
          Target = await Chapter.findOne({ _id: req.body.target.id })
          break;

        case 'course':
          Target = await Course.findOne({ _id: req.body.target.id })
          break;

        case 'facilitycollegeyear':
          Target = await FacilityCollegeYear.findOne({ _id: req.body.target.id })
          break;

        default:
          break;
      }

      if (!Target)
        return res.status(400).send(`Quiz target id ${req.body.target.id} doens't exist`)
    }
    const validQuestions = validateQuestions(req.body.questions)
    if (validQuestions.status !== true)
      return res.status(400).send(validQuestions.error)

    let newDocument = new Quiz({
      name: req.body.name,
      target: req.body.target,
      duration: req.body.duration,
      instructions: req.body.instructions,
      instructor: req.body.instructor,
      questions: req.body.questions,
      totalMarks: validQuestions.totalMarks
    })

    const saveDocument = await newDocument.save()
    if (saveDocument)
      return res.status(201).send(saveDocument)
    return res.status(500).send('New Quiz not Registered')
  } catch (error) {
    return res.status(500).send(error)
  }
})

// updated a quiz
router.put('/:id', async (req, res) => {
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  error = validateQuiz(req.body)
  error = error.error
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if quiz exist
  let quiz = await Quiz.findOne({ _id: req.params.id })
  if (!quiz)
    return res.status(404).send(`Quiz with code ${req.params.id} doens't exist`)

  let instructor = await Instructor.findOne({ _id: req.body.instructor })
  if (!instructor)
    return res.status(404).send(`Instructor of Code ${req.body.instructor} Not Found`)

  if (req.body.target) {
    req.body.target.type = req.body.target.type.toLowerCase()

    const allowedTargets = ['chapter', 'course', 'facilitycollegeyear']

    if (!allowedTargets.includes(req.body.target.type))
      return res.status(404).send(`Quiz target type ${req.body.target.type} doens't exist`)

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
      return res.status(400).send(`Quiz target id ${req.body.target.id} doens't exist`)
  }

  const validQuestions = validateQuestions(req.body.questions)
  if (validQuestions.status !== true)
    return res.status(400).send(validQuestions.error)

  req.body.totalMarks = validQuestions.totalMarks

  const updateDocument = await Quiz.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.status(201).send(updateDocument)
  return res.status(500).send("Error ocurred")

})

// delete a quiz
router.delete('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  let quiz = await Quiz.findOne({ _id: req.params.id })
  if (!quiz)
    return res.status(404).send(`Quiz of Code ${req.params.id} Not Found`)
  let deletedQuiz = await Quiz.findOneAndDelete({ _id: req.params.id })
  if (!deletedQuiz)
    return res.status(500).send('Quiz Not Deleted')
  return res.status(200).send(`Quiz ${deletedQuiz._id} Successfully deleted`)
})

function validateQuestions(questions) {
  const allowedQuestionTypes = ['open-ended', 'single-text-select', 'multi-text-select', 'single-file-select', 'multi-file-select', 'file-upload']
  let message = ''
  let marks = 0
  for (let i in questions) {
    i = parseInt(i)
    if (!allowedQuestionTypes.includes(questions[i].type)) {
      message = `question type "${questions[i].type}" is not supported`
      break;
    }
    if (questions[i].type.includes('select')) {
      if (!questions[i].options) {
        message = `question ${i + 1} must have selection options`
        break;
      } else {
        if (!questions[i].options.choices && !questions[i].type.includes('file')) {
          message = `question ${i + 1} must have selection choices`
          break;
        }
        for (let k in questions[i].options.choices) {
          k = parseInt(k)
          if ((questions[i].type === 'single-text-select' || questions[i].type === 'multi-text-select') && !questions[i].options.choices[k].text) {
            message = `choice ${k + 1} in question ${i + 1} must have text`
            break;
          }
          if ((questions[i].type === 'single-file-select' || questions[i].type === 'multi-file-select') && !questions[i].options.choices[k].src) {
            message = `choice ${k + 1} in question ${i + 1} must have attachment src`
            break;
          }
        }
      }
    }
    marks += parseInt(questions[i].marks)
    // more validations later
  }
  return message === '' ? { status: true, totalMarks: marks } : { status: false, error: message }
}

// export the router
module.exports = router
