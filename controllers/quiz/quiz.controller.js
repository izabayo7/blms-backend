// import dependencies
const {
  express,
  fs,
  Quiz,
  Chapter,
  Course,
  Instructor,
  validateQuiz,
  FacilityCollegeYear,
  validateObjectId,
  _,
  StudentFacultyCollegeYear
} = require('../../utils/imports')
const {
  parseInt
} = require('lodash')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Quiz:
 *     properties:
 *       _id:
 *         type: string
 *       name:
 *         type: string
 *       instructions:
 *         type: string
 *       duration:
 *         type: number
 *       totalMarks:
 *         type: number
 *       instructor:
 *         type: string
 *       published:
 *         type: boolean
 *       target:
 *         type: object
 *         properties:
 *           typer:
 *             type: string
 *           id:
 *             type: string
 *       profile:
 *         type: string
 *     required:
 *       - name
 *       - instructions
 *       - instructor
 */

/**
 * @swagger
 * /kurious/quiz:
 *   get:
 *     tags:
 *       - Quiz
 *     description: Get all quizes
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', async (req, res) => {
  let quizes = await Quiz.find().lean()
  try {
    if (quizes.length === 0)
      return res.status(404).send('Quiz list is empty')
    quizes = await injectInstructor(quizes)
    quizes = await addAttachmentMediaPaths(quizes)
    return res.status(200).send(quizes)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// Get specified quiz
router.get('/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.status(400).send(error.details[0].message)
    let quiz = await Quiz.findOne({
      _id: req.params.id
    }).lean()

    if (!quiz)
      return res.status(404).send(`Quiz ${req.params.id} Not Found`)
    quiz = await injectInstructor([quiz])
    quiz = await addAttachmentMediaPaths([quiz])
    return res.status(200).send(quiz[0])
  } catch (error) {
    return res.status(500).send(error)
  }
})

// Get quizes for a specific instructor
router.get('/instructor/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.status(400).send(error.details[0].message)

    let instructor = await Instructor.findOne({
      _id: req.params.id
    })
    if (!instructor)
      return res.status(404).send(`Instructor of Code ${req.params.id} Not Found`)

    let quizes = await Quiz.find({
      instructor: req.params.id
    }).lean()

    if (quizes.length < 1)
      return res.status(404).send(`There are no quizes for instructor ${instructor.surName}`)

    quizes = await addAttachmentMediaPaths(quizes)

    return res.status(200).send(quizes)
  } catch (error) {
    return res.status(500).send(error)
  }
})

// Get quizes for a specific instructor by name
router.get('/instructor/:id/:quiz_name', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.status(400).send(error.details[0].message)

    let instructor = await Instructor.findOne({
      _id: req.params.id
    })
    if (!instructor)
      return res.status(404).send(`Instructor of Code ${req.params.id} Not Found`)

    let quiz = await Quiz.findOne({
      instructor: req.params.id,
      name: req.params.quiz_name
    }).lean()

    if (!quiz)
      return res.status(404).send(`Quiz ${req.params.quiz_name} was not found`)

    quiz = await addAttachmentMediaPaths([quiz])

    return res.status(200).send(quiz[0])
  } catch (error) {
    return res.status(500).send(error)
  }
})

// Get quizes for a specific student by name
router.get('/student/:id/:quiz_name', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.status(400).send(error.details[0].message)

    let student = await Student.findOne({
      _id: req.params.id
    })
    if (!student)
      return res.status(404).send(`Student with Code ${req.params.id} Not Found`)

    let quiz = await Quiz.find({
      name: req.params.quiz_name,
      published: true
    }).lean()

    if (!quiz)
      return res.status(404).send(`Quiz ${req.params.quiz_name} was not found`)

    let facultycollegeyear = ''
    let chapter
    let course = ''

    if (quiz.target.type === 'chapter') {
      chapter = await Chapter.findOne({ _id: quiz.target.id })
      course = await Course.findOne({ _id: chapter.course })
    }
    else if (quiz.target.type === 'course') {
      course = await Course.findOne({ _id: quiz.target.id })
      facultycollegeyear = course.facultycollegeyear
    }

    if (quiz.target.type === 'facultycollegeyear') {
      facultycollegeyear = quiz.target.id
    }

    const studentFacultyCollegeYear = await StudentFacultyCollegeYear({ student: req.params.student, facultycollegeyear: facultycollegeyear })

    if (!studentFacultyCollegeYear)
      return res.status(404).send(`Student is not allowed to do this quiz`)

    quiz = await addAttachmentMediaPaths([quiz])

    return res.status(200).send(quiz[0])
  } catch (error) {
    return res.status(500).send(error)
  }
})

// post an quiz
router.post('/', async (req, res) => {
  try {
    const {
      error
    } = validateQuiz(req.body)
    if (error)
      return res.status(400).send(error.details[0].message)

    let instructor = await Instructor.findOne({
      _id: req.body.instructor
    })
    if (!instructor)
      return res.status(404).send(`Instructor of Code ${req.body.instructor} Not Found`)

    if (req.body.target) {
      req.body.target.type = req.body.target.type.toLowerCase()

      const allowedTargets = ['chapter', 'course', 'facultycollegeyear']

      if (!allowedTargets.includes(req.body.target.type))
        return res.status(404).send(`Quiz target type ${req.body.target.type} doens't exist`)


      error = validateObjectId(req.body.target.id, 'POST')
      error = error.error
      if (error)
        return res.status(400).send(error.details[0].message)

      let Target = undefined

      switch (req.body.target.type) {
        case 'chapter':
          Target = await Chapter.findOne({
            _id: req.body.target.id
          })
          break;

        case 'course':
          Target = await Course.findOne({
            _id: req.body.target.id
          })
          break;

        case 'facultycollegeyear':
          Target = await FacilityCollegeYear.findOne({
            _id: req.body.target.id
          })
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
    console.log(error)
    return res.status(500).send(error)
  }
})

// updated a quiz
router.put('/:id', async (req, res) => {
  let {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  error = validateQuiz(req.body)
  error = error ? error.error : error
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if quiz exist
  let quiz = await Quiz.findOne({
    _id: req.params.id
  })
  if (!quiz)
    return res.status(404).send(`Quiz with code ${req.params.id} doens't exist`)

  let instructor = await Instructor.findOne({
    _id: req.body.instructor
  })
  if (!instructor)
    return res.status(404).send(`Instructor of Code ${req.body.instructor} Not Found`)

  if (req.body.target) {

    req.body.target.type = req.body.target.type.toLowerCase()

    const allowedTargets = ['chapter', 'course', 'facultycollegeyear']

    if (!allowedTargets.includes(req.body.target.type))
      return res.status(404).send(`Quiz target type ${req.body.target.type} doens't exist`)

    let Target

    switch (req.body.target.type) {
      case 'chapter':
        Target = await Chapter.find({
          _id: req.body.target.id
        })
        break;

      case 'course':
        Target = await Course.find({
          _id: req.body.target.id
        })
        break;

      case 'facultycollegeyear':
        Target = await FacilityCollegeYear.find({
          _id: req.body.target.id
        })
        break;

      default:
        break;
    }

    if (!Target)
      return res.status(400).send(`Quiz target id ${req.body.target.id} doens't exist`)

    const latesTargetedQuiz = await Quiz.findOne({ target: req.body.target })
    if (latesTargetedQuiz) {
      latesTargetedQuiz.target = undefined
      latesTargetedQuiz.save()
    }
  }

  const validQuestions = validateQuestions(req.body.questions)
  if (validQuestions.status !== true)
    return res.status(400).send(validQuestions.error)

  req.body.totalMarks = validQuestions.totalMarks

  const updateDocument = await Quiz.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    new: true
  })
  if (!updateDocument)
    return res.status(500).send("Error ocurred")

  // delete removed files
  for (const i in quiz.questions) {
    if (
      quiz.questions[i].type.includes("file-select") &&
      quiz.questions[i].options.choices.length > 0
    ) {
      let deleteAll = false
      if (!req.body.questions[i].type.includes('file-select')) {
        deleteAll = true
      }
      for (const j in quiz.questions[i].options.choices) {
        let deletePicture = true
        if (req.body.questions[i].type.includes('file-select')) {
          for (const k in req.body.questions[i].options.choices) {
            if (quiz.questions[i].options.choices[j].src === req.body.questions[i].options.choices[k].src) {
              deletePicture = false
            }
          }
        }
        if (deleteAll || deletePicture) {
          const path = `./uploads/colleges/${instructor.college}/assignments/${req.params.id}/${quiz.questions[i].options.choices[j].src}`
          fs.exists(path, (exists) => {
            if (exists) {
              fs.unlink(path, (err) => {
                if (err) {
                  return res.status(500).send(err)
                }
              })
            }
          })
        }
      }
    }
  }

  return res.status(201).send(updateDocument)

})

// delete a quiz
router.delete('/:id', async (req, res) => {
  try {

    let {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.status(400).send(error.details[0].message)
    let quiz = await Quiz.findOne({
      _id: req.params.id
    })
    if (!quiz)
      return res.status(404).send(`Quiz of Code ${req.params.id} Not Found`)

    let instructor = await Instructor.findOne({
      _id: quiz.instructor
    })
    if (!instructor)
      return res.status(404).send(`Instructor of Code ${req.body.instructor} Not Found`)

    let deletedQuiz = await Quiz.findOneAndDelete({
      _id: req.params.id
    })
    if (!deletedQuiz)
      return res.status(500).send('Quiz Not Deleted')

    let err = undefined

    const path = `./uploads/colleges/${instructor.college}/assignments/${req.params.id}`
    fs.exists(path, (exists) => {
      if (exists) {
        fs.rmdir(path, { recursive: true }, (err) => {
          if (err) {
            err = err
          }
        })
      }
    })


    if (err)
      return res.status(500).send(err)

    return res.status(200).send(`Quiz ${deletedQuiz._id} Successfully deleted`)
  } catch (error) {
    return res.status(500).send(error)
  }
})

function validateQuestions(questions) {
  const allowedQuestionTypes = ['open-ended', 'single-text-select', 'multiple-text-select', 'single-file-select', 'multiple-file-select', 'file-upload']
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
  return message === '' ? {
    status: true,
    totalMarks: marks
  } : {
      status: false,
      error: message
    }
}

// replace instructor id by the instructor information
async function injectInstructor(quizes) {
  for (const i in quizes) {
    const instructor = await Instructor.findOne({
      _id: quizes[i].instructor
    })
    quizes[i].instructor = _.pick(instructor, ['_id', 'surName', 'otherNames', 'gender', 'phone', 'profile'])
    if (quizes[i].instructor.profile) {
      quizes[i].instructor.profile = `${process.env.HOST}/kurious/file/instructorProfile/${instructor._id}`
    }
  }
  return quizes
}

async function addAttachmentMediaPaths(quizes) {
  for (const i in quizes) {
    for (const k in quizes[i].questions) {
      if (quizes[i].questions[k].options) {
        for (const j in quizes[i].questions[k].options.choices) {
          if (quizes[i].questions[k].options.choices[j].src && !quizes[i].questions[k].options.choices[j].src.includes('http')) {
            quizes[i].questions[k].options.choices[j].src = `http://${process.env.HOST}/kurious/file/quizAttachedFiles/${quizes[i]._id}/${quizes[i].questions[k].options.choices[j].src}`
          }
        }
      }
    }
  }
  return quizes
}

// export the router
module.exports = router