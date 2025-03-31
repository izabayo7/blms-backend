// import dependencies
const {
  express,
  fs,
  Quiz,
  Chapter,
  Course,
  validate_quiz,
  Faculty_college_year,
  validateObjectId,
  _,
  User_faculty_college_year,
  addAttachmentMediaPaths,
  addQuizUsages,
  addAttachedCourse,
  findDocuments,
  formatResult,
  findDocument,
  User
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
 *       name:
 *         type: string
 *       instructions:
 *         type: string
 *       duration:
 *         type: number
 *       totalMarks:
 *         type: number
 *       user:
 *         type: string
 *       published:
 *         type: boolean
 *       questions  :
 *         type: array
 *         items:
 *            type: object
 *            properties:
 *              type:
 *                type: string
 *              marks:
 *                type: number
 *              details:
 *                type: string
 *              options  :
 *                type: object
 *                properties:
 *                  list_style_type:
 *                    type: string
 *                  choices:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        text:
 *                          type: string
 *                        src:
 *                          type: string
 *                        right:
 *                          type: boolean
 *       target:
 *         type: object
 *         properties:
 *           type:
 *             type: string
 *           id:
 *             type: string
 *       profile:
 *         type: string
 *     required:
 *       - name
 *       - user
 */

/**
 * @swagger
 * /quiz:
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
  try {
    let result = await findDocuments(Quiz)

    if (!result.data.length)
      return res.send(formatResult(404, 'Quiz list is empty'))

    // result.data = await injectInstructor(result.data)
    // result.data = await addAttachmentMediaPaths(result.data)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz/user/{id}:
 *   get:
 *     tags:
 *       - Quiz
 *     description: Returns quizes of a specified user
 *     parameters:
 *       - name: id
 *         description: User id
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
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let quiz = await findDocument(Quiz, {
      _id: req.params.id
    })
    if (!quiz.data)
      return res.send(formatResult(404, 'quiz not found'))

    // quiz.data = await injectInstructor([quiz.data])
    // quiz.data = await addAttachmentMediaPaths(quiz.data)
    // quiz.data = quiz.data[0]

    return res.send(quiz)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz/user/{id}:
 *   get:
 *     tags:
 *       - Quiz
 *     description: Returns quizes of a specified user
 *     parameters:
 *       - name: id
 *         description: User id
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
router.get('/user/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let user = await findDocument(User, {
      _id: req.params.id
    })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    let quiz = await findDocuments(Quiz, {
      user: req.params.id
    })

    if (!quiz.data.length)
      return res.send(formatResult(404, 'quizes not found'))

    // quiz.data = await addAttachmentMediaPaths(quiz.data)
    // quiz.data = await addQuizUsages(quiz.data)
    // quiz.data = await addAttachedCourse(quiz.data)

    return res.send(quiz)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz/user/{userId}/{quizName}:
 *   get:
 *     tags:
 *       - Quiz
 *     description: Returns a quiz with the specified name
 *     parameters:
 *       - name: userId
 *         description: User id
 *         in: path
 *         required: true
 *         type: string
 *       - name: quizName
 *         description: Quiz name
 *         in: path
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/user/:id/:quiz_name', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let user = await findDocument(User, {
      _id: req.params.id
    })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    let quiz = await findDocument(Quiz, {
      name: req.params.quiz_name
    })

    if (!quiz.data)
      return res.send(formatResult(404, 'quiz not found'))

    let faculty_college_year
    let chapter
    let course

    if (quiz.data.target.type === 'chapter') {
      chapter = await findDocument(Chapter, {
        _id: quiz.data.target.id
      })
      course = await findDocument(Course, {
        _id: chapter.data.course
      })
    } else if (quiz.data.target.type === 'course') {
      course = await findDocument(Course, {
        _id: quiz.data.target.id
      })
      faculty_college_year = course.data.faculty_college_year
    }

    if (quiz.data.target.type === 'faculty_college_year') {
      faculty_college_year = quiz.data.target.id
    }

    const user_faculty_college_year = await findDocument(User_faculty_college_year, {
      user: req.params.id,
      faculty_college_year: faculty_college_year
    })

    if (!user_faculty_college_year.data)
      return res.send(formatResult(404, 'quiz not found'))

    // quiz.data = await addAttachmentMediaPaths([quiz.data])
    // quiz.data = await addQuizUsages(quiz.data)
    // quiz.data = await addAttachedCourse(quiz.data)
    // quiz.data = quiz.data[0]

    return res.send(quiz)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz:
 *   post:
 *     tags:
 *       - Quiz
 *     description: Create quiz
 *     parameters:
 *       - name: body
 *         description: Fields for a quiz
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Quiz'
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
  try {
    const {
      error
    } = validate_quiz(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let user = await findDocument(User, {
      _id: req.params.id
    })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    // check if quizname exist
    let quiz = await Quiz.findOne({
      name: req.body.name
    })
    if (quiz)
      return res.send(formatResult(400, `Quiz ${req.body.name} arleady exist try another name`))

    const validQuestions = validateQuestions(req.body.questions)
    if (validQuestions.status !== true)
      return res.send(formatResult(400, validQuestions.error))

    let newDocument = new Quiz({
      name: req.body.name,
      duration: req.body.duration,
      instructions: req.body.instructions,
      user: req.body.user,
      questions: req.body.questions,
      totalMarks: validQuestions.totalMarks
    })

    const saveDocument = await newDocument.save()
    if (saveDocument)
      return res.status(201).send(saveDocument)
    return res.status(500).send('New Quiz not Registered')
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// updated a quiz
router.put('/:id', async (req, res) => {
  let {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.send(formatResult(400, error.details[0].message))
  error = validate_quiz(req.body)
  error = error ? error.error : error
  if (error)
    return res.send(formatResult(400, error.details[0].message))

  // check if quiz exist
  let quiz = await Quiz.findOne({
    _id: req.params.id
  })
  if (!quiz)
    return res.send(formatResult(404, `Quiz with code ${req.params.id} doens't exist`))

  let user = await Instructor.findOne({
    _id: req.body.user
  })
  if (!user)
    return res.send(formatResult(404, `Instructor of Code ${req.body.user} Not Found`))

  // // check if quizname exist
  // let _quiz = await Quiz.findOne({
  //   // use id not equal
  //   name: req.body.name
  // })
  // if (_quiz && _quiz._id !== quiz._id)
  //   return res.send(formatResult(404,`Quiz ${req.body.name} arleady exist try another name`))

  if (req.body.target) {

    req.body.target.type = req.body.target.type.toLowerCase()

    const allowedTargets = ['chapter', 'course', 'faculty_college_year']

    if (!allowedTargets.includes(req.body.target.type))
      return res.send(formatResult(404, `Quiz target type ${req.body.target.type} doens't exist`))

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

      case 'faculty_college_year':
        Target = await Faculty_college_year.find({
          _id: req.body.target.id
        })
        break;

      default:
        break;
    }

    if (!Target)
      return res.send(formatResult(400, `Quiz target id ${req.body.target.id} doens't exist`))

    const latesTargetedQuiz = await Quiz.findOne({
      target: req.body.target
    })
    if (latesTargetedQuiz) {
      latesTargetedQuiz.target = undefined
      await latesTargetedQuiz.save()
    }
  }
  const validQuestions = validateQuestions(req.body.questions)
  if (validQuestions.status !== true)
    return res.send(formatResult(400, validQuestions.error))

  req.body.totalMarks = validQuestions.totalMarks

  quiz.name = req.body.name
  quiz.instructions = req.body.instructions
  quiz.target = req.body.target
  quiz.duration = req.body.duration
  quiz.questions = req.body.questions
  quiz.totalMarks = req.body.totalMarks
  quiz.user = req.body.user
  quiz.published = req.body.published

  const updateDocument = await quiz.save()
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
          const path = `./uploads/colleges/${user.college}/assignments/${req.params.id}/${quiz.questions[i].options.choices[j].src}`
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
      return res.send(formatResult(400, error.details[0].message))
    let quiz = await Quiz.findOne({
      _id: req.params.id
    })
    if (!quiz)
      return res.send(formatResult(404, `Quiz of Code ${req.params.id} Not Found`))

    let user = await Instructor.findOne({
      _id: quiz.user
    })
    if (!user)
      return res.send(formatResult(404, `Instructor of Code ${req.body.user} Not Found`))

    let deletedQuiz = await Quiz.findOneAndDelete({
      _id: req.params.id
    })
    if (!deletedQuiz)
      return res.status(500).send('Quiz Not Deleted')

    let err = undefined

    const path = `./uploads/colleges/${user.college}/assignments/${req.params.id}`
    fs.exists(path, (exists) => {
      if (exists) {
        fs.rmdir(path, {
          recursive: true
        }, (err) => {
          if (err) {
            err = err
          }
        })
      }
    })


    if (err)
      return res.status(500).send(err)

    return res.send(`Quiz ${deletedQuiz._id} Successfully deleted`)
  } catch (error) {
    return res.send(formatResult(500, error))
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

// replace user id by the user information
async function injectInstructor(quizes) {
  for (const i in quizes) {
    const user = await Instructor.findOne({
      _id: quizes[i].user
    })
    quizes[i].user = _.pick(user, ['_id', 'surName', 'otherNames', 'gender', 'phone', 'profile'])
    if (quizes[i].user.profile) {
      quizes[i].user.profile = `${process.env.HOST}/kurious/file/userProfile/${user._id}`
    }
  }
  return quizes
}

// export the router
module.exports = router