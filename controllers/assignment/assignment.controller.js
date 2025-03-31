// import dependencies
const {User_user_group} = require("../../models/user_user_group/user_user_group.model");
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
    validate_assigment,
    path,
    Faculty_college_year,
    validateObjectId,
    _,
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
 * /assignments/user/{user_name}:
 *   get:
 *     tags:
 *       - Assignment
 *     description: Returns assigmentes of a specified user
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
router.get('/', async (req, res) => {
    try {
        let user = await findDocument(User, {
            user_name: req.params.user_name
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        let assigment = await findDocuments(Quiz, {
            user: user._id
        }, u, u, u, u, u, {_id: -1})

        assigment = await addAttachmentMediaPaths(assigment)
        assigment = await addQuizUsages(assigment)
        assigment = await addAttachedCourse(assigment)

        return res.send(formatResult(u, u, assigment))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /assignments/{id}:
 *   get:
 *     tags:
 *       - Assignment
 *     description: Returns a assigment with the specified id
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
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
router.get('/:id', filterUsers(["INSTRUCTOR", "STUDENT"]), async (req, res) => {
    try {

        const isInstructor = req.user.category.name === 'INSTRUCTOR'

        let assigment = await findDocument(Quiz, isInstructor ? {
            _id: req.params.id,
            user: req.user._id
        } : {_id: req.params.id})
        if (!assigment)
            return res.send(formatResult(404, 'assigment not found'))

        let user_group
        let chapter
        let course

        if (!isInstructor) {
            if (assigment.target.type === 'chapter') {
                chapter = await findDocument(Chapter, {
                    _id: assigment.target.id
                })
                course = await findDocument(Course, {
                    _id: chapter.course
                })
                user_group = course.user_group
            } else if (assigment.target.type === 'course') {
                course = await findDocument(Course, {
                    _id: assigment.target.id
                })
                user_group = course.user_group
            }
            const user_user_group = await findDocument(User_user_group, {
                user: user._id,
                user_group: user_group
            })
            if (!user_user_group)
                return res.send(formatResult(404, 'assigment not found'))
        }

        return res.send(formatResult(u, u, assigment))
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
 *     description: Returns the files attached to a specified assigment ( use format height and width only when the attachment is a picture)
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

        const assigment = await findDocument(Quiz, {
            _id: req.params.id
        })
        if (!assigment)
            return res.send(formatResult(404, 'assigment not found'))

        let file_found = false

        for (const i in assigment.questions) {
            if (assigment.questions[i].type.includes('image_select')) {
                for (const k in assigment.questions[i].options.choices) {
                    if (assigment.questions[i].options.choices[k].src == req.params.file_name) {
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
            _id: assigment.user
        })

        const file_path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${assigment._id}/${req.params.file_name}`)

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
 *     description: Create assigment
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a assigment
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
 *     description: Update assigment
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Quiz id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: Fields for a assigment
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

        // check if assigment exist
        let assignment = await findDocument(Assignment, {
            _id: req.params.id,
            user: req.user._id
        }, u, false)
        if (!assignment)
            return res.send(formatResult(404, 'assignment not found'))

        let _copy = assignment

        // check if assigmentname exist
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
 *     description: Publish assigment marks
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
        let assigment = await findDocument(Quiz, {
            _id: req.params.id
        })
        if (!assigment)
            return res.send(formatResult(404, 'assigment not found'))


        let result = await updateDocument(Quiz, req.params.id,
            {
                status: assigment.status == 1 ? 2 : 1
            })
        if (assigment.status === 1) {
            const submissions = await Quiz_submission.find({assigment: req.params.id}).populate('user')
            for (const i in submissions) {
                if (submissions[i].user.email) {
                    await sendReleaseMarskEmail({
                        email: submissions[i].user.email,
                        user_names: `Mr${submissions[i].user.gender === 'female' ? 's' : ''} ${submissions[i].user.sur_name} ${submissions[i].user.other_names}`,
                        instructor_names: req.user.sur_name + ' ' + req.user.other_names,
                        assignment_name: assigment.name,
                        assignment_type: 'assigment',
                        link: `https://${process.env.FRONTEND_HOST}/assignments/${assigment.name}/${submissions[i].user.user_name}`
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
 *     description: Upload assigment attacments
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

        const assigment = await findDocument(Quiz, {
            _id: req.params.id
        })
        if (!assigment)
            return res.send(formatResult(404, 'assigment not found'))

        const user = await findDocument(User, {
            _id: assigment.user
        })

        const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${req.params.id}`)

        req.kuriousStorageData = {
            dir: path,
        }

        let file_missing = false

        for (const i in assigment.questions) {
            if (assigment.questions[i].type.includes('image_select')) {
                for (const k in assigment.questions[i].options.choices) {
                    const file_found = await fs.exists(`${path}/${assigment.questions[i].options.choices[k].src}`)
                    if (!file_found) {
                        file_missing = true
                    }
                }
            }
        }
        if (!file_missing)
            return res.send(formatResult(400, 'all attachments for this assigment were already uploaded'))

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
 *     description: Delete a assigment
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

        // check if the assigment is never used
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

// export the router
module.exports = router