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
  User,
  User_category,
  createDocument,
  deleteDocument,
  simplifyObject,
  Quiz_submission,
  sendResizedImage,
  findFileType,
  streamVideo,
  u,
  upload_multiple_images,
  Compress_images
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
 *       total_marks:
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
 *     required:
 *       - name
 *       - user
 *       - duration
 *       - questions
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

    if (!result.length)
      return res.send(formatResult(404, 'Quiz list is empty'))

    // result = await injectInstructor(result)
    // result = await addAttachmentMediaPaths(result)

    return res.send(formatResult(u, u, result))
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
    if (!quiz)
      return res.send(formatResult(404, 'quiz not found'))

    // quiz = await injectInstructor([quiz])
    // quiz = await addAttachmentMediaPaths(quiz)
    // quiz = quiz[0]

    return res.send(formatResult(u, u, quiz))
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
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    let quiz = await findDocuments(Quiz, {
      user: req.params.id
    })

    if (!quiz.length)
      return res.send(formatResult(404, 'quizes not found'))

    // quiz = await addAttachmentMediaPaths(quiz)
    // quiz = await addQuizUsages(quiz)
    // quiz = await addAttachedCourse(quiz)

    return res.send(formatResult(u, u, quiz))
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
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    let quiz = await findDocument(Quiz, {
      name: req.params.quiz_name
    })

    if (!quiz)
      return res.send(formatResult(404, 'quiz not found'))

    let faculty_college_year
    let chapter
    let course

    if (quiz.target.id) {
      if (quiz.target.type === 'chapter') {
        chapter = await findDocument(Chapter, {
          _id: quiz.target.id
        })
        course = await findDocument(Course, {
          _id: chapter.course
        })
        faculty_college_year = course.faculty_college_year
      } else if (quiz.target.type === 'course') {
        course = await findDocument(Course, {
          _id: quiz.target.id
        })
        faculty_college_year = course.faculty_college_year
      } else if (quiz.target.type === 'faculty_college_year') {
        faculty_college_year = quiz.target.id
      }

      const user_faculty_college_year = await findDocument(User_faculty_college_year, {
        user: req.params.id,
        faculty_college_year: faculty_college_year
      })
      if (!user_faculty_college_year)
        return res.send(formatResult(404, 'quiz not found'))
    } else {
      if (quiz.user !== req.params.id)
        return res.send(formatResult(404, 'quiz not found'))
    }

    quiz = await addAttachmentMediaPaths([quiz])
    quiz = await addQuizUsages(quiz)
    quiz = await addAttachedCourse(quiz)
    quiz = quiz[0]

    return res.send(formatResult(u, u, quiz))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})


/**
 * @swagger
 * /quiz/{id}/attachment/{file_name}:
 *   get:
 *     tags:
 *       - Quiz
 *     description: Returns the files attached to a specified quiz ( use format height and width only when the attachment is a picture)
 *     parameters:
 *       - name: id
 *         description: Quiz's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: file's name
 *         in: path
 *         required: true
 *         type: string
 *       - name: format
 *         description: File format one of (jpeg, jpg, png, webp)
 *         in: query
 *         type: string
 *       - name: height
 *         description: custom height
 *         in: query
 *         type: string
 *       - name: width
 *         description: custom width
 *         in: query
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

    const quiz = await findDocument(Quiz, {
      _id: req.params.id
    })
    if (!quiz)
      return res.send(formatResult(404, 'quiz not found'))

    let file_found = false

    for (const i in quiz.questions) {
      if (quiz.questions[i].type.includes('file_select')) {
        for (const k in quiz.questions[i].options.choices) {
          if (quiz.questions[i].options.choices[k].src == req.params.file_name) {
            file_found = true
            break
          }
        }
      }
      if (file_found)
        break
    }
    if (!file_found)
      return res.send(formatResult(404, 'file not found'))

    const user = await findDocument(User, {
      _id: quiz.user
    })

    const file_path = `./uploads/colleges/${user.college}/assignments/${quiz._id}/${req.params.file_name}`

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

    let user_category = await findDocument(User_category, {
      name: 'INSTRUCTOR'
    })

    let user = await findDocument(User, {
      user_name: req.body.user
    })
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    if (user.category != user_category._id)
      return res.send(formatResult(404, 'user can\'t create quiz'))

    // check if quizname exist
    let quiz = await findDocument(Quiz, {
      name: req.body.name
    })
    if (quiz)
      return res.send(formatResult(400, 'name was taken'))

    const validQuestions = validateQuestions(req.body.questions)
    if (validQuestions.status !== true)
      return res.send(formatResult(400, validQuestions.error))

    let result = await createDocument(Quiz, {
      name: req.body.name,
      duration: req.body.duration,
      instructions: req.body.instructions,
      user: req.body.user,
      questions: req.body.questions,
      total_marks: validQuestions.total_marks
    })

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz/{id}:
 *   put:
 *     tags:
 *       - Quiz
 *     description: Update quiz
 *     parameters:
 *       - name: id
 *         description: Quiz id
 *         in: path
 *         required: true
 *         type: string
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
router.put('/:id', async (req, res) => {
  try {
    let {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    error = validate_quiz(req.body)
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let user_category = await findDocument(User_category, {
      name: 'INSTRUCTOR'
    })

    let user = await findDocument(User, {
      _id: req.body.user
    })
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    if (user.category != user_category._id)
      return res.send(formatResult(404, 'user can\'t create quiz'))

    // check if quiz exist
    let quiz = await findDocument(Quiz, {
      _id: req.params.id,
      user: req.body.user
    }, u, false)
    if (!quiz)
      return res.send(formatResult(404, 'quiz not found'))

    let quiz_copy = quiz

    // check if quizname exist
    quiz = await findDocument(Quiz, {
      _id: {
        $ne: req.params.id
      },
      name: req.body.name
    })
    if (quiz)
      return res.send(formatResult(400, 'name was taken'))

    quiz = quiz_copy
    quiz_copy = simplifyObject(quiz)

    if (req.body.target) {

      req.body.target.type = req.body.target.type.toLowerCase()

      const allowedTargets = ['chapter', 'course', 'faculty_college_year']

      if (!allowedTargets.includes(req.body.target.type))
        return res.send(formatResult(400, 'invalid quiz target_type'))

      let target

      switch (req.body.target.type) {
        case 'chapter':
          target = await findDocument(Chapter, {
            _id: req.body.target.id
          })
          break;

        case 'course':
          target = await findDocument(Course, {
            _id: req.body.target.id
          })
          break;

        case 'faculty_college_year':
          target = await findDocument(Faculty_college_year, {
            _id: req.body.target.id
          })
          break;

        default:
          break;
      }

      if (!target)
        return res.send(formatResult(404, 'quiz target not found'))

      // remove the previously attached quiz
      const last_targeted_quiz = await findDocument(Quiz, {
        target: req.body.target
      })
      if (last_targeted_quiz) {
        last_targeted_quiz.target = undefined
        await last_targeted_quiz.save()
      }
    }

    const validQuestions = validateQuestions(req.body.questions)
    if (validQuestions.status !== true)
      return res.send(formatResult(400, validQuestions.error))

    req.body.total_marks = validQuestions.total_marks

    quiz.name = req.body.name
    quiz.instructions = req.body.instructions
    quiz.target = req.body.target
    quiz.duration = req.body.duration
    quiz.questions = req.body.questions
    quiz.total_marks = req.body.total_marks
    quiz.user = req.body.user
    quiz.published = req.body.published

    await quiz.save()


    // delete removed files
    for (const i in quiz_copy.questions) {
      if (
        quiz_copy.questions[i].type.includes("file_select")
      ) {
        let deleteAll = false
        if (!req.body.questions[i].type.includes('file_select')) {
          deleteAll = true
        }
        for (const j in quiz_copy.questions[i].options.choices) {
          let deletePicture = true
          if (req.body.questions[i].type.includes('file_select')) {
            for (const k in req.body.questions[i].options.choices) {
              if (quiz_copy.questions[i].options.choices[j].src === req.body.questions[i].options.choices[k].src) {
                deletePicture = false
              }
            }
          }
          if (deleteAll || deletePicture) {
            const path = `./uploads/colleges/${user.college}/assignments/${req.params.id}/${quiz_copy.questions[i].options.choices[j].src}`
            fs.exists(path, (exists) => {
              if (exists) {
                fs.unlink(path)
              }
            })
          }
        }
      }
    }

    return res.send(formatResult(200, 'UPDATED', quiz))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz/{id}/attachment:
 *   post:
 *     tags:
 *       - Quiz
 *     description: Upload quiz attacments (file upload using swagger is still under construction)
 *     parameters:
 *       - name: id
 *         description: Quiz id
 *         in: path
 *         required: true
 *         type: string
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
router.post('/:id/attachment', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const quiz = await findDocument(Quiz, {
      _id: req.params.id
    })
    if (!quiz)
      return res.send(formatResult(404, 'quiz not found'))

    const user = await findDocument(User, {
      _id: quiz.user
    })

    const path = `./uploads/colleges/${user.college}/assignments/${req.params.id}`, temp_path = `./uploads/colleges/${user.college}/temp`

    req.kuriousStorageData = {
      dir: temp_path,
    }

    let file_missing = false

    for (const i in quiz.questions) {
      if (quiz.questions[i].type.includes('file_select')) {
        for (const k in quiz.questions[i].options.choices) {
          const file_found = await fs.exists(`${path}/${quiz.questions[i].options.choices[k].src}`)
          if (!file_found) {
            file_missing = true
          }
        }
      }
    }
    if (!file_missing)
      return res.send(formatResult(400, 'all attachments for this quiz were already uploaded'))

    upload_multiple_images(req, res, async (err) => {
      if (err)
        return res.send(formatResult(500, err.message))

      await Compress_images(temp_path, path)

      for (const i in req.files) {
        setTimeout(() => {
          fs.unlink(`${temp_path}/${req.files[i].filename}`, (err) => {
            if (err)
              return res.send(formatResult(500, err))
          })
        }, 1000);
      }

      return res.send(formatResult(u, 'All attachments were successfuly uploaded'))
    })

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /quiz/{id}:
 *   delete:
 *     tags:
 *       - Quiz
 *     description: Delete a quiz
 *     parameters:
 *       - name: id
 *         description: Quiz id
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

    let {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let quiz = await findDocument(Quiz, {
      _id: req.params.id
    })
    if (!quiz)
      return res.send(formatResult(404, 'quiz not found'))

    // check if the quiz is never used
    let quiz_used = false

    const submission = await findDocument(Quiz_submission, {
      quiz: req.params.id
    })
    if (submission)
      quiz_used = true

    if (!quiz_used) {
      let user = await findDocument(User, {
        _id: quiz.user
      })

      let result = await deleteDocument(Quiz, req.params.id)

      const path = `./uploads/colleges/${user.college}/assignments/${req.params.id}`
      fs.exists(path, (exists) => {
        if (exists) {
          fs.remove(path)
        }
      })

      return res.send(result)
    }

    const update_quiz = await updateDocument(Quiz, req.params.id, {
      status: 0
    })
    return res.send(formatResult(200, 'quiz couldn\'t be deleted because it was used, instead it was disabled', update_quiz.data))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

function validateQuestions(questions) {
  const allowedQuestionTypes = ['open_ended', 'single_text_select', 'multiple_text_select', 'single_file_select', 'multiple_file_select', 'file_upload']
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
        if (questions[i].options.choices.length < 2) {
          message = `question ${i + 1} must have more than one selection choices`
          break;
        }
        if (!questions[i].options.choices && !questions[i].type.includes('file')) {
          message = `question ${i + 1} must have selection choices`
          break;
        }
        let right_option_found = false
        for (let k in questions[i].options.choices) {
          k = parseInt(k)
          let times
          if (questions[i].type === 'single_text_select' || questions[i].type === 'multi_text_select') {
            times = questions[i].options.choices.filter(choice => choice.text == questions[i].options.choices[k].text).length
            if (!questions[i].options.choices[k].text) {
              message = `choice ${k + 1} in question ${i + 1} must have text`
              break;
            }
          }
          if (questions[i].type === 'single_file_select' || questions[i].type === 'multi_file_select') {
            times = questions[i].options.choices.filter(choice => choice.src == questions[i].options.choices[k].src).length
            if (!questions[i].options.choices[k].src) {
              message = `choice ${k + 1} in question ${i + 1} must have attachment src`
              break;
            }
          }
          if (questions[i].options.choices[k].right) {
            right_option_found = true
          }
          if (times > 1) {
            message = `question ${i + 1} must have identical choices`
            break;
          }
        }
        if (!right_option_found) {
          message = `question ${i + 1} must have one right selection choice`
          break;
        }
      }
    }
    marks += parseInt(questions[i].marks)
    // more validations later
  }
  return message === '' ? {
    status: true,
    total_marks: marks
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