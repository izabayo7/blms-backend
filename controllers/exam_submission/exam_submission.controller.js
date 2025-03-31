// import dependencies
const {autoMarkSelectionQuestions, Live_session, checkCollegePayment} = require("../../utils/imports");
const {User_user_group} = require('../../models/user_user_group/user_user_group.model')
const {
    express,
    User,
    date,
    validateObjectId,
    addAttachmentMediaPaths,
    injectUser,
    mongoose,
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
    addExamTarget,
    auth,
    addStorageDirectoryToPath
} = require('../../utils/imports')
const {filterUsers} = require("../../middlewares/auth.middleware");
const {Exam_submission, validate_exam_submission} = require("../../models/exam_submission/exam_submission.model");
const {Exam} = require("../../models/exams/exam.model");
const {Faculty} = require("../../models/faculty/faculty.model");
const {User_group} = require("../../models/user_group/user_group.model");

// create router
const router = express.Router()

/**
 * @swagger
 * /submission/user:
 *   get:
 *     tags:
 *       - Exam_submission
 *     description: Returns submissions of the specified user
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

        if (req.user.category.name === 'STUDENT') {

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

                let submissions_found = false

                let exams = await Exam.find({
                    "course": courses[j]._id,
                }).sort({
                    _id: -1
                }).lean()

                let foundSubmissions = []
                for (const i in exams) {

                    let submissions = await findDocuments(Exam_submission, {
                        exam: exams[i]._id,
                        user: req.user._id
                    }, u, u, u, u, u, {
                        _id: -1
                    })
                    if (submissions.length) {

                        submissions = await injectUserFeedback(submissions)

                        for (const k in submissions) {

                            submissions[k].total_feedbacks = 0

                            for (const l in submissions[k].answers) {
                                submissions[k].total_feedbacks += submissions[k].answers[l].feedback ? 1 : 0;
                            }
                            submissions[k].exam = exams[i]
                            foundSubmissions.push(submissions[k])
                        }
                    }
                }
                if (foundSubmissions.length) {
                    submissions_found = true
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


                }
                if (submissions_found)
                    coursesWithSubmissions.push(courses[j])
            }
            result = coursesWithSubmissions
        } else {
            // check if there are exams made by the user
            let exams = await Exam.find({
                user: req.user._id,
                status: {$in: ['PUBLISHED', 'RELEASED']}
            }).sort({
                _id: -1
            }).lean()

            if (!exams.length)
                return res.send(formatResult(u, u, []))

            let foundSubmissions = []

            exams = await addAttachmentMediaPaths(exams)

            for (const i in exams) {

                let submissions = await findDocuments(Exam_submission, {
                    exam: exams[i]._id
                }, u, u, u, u, u, {
                    _id: -1
                })

                exams[i].total_submissions = submissions.length

                if (submissions.length) {
                    submissions = await injectUser(submissions, 'user')
                    submissions = await injectUserFeedback(submissions)

                    exams[i].marking_status = 0
                    const percentage_of_one_submission = 100 / submissions.length

                    for (const k in submissions) {

                        if (submissions[k].marked) {
                            exams[i].marking_status += percentage_of_one_submission
                        }

                        submissions[k].total_feedbacks = 0

                        for (const l in submissions[k].answers) {
                            submissions[k].total_feedbacks += submissions[k].answers[l].feedback ? 1 : 0;
                        }
                    }
                    exams[i].submissions = submissions
                    foundSubmissions.push(exams[i])
                    exams[i].marking_status += '%'
                }
            }
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
 * /submission/{id}:
 *   get:
 *     tags:
 *       - Exam_submission
 *     description: Returns a specified submission
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam_submission's id
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
router.get('/:id', auth, filterUsers(['INSTRUCTOR']), async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let result = await findDocument(Exam_submission, {
            _id: req.params.id
        })
        if (!result)
            return res.send(formatResult(404, 'submission not found'))

        // result = await injectUser([result], 'user')
        // result = await injectExam(result)
        // result = result[0]

        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /submission/exam/{id}:
 *   get:
 *     tags:
 *       - Exam_submission
 *     description: Returns submissions of the specified exam
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
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/exam/:id', auth, filterUsers(['INSTRUCTOR']), async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if exam exist
        let exam = await findDocument(Exam, {
            _id: req.params.id,
            user: req.user._id
        })
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))

        let result = await findDocuments(Exam_submission, {
            exam: req.params.id
        })

        if (!result.length)
            return res.send(formatResult(u, u, []))

        // result = await injectUser(result, 'user')

        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /submission/user/{user_name}/{exam_id}:
 *   get:
 *     tags:
 *       - Exam_submission
 *     description: Returns submission of the specified user with the specified user_name
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: user_name
 *         description: User name
 *         in: path
 *         required: true
 *         type: string
 *       - name: quiz_name
 *         description: Exam name
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
router.get('/user/:user_name/:exam_id', auth, async (req, res) => {
    try {

        // check if user exist
        let user = await findDocument(User, {
            user_name: req.params.user_name
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        let exam = await findDocument(Exam, {
            _id: req.params.exam_id
        })
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))

        let result = await findDocument(Exam_submission, {
            user: user._id,
            exam: exam._id
        })
        if (!result)
            return res.send(formatResult(404, 'submission not found'))

        result = simplifyObject(result)
        result = simplifyObject(await injectExam([result]))
        result = await injectUserFeedback(result)
        result = await injectUser(result, 'user')
        result = result[0]
        result.exam = await addExamTarget([result.exam])
        result.exam = await addAttachmentMediaPaths(result.exam)
        result.exam = simplifyObject(result.exam)
        result.exam = await injectUser(result.exam, 'user')
        // result = await injectUser(result, 'user')
        result.exam = result.exam[0]
        result = await injectUserFeedback(result)
        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /submission/{id}/attachment/{file_name}/{action}:
 *   get:
 *     tags:
 *       - Exam_submission
 *     description: Returns or download the files attached to the specified submission attachment
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam_submission's id
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

        const submission = await findDocument(Exam_submission, {
            _id: req.params.id
        })
        if (!submission)
            return res.send(formatResult(404, 'submission not found'))

        const exam = await findDocument(Exam, {
            _id: submission.exam
        })

        const user = await findDocument(User, {
            _id: exam.user
        })

        let file_found = false

        for (let i in submission.answers) {
            i = parseInt(i)
            if (exam.questions[i].type == 'file_upload') {
                if (submission.answers[i].src == req.params.file_name || submission.answers[i].feedback_src == req.params.file_name) {
                    file_found = true
                    break
                }
            }
            if (file_found)
                break
        }
        if (!file_found)
            return res.send(formatResult(404, 'file not found'))

        const file_path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${submission.exam}/submissions/${submission._id}/${req.params.file_name}`)

        const file_type = await findFileType(req.params.file_name)

        if (req.params.action == 'download')
            return res.download(file_path)

        if (file_type === 'image') {
            sendResizedImage(req, res, file_path)
        } else if (file_type === 'video') {
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
 * /submission/statistics/submitted:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get User statistics of how user attempted exams
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: start_date
 *         description: The starting date
 *         in: query
 *         required: true
 *         type: string
 *       - name: end_date
 *         description: The ending date
 *         in: query
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
router.get('/statistics/submitted', async (req, res) => {
    try {
        const {start_date, end_date} = req.query
        const student = await User_category.findOne({name: "STUDENT"});
        const users = await User.find({college: req.user.college, category: student._id}, {_id: 1})

        const result = await Exam_submission.aggregate([
            {"$match": {createdAt: {$gt: date(start_date), $lte: date(end_date)}}},
            {"$match": {user: {$in: users.map(x => x._id.toString())}}},
            {
                "$group": {
                    "_id": {
                        "$subtract": [
                            "$createdAt",
                            {
                                "$mod": [
                                    {"$subtract": ["$createdAt", date("1970-01-01T00:00:00.000Z")]},
                                    1000 * 60 * 60 * 24
                                ]
                            }
                        ]
                    },
                    "total_submissions": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ])
        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /submission/statistics/user:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get User statistics of a user
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
router.get('/statistics/user', async (req, res) => {
    try {
        let courses = await Course.find({user: req.user._id}, {_id: 1})
        let exam = await Exam.find({
            "course": {$in: courses.map(x => x._id.toString())}
        }, {_id: 1, passMarks: 1, total_marks: 1})

        const result = await Exam_submission.find({exam: {$in: exam.map(x => x._id.toString())}}).populate('user',
            {sur_name: 1, other_names: 1, user_name: 1, _id: 0}
        ).populate('exam',
            {name: 1}
        ).sort({_id: -1})
        const total_submissions = result.length
        let marked = result.filter(e => e.marked)

        let passed = marked.filter(e => ((e.total_marks / findExamMarks(exam, e.exam._id)) * 100) >= findExamMarks(exam, e.exam._id, true))

        if (result.length > 4)
            result.length = 4

        return res.send(formatResult(u, u, {
            marking_status: (marked.length / total_submissions) * 100,
            perfomance: (passed.length / marked.length) * 100,
            submissions: result
        }))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

function findExamMarks(quizarray, quizid, passMarks = false) {
    for (const i in quizarray) {
        if (quizarray[i]._id.toString() === quizid.toString()) {
            return passMarks ? quizarray[i].passMarks : quizarray[i].total_marks
        }
    }
}

/**
 * @swagger
 * /submission:
 *   post:
 *     tags:
 *       - Exam_submission
 *     description: Create submission
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a submission
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Exam_submission'
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
router.post('/', auth, filterUsers(["STUDENT"]), async (req, res) => {
    try {
        req.body.user = req.user.user_name
        let {
            error
        } = validate_exam_submission(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        if (req.user.registration_number !== undefined) {
            let paid = await checkCollegePayment({
                registration_number: req.user.registration_number,
                link: 'https://test.apis.kurious.rw/api/user/reg_number/'
            })
            if (!paid)
                return res.send(formatResult(403, 'user must pay the college to be able to create a submission'))
        }

        let exam = await Exam.findOne({
            _id: req.body.exam,
        }).populate('course')
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))

        if (exam.status !== 'PUBLISHED')
            return res.send(formatResult(404, 'exam is not available'))
        let user_user_group = await findDocument(User_user_group, {
            user: req.user._id,
            user_group: exam.course.user_group
        })
        if (!user_user_group)
            return res.send(formatResult(403, 'user is not allowed to do this exam'))

        const valid_submision = validateSubmittedAnswers(exam.questions, req.body.answers, 'anwsering')
        if (valid_submision.status !== true)
            return res.send(formatResult(400, valid_submision.error))

        // check if submissions exist
        let submission = await findDocument(Exam_submission, {
            user: req.user._id,
            exam: req.body.exam
        })
        if (submission)
            return res.send(formatResult(400, 'submission already exist'))

        const {answers, total_marks, is_selection_only} = autoMarkSelectionQuestions(exam.questions, req.body.answers)

        let result = await createDocument(Exam_submission, {
            user: req.user._id,
            exam: req.body.exam,
            answers: answers,
            used_time: req.body.used_time,
            auto_submitted: req.body.auto_submitted,
            total_marks: total_marks,
            marked: is_selection_only
        })
        result = simplifyObject(result)
        result.data = await injectExam([result.data])
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
 * /submission/{id}:
 *   put:
 *     tags:
 *       - Exam_submission
 *     description: Update submission
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam_submission id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: Fields for a submission
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Exam_submission'
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
router.put('/:id', auth, filterUsers(['INSTRUCTOR']), async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        error = validate_exam_submission(req.body)
        error = error.error
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let submission = await findDocument(Exam_submission, {
            _id: req.params.id
        })
        if (!submission)
            return res.send(formatResult(404, 'submission not found'))

        let exam = await findDocument(Exam, {
            _id: req.body.exam
        })
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))

        req.body.user = submission.user

        const valid_submision = validateSubmittedAnswers(exam.questions, req.body.answers, 'marking')
        if (valid_submision.status !== true)
            return res.send(formatResult(400, valid_submision.error))

        req.body.total_marks = valid_submision.total_marks
        req.body.marked = true

        const result = await updateDocument(Exam_submission, req.params.id, req.body)

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /submission/{id}/results_seen:
 *   put:
 *     tags:
 *       - Exam_submission
 *     description: Indicate that student saw quiz_results
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam_submission id
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

        let submission = await findDocument(Exam_submission, {
            _id: req.params.id,
            user: req.user._id
        })
        if (!submission)
            return res.send(formatResult(404, 'submission not found'))

        const result = await updateDocument(Exam_submission, req.params.id, {
            results_seen: true
        })

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /submission/{id}/attachment:
 *   post:
 *     tags:
 *       - Exam_submission
 *     description: Upload exam submission attacments
 *     security:
 *       - bearerAuth: -[]
 *     consumes:
 *        - multipart/form-data
 *     parameters:
 *       - name: id
 *         description: Exam_submission id
 *         in: path
 *         required: true
 *         type: string
 *       - in: formData
 *         name: files
 *         type: file
 *         description: attachment to upload
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

        const submission = await findDocument(Exam_submission, {
            _id: req.params.id
        })
        if (!submission)
            return res.send(formatResult(404, 'submission not found'))

        const exam = await findDocument(Exam, {
            _id: submission.exam
        })
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))

        const user = await findDocument(User, {
            _id: exam.user
        })

        const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${exam._id}/submissions/${req.params.id}`)

        req.kuriousStorageData = {
            dir: path,
        }

        let file_missing = false

        for (const i in submission.answers) {
            if (submission.answers[i].src) {
                const file_found = await fs.exists(`${path}/${submission.answers[i].src}`)
                if (!file_found) {
                    file_missing = true
                }
            }
        }
        if (!file_missing)
            return res.send(formatResult(400, 'all attachments for this submission were already uploaded'))

        upload_multiple(req, res, async (err) => {
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
 * /submission/feedback/{id}/{answer}:
 *   post:
 *     tags:
 *       - Exam_submission
 *     description: Upload exam submission feedback attacments
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam_submission id
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
            return res.send(formatResult(400, "invalid submission id"))

        error = validateObjectId(req.params.answer)
        error = error.error
        if (error)
            return res.send(formatResult(400, "invalid question id"))

        const submission = await findDocument(Exam_submission, {
            _id: req.params.id
        })
        if (!submission)
            return res.send(formatResult(404, 'submission not found'))

        const answer = submission.answers.filter(e => e._id == req.params.answer)
        if (!answer.length)
            return res.send(formatResult(404, 'answer not found'))

        const exam = await findDocument(Exam, {
            _id: submission.exam
        })
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))

        const user = await findDocument(User, {
            _id: exam.user
        })

        const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${exam._id}/submissions/${req.params.id}`)

        req.kuriousStorageData = {
            dir: path,
        }

        const file_found = await fs.exists(`${path}/${answer[0].feedback_src}`)
        if (file_found)
            return res.send(formatResult(400, 'feedback for this answer was already uploaded'))

        upload_single(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))

            submission.answers[submission.answers.indexOf(answer[0])].feedback_src = req.file.filename

            await updateDocument(Exam_submission, req.params.id, {
                answers: submission.answers
            })

            return res.send(formatResult(u, 'Feedback attachment was successfuly uploaded'))
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /submission/feedback/{id}/{answer}/{file_name}:
 *   delete:
 *     tags:
 *       - Exam_submission
 *     description: Delete exam submission feedback attacments
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam_submission id
 *         in: path
 *         required: true
 *         type: string
 *       - name: answer
 *         description: Answer id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: File name
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
router.delete('/feedback/:id/:answer/:file_name', auth, async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, "invalid submission id"))

        error = validateObjectId(req.params.answer)
        error = error.error
        if (error)
            return res.send(formatResult(400, "invalid question id"))

        const submission = await findDocument(Exam_submission, {
            _id: req.params.id
        })
        if (!submission)
            return res.send(formatResult(404, 'submission not found'))

        const answer = submission.answers.filter(e => e._id == req.params.answer)
        if (!answer.length)
            return res.send(formatResult(404, 'answer not found'))

        if (answer[0].feedback_src != req.params.file_name)
            return res.send(formatResult(404, 'File not found'))

        const exam = await findDocument(Exam, {
            _id: submission.exam
        })
        if (!exam)
            return res.send(formatResult(404, 'exam not found'))

        const user = await findDocument(User, {
            _id: exam.user
        })

        const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${exam._id}/submissions/${req.params.id}/${req.params.file_name}`)

        req.kuriousStorageData = {
            dir: path,
        }

        const file_found = await fs.exists(path)
        if (!file_found)
            return res.send(formatResult(400, 'File not found'))

        fs.unlink(path, (err) => {
            if (err)
                return res.send(formatResult(500, err))
        })

        submission.answers[submission.answers.indexOf(answer[0])].feedback_src = undefined

        await updateDocument(Exam_submission, req.params.id, {
            answers: submission.answers
        })
        return res.send(formatResult(u, "DELETED"))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /submission/{id}:
 *   delete:
 *     tags:
 *       - Exam_submission
 *     description: Delete a submission
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Exam_submission id
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

        let submission = await findDocument(Exam_submission, {
            _id: req.params.id
        })
        if (!submission)
            return res.send(formatResult(404, 'submission not found'))

        const result = await deleteDocument(Exam_submission, req.params.id)

        let exam = await Exam.findOne({
            _id: submission.exam
        }).populate('course')
        if (!exam.target.id) {
            let user_group = await User_group.findOne({_id: exam.course.user_group})

            let faculty = await findDocument(Faculty, {
                _id: user_group.faculty
            })

            const path = addStorageDirectoryToPath(`./uploads/colleges/${faculty.college}/assignments/${exam._id}/submissions/${req.params.id}`)
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

// replace exam id by the exam information
async function injectExam(submissions) {
    for (const i in submissions) {
        const exam = await Exam.findOne({
            _id: submissions[i].exam
        })
        submissions[i].exam = exam
    }
    return submissions
}

// add feedback to exam submission
async function injectUserFeedback(submissions) {
    for (const i in submissions) {
        for (const k in submissions[i].answers) {
            let feedback = await Comment.find({
                "target.type": 'exam_submission_answer',
                "target.id": submissions[i].answers[k]._id
            })
            feedback = await injectUser(simplifyObject(feedback), 'sender')
            submissions[i].answers[k].feedback = feedback[0]
        }
    }
    return submissions
}

async function get_faculty_college_year(quiz_id) {
    let exam = await findDocument(Exam, {
        _id: quiz_id
    })
    let course

    if (exam.target.type == 'chapter') {
        let chapter = await findDocument(Chapter, {
            _id: exam.target.id
        })
        course = await findDocument(Course, {
            _id: chapter.course
        })
        return await findDocument(Faculty_college_year, {
            _id: course.faculty_college_year
        })
    } else if (exam.target.type == 'course') {
        course = await findDocument(Course, {
            _id: exam.target.id
        })
        return await findDocument(Faculty_college_year, {
            _id: course.faculty_college_year
        })
    } else {
        return await findDocument(Faculty_college_year, {
            _id: exam.target.id
        })
    }
}

// export the router
module.exports = router