// import dependencies
const {
  express,
  Quiz_submission,
  Quiz,
  User,
  validate_quiz_submission,
  validateObjectId,
  addAttachmentMediaPaths,
  injectUser,
  _,
  formatResult,
  findDocuments,
  findDocument,
  User_category,
  u,
  createDocument,
  updateDocument,
  Chapter,
  User_faculty_college_year,
  Faculty_college_year,
  Course,
  deleteDocument,
  findFileType,
  sendResizedImage,
  streamVideo,
  path,
  simplifyObject
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Quiz_submission:
 *     properties:
 *       quiz:
 *         type: string
 *       user:
 *         type: string
 *       used_time:
 *         type: number
 *       auto_submitted:
 *         type: boolean
 *       marked:
 *         type: boolean
 *       published:
 *         type: boolean
 *       total_marks:
 *         type: number
 *       answers:
 *         type: array
 *         items:
 *            type: object
 *            properties:
 *              text:
 *                type: string
 *              marks:
 *                type: number
 *              src:
 *                type: string
 *              choosed_options:
 *                type: array
 *                items:
 *                  type: object
 *                  properties:
 *                    text:
 *                      type: string
 *                    src:
 *                      type: string
 *     required:
 *       - quiz
 *       - user
 *       - used_time
 *       - answers
 */

/**
 * @swagger
 * /quiz_submission:
 *   get:
 *     tags:
 *       - Quiz_submission
 *     description: Get all quiz_submissions
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

    let result = await findDocuments(Quiz_submission)

    if (!result.data.length)
      return res.send(formatResult(404, 'Quiz_submission list is empty'))

    // result.data = await injectUser(result.data, 'user')
    // result.data = await injectQuiz(result.data)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz_submission/{id}:
 *   get:
 *     tags:
 *       - Quiz_submission
 *     description: Returns a specified quiz_submission
 *     parameters:
 *       - name: id
 *         description: Quiz_submission's id
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

    let result = await findDocument(Quiz_submission, {
      _id: req.params.id
    })
    if (!result.data)
      return res.send(formatResult(404, 'quiz_submission not found'))

    // result.data = await injectUser([result.data], 'user')
    // result.data = await injectQuiz(result.data)
    // result.data = result.data[0]

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz_submission/quiz/{id}:
 *   get:
 *     tags:
 *       - Quiz_submission
 *     description: Returns quiz_submissions of the specified quiz
 *     parameters:
 *       - name: id
 *         description: Quiz id
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
router.get('/quiz/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if quiz exist
    let quiz = await findDocument(Quiz, {
      _id: req.params.id
    })
    if (!quiz.data)
      return res.send(formatResult(404, 'quiz not found'))

    let result = await findDocuments(Quiz_submission, {
      quiz: req.params.id
    })

    if (!result.data.length)
      return res.send(formatResult(404, 'quiz_submissions not found'))

    // result.data = await injectUser(result.data, 'user')

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz_submission/user/{id}:
 *   get:
 *     tags:
 *       - Quiz_submission
 *     description: Returns quiz_submissions of the specified user
 *     parameters:
 *       - name: id
 *         description: Student id
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

    // check if user exist
    let user = await findDocument(User, {
      _id: req.params.id
    })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    let result

    let user_category = await findDocument(User_category, {
      _id: user.data.category
    })

    if (user_category.data.name == 'STUDENT') {
      result = simplifyObject(await findDocuments(Quiz_submission, {
        user: req.params.id
      }))
      if (!result.data.length)
        return res.send(formatResult(404, 'quiz_submissions not found'))

      result.data = await injectQuiz(result.data)
      for (const i in result.data) {
        if (result.data[i].quiz) {
          result.data[i].quiz = await addAttachmentMediaPaths([result.data[i].quiz])
          result.data[i].quiz = await injectUser(result.data[i].quiz, 'user')
          result.data[i].quiz = result.data[i].quiz[0]
        }
      }
    } else {
      // check if there are quizes made by the user
      let quizes = await findDocuments(Quiz, {
        user: req.params.id
      })
      if (!quizes.data.length)
        return res.send(formatResult(404, 'quiz_submissions not found'))

      let foundSubmissions = []

      for (const i in quizes.data) {
        let quiz_submission = await findDocuments(Quiz_submission, {
          quiz: quizes.data[i]._id
        })
        if (quiz_submission.data.length) {
          quiz_submission.data = await injectUser(quiz_submission.data, 'user')
          quiz_submission.data = await injectQuiz(quiz_submission.data)

          for (const k in quiz_submission.data) {
            quiz_submission[k].quiz = await addAttachmentMediaPaths([quiz_submission[k].quiz])
            quiz_submission[k].quiz = quiz_submission[k].quiz[0]
            foundSubmissions.push(quiz_submission.data[k])
          }
        }
      }

      if (!foundSubmissions.length)
        return res.send(formatResult(404, 'quiz_submissions not found'))
      result = formatResult(u, u, foundSubmissions)
    }

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz_submission/user/{user_name}/{quiz_name}:
 *   get:
 *     tags:
 *       - Quiz_submission
 *     description: Returns quiz_submission of the specified user with the specified name
 *     parameters:
 *       - name: user_name
 *         description: User name
 *         in: path
 *         required: true
 *         type: string
 *       - name: quiz_name
 *         description: Quiz name
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
router.get('/user/:user_name/:quiz_name', async (req, res) => {
  try {

    // check if user exist
    let user = await findDocument(User, {
      user_name: req.params.user_name
    })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    let quiz = await findDocument(Quiz, {
      name: req.params.quiz_name
    })
    if (!quiz.data)
      return res.send(formatResult(404, 'quiz not found'))

    let result = await findDocument(Quiz_submission, {
      user: user.data._id,
      quiz: quiz.data._id
    })
    if (!result.data)
      return res.send(formatResult(404, 'quiz_submission not found'))
    result.data = simplifyObject(result.data)
    result.data = await injectQuiz([result.data])
    result.data[0].quiz = await addAttachmentMediaPaths([result.data[0].quiz])
    result.data[0].quiz = simplifyObject(result.data[0].quiz)
    result.data[0].quiz = await injectUser(result.data[0].quiz, 'user')
    result.data[0].quiz = result.data[0].quiz[0]
    result.data = result.data[0]

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
* @swagger
* /quiz_submission/{id}/attachment/{file_name}:
*   get:
*     tags:
*       - Quiz_submission
*     description: Returns the files attached to the specified quiz_submission
*     parameters:
*       - name: id
*         description: Quiz_submission's id
*         in: path
*         required: true
*         type: string
*       - name: file_name
*         description: file's name
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
router.get('/:id/attachment/:file_name', async (req, res) => {
  try {

    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const submission = await findDocument(Quiz_submission, {
      _id: req.params.id
    })
    if (!submission.data)
      return res.send(formatResult(404, 'quiz_submission not found'))

    const quiz = await findDocument(Quiz, {
      _id: submission.data.quiz
    })

    const user = await findDocument(User, {
      _id: quiz.data.user
    })

    let file_found = false

    for (let i in submission.data.answers) {
      i = parseInt(i)
      if (quiz.data.questions[i].type == 'file_upload') {
        if (submission.data.answers[i].src == req.params.file_name) {
          file_found = true
          break
        }
      }
      if (file_found)
        break
    }
    if (!file_found)
      return res.send(formatResult(404, 'file not found'))

    const file_path = `./uploads/colleges/${user.data.college}/assignments/${submission.data.quiz}/submissions/${submission.data._id}/${req.params.file_name}`

    const file_type = await findFileType(req.params.file_name)

    if (file_type === 'image') {
      sendResizedImage(req, res, file_path)
    } else if (file_type == 'video') {
      streamVideo(req, res, file_path)
    } else {
      return res.sendFile(path.normalize(__dirname + '../../../' + file_path))
    }

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz_submission:
 *   post:
 *     tags:
 *       - Quiz_submission
 *     description: Create quiz_submission
 *     parameters:
 *       - name: body
 *         description: Fields for a quiz_submission
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Quiz_submission'
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

    let {
      error
    } = validate_quiz_submission(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let user = await findDocument(User, {
      _id: req.body.user
    })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    let user_category = await findDocument(User_category, {
      _id: user.data.category
    })

    if (user_category.data.name != 'STUDENT')
      return res.send(formatResult(403, 'user is not allowed to do this quiz'))

    let quiz = await findDocument(Quiz, {
      _id: req.body.quiz
    })
    if (!quiz.data)
      return res.send(formatResult(404, 'quiz not found'))

    if (!quiz.data.target.id)
      return res.send(formatResult(404, 'quiz is not available'))

    const faculty_college_year = await get_faculty_college_year(req.body.quiz)

    let user_faculty_college_year = await findDocument(User_faculty_college_year, {
      user: user.data._id,
      faculty_college_year: faculty_college_year.data._id
    })
    if (!user_faculty_college_year.data)
      return res.send(formatResult(403, 'user is not allowed to do this quiz'))

    const valid_submision = validateSubmittedAnswers(quiz.data.questions, req.body.answers, 'anwsering')
    if (valid_submision.status !== true)
      return res.send(formatResult(400, valid_submision.error))

    // check if quiz_submissions exist
    let quiz_submission = await findDocument(Quiz_submission, {
      user: req.body.user,
      quiz: req.body.quiz
    })
    if (quiz_submission.data)
      return res.send(formatResult(400, 'quiz_submission already exist'))

    let result = await createDocument(Quiz_submission, {
      user: req.body.user,
      quiz: req.body.quiz,
      answers: req.body.answers,
      used_time: req.body.used_time,
      auto_submitted: req.body.auto_submitted
    })

    result.data = simplifyObject(result.data)
    result.data = await injectQuiz([result.data])
    result.data = result.data[0]

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz_submission/{id}:
 *   put:
 *     tags:
 *       - Quiz_submission
 *     description: Update quiz_submission
 *     parameters:
 *       - name: id
 *         description: Quiz_submission id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: Fields for a quiz_submission
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Quiz_submission'
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
router.put('/:id', async (req, res) => {
  try {
    let {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    error = validate_quiz_submission(req.body)
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let quiz_submission = await findDocument(Quiz_submission, {
      _id: req.params.id
    })
    if (!quiz_submission)
      return res.send(formatResult(404, 'quiz_submission not found'))

    let user = await findDocument(User, {
      _id: req.body.user
    })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    let user_category = await findDocument(User_category, {
      _id: user.data.category
    })

    if (user_category.data.name != 'STUDENT')
      return res.send(formatResult(403, 'user is not allowed to do this quiz'))

    let quiz = await findDocument(Quiz, {
      _id: req.body.quiz
    })
    if (!quiz.data)
      return res.send(formatResult(404, 'quiz not found'))

    if (!quiz.data.target.id)
      return res.send(formatResult(404, 'quiz is not available'))

    const faculty_college_year = await get_faculty_college_year(req.body.quiz)

    let user_faculty_college_year = await findDocument(User_faculty_college_year, {
      user: user.data._id,
      faculty_college_year: faculty_college_year.data._id
    })
    if (!user_faculty_college_year.data)
      return res.send(formatResult(403, 'user is not allowed to do this quiz'))

    const valid_submision = validateSubmittedAnswers(quiz.data.questions, req.body.answers, 'marking')
    if (valid_submision.status !== true)
      return res.send(formatResult(400, valid_submision.error))

    req.body.total_marks = valid_submision.total_marks
    req.body.marked = true

    const result = await updateDocument(Quiz_submission, req.params.id, req.body)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz_submission/{id}:
 *   delete:
 *     tags:
 *       - Quiz_submission
 *     description: Delete a quiz_submission
 *     parameters:
 *       - name: id
 *         description: Quiz_submission id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let quiz_submission = await findDocument(Quiz_submission, {
      _id: req.params.id
    })
    if (!quiz_submission.data)
      return res.send(formatResult(404, 'quiz_submission not found'))

    const result = await deleteDocument(Quiz_submission, req.params.id)

    let quiz = await findDocument(Quiz, {
      _id: quiz_submission.data.quiz
    })
    if (!quiz.data.target.id) {
      let faculty_college_year = await get_faculty_college_year(quiz.data._id)

      let faculty_college = await findDocument(Faculty_college, {
        _id: faculty_college_year.data.faculty_college
      })

      const path = `./uploads/colleges/${faculty_college.data.college}/assignments/${quiz.data._id}/submissions/${req.params.id}`
      fs.exists(path, (exists) => {
        if (exists) {
          fs.remove(path)
        }
      })
    }

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
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
        if (!answers[i].choosed_options) {
          message = `answer ${i + 1} must have choosed_options`
          break;
        } else {
          if (questions[i].type.includes('single') && !answers[i].choosed_options.length > 1) {
            if (!answers[i].choosed_options.length > 1) {
              message = `answer ${i + 1} must only one choosed_options`
              break;
            }
          }
          for (let k in answers[i].choosed_options) {
            k = parseInt(k)
            if (questions[i].type.includes('text') && !answers[i].choosed_options[k].text) {
              message = `choosed_option ${k + 1} in answer ${i + 1} must contain text`
              break;
            } else if (questions[i].type.includes('file') && !answers[i].choosed_options[k].src) {
              message = `choosed_option ${k + 1} in answer ${i + 1} must contain choosed file src`
              break;
            }
            if (questions[i].type.includes('text') && answers[i].choosed_options[k].src) {
              message = `choosed_option ${k + 1} in answer ${i + 1} must not contain src`
              break;
            } else if (questions[i].type.includes('file') && answers[i].choosed_options[k].text) {
              message = `choosed_option ${k + 1} in answer ${i + 1} must not contain text`
              break;
            }
          }
        }
      } else if (questions[i].type === 'open_ended') {
        if (!answers[i].text) {
          message = `question ${i + 1} must have text answer`
          break;
        } else if (answers[i].src) {
          message = `answer ${i + 1} must not contain src`
          break;
        }
      } else if (questions[i].type === 'file_upload') {
        if (!answers[i].src) {
          message = `question ${i + 1} must have src of the uploaded file`
          break;
        } else if (answers[i].text) {
          message = `answer ${i + 1} must not contain text`
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
    total_marks: marks
  } : {
      status: false,
      error: message
    }
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

async function get_faculty_college_year(quiz_id) {
  let quiz = await findDocument(Quiz, {
    _id: quiz_id
  })
  let course

  if (quiz.data.target.type == 'chapter') {
    let chapter = await findDocument(Chapter, {
      _id: quiz.data.target.id
    })
    course = await findDocument(Course, {
      _id: chapter.data.course
    })
    return await findDocument(Faculty_college_year, {
      _id: course.data.faculty_college_year
    })
  } else if (quiz.data.target.type == 'course') {
    course = await findDocument(Course, {
      _id: quiz.data.target.id
    })
    return await findDocument(Faculty_college_year, {
      _id: course.data.faculty_college_year
    })
  } else {
    return await findDocument(Faculty_college_year, {
      _id: quiz.data.target.id
    })
  }
}

// export the router
module.exports = router