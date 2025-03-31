// import dependencies
const {filterUsers} = require("../../middlewares/auth.middleware");
const {Assignment} = require("../../models/assignments/assignments.model");
const {
    Assignment_submission,
    validate_assignment_submission
} = require("../../models/assignment_submission/assignment_submission.model");
const {autoMarkSelectionQuestions} = require("../../utils/imports");
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
                const chapters = await Chapter.find({course: courses[j]._id})
                const ids = chapters.map(x=>x._id.toString())
                ids.push(courses[i]._id)

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

                            for (const l in assignment_submissions[k].answers) {
                                assignment_submissions[k].total_feedbacks += assignment_submissions[k].answers[l].feedback ? 1 : 0;
                            }
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
            }, u, u, u, u, u, {
                _id: -1
            })
            if (!assignments.length)
                return res.send(formatResult(404, 'assignment_submissions not found'))

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

                        for (const l in assignment_submissions[k].answers) {
                            assignment_submissions[k].total_feedbacks += assignment_submissions[k].answers[l].feedback ? 1 : 0;
                        }
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
router.get('/:id', auth,filterUsers(["INSTRUCTOR", "STUDENT"]), async (req, res) => {
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
 * /assignment_submission/user/{user_name}/{assignment_name}:
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
 *       - name: assignment_name
 *         description: Assignment name
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
router.get('/user/:user_name/:assignment_name', auth, async (req, res) => {
    try {

        // check if user exist
        let user = await findDocument(User, {
            user_name: req.params.user_name
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        let assignment = await findDocument(Assignment, {
            name: req.params.assignment_name
        })
        if (!assignment)
            return res.send(formatResult(404, 'assignment not found'))

        let result = await findDocument(Assignment_submission, {
            user: user._id,
            assignment: assignment._id
        })
        if (!result)
            return res.send(formatResult(404, 'assignment_submission not found'))
        result = simplifyObject(result)
        result = simplifyObject(await injectAssignment([result]))
        result = await injectUserFeedback(result)
        result = await injectUser(result, 'user')
        result = result[0]
        result.assignment = await addAssignmentTarget([result.assignment])
        result.assignment = await addAttachmentMediaPaths(result.assignment)
        result.assignment = simplifyObject(result.assignment)
        result.assignment = await injectUser(result.assignment, 'user')
        // result = await injectUser(result, 'user')
        result.assignment = result.assignment[0]
        result = await injectUserFeedback(result)
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
            if (submission.attachments[i].src === req.parama.file_name) {
                file_found = true
                break
            }
        }
        if (!file_found)
            return res.send(formatResult(404, 'file not found'))

        const file_path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/assignments/${submission.assignment}/submissions/${submission._id}/${req.params.file_name}`)

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
        req.body.user = req.user.user_name
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
            return res.send(formatResult(404, 'assignment is not available'))

        const user_group = await get_faculty_college_year(req.body.assignment)

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

        error = validate_assignment_submission(req.body)
        error = error.error
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let assignment_submission = await findDocument(Assignment_submission, {
            _id: req.params.id
        }).populate('assignment')
        if (!assignment_submission)
            return res.send(formatResult(404, 'assignment_submission not found'))

        if (assignment_submission.assignment.status !== "PUBLISHED")
            return res.send(formatResult(403, 'Submission on this assignment have ended'))

        req.body.user = req.user._id

        const user_group = await get_faculty_college_year(req.body.assignment)

        let user_user_group = await findDocument(User_faculty_college_year, {
            user: req.user._id,
            faculty_college_year: user_group
        })
        if (!user_user_group)
            return res.send(formatResult(403, 'user is not allowed to do this assignment'))

        if (req.user.category.name === 'INSTRUCTOR')
            req.body.marked = true

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

        const assignment_submission = await findDocument(Assignment_submission, {
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
            _id: req.params.id
        })
        if (!assignment_submission)
            return res.send(formatResult(404, 'assignment_submission not found'))

        const result = await deleteDocument(Assignment_submission, req.params.id)

        let assignment = await findDocument(Assignment, {
            _id: assignment_submission.assignment
        })
        if (!assignment_submission.attachments.length) {
            const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/assignments/${assignment._id}/submissions/${req.params.id}`)
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
        for (const k in submissions[i].answers) {
            let feedback = await Comment.find({
                "target.type": 'assignment_submission_answer', auth,
                "target.id": submissions[i].answers[k]._id
            })
            feedback = await injectUser(simplifyObject(feedback), 'sender')
            submissions[i].answers[k].feedback = feedback[0]
        }
    }
    return submissions
}

// export the router
module.exports = router