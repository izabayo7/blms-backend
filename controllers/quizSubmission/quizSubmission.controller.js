// import dependencies
const {
  express,
  QuizSubmission,
  Quiz,
  Student,
  validateQuizSubmission,
  validateObjectId,
  _
} = require('../../utils/imports')
const {
  Instructor
} = require('../../models/instructor/instructor.model')

// create router
const router = express.Router()

// Get all quizSubmissions
router.get('/', async (req, res) => {
  let quizSubmissions = await QuizSubmission.find().lean()
  try {
    if (quizSubmissions.length === 0)
      return res.status(404).send('QuizSubmission list is empty')
    quizSubmissions = await injectStudent(quizSubmissions)
    quizSubmissions = await injectQuiz(quizSubmissions)
    return res.status(200).send(quizSubmissions)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// Get specified quizSubmissions
router.get('/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.status(400).send(error.details[0].message)
    let quizSubmission = await QuizSubmission.findOne({
      _id: req.params.id
    }).lean()

    if (!quizSubmission)
      return res.status(404).send(`QuizSubmission ${req.params.id} Not Found`)
    quizSubmission = await injectStudent([quizSubmission])
    quizSubmission = await injectQuiz(quizSubmission)
    return res.status(200).send(quizSubmission[0])
  } catch (error) {
    return res.status(500).send(error)
  }
})

// Get specified submissions of a specified quiz
router.get('/quiz/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.status(400).send(error.details[0].message)

    // check if quiz exist
    let quiz = await Quiz.findOne({
      _id: req.params.id
    })
    if (!quiz)
      return res.status(404).send(`Quiz with code ${req.params.id} doens't exist`)

    let quizSubmissions = await QuizSubmission.find({
      quiz: req.params.id
    }).lean()

    if (quizSubmissions.length < 1)
      return res.status(404).send(`Ther are no submissions for quiz ${quiz.name}`)
      quizSubmissions = await injectStudent(quizSubmissions)
    return res.status(200).send(quizSubmissions)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// Get specified submissions of a specified student
router.get('/student/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.status(400).send(error.details[0].message)

    // check if student exist
    let student = await Student.findOne({
      _id: req.params.id
    })
    if (!student)
      return res.status(404).send(`Sudent with code ${req.params.id} doens't exist`)

    let quizSubmissions = await QuizSubmission.find({
      student: req.params.id
    }).lean()

    if (quizSubmissions.length < 1)
      return res.status(404).send(`Ther are no submissions for ${student.surName} ${student.otherNames}`)
      quizSubmissions = await injectQuiz(quizSubmissions)
    return res.status(200).send(quizSubmissions)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// Get specified submissions of a specified student
router.get('/instructor/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.status(400).send(error.details[0].message)

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
      let quizSubmissions = await QuizSubmission.find({
        quiz: quiz._id
      }).lean()
      if (quizSubmissions.length > 0) {
        quizSubmissions = await injectStudent(quizSubmissions)
        quizSubmissions = await injectQuiz(quizSubmissions)
        for (let submission of quizSubmissions) {
          foundSubmissions.push(submission)
        }
      }
    }

    if (foundSubmissions.length < 1)
      return res.status(404).send(`Ther are no submissions for Instructor ${instructor.surName}`)
    return res.status(200).send(foundSubmissions)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// post an quizSubmissions
router.post('/', async (req, res) => {
  try {

    let {
      error
    } = validateQuizSubmission(req.body)
    if (error)
      return res.status(400).send(error.details[0].message)

    let student = await Student.findOne({
      _id: req.body.student
    })
    if (!student)
      return res.status(404).send(`Student of Code ${req.body.student} Not Found`)

    // check if quiz exist
    let quiz = await Quiz.findOne({
      _id: req.body.quiz
    })
    if (!quiz)
      return res.status(404).send(`Quiz with code ${req.params.id} doens't exist`)

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
      return res.status(201).send(saveDocument)
    return res.status(500).send('New QuizSubmission not Registered')
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
    return res.status(400).send(error.details[0].message)
  error = validateQuizSubmission(req.body)
  error = error.error
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if quizSubmissions exist
  let quizSubmission = await QuizSubmission.findOne({
    _id: req.params.id
  })
  if (!quizSubmission)
    return res.status(404).send(`QuizSubmission with code ${req.params.id} doens't exist`)

  let quiz = await Quiz.findOne({
    _id: quizSubmission.quiz
  })
  if (!quiz)
    return res.status(404).send(`Quiz with code ${req.params.id} doens't exist`)

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
    return res.status(201).send(updateDocument)
  return res.status(500).send("Error ocurred")

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

// replace student id by the student information
async function injectStudent(submissions) {
  for (const i in submissions) {
    const instructor = await Student.findOne({
      _id: submissions[i].student
    })
    submissions[i].student = _.pick(instructor, ['_id', 'surName', 'otherNames', 'gender', 'phone', 'profile'])
  }
  return submissions
}

// replace quiz id by the quiz information
async function injectQuiz(submissions) {
  for (const i in submissions) {
    const quiz = await Quiz.findOne({
      _id: submissions[i].quiz
    })
    submissions[i].quiz = quiz
  }
  return submissions
}

// export the router
module.exports = router