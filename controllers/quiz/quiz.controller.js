// import dependencies
const {sendReleaseMarskEmail} = require("../email/email.controller");
const {updateDocument, validateQuestions} = require("../../utils/imports");
const {
    express,
    fs,
    Quiz,
    Chapter,
    Course,
    validate_quiz,
    path,
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
    addQuizTarget,
    addStorageDirectoryToPath
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
 * /quiz/user/{id}:
 *   get:
 *     tags:
 *       - Quiz
 *     description: Returns quizes of a specified user
 *     security:
 *       - bearerAuth: -[]
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
        quiz = await addAttachmentMediaPaths(quiz)
        // quiz = quiz[0]

        return res.send(formatResult(u, u, quiz))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /quiz/user/{user_name}:
 *   get:
 *     tags:
 *       - Quiz
 *     description: Returns quizes of a specified user
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: user_name
 *         description: User's user_name
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
router.get('/user/:user_name', async (req, res) => {
    try {
        let user = await findDocument(User, {
            user_name: req.params.user_name
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        let quiz = await findDocuments(Quiz, {
            user: user._id
        }, u, u, u, u, u, {_id: -1})

        quiz = await addAttachmentMediaPaths(quiz)
        quiz = await addQuizUsages(quiz)
        quiz = await addAttachedCourse(quiz)

        return res.send(formatResult(u, u, quiz))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /quiz/user/{user_name}/{quiz_name}:
 *   get:
 *     tags:
 *       - Quiz
 *     description: Returns a quiz with the specified name
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: user_name
 *         description: User_name
 *         in: path
 *         required: true
 *         type: string
 *       - name: quiz_name
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
router.get('/user/:user_name/:quiz_name', async (req, res) => {
    try {
        let user = await findDocument(User, {
            user_name: req.params.user_name
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        let user_category = await findDocument(User_category, {
            name: 'INSTRUCTOR'
        })

        const isInstructor = user.category == user_category._id

        let quiz = await findDocument(Quiz, isInstructor ? {
            name: req.params.quiz_name,
            user: user._id
        } : {name: req.params.quiz_name})
        if (!quiz)
            return res.send(formatResult(404, 'quiz not found'))

        let faculty_college_year
        let chapter
        let course

        if (quiz.target) {
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
                user: user._id,
                faculty_college_year: faculty_college_year
            })
            if (!user_faculty_college_year)
                return res.send(formatResult(404, 'quiz not found'))
        } else {
            if (req.params.user_name != req.user.user_name)
                return res.send(formatResult(404, 'quiz not found'))
        }

        if (isInstructor) {
            quiz = await addQuizUsages(quiz)
        }

        quiz = await addAttachmentMediaPaths([quiz])
        quiz = await addAttachedCourse(quiz)
        quiz = await addQuizTarget(quiz)
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
 *     security:
 *       - bearerAuth: -[]
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
            if (quiz.questions[i].type.includes('image_select')) {
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

        const file_path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${quiz._id}/${req.params.file_name}`)

        const file_type = await findFileType(req.params.file_name)

        if (file_type === 'image') {
            sendResizedImage(req, res, file_path)
        } else if (file_type == 'video') {
            streamVideo(req, res, file_path)
        } else {
            return res.sendFile(file_path)
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
 *     security:
 *       - bearerAuth: -[]
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
            name: req.body.name,
            user: user._id
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
            user: user._id,
            questions: req.body.questions,
            total_marks: validQuestions.total_marks,
            passMarks: req.body.passMarks
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
 *     security:
 *       - bearerAuth: -[]
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
            user_name: req.body.user
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        if (user.category != user_category._id)
            return res.send(formatResult(404, 'user can\'t create quiz'))

        // check if quiz exist
        let quiz = await findDocument(Quiz, {
            _id: req.params.id,
            user: user._id
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

        const validQuestions = validateQuestions(req.body.questions)
        if (validQuestions.status !== true)
            return res.send(formatResult(400, validQuestions.error))

        req.body.total_marks = validQuestions.total_marks

        quiz.name = req.body.name
        quiz.instructions = req.body.instructions
        quiz.duration = req.body.duration
        quiz.questions = req.body.questions
        quiz.total_marks = req.body.total_marks
        quiz.user = user._id
        quiz.published = req.body.published
        quiz.passMarks = req.body.passMarks

        await quiz.save()


        // delete removed files
        for (const i in quiz_copy.questions) {
            if (
                quiz_copy.questions[i].type.includes("image_select")
            ) {
                let current_question = quiz.questions.filter(q => q._id == quiz_copy.questions[i]._id)
                current_question = current_question[0]
                for (const j in quiz_copy.questions[i].options.choices) {
                    let deletePicture = true
                    if (current_question) {
                        if (current_question.type.includes('image_select')) {
                            for (const k in current_question.options.choices) {
                                if (quiz_copy.questions[i].options.choices[j].src === current_question.options.choices[k].src) {
                                    deletePicture = false
                                }
                            }
                        }
                    }
                    if (deletePicture) {
                        const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${req.params.id}/${quiz_copy.questions[i].options.choices[j].src}`)
                        fs.exists(path, (exists) => {
                            if (exists) {
                                fs.unlink(path)
                            }
                        })
                    }
                }
            }
        }
        quiz = await addQuizUsages([quiz])
        quiz = await addAttachedCourse(quiz)
        quiz = quiz[0]
        return res.send(formatResult(200, 'UPDATED', quiz))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /quiz/release_marks/{id}:
 *   put:
 *     tags:
 *       - Quiz
 *     description: Publish quiz marks
 *     security:
 *       - bearerAuth: -[]
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
router.put('/release_marks/:id', async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if course exist
        let quiz = await findDocument(Quiz, {
            _id: req.params.id
        })
        if (!quiz)
            return res.send(formatResult(404, 'quiz not found'))

        let unmarked = await countDocuments(Quiz_submission, {
            exam: req.params.id,
            marked: false
        })

        if (unmarked)
            return res.send(formatResult(403, `Please mark the remaining ${unmarked} submission${unmarked > 1 ? 's' : ''} before releasing marks`))

        let result = await updateDocument(Quiz, req.params.id,
            {
                status: quiz.status == 1 ? 2 : 1
            })
        if (quiz.status === 1) {
            const submissions = await Quiz_submission.find({quiz: req.params.id}).populate('user')
            for (const i in submissions) {
                if (submissions[i].user.email) {
                    await sendReleaseMarskEmail({
                        email: submissions[i].user.email,
                        user_names: `Mr${submissions[i].user.gender === 'female' ? 's' : ''} ${submissions[i].user.sur_name} ${submissions[i].user.other_names}`,
                        instructor_names: req.user.sur_name + ' ' + req.user.other_names,
                        assignment_name: quiz.name,
                        assignment_type: 'quiz',
                        link: `https://${process.env.FRONTEND_HOST}/assessments/quiz/${quiz.name}/${submissions[i].user.user_name}`
                    })
                }
            }
        }
        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /quiz/{id}/target:
 *   put:
 *     tags:
 *       - Quiz
 *     description: Update quiz target
 *     security:
 *       - bearerAuth: -[]
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
 *           type:
 *             type: string
 *             required: true
 *           id:
 *             type: string
 *             required: true
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
router.put('/:id/target', async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        error = validate_quiz(req.body, true)
        error = error.error
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if quiz exist
        let quiz = await findDocument(Quiz, {
            _id: req.params.id
        }, u, false)
        if (!quiz)
            return res.send(formatResult(404, 'quiz not found'))


        req.body.type = req.body.type.toLowerCase()

        const allowedTargets = ['chapter', 'course', 'faculty_college_year']

        if (!allowedTargets.includes(req.body.type))
            return res.send(formatResult(400, 'invalid quiz target_type'))

        let target

        switch (req.body.type) {
            case 'chapter':
                target = await findDocument(Chapter, {
                    _id: req.body.id
                })
                break;

            case 'course':
                target = await findDocument(Course, {
                    _id: req.body.id
                })
                break;

            case 'faculty_college_year':
                target = await findDocument(Faculty_college_year, {
                    _id: req.body.id
                })
                break;

            default:
                break;
        }

        if (!target)
            return res.send(formatResult(404, 'quiz target not found'))

        // remove the previously attached quiz
        const last_targeted_quiz = await findDocument(Quiz, {
            _id: {
                $ne: req.params.id
            },
            "target.id": req.body.id
        }, u, false)
        if (last_targeted_quiz) {
            last_targeted_quiz.target = undefined
            await last_targeted_quiz.save()
        }

        quiz.target = {
            type: req.body.type,
            id: req.body.id
        }

        await quiz.save()

        return res.send(formatResult(200, 'UPDATED', quiz))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /quiz/{id}/target:
 *   delete:
 *     tags:
 *       - Quiz
 *     description: Remove quiz target
 *     security:
 *       - bearerAuth: -[]
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
router.delete('/:id/target', async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if quiz exist
        let quiz = await findDocument(Quiz, {
            _id: req.params.id,
            user: req.user._id
        }, u, false)
        if (!quiz)
            return res.send(formatResult(404, 'quiz not found'))

        quiz.target = undefined

        await quiz.save()

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
 *     description: Upload quiz attacments
 *     security:
 *       - bearerAuth: -[]
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

        const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${req.params.id}`)

        req.kuriousStorageData = {
            dir: path,
        }

        let file_missing = false

        for (const i in quiz.questions) {
            if (quiz.questions[i].type.includes('image_select')) {
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
 *     security:
 *       - bearerAuth: -[]
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

            const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${req.params.id}`)
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

// export the router
module.exports = router