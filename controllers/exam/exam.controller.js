// import dependencies
const {sendReleaseMarskEmail} = require("../email/email.controller");
const {updateDocument} = require("../../utils/imports");
const {
    express,
    fs,
    Chapter,
    Course,
    validate_exam,
    path,
    Faculty_college_year,
    validateObjectId,
    _,
    User_faculty_college_year,
    addAttachmentMediaPaths,
    addExamUsages,
    addAttachedCourse,
    findDocuments,
    formatResult,
    findDocument,
    User,
    User_category,
    createDocument,
    deleteDocument,
    simplifyObject,
    Exam_submission,
    sendResizedImage,
    findFileType,
    streamVideo,
    u,
    upload_multiple_images,
    addExamTarget,
    addStorageDirectoryToPath
} = require('../../utils/imports')
const {
    parseInt
} = require('lodash')
const {Exam} = require("../../models/exams/exam.model");
const {filterUsers} = require("../../middlewares/auth.middleware");

// create router
const router = express.Router()

/**
 * @swagger
 * /exam/user/{user_name}:
 *   get:
 *     tags:
 *       - Exam
 *     description: Returns exames of a specified user
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
router.get('/user/:user_name', filterUsers(['INSTRUCTOR']), async (req, res) => {
    try {
        if (req.user.user_name !== req.params.user_name)
            return res.send(formatResult(403, 'You don\'t have access'))

        let exam = await Exam.find({
            user: req.user._id
        }).sort({_id: -1}).populate('course').lean()

        exam = await addAttachmentMediaPaths(exam)
        exam = await addExamUsages(exam)

        return res.send(formatResult(u, u, exam))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /exam/user/{user_name}/{exam_name}:
 *   get:
 *     tags:
 *       - Exam
 *     description: Returns a exam with the specified name
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: user_name
 *         description: User_name
 *         in: path
 *         required: true
 *         type: string
 *       - name: exam_name
 *         description: Exam name
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
router.get('/user/:user_name/:exam_name', async (req, res) => {
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

        let exam = await Exam.findOne(isInstructor ? {
            name: req.params.exam_name,
            user: user._id
        } : {name: req.params.exam_name}).populate('course')
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))


        if (exam.status === 'DRAFT' && req.params.user_name !== req.user.user_name)
            return res.send(formatResult(404, 'exam not found'))

        if (isInstructor) {
            exam = await addExamUsages(exam)
        }

        exam = await addAttachmentMediaPaths([exam])
        exam = exam[0]
        return res.send(formatResult(u, u, exam))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /exam/{id}/attachment/{file_name}:
 *   get:
 *     tags:
 *       - Exam
 *     description: Returns the files attached to a specified exam ( use format height and width only when the attachment is a picture)
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam's id
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

        const exam = await findDocument(Exam, {
            _id: req.params.id
        })
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))

        let file_found = false

        for (const i in exam.questions) {
            if (exam.questions[i].type.includes('image_select')) {
                for (const k in exam.questions[i].options.choices) {
                    if (exam.questions[i].options.choices[k].src == req.params.file_name) {
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
            _id: exam.user
        })

        const file_path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${exam._id}/${req.params.file_name}`)

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
 * /exam:
 *   post:
 *     tags:
 *       - Exam
 *     description: Create exam
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a exam
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Exam'
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
router.post('/', filterUsers(['INSTRUCTOR']), async (req, res) => {
    try {
        const {
            error
        } = validate_exam(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if examname exist
        let course = await findDocument(Course, {
            _id: req.body.course
        })
        if (!course)
            return res.send(formatResult(404, 'course not found'))

        const validQuestions = validateQuestions(req.body.questions)
        if (validQuestions.status !== true)
            return res.send(formatResult(400, validQuestions.error))

        let result = await createDocument(Exam, {
            name: req.body.name,
            duration: req.body.duration,
            instructions: req.body.instructions,
            course: req.body.course,
            type: req.body.type,
            user: req.user._id,
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
 * /exam/{id}:
 *   put:
 *     tags:
 *       - Exam
 *     description: Update exam
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: Fields for a exam
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Exam'
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

        error = validate_exam(req.body)
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
            return res.send(formatResult(404, 'user can\'t create exam'))

        // check if exam exist
        let exam = await findDocument(Exam, {
            _id: req.params.id,
            user: user._id
        }, u, false)
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))

        let exam_copy = exam

        // check if examname exist
        exam = await findDocument(Exam, {
            _id: {
                $ne: req.params.id
            },
            name: req.body.name
        })
        if (exam)
            return res.send(formatResult(400, 'name was taken'))

        exam = exam_copy
        exam_copy = simplifyObject(exam)

        const validQuestions = validateQuestions(req.body.questions)
        if (validQuestions.status !== true)
            return res.send(formatResult(400, validQuestions.error))

        req.body.total_marks = validQuestions.total_marks

        exam.name = req.body.name
        exam.instructions = req.body.instructions
        exam.duration = req.body.duration
        exam.questions = req.body.questions
        exam.total_marks = req.body.total_marks
        exam.user = user._id
        exam.published = req.body.published
        exam.passMarks = req.body.passMarks

        await exam.save()


        // delete removed files
        for (const i in exam_copy.questions) {
            if (
                exam_copy.questions[i].type.includes("image_select")
            ) {
                let current_question = exam.questions.filter(q => q._id == exam_copy.questions[i]._id)
                current_question = current_question[0]
                for (const j in exam_copy.questions[i].options.choices) {
                    let deletePicture = true
                    if (current_question) {
                        if (current_question.type.includes('image_select')) {
                            for (const k in current_question.options.choices) {
                                if (exam_copy.questions[i].options.choices[j].src === current_question.options.choices[k].src) {
                                    deletePicture = false
                                }
                            }
                        }
                    }
                    if (deletePicture) {
                        const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${req.params.id}/${exam_copy.questions[i].options.choices[j].src}`)
                        fs.exists(path, (exists) => {
                            if (exists) {
                                fs.unlink(path)
                            }
                        })
                    }
                }
            }
        }
        exam = await addExamUsages([exam])
        exam = await addAttachedCourse(exam)
        exam = exam[0]
        return res.send(formatResult(200, 'UPDATED', exam))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /exam/release_marks/{id}:
 *   put:
 *     tags:
 *       - Exam
 *     description: Publish exam marks
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam id
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
        let exam = await findDocument(Exam, {
            _id: req.params.id
        })
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))


        let result = await updateDocument(Exam, req.params.id,
            {
                status: exam.status == 1 ? 2 : 1
            })
        if (exam.status === 1) {
            const submissions = await Exam_submission.find({exam: req.params.id}).populate('user')
            for (const i in submissions) {
                if (submissions[i].user.email) {
                    await sendReleaseMarskEmail({
                        email: submissions[i].user.email,
                        user_names: `Mr${submissions[i].user.gender === 'female' ? 's' : ''} ${submissions[i].user.sur_name} ${submissions[i].user.other_names}`,
                        instructor_names: req.user.sur_name + ' ' + req.user.other_names,
                        assignment_name: exam.name,
                        assignment_type: 'exam',
                        link: `https://${process.env.FRONTEND_HOST}/exam/${exam.name}/${submissions[i].user.user_name}`
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
 * /exam/{id}/target:
 *   put:
 *     tags:
 *       - Exam
 *     description: Update exam target
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: Fields for a exam
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

        error = validate_exam(req.body, true)
        error = error.error
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if exam exist
        let exam = await findDocument(Exam, {
            _id: req.params.id
        }, u, false)
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))


        req.body.type = req.body.type.toLowerCase()

        const allowedTargets = ['chapter', 'course', 'faculty_college_year']

        if (!allowedTargets.includes(req.body.type))
            return res.send(formatResult(400, 'invalid exam target_type'))

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
            return res.send(formatResult(404, 'exam target not found'))

        // remove the previously attached exam
        const last_targeted_exam = await findDocument(Exam, {
            _id: {
                $ne: req.params.id
            },
            "target.id": req.body.id
        }, u, false)
        if (last_targeted_exam) {
            last_targeted_exam.target = undefined
            await last_targeted_exam.save()
        }

        exam.target = {
            type: req.body.type,
            id: req.body.id
        }

        await exam.save()

        return res.send(formatResult(200, 'UPDATED', exam))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /exam/{id}/target:
 *   delete:
 *     tags:
 *       - Exam
 *     description: Remove exam target
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam id
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

        // check if exam exist
        let exam = await findDocument(Exam, {
            _id: req.params.id,
            user: req.user._id
        }, u, false)
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))

        exam.target = undefined

        await exam.save()

        return res.send(formatResult(200, 'UPDATED', exam))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /exam/{id}/attachment:
 *   post:
 *     tags:
 *       - Exam
 *     description: Upload exam attacments
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam id
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

        const exam = await findDocument(Exam, {
            _id: req.params.id
        })
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))

        const user = await findDocument(User, {
            _id: exam.user
        })

        const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${req.params.id}`)

        req.kuriousStorageData = {
            dir: path,
        }

        let file_missing = false

        for (const i in exam.questions) {
            if (exam.questions[i].type.includes('image_select')) {
                for (const k in exam.questions[i].options.choices) {
                    const file_found = await fs.exists(`${path}/${exam.questions[i].options.choices[k].src}`)
                    if (!file_found) {
                        file_missing = true
                    }
                }
            }
        }
        if (!file_missing)
            return res.send(formatResult(400, 'all attachments for this exam were already uploaded'))

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
 * /exam/{id}:
 *   delete:
 *     tags:
 *       - Exam
 *     description: Delete a exam
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam id
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

        let exam = await findDocument(Exam, {
            _id: req.params.id
        })
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))

        // check if the exam is never used
        let exam_used = false

        const submission = await findDocument(Exam_submission, {
            exam: req.params.id
        })
        if (submission)
            exam_used = true

        if (!exam_used) {
            let user = await findDocument(User, {
                _id: exam.user
            })

            let result = await deleteDocument(Exam, req.params.id)

            const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${req.params.id}`)
            fs.exists(path, (exists) => {
                if (exists) {
                    fs.remove(path)
                }
            })

            return res.send(result)
        }

        const update_exam = await updateDocument(Exam, req.params.id, {
            status: 0
        })
        return res.send(formatResult(200, 'exam couldn\'t be deleted because it was used, instead it was disabled', update_exam.data))
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

// export the router
module.exports = router