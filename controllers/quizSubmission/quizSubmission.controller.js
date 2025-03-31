// import dependencies
const {
  express,
  QuizSubmission,
  Quiz,
  Student,
  validateQuizSubmission,
  validateObjectId
} = require('../../utils/imports')
const { Instructor } = require('../../models/instructor/instructor.model')

// create router
const router = express.Router()

// Get all quizSubmissions
router.get('/', async (req, res) => {
  const quizSubmissions = await QuizSubmission.find()
  try {
    if (quizSubmissions.length === 0)
      return res.send('QuizSubmission list is empty').status(404)
    return res.send(quizSubmissions).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get specified quizSubmissions
router.get('/:id', async (req, res) => {
  const {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  const quizSubmissions = await QuizSubmission.findOne({
    _id: req.params.id
  })
  try {
    if (!quizSubmissions)
      return res.send(`QuizSubmission ${req.params.id} Not Found`).status(404)
    return res.send(quizSubmissions).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get specified submissions of a specified quiz
router.get('/quiz/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(error.details[0].message).status(400)

    // check if quiz exist
    let quiz = await Quiz.findOne({
      _id: req.params.id
    })
    if (!quiz)
      return res.send(`Quiz with code ${req.params.id} doens't exist`)

    const quizSubmissions = await QuizSubmission.find({
      quiz: req.params.id
    })

    if (quizSubmissions.length < 1)
      return res.send(`Ther are no submissions for quiz ${quiz.name}`).status(404)
    return res.send(quizSubmissions).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get specified submissions of a specified student
router.get('/student/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(error.details[0].message).status(400)

    // check if quiz exist
    let student = await Student.findOne({
      _id: req.params.id
    })
    if (!student)
      return res.send(`Sudent with code ${req.params.id} doens't exist`)

    const quizSubmissions = await QuizSubmission.find({
      student: req.params.id
    })

    if (quizSubmissions.length < 1)
      return res.send(`Ther are no submissions for ${student.surName} ${student.otherNames}`).status(404)
    return res.send(quizSubmissions).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get specified submissions of a specified student
router.get('/instructor/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(error.details[0].message).status(400)

    // check if instructor exist
    let instructor = await Instructor.findOne({
      _id: req.params.id
    })
    if (!instructor)
      return res.status(404).send(`Instructor with code ${req.params.id} doens't exist`)

    // check if there are quizes made by the instructor
    let quizes = await Quiz.find({
      instructor: req.params.id
    })
    if (quizes.lenght < 1)
      return res.status(404).send(`Ther are no submissions for Instructor ${instructor.surName}`)

    let foundSubmissions = []

    for (const quiz of quizes) {
      const quizSubmissions = await QuizSubmission.find({
        quiz: quiz._id
      })
      if (quizSubmissions.length > 0){
        for (const submission of quizSubmissions) {
          foundSubmissions.push(submission)
        }
      }
    }

    if (foundSubmissions.length < 1)
      return res.send(`Ther are no submissions for Instructor ${instructor.surName}`).status(404)
    return res.status(200).send(foundSubmissions)
  } catch (error) {
    console.log(error)
    return res.send(error).status(500)
  }
})

// post an quizSubmissions
router.post('/', async (req, res) => {
  try {

    let {
      error
    } = validateQuizSubmission(req.body)
    if (error)
      return res.send(error.details[0].message).status(400)

    let student = await Student.findOne({
      _id: req.body.student
    })
    if (!student)
      return res.send(`Student of Code ${req.body.student} Not Found`)

    // check if quiz exist
    let quiz = await Quiz.findOne({
      _id: req.body.quiz
    })
    if (!quiz)
      return res.send(`Quiz with code ${req.params.id} doens't exist`)

    const validSubmissions = validateSubmittedAnswers(quiz.questions, req.body.answers, 'anwsering')
    if (validSubmissions.status !== true)
      return res.status(400).send(validSubmissions.error)

    // check if quizSubmissions exist
    let quizSubmission = await QuizSubmission.findOne({
      student: req.body.student,
      quiz: req.body.quiz
    })
    if (quizSubmission)
      return res.status(400).send(`Cant submitt a single quiz twice`)

    let newDocument = new QuizSubmission({
      student: req.body.student,
      quiz: req.body.quiz,
      answers: req.body.answers,
      usedTime: req.body.usedTime,
      autoSubmitted: req.body.autoSubmitted
    })

    const saveDocument = await newDocument.save()
    if (saveDocument)
      return res.send(saveDocument).status(201)
    return res.send('New QuizSubmission not Registered').status(500)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// updated a quizSubmissions
router.put('/:id', async (req, res) => {
  let {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  error = validateQuizSubmission(req.body)
  error = error.error
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if quizSubmissions exist
  let quizSubmission = await QuizSubmission.findOne({
    _id: req.params.id
  })
  if (!quizSubmission)
    return res.send(`QuizSubmission with code ${req.params.id} doens't exist`)

  let quiz = await Quiz.findOne({
    _id: quizSubmission.quiz
  })
  if (!quiz)
    return res.send(`Quiz with code ${req.params.id} doens't exist`)

  let student = await Student.findOne({
    _id: req.body.student
  })
  if (!student)
    return res.status(404).send(`Student of Code ${req.body.student} Not Found`)

  const validSubmissions = validateSubmittedAnswers(quiz.questions, req.body.answers, 'marking')
  if (validSubmissions.status !== true)
    return res.status(400).send(validSubmissions.error)

  req.body.totalMarks = validSubmissions.totalMarks
  req.body.marked = true

  const updateDocument = await QuizSubmission.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    new: true
  })
  if (updateDocument)
    return res.send(updateDocument).status(201)
  return res.send("Error ocurred").status(500)

})


function validateSubmittedAnswers(questions, answers, mode) {
  let message = ''
  let marks = 0

  if (answers.length !== questions.length) {
    message = `answers must be equal to questions (length)`
  } else {
    for (let i in answers) {
      if (mode === 'marking' && answers[i].marks === undefined) {
        message = `answer ${i + 1} must have marks`
        break;
      }
      if (mode === 'marking' && answers[i].marks > questions[i].marks) {
        message = `answer ${i + 1} must have valid marks`
        break;
      }
      i = parseInt(i)
      if (questions[i].type.includes('select')) {
        if (!answers[i].choosedOptions) {
          message = `answer ${i + 1} must have choosedOptions`
          break;
        } else {
          if (questions[i].type.includes('single') && !answers[i].choosedOptions.length > 1) {
            if (!answers[i].choosedOptions.length > 1) {
              message = `answer ${i + 1} must only one choosedOption`
              break;
            }
          }
          for (const k in questions[i].choosedOptions) {
            if (questions[i].type.includes('text') && !answers[i].choosedOptions[k].text) {
              message = `choosedOption ${k + 1} in answer ${i + 1} must contain text`
              break;
            } else if (questions[i].type.includes('file') && !answers[i].choosedOptions[k].src) {
              message = `choosedOption ${k + 1} in answer ${i + 1} must contain choosed file src`
              break;
            }
          }
        }
      } else if (questions[i].type === 'open-ended') {
        if (!answers[i].text) {
          message = `question ${i + 1} must have text answer`
          break;
        }
      } else if (questions[i].type === 'file-upload') {
        if (!answers[i].src) {
          message = `question ${i + 1} must have src of the uploaded file`
          break;
        }
      }
      if (mode === 'marking') {
        marks += parseInt(answers[i].marks)
      }

    }
  }
  return message === '' ? {
    status: true,
    totalMarks: marks
  } : {
      status: false,
      error: message
    }
}

// export the router
module.exports = router