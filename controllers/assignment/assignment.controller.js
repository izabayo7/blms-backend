// import dependencies
const {validate_assignment} = require("../../models/assignments/assignments.model");
const {filterUsers} = require("../../middlewares/auth.middleware");
const {Assignment} = require("../../models/assignments/assignments.model");
const {sendReleaseMarskEmail} = require("../email/email.controller");
const {updateDocument} = require("../../utils/imports");
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
 * /assignments:
 *   get:
 *     tags:
 *       - Assignment
 *     description: Get all quizes
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
 * /assignments/user/{id}:
 *   get:
 *     tags:
 *       - Assignment
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
 * /assignments/user/{user_name}:
 *   get:
 *     tags:
 *       - Assignment
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
 * /assignments/user/{user_name}/{quiz_name}:
 *   get:
 *     tags:
 *       - Assignment
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
 * /assignments/{id}/attachment/{file_name}:
 *   get:
 *     tags:
 *       - Assignment
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
 * /assignments:
 *   post:
 *     tags:
 *       - Assignment
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
router.post('/', filterUsers(["INSTRUCTOR"]), async (req, res) => {
    try {
        const {
            error
        } = validate_assignment(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const allowedTargets = ['chapter', 'course']

        if (!allowedTargets.includes(req.body.target.type))
            return res.send(formatResult(400, 'invalid assignment target_type'))

        let target

        switch (req.body.type) {
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

            default:
                break;
        }

        if (!target)
            return res.send(formatResult(404, 'assignment target not found'))

        let result = await createDocument(Assignment, {
            title: req.body.title,
            dueDate: req.body.dueDate,
            user: req.user._id,
            attachments: req.body.attachments,
            total_marks: req.body.total_marks,
            passMarks: req.body.passMarks,
            target: req.body.target
        })

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /assignments/{id}:
 *   put:
 *     tags:
 *       - Assignment
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
router.put('/:id', filterUsers(["INSTRUCTOR"]), async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        error = validate_assignment(req.body)
        error = error.error
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if quiz exist
        let assignment = await findDocument(Assignment, {
            _id: req.params.id,
            user: req.user._id
        }, u, false)
        if (!assignment)
            return res.send(formatResult(404, 'assignment not found'))

        let _copy = assignment

        // check if quizname exist
        assignment = await findDocument(Quiz, {
            _id: {
                $ne: req.params.id
            },
            title: req.body.title
        })
        if (assignment)
            return res.send(formatResult(400, 'name was taken'))

        assignment = _copy
        // _copy = simplifyObject(assignment)

        assignment.title = req.body.name
        assignment.passMarks = req.body.passMarks
        assignment.dueDate = req.body.dueDate
        assignment.total_marks = req.body.total_marks
        assignment.user = req.user._id

        await assignment.save()

        assignment = await addQuizUsages([assignment])
        assignment = await addAttachedCourse(assignment)
        assignment = assignment[0]
        return res.send(formatResult(200, 'UPDATED', assignment))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /assignments/release_marks/{id}:
 *   put:
 *     tags:
 *       - Assignment
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
                        link: `https://${process.env.FRONTEND_HOST}/assignments/${quiz.name}/${submissions[i].user.user_name}`
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
 * /assignments/{id}/attachment:
 *   post:
 *     tags:
 *       - Assignment
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
 * /assignments/{id}:
 *   delete:
 *     tags:
 *       - Assignment
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
router.delete('/:id', filterUsers(["INSTRUCTOR"]), async (req, res) => {
    try {

        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let assignment = await findDocument(Assignment, {
            _id: req.params.id,
            user: req.user._id
        })
        if (!assignment)
            return res.send(formatResult(404, 'assignment not found'))

        // check if the quiz is never used
        let used = false

        const submission = await findDocument(Quiz_submission, {
            assignment: req.params.id
        })
        if (submission)
            used = true

        if (!used) {

            let result = await deleteDocument(Assignment, req.params.id)

            const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/assignments/${req.params.id}`)
            fs.exists(path, (exists) => {
                if (exists) {
                    fs.remove(path)
                }
            })

            return res.send(result)
        }

        await updateDocument(Quiz, req.params.id, {
            status: "DELETED"
        })
        return res.send(formatResult(200, 'DELETED'))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

function validateQuestions(questions) {
    const allowedQuestionTypes = ['open_ended', 'single_text_select', 'multiple_text_select', 'single_image_select', 'multiple_image_select', 'file_upload']
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
                    if (questions[i].type === 'single_text_select' || questions[i].type === 'multiple_text_select') {
                        times = questions[i].options.choices.filter(choice => choice.text == questions[i].options.choices[k].text).length
                        if (!questions[i].options.choices[k].text) {
                            message = `choice ${k + 1} in question ${i + 1} must have text`
                            break;
                        }
                    }
                    if (questions[i].type === 'single_image_select' || questions[i].type === 'multiple_image_select') {
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

        if (questions[i].type == "file_upload") {
            if (!questions[i].allowed_files) {
                message = `question"${i + 1}" must have files that students are allowed to submit`
            }

            if (!questions[i].allowed_files.length) {
                message = `question"${i + 1}" must have files that students are allowed to submit`
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