// import dependencies
const {filterUsers} = require("../../middlewares/auth.middleware");
const {Assignment} = require("../../models/assignments/assignments.model");
const {
    Assignment_submission,
    validate_assignment_submission
} = require("../../models/assignment_submission/assignment_submission.model");
const {autoMarkSelectionQuestions, checkCollegePayment, College} = require("../../utils/imports");
const {User_user_group} = require('../../models/user_user_group/user_user_group.model')
const {
    express,
    User,
    date,
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
    addAssignmentTarget,
    auth,
    addStorageDirectoryToPath
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * /assignment_submission:
 *   get:
 *     tags:
 *       - Assignment_submission
 *     description: Returns assignment_submissions of the specified user
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
router.get('/', auth, filterUsers(["INSTRUCTOR", "STUDENT"]), async (req, res) => {
    try {

        let result

        if (req.user.category.name === 'STUDENT') {

            const user_user_group = await findDocuments(User_user_group, {
                user: req.user._id
            })

            if (!user_user_group.length)
                return res.send(formatResult(200, undefined, []))

            let courses = await findDocuments(Course, {
                user_group: {$in: user_user_group.map(x => x.user_group)},
                published: true
            }, u, u, u, u, u, {
                _id: -1
            })

            if (!courses.length)
                return res.send(formatResult(200, undefined, []))

            let coursesWithSubmissions = []

            for (const j in courses) {
                const chapters = await Chapter.find({course: courses[j]._id})
                const ids = chapters.map(x => x._id.toString())
                ids.push(courses[j]._id.toString())

                // check if there are assignments made by the user
                let assignments = await findDocuments(Assignment, {
                    "target.id": {$in: ids},
                    status: "RELEASED"
                }, u, u, u, u, u, {
                    _id: -1
                })

                let foundSubmissions = []
                assignments = await addAssignmentTarget(assignments)
                for (const i in assignments) {

                    let assignment_submissions = await findDocuments(Assignment_submission, {
                        assignment: assignments[i]._id,
                        user: req.user._id
                    }, u, u, u, u, u, {
                        _id: -1
                    })
                    if (assignment_submissions.length) {

                        assignment_submissions = await injectUserFeedback(assignment_submissions)

                        for (const k in assignment_submissions) {

                            assignment_submissions[k].total_feedbacks = 0

                            assignment_submissions[k].total_feedbacks += assignment_submissions[k].feedback ? 1 : 0;

                            assignment_submissions[k].assignment = assignments[i]
                            foundSubmissions.push(assignment_submissions[k])
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

            result = coursesWithSubmissions
        } else {
            // check if there are assignments made by the user
            let assignments = await findDocuments(Assignment, {
                user: req.user._id,
                status: {$ne: 'DELETED'}
            }, u, u, u, u, u, {
                _id: -1
            })
            if (!assignments.length)
                return res.send(formatResult(u,u,[]))

            let foundSubmissions = []

            assignments = await addAssignmentTarget(assignments)
            for (const i in assignments) {

                let assignment_submissions = await findDocuments(Assignment_submission, {
                    assignment: assignments[i]._id
                }, u, u, u, u, u, {
                    _id: -1
                })

                assignments[i].total_submissions = assignment_submissions.length
                if (assignment_submissions.length) {

                    assignment_submissions = await injectUser(assignment_submissions, 'user')
                    assignment_submissions = await injectUserFeedback(assignment_submissions)

                    assignments[i].marking_status = 0
                    const percentage_of_one_submission = 100 / assignment_submissions.length

                    for (const k in assignment_submissions) {

                        if (assignment_submissions[k].marked) {
                            assignments[i].marking_status += percentage_of_one_submission
                        }

                        assignment_submissions[k].total_feedbacks = 0
                        assignment_submissions[k].total_feedbacks += assignment_submissions[k].feedback ? 1 : 0;

                    }
                    assignments[i].submissions = assignment_submissions
                    foundSubmissions.push(assignments[i])
                    assignments[i].marking_status += '%'
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
 * /assignment_submission/{id}:
 *   get:
 *     tags:
 *       - Assignment_submission
 *     description: Returns a specified assignment_submission
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Assignment_submission's id
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
router.get('/:id', auth, filterUsers(["INSTRUCTOR", "STUDENT"]), async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let result = await findDocument(Assignment_submission, {
            _id: req.params.id
        }).populate('assignment')
        if (!result)
            return res.send(formatResult(404, 'assignment_submission not found'))
        result = await injectUser([result], 'user')
        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /assignment_submission/user/{user_name}/{assignment_id}:
 *   get:
 *     tags:
 *       - Assignment_submission
 *     description: Returns assignment_submission of the specified user with the specified name
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: user_name
 *         description: User name
 *         in: path
 *         required: true
 *         type: string
 *       - name: assignment_id
 *         description: Assignment id
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
router.get('/user/:user_name/:assignment_id', auth, filterUsers(["INSTRUCTOR", "STUDENT"]), async (req, res) => {
    try {

        if (req.user.category.name === 'STUDENT' && req.params.user_name !== req.user.user_name)
            return res.send(formatResult(403, 'You can only view your submissions'))

        // check if user exist
        let user = await findDocument(User, {
            user_name: req.params.user_name
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        let assignment = await Assignment.findOne({
            _id: req.params.assignment_id
        }).lean()
        if (!assignment)
            return res.send(formatResult(404, 'assignment not found'))

        let result = await Assignment_submission.findOne({
            user: user._id,
            assignment: assignment._id
        }).lean()
        if (!result)
            return res.send(formatResult(404, 'assignment_submission not found'))

        result.assignment = assignment
        result = await injectUser([result], 'user')
        result = await injectUserFeedback(result)
        result = result[0]
        result.assignment = await addAssignmentTarget([result.assignment])
        result.assignment = await injectUser(result.assignment, 'user')
        result.assignment = result.assignment[0]
        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /assignment_submission/{id}/attachment/{file_name}/{action}:
 *   get:
 *     tags:
 *       - Assignment_submission
 *     description: Returns or download the files attached to the specified assignment_submission
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Assignment_submission's id
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

        const submission = await findDocument(Assignment_submission, {
            _id: req.params.id
        })
        if (!submission)
            return res.send(formatResult(404, 'assignment_submission not found'))

        let file_found = false

        for (const i in submission.attachments) {
            if (submission.attachments[i].src === req.params.file_name) {
                file_found = true
                break
            }
        }
        if (!file_found && submission.feedback_src !== req.params.file_name)
            return res.send(formatResult(404, 'file not found'))

        const file_path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/assignments/${submission.assignment}/submissions/${submission._id}/${req.params.file_name}`)

        const file_type = await findFileType(req.params.file_name)

        if (req.params.action === 'download')
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
 * /assignment_submission:
 *   post:
 *     tags:
 *       - Assignment_submission
 *     description: Create assignment_submission
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a assignment_submission
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Assignment_submission'
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
        let {
            error
        } = validate_assignment_submission(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let assignment = await findDocument(Assignment, {
            _id: req.body.assignment
        })
        if (!assignment)
            return res.send(formatResult(404, 'assignment not found'))

        if (assignment.status !== 'PUBLISHED')
            return res.send(formatResult(403, 'Submission on this assignment have ended'))

        if (new Date() > new Date(assignment.dueDate))
            return res.send(formatResult(403, 'Submission on this assignment have ended'))

        const college = await College.findOne({_id: req.user.college})

        if (college.users_verification_link) {

            if (!req.user.registration_number)
                return res.send(formatResult(403, 'user must have a registration number (since the college is verifying your college payment status)'))

            let resp = await checkCollegePayment({
                users: [{registration_number: req.user.registration_number}],
                link: college.users_verification_link
            })
            let paid = resp[0].paid

            if (!paid)
                return res.send(formatResult(403, 'user must pay the college to be able to create a submission'))
        }


        const user_group = await get_faculty_college_year(assignment)

        let user_user_group = await findDocument(User_user_group, {
            user: req.user._id,
            user_group: user_group
        })
        if (!user_user_group)
            return res.send(formatResult(403, 'user is not allowed to do this assignment'))

        // check if assignment_submissions exist
        let assignment_submission = await findDocument(Assignment_submission, {
            user: req.user._id,
            assignment: req.body.assignment
        })
        if (assignment_submission)
            return res.send(formatResult(400, 'assignment_submission already exist'))

        if (!assignment.allowMultipleFilesSubmission && req.body.attachments.length > 1)
            return res.send(formatResult(400, 'You can only upload one file'))

        req.body.user = req.user._id

        let result = await createDocument(Assignment_submission, req.body)
        result = simplifyObject(result)

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /assignment_submission/{id}:
 *   put:
 *     tags:
 *       - Assignment_submission
 *     description: Update assignment_submission
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Assignment_submission id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: Fields for a assignment_submission
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Assignment_submission'
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
router.put('/:id', auth, filterUsers(['STUDENT', "INSTRUCTOR"]), async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        error = validate_assignment_submission(req.body, req.user.category.name)
        error = error.error
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let assignment_submission = await Assignment_submission.findOne({
            _id: req.params.id
        }).populate('assignment')
        if (!assignment_submission)
            return res.send(formatResult(404, 'assignment_submission not found'))

        if (req.user.category === 'STUDENT' && assignment_submission.assignment.status !== "PUBLISHED")
            return res.send(formatResult(403, 'Submission on this assignment have ended'))

        if (req.user.category === 'STUDENT' && new Date() > new Date(assignment_submission.assignment.dueDate))
            return res.send(formatResult(403, 'Submission on this assignment have ended'))

        if (req.user.category.name !== 'INSTRUCTOR')
            req.body.user = req.user._id

        const user_group = await get_faculty_college_year(assignment_submission.assignment)

        let user_user_group = await findDocument(User_faculty_college_year, {
            user: req.user._id,
            faculty_college_year: user_group
        })
        if (!user_user_group)
            return res.send(formatResult(403, 'user is not allowed to do this assignment'))

        if (req.user.category.name === 'INSTRUCTOR')
            req.body.marked = true
        else {
            if (!assignment_submission.assignment.allowMultipleFilesSubmission && req.body.attachments.length > 1)
                return res.send(formatResult(400, 'You can only upload one file'))

            // delete removed files
            for (const i in assignment_submission.attachments) {
                let deleteFile = true
                for (const j in req.body.attachments) {
                    if (assignment_submission.attachments[i].src === req.body.attachments[j].src) {
                        deleteFile = false
                        break
                    }
                }
                if (deleteFile) {
                    const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/assignments/${assignment_submission.assignment._id}/submissions/${req.params.id}/${assignment_submission.attachments[i].src}`)
                    fs.exists(path, (exists) => {
                        if (exists) {
                            fs.unlink(path)
                        }
                    })
                }
            }
        }
        const result = await updateDocument(Assignment_submission, req.params.id, req.body)

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /assignment_submission/{id}/results_seen:
 *   put:
 *     tags:
 *       - Assignment_submission
 *     description: Indicate that student saw assignment_results
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Assignment_submission id
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
router.put('/:id/results_seen', auth, filterUsers(["STUDENT"]), async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let assignment_submission = await findDocument(Assignment_submission, {
            _id: req.params.id,
            user: req.user._id
        })
        if (!assignment_submission)
            return res.send(formatResult(404, 'assignment_submission not found'))

        const result = await updateDocument(Assignment_submission, req.params.id, {
            results_seen: true
        })

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /assignment_submission/{id}/attachment:
 *   post:
 *     tags:
 *       - Assignment_submission
 *     description: Upload assignment submission attacments
 *     security:
 *       - bearerAuth: -[]
 *     consumes:
 *        - multipart/form-data
 *     parameters:
 *       - name: id
 *         description: Assignment_submission id
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
router.post('/:id/attachment', auth, filterUsers(["STUDENT"]), async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const assignment_submission = await Assignment_submission.findOne({
            _id: req.params.id,
            user: req.user._id
        }).populate('assignment')
        if (!assignment_submission)
            return res.send(formatResult(404, 'assignment_submission not found'))

        const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/assignments/${assignment_submission.assignment._id}/submissions/${req.params.id}`)

        req.kuriousStorageData = {
            dir: path,
        }

        let file_missing = false

        for (const i in assignment_submission.attachments) {
            if (assignment_submission.attachments[i].src) {
                const file_found = await fs.exists(`${path}/${assignment_submission.attachments[i].src}`)
                if (!file_found) {
                    file_missing = true
                }
            }
        }
        if (!file_missing)
            return res.send(formatResult(400, 'all attachments for this assignment_submission were already uploaded'))

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
 * /assignment_submission/feedback/{id}:
 *   post:
 *     tags:
 *       - Assignment_submission
 *     description: Upload assignment submission feedback attacments
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Assignment_submission id
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
router.post('/feedback/:id', auth, async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, "invalid assignment_submission id"))

        const assignment_submission = await findDocument(Assignment_submission, {
            _id: req.params.id
        })
        if (!assignment_submission)
            return res.send(formatResult(404, 'assignment_submission not found'))


        const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/assignments/${assignment_submission.assignment}/submissions/${req.params.id}`)

        req.kuriousStorageData = {
            dir: path,
        }

        const file_found = await fs.exists(`${path}/${assignment_submission.feedback_src}`)
        if (file_found)
            return res.send(formatResult(400, 'feedback for this answer was already uploaded'))

        upload_single(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))

            await updateDocument(Assignment_submission, req.params.id, {
                feedback_src: req.file.filename
            })

            return res.send(formatResult(u, 'Feedback attachment was successfuly uploaded'))
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /assignment_submission/feedback/{id}/{file_name}:
 *   delete:
 *     tags:
 *       - Assignment_submission
 *     description: Delete assignment submission feedback attacments
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Assignment_submission id
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
router.delete('/feedback/:id/:file_name', auth, async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, "invalid assignment_submission id"))

        const assignment_submission = await Assignment_submission.findOne({
            _id: req.params.id
        })
        if (!assignment_submission)
            return res.send(formatResult(404, 'assignment_submission not found'))


        if (assignment_submission.feedback_src !== req.params.file_name)
            return res.send(formatResult(404, 'File not found'))


        const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/assignments/${assignment_submission.assignment}/submissions/${req.params.id}/${req.params.file_name}`)

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

        await updateDocument(Assignment_submission, req.params.id, {
            feedback_src: undefined
        })
        return res.send(formatResult(u, "DELETED"))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /assignment_submission/{id}:
 *   delete:
 *     tags:
 *       - Assignment_submission
 *     description: Delete a assignment_submission
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Assignment_submission id
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
router.delete('/:id', auth, filterUsers(["STUDENT"]), async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let assignment_submission = await findDocument(Assignment_submission, {
            _id: req.params.id,
        })
        if (!assignment_submission)
            return res.send(formatResult(404, 'assignment_submission not found'))

        if (assignment_submission.marked)
            return res.send(formatResult(403, 'You can not delete a marked submission'))

        const result = await deleteDocument(Assignment_submission, req.params.id)

        if (assignment_submission.attachments.length) {
            const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/assignments/${assignment_submission.assignment}/submissions/${req.params.id}`)
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

async function get_faculty_college_year(assignment) {

    let course, chapter

    if (assignment.target.type === 'chapter') {
        chapter = await findDocument(Chapter, {
            _id: assignment.target.id
        })
    }
    course = await findDocument(Course, {
        _id: chapter ? chapter.course : assignment.target.id
    })
    return course.user_group
}

async function injectUserFeedback(submissions) {
    for (const i in submissions) {
        let feedback = await Comment.find({
            "target.type": 'assignment_submission',
            "target.id": submissions[i]._id
        })
        feedback = await injectUser(simplifyObject(feedback), 'sender')
        submissions[i].feedback = feedback[0]
    }
    return submissions
}

// export the router
module.exports = router