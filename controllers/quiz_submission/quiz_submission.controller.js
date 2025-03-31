// import dependencies
const {
    quiz
} = require('../../models/quiz/quiz.model')
const {User_user_group} = require('../../models/user_user_group/user_user_group.model')
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
    simplifyObject,
    fs,
    upload_multiple,
    upload_single,
    Comment,
    addQuizTarget,
    auth,
    addStorageDirectoryToPath
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
 *     security:
 *       - bearerAuth: -[]
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', auth, async (req, res) => {
    try {

        let result = await findDocuments(Quiz_submission)

        if (!result.length)
            return res.send(formatResult(404, 'Quiz_submission list is empty'))

        // result = await injectUser(result, 'user')
        // result = await injectQuiz(result)

        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /quiz_submission/user:
 *   get:
 *     tags:
 *       - Quiz_submission
 *     description: Returns quiz_submissions of the specified user
 *     security:
 *       - bearerAuth: -[]
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/user', auth, async (req, res) => {
    try {

        let result

        if (req.user.category.name == 'STUDENT') {

            const user_user_group = await findDocument(User_user_group, {
                user: req.user._id,
                status: "ACTIVE"
            })

            if (!user_user_group)
                return res.send(formatResult(200, undefined, []))

            let courses = await findDocuments(Course, {
                user_group: user_user_group.user_group,
                published: true
            }, u, u, u, u, u, {
                _id: -1
            })
            if (!courses.length)
                return res.send(formatResult(200, undefined, []))

            let coursesWithSubmissions = []

            for (const j in courses) {
                // check if there are quizes made by the user
                let chapters = await findDocuments(Chapter, {
                    course: courses[j]._id
                }, u, u, u, u, u, {
                    _id: -1
                })

                for (const l in chapters) {

                    let quizes = await findDocuments(Quiz, {
                        "target.id": chapters[l]._id,
                        status: 2 // only released marks
                    }, u, u, u, u, u, {
                        _id: -1
                    })

                    let foundSubmissions = []
                    quizes = await addQuizTarget(quizes)
                    for (const i in quizes) {

                        let quiz_submissions = await findDocuments(Quiz_submission, {
                            quiz: quizes[i]._id,
                            user: req.user._id
                        }, u, u, u, u, u, {
                            _id: -1
                        })
                        if (quiz_submissions.length) {

                            quiz_submissions = await injectUserFeedback(quiz_submissions)

                            for (const k in quiz_submissions) {

                                quiz_submissions[k].total_feedbacks = 0

                                for (const l in quiz_submissions[k].answers) {
                                    quiz_submissions[k].total_feedbacks += quiz_submissions[k].answers[l].feedback ? 1 : 0;
                                }
                                quiz_submissions[k].quiz = quizes[i]
                                foundSubmissions.push(quiz_submissions[k])
                            }
                        }
                    }
                    if (foundSubmissions.length) {
                        foundSubmissions = foundSubmissions.sort((a, b) => {
                            if (a.createdAt > b.createdAt) return -1;
                            if (a.createdAt < b.createdAt) return 1;
                            return 0;
                        })
                        courses[j].submissions = foundSubmissions
                        courses[j].marking_status = 0
                        courses[j].unread_results = 0
                        const percentage_of_one_submission = 100 / foundSubmissions.length
                        for (const a in foundSubmissions) {
                            if (foundSubmissions[a].marked) {
                                courses[j].marking_status += percentage_of_one_submission
                            }
                            if (!foundSubmissions[a].results_seen) {
                                courses[j].unread_results++
                            }
                        }
                        courses[j].marking_status += '%'
                        courses[j].last_submitted = foundSubmissions[foundSubmissions.length - 1].updatedAt
                        coursesWithSubmissions.push(courses[j])
                    }

                }

            }

            result = coursesWithSubmissions
        } else {
            // check if there are quizes made by the user
            let quizes = await findDocuments(Quiz, {
                user: req.user._id,
                target: {
                    $ne: undefined
                }
            }, u, u, u, u, u, {
                _id: -1
            })
            if (!quizes.length)
                return res.send(formatResult(404, 'quiz_submissions not found'))

            let foundSubmissions = []

            quizes = await addAttachmentMediaPaths(quizes)

            quizes = await addQuizTarget(quizes)
            for (const i in quizes) {

                let quiz_submissions = await findDocuments(Quiz_submission, {
                    quiz: quizes[i]._id
                }, u, u, u, u, u, {
                    _id: -1
                })

                quizes[i].total_submissions = quiz_submissions.length

                if (quiz_submissions.length) {

                    quiz_submissions = await injectUser(quiz_submissions, 'user')
                    quiz_submissions = await injectUserFeedback(quiz_submissions)

                    quizes[i].marking_status = 0
                    const percentage_of_one_submission = 100 / quiz_submissions.length

                    for (const k in quiz_submissions) {

                        if (quiz_submissions[k].marked) {
                            quizes[i].marking_status += percentage_of_one_submission
                        }

                        quiz_submissions[k].total_feedbacks = 0

                        for (const l in quiz_submissions[k].answers) {
                            quiz_submissions[k].total_feedbacks += quiz_submissions[k].answers[l].feedback ? 1 : 0;
                        }
                    }
                    quizes[i].submissions = quiz_submissions
                    foundSubmissions.push(quizes[i])
                    quizes[i].marking_status += '%'
                }
            }

            if (!foundSubmissions.length)
                return res.send(formatResult(404, 'quiz_submissions not found'))
            result = foundSubmissions
        }
        result = await injectUser(result, 'user')

        return res.send(formatResult(u, u, result))
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
 *     security:
 *       - bearerAuth: -[]
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
router.get('/:id', auth, async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let result = await findDocument(Quiz_submission, {
            _id: req.params.id
        })
        if (!result)
            return res.send(formatResult(404, 'quiz_submission not found'))

        // result = await injectUser([result], 'user')
        // result = await injectQuiz(result)
        // result = result[0]

        return res.send(formatResult(u, u, result))
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
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/quiz/:id', auth, async (req, res) => {
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
        if (!quiz)
            return res.send(formatResult(404, 'quiz not found'))

        let result = await findDocuments(Quiz_submission, {
            quiz: req.params.id
        })

        if (!result.length)
            return res.send(formatResult(404, 'quiz_submissions not found'))

        // result = await injectUser(result, 'user')

        return res.send(formatResult(u, u, result))
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
 *     security:
 *       - bearerAuth: -[]
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
router.get('/user/:user_name/:quiz_name', auth, async (req, res) => {
    try {

        // check if user exist
        let user = await findDocument(User, {
            user_name: req.params.user_name
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        let quiz = await findDocument(Quiz, {
            name: req.params.quiz_name
        })
        if (!quiz)
            return res.send(formatResult(404, 'quiz not found'))

        let result = await findDocument(Quiz_submission, {
            user: user._id,
            quiz: quiz._id
        })
        if (!result)
            return res.send(formatResult(404, 'quiz_submission not found'))
        result = simplifyObject(result)
        result = simplifyObject(await injectQuiz([result]))
        result = await injectUserFeedback(result)
        result = await injectUser(result, 'user')
        result = result[0]
        result.quiz = await addQuizTarget([result.quiz])
        result.quiz = await addAttachmentMediaPaths(result.quiz)
        result.quiz = simplifyObject(result.quiz)
        result.quiz = await injectUser(result.quiz, 'user')
        // result = await injectUser(result, 'user')
        result.quiz = result.quiz[0]
        result = await injectUserFeedback(result)
        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /quiz_submission/{id}/attachment/{file_name}/{action}:
 *   get:
 *     tags:
 *       - Quiz_submission
 *     description: Returns or download the files attached to the specified quiz_submission
 *     security:
 *       - bearerAuth: -[]
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
 *       - name: action
 *         description: what you want
 *         in: path
 *         required: true
 *         type: string
 *         enum: ['view','download']
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/:id/attachment/:file_name/:action', auth, async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let allowed_actions = ['view', 'download']
        if (!allowed_actions.includes(req.params.action))
            return res.send(formatResult(400, 'invalid action'))


        const submission = await findDocument(Quiz_submission, {
            _id: req.params.id
        })
        if (!submission)
            return res.send(formatResult(404, 'quiz_submission not found'))

        const quiz = await findDocument(Quiz, {
            _id: submission.quiz
        })

        const user = await findDocument(User, {
            _id: quiz.user
        })

        let file_found = false

        for (let i in submission.answers) {
            i = parseInt(i)
            if (quiz.questions[i].type == 'file_upload') {
                if (submission.answers[i].src == req.params.file_name) {
                    file_found = true
                    break
                }
            }
            if (file_found)
                break
        }
        if (!file_found)
            return res.send(formatResult(404, 'file not found'))

        const file_path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${submission.quiz}/submissions/${submission._id}/${req.params.file_name}`)

        const file_type = await findFileType(req.params.file_name)

        if (req.params.action == 'download')
            return res.download(file_path)

        if (file_type === 'image') {
            sendResizedImage(req, res, file_path)
        } else if (file_type == 'video') {
            streamVideo(req, res, file_path)
        } else {
            return res.sendFile(path.normalize(file_path))
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
 *     security:
 *       - bearerAuth: -[]
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
router.post('/', auth, async (req, res) => {
    try {
        req.body.user = req.user.user_name
        let {
            error
        } = validate_quiz_submission(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let user = await findDocument(User, {
            user_name: req.body.user
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        let user_category = await findDocument(User_category, {
            _id: user.category
        })

        if (user_category.name != 'STUDENT')
            return res.send(formatResult(403, 'user is not allowed to do this quiz'))

        let quiz = await findDocument(Quiz, {
            _id: req.body.quiz
        })
        if (!quiz)
            return res.send(formatResult(404, 'quiz not found'))

        if (!quiz.target.id)
            return res.send(formatResult(404, 'quiz is not available'))

        const faculty_college_year = await get_faculty_college_year(req.body.quiz)

        let user_faculty_college_year = await findDocument(User_faculty_college_year, {
            user: user._id,
            faculty_college_year: faculty_college_year._id
        })
        if (!user_faculty_college_year)
            return res.send(formatResult(403, 'user is not allowed to do this quiz'))

        const valid_submision = validateSubmittedAnswers(quiz.questions, req.body.answers, 'anwsering')
        if (valid_submision.status !== true)
            return res.send(formatResult(400, valid_submision.error))

        // check if quiz_submissions exist
        let quiz_submission = await findDocument(Quiz_submission, {
            user: user._id,
            quiz: req.body.quiz
        })
        if (quiz_submission)
            return res.send(formatResult(400, 'quiz_submission already exist'))

        const {answers, total_marks, is_selection_only} = autoMarkSelectionQuestions(quiz.questions, req.body.answers)

        let result = await createDocument(Quiz_submission, {
            user: user._id,
            quiz: req.body.quiz,
            answers: answers,
            used_time: req.body.used_time,
            auto_submitted: req.body.auto_submitted,
            total_marks: total_marks,
            marked: is_selection_only
        })
        result = simplifyObject(result)
        result.data = await injectQuiz([result.data])
        result.data = {
            document: result.data[0],
            is_selection_only: is_selection_only
        }

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
 *     security:
 *       - bearerAuth: -[]
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
router.put('/:id', auth, async (req, res) => {
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
            user_name: req.body.user
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        req.body.user = user._id

        let user_category = await findDocument(User_category, {
            _id: user.category
        })

        if (user_category.name != 'STUDENT')
            return res.send(formatResult(403, 'user is not allowed to do this quiz'))

        let quiz = await findDocument(Quiz, {
            _id: req.body.quiz
        })
        if (!quiz)
            return res.send(formatResult(404, 'quiz not found'))

        if (!quiz.target.id)
            return res.send(formatResult(404, 'quiz is not available'))

        const faculty_college_year = await get_faculty_college_year(req.body.quiz)

        let user_faculty_college_year = await findDocument(User_faculty_college_year, {
            user: user._id,
            faculty_college_year: faculty_college_year._id
        })
        if (!user_faculty_college_year)
            return res.send(formatResult(403, 'user is not allowed to do this quiz'))

        const valid_submision = validateSubmittedAnswers(quiz.questions, req.body.answers, 'marking')
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
 * /quiz_submission/{id}/results_seen:
 *   put:
 *     tags:
 *       - Quiz_submission
 *     description: Indicate that student saw quiz_results
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Quiz_submission id
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
router.put('/:id/results_seen', auth, async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let quiz_submission = await findDocument(Quiz_submission, {
            _id: req.params.id
        })
        if (!quiz_submission)
            return res.send(formatResult(404, 'quiz_submission not found'))

        const result = await updateDocument(Quiz_submission, req.params.id, {
            results_seen: true
        })

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /quiz_submission/{id}/attachment:
 *   post:
 *     tags:
 *       - Quiz_submission
 *     description: Upload quiz submission attacments
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Quiz_submission id
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
router.post('/:id/attachment', auth, async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const quiz_submission = await findDocument(Quiz_submission, {
            _id: req.params.id
        })
        if (!quiz_submission)
            return res.send(formatResult(404, 'quiz_submission not found'))

        const quiz = await findDocument(Quiz, {
            _id: quiz_submission.quiz
        })
        if (!quiz)
            return res.send(formatResult(404, 'quiz not found'))

        const user = await findDocument(User, {
            _id: quiz.user
        })

        const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${quiz._id}/submissions/${req.params.id}`)

        req.kuriousStorageData = {
            dir: path,
        }

        let file_missing = false

        for (const i in quiz_submission.answers) {
            if (quiz_submission.answers[i].src) {
                const file_found = await fs.exists(`${path}/${quiz_submission.answers[i].src}`)
                if (!file_found) {
                    file_missing = true
                }
            }
        }
        if (!file_missing)
            return res.send(formatResult(400, 'all attachments for this quiz_submission were already uploaded'))

        upload_single(req, res, async (err) => {
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
 * /quiz_submission/feedback/{id}/{answer}:
 *   post:
 *     tags:
 *       - Quiz_submission
 *     description: Upload quiz submission feedback attacments
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Quiz_submission id
 *         in: path
 *         required: true
 *         type: string
 *       - name: answer
 *         description: Answer id
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
router.post('/feedback/:id/:answer', auth, async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, "invalid quiz_submission id"))

        error = validateObjectId(req.params.answer)
        error = error.error
        if (error)
            return res.send(formatResult(400, "invalid question id"))

        const quiz_submission = await findDocument(Quiz_submission, {
            _id: req.params.id
        })
        if (!quiz_submission)
            return res.send(formatResult(404, 'quiz_submission not found'))

        const answer = quiz_submission.answers.filter(e => e._id == req.params.answer)
        if (!answer.length)
            return res.send(formatResult(404, 'answer not found'))

        const quiz = await findDocument(Quiz, {
            _id: quiz_submission.quiz
        })
        if (!quiz)
            return res.send(formatResult(404, 'quiz not found'))

        const user = await findDocument(User, {
            _id: quiz.user
        })

        const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${quiz._id}/submissions/${req.params.id}`)

        req.kuriousStorageData = {
            dir: path,
        }


        const file_found = await fs.exists(`${path}/${quiz_submission.answers[i].feedback_src}`)
        if (file_found)
            return res.send(formatResult(400, 'feedbacks for this answer was already uploaded'))

        upload_multiple(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))

            return res.send(formatResult(u, 'Feedback attachment was successfuly uploaded'))
        })

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
 *     security:
 *       - bearerAuth: -[]
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
router.delete('/:id', auth, async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let quiz_submission = await findDocument(Quiz_submission, {
            _id: req.params.id
        })
        if (!quiz_submission)
            return res.send(formatResult(404, 'quiz_submission not found'))

        const result = await deleteDocument(Quiz_submission, req.params.id)

        let quiz = await findDocument(Quiz, {
            _id: quiz_submission.quiz
        })
        if (!quiz.target.id) {
            let faculty_college_year = await get_faculty_college_year(quiz._id)

            let faculty_college = await findDocument(Faculty_college, {
                _id: faculty_college_year.faculty_college
            })

            const path = addStorageDirectoryToPath(`./uploads/colleges/${faculty_college.college}/assignments/${quiz._id}/submissions/${req.params.id}`)
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
            // validate questions if it was not auto_submitted
            if (!answers[i].not_done) {
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

// auto mark selection questions
function autoMarkSelectionQuestions(questions, answers) {
    let is_selection_only = true, total_marks = 0;
    for (const i in questions) {
        if (questions[i].type.includes("select")) {
            answers[i].marks = 0
            if (answers[i].choosed_options.length) {
                const rightChoices = questions[i].options.choices.filter((choice) => choice.right);
                if (questions[i].type.includes("single")) {
                    if (questions[i].type.includes("file")) {
                        answers[i].marks = (answers[i].choosed_options[0].src == rightChoices[0].src) ? questions[i].marks : 0;
                    } else {
                        answers[i].marks = (answers[i].choosed_options[0].text == rightChoices[0].text) ? questions[i].marks : 0;
                    }
                } else {
                    for (const k in answers[i].choosed_options) {
                        if (questions[i].type.includes("file")) {
                            let checkStatus = rightChoices.filter((choice) => choice.src == answers[i].choosed_options[k].src);
                            if (checkStatus.length > 0) {
                                answers[i].marks += questions[i].marks / rightChoices.length;
                            }
                        } else {
                            let checkStatus = rightChoices.filter((choice) => choice.text == answers[i].choosed_options[k].text);
                            if (checkStatus.length > 0) {
                                answers[i].marks += questions[i].marks / rightChoices.length;
                            }
                        }
                    }
                }
                total_marks += answers[i].marks
            }
        } else {
            is_selection_only = false
        }
    }
    return {
        answers: answers,
        total_marks: total_marks,
        is_selection_only: is_selection_only
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

// add feedback to quiz submission
async function injectUserFeedback(submissions) {
    for (const i in submissions) {
        for (const k in submissions[i].answers) {
            let feedback = await Comment.find({
                "target.type": 'quiz_submission_answer', auth,
                "target.id": submissions[i].answers[k]._id
            })
            feedback = await injectUser(simplifyObject(feedback), 'sender')
            submissions[i].answers[k].feedback = feedback[0]
        }
    }
    return submissions
}

async function get_faculty_college_year(quiz_id) {
    let quiz = await findDocument(Quiz, {
        _id: quiz_id
    })
    let course

    if (quiz.target.type == 'chapter') {
        let chapter = await findDocument(Chapter, {
            _id: quiz.target.id
        })
        course = await findDocument(Course, {
            _id: chapter.course
        })
        return await findDocument(Faculty_college_year, {
            _id: course.faculty_college_year
        })
    } else if (quiz.target.type == 'course') {
        course = await findDocument(Course, {
            _id: quiz.target.id
        })
        return await findDocument(Faculty_college_year, {
            _id: course.faculty_college_year
        })
    } else {
        return await findDocument(Faculty_college_year, {
            _id: quiz.target.id
        })
    }
}

// export the router
module.exports = router