// import dependencies
const {sendAssignmentExpirationEmail} = require("../email/email.controller");
const {scheduleEvent} = require("../../utils/imports");
const {User_notification} = require("../../utils/imports");
const {MyEmitter} = require("../../utils/imports");
const {countDocuments} = require("../../utils/imports");
const {getStudentAssignments} = require("../../utils/imports");
const {Assignment_submission} = require("../../models/assignment_submission/assignment_submission.model");
const {addAssignmentTarget} = require("../../utils/imports");
const {simplifyObject} = require("../../utils/imports");
const {upload_multiple} = require("../../utils/imports");
const {User_user_group} = require("../../models/user_user_group/user_user_group.model");
const {validate_assignment} = require("../../models/assignments/assignments.model");
const {filterUsers} = require("../../middlewares/auth.middleware");
const {Assignment} = require("../../models/assignments/assignments.model");
const {sendReleaseMarskEmail} = require("../email/email.controller");
const {updateDocument, _} = require("../../utils/imports");
var path = require('path');
const {
    express,
    fs,
    Notification,
    Chapter,
    Course,
    validateObjectId,
    findDocuments,
    formatResult,
    findDocument,
    User,
    User_category,
    createDocument,
    deleteDocument,
    sendResizedImage,
    findFileType,
    streamVideo,
    u,
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
 *     description: Returns assignments
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
router.get('/', filterUsers(["INSTRUCTOR", "STUDENT"]), async (req, res) => {
    try {
        let assignments
        if (req.user.category.name === "INSTRUCTOR") {
            assignments = await findDocuments(Assignment, {
                user: req.user._id,
                status: {$ne: "DELETED"}
            }, u, u, u, u, u, {_id: -1})
        } else {
            assignments = await getStudentAssignments(req.user._id)
            for (const i in assignments) {
                assignments[i].submission = await Assignment_submission.findOne({
                    assignment: assignments[i]._id,
                    user: req.user._id
                })
            }
        }

        assignments = await addAssignmentTarget(assignments)

        return res.send(formatResult(u, u, assignments))
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
 *     description: Returns a assignment with the specified id
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

        let assignment = await findDocument(Assignment, isInstructor ? {
            _id: req.params.id,
            user: req.user._id,
            status: {$ne: "DELETED"}
        } : {_id: req.params.id})
        if (!assignment)
            return res.send(formatResult(404, 'assignment not found'))

        let user_group
        let chapter
        let course

        if (!isInstructor) {
            if (assignment.target.type === 'chapter') {
                chapter = await findDocument(Chapter, {
                    _id: assignment.target.id
                })
                course = await findDocument(Course, {
                    _id: chapter.course
                })
                user_group = course.user_group
            } else if (assignment.target.type === 'course') {
                course = await findDocument(Course, {
                    _id: assignment.target.id
                })
                user_group = course.user_group
            }
            const user_user_group = await findDocument(User_user_group, {
                user: req.user._id,
                user_group: user_group
            })
            if (!user_user_group)
                return res.send(formatResult(404, 'assignment not found'))
        }
        assignment = await addAssignmentTarget([assignment])
        assignment = assignment[0]
        return res.send(formatResult(u, u, assignment))
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
 *     description: Returns the files attached to a specified assignment ( use format height and width only when the attachment is a picture)
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Assignment's id
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
 *       - name: download
 *         description: make it true if you want to download the attachment
 *         in: query
 *         type: boolean
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/:id/attachment/:file_name', filterUsers(["INSTRUCTOR", "STUDENT"]), async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const assignment = await findDocument(Assignment, {
            _id: req.params.id
        })
        if (!assignment)
            return res.send(formatResult(404, 'assignment not found'))

        let file_found = false

        for (const i in assignment.attachments) {
            if (assignment.attachments[i].src === req.params.file_name) {
                file_found = true
                break
            }
            if (file_found)
                break
        }
        if (!file_found)
            return res.send(formatResult(404, 'file not found'))

        const user = await findDocument(User, {
            _id: assignment.user
        })

        const file_path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/assignments/${assignment._id}/${req.params.file_name}`)

        const file_type = await findFileType(req.params.file_name)
        if (req.query.download === 'true') {
            return res.download(file_path)
        } else {
            if (file_type === 'image') {
                sendResizedImage(req, res, file_path)
            } else if (file_type === 'video') {
                streamVideo(req, res, file_path)
            } else {
                return res.sendFile(file_path)
            }
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
 *     description: Create assignment
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a assignment
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Assignment'
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

            default:
                break;
        }

        if (!target)
            return res.send(formatResult(404, 'assignment target not found'))

        req.body.user = req.user._id

        let result = await createDocument(Assignment, req.body)
        result.data = await addAssignmentTarget([result.data])
        result.data = result.data[0]
        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /assignments/duplicate/{id}:
 *   post:
 *     tags:
 *       - Assignment
 *     description: Create assignment
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Id of the assignment you want to duplicate
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
router.post('/duplicate/:id', filterUsers(["INSTRUCTOR"]), async (req, res) => {
    try {
        // check if assignment exist
        let assignment = await findDocument(Assignment, {
            _id: req.params.id,
            user: req.user._id
        }, u, false)
        if (!assignment)
            return res.send(formatResult(404, 'assignment not found'))

        assignment = _.pick(assignment, "title,details,passMarks,target,dueDate,total_marks,allowMultipleFilesSubmission,submissionMode,allowed_files,attachments")
        assignment.title = `${assignment.title} copy(${Math.floor(1000 + Math.random() * 9000)})`
        let result = await createDocument(Assignment, assignment)
        if(assignment.attachments.length){
            const src_path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/assignments/${assignment._id}`)
            const target_path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/assignments/${result.data._id}`)
            copyFolderRecursiveSync(file_path,target_path)
        }
        result.data = await addAssignmentTarget([result.data])
        result.data = result.data[0]
        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

function copyFileSync( source, target ) {

    var targetFile = target;

    // If target is a directory, a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync( source, target ) {
    var files = [];

    // Check if folder needs to be created or integrated
    var targetFolder = target
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    // Copy
    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}

/**
 * @swagger
 * /assignments/{id}:
 *   put:
 *     tags:
 *       - Assignment
 *     description: Update assignment
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Assignment id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: Fields for a assignment
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Assignment'
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

        // check if assignment exist
        let assignment = await findDocument(Assignment, {
            _id: req.params.id,
            user: req.user._id
        }, u, false)
        if (!assignment)
            return res.send(formatResult(404, 'assignment not found'))

        let _copy = assignment

        // check if assignmentname exist
        assignment = await findDocument(Assignment, {
            _id: {
                $ne: req.params.id
            },
            title: req.body.title
        })
        if (assignment)
            return res.send(formatResult(400, 'name was taken'))

        assignment = _copy
        _copy = simplifyObject(assignment)

        assignment.title = req.body.title
        assignment.details = req.body.details
        assignment.passMarks = req.body.passMarks
        assignment.dueDate = req.body.dueDate
        assignment.submissionMode = req.body.submissionMode
        assignment.allowMultipleFilesSubmission = req.body.allowMultipleFilesSubmission
        assignment.allowed_files = req.body.allowed_files
        assignment.total_marks = req.body.total_marks
        assignment.user = req.user._id


        // delete removed files
        for (const i in _copy.attachments) {
            let deleteFile = true
            for (const j in req.body.attachments) {
                if (_copy.attachments[i].src === req.body.attachments[j].src) {
                    deleteFile = false
                    break
                }
            }
            if (deleteFile) {
                const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/assignments/${req.params.id}/${_copy.attachments[i].src}`)
                fs.exists(path, (exists) => {
                    if (exists) {
                        fs.unlink(path)
                    }
                })
            }
        }

        assignment.attachments = req.body.attachments

        await assignment.save()

        assignment = simplifyObject(assignment)
        assignment = await addAssignmentTarget([assignment])
        assignment = assignment[0]

        return res.send(formatResult(200, 'UPDATED', assignment))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /assignments/changeStatus/{id}/{status}:
 *   put:
 *     tags:
 *       - Assignment
 *     description: Update assignment status
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Assignment id
 *         in: path
 *         required: true
 *         type: string
 *       - name: status
 *         description: Assignment id
 *         in: path
 *         required: true
 *         type: string
 *         enum: ["DRAFT","PUBLISHED","RELEASED"]
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
router.put('/changeStatus/:id/:status', filterUsers(["INSTRUCTOR"]), async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        if (!["DRAFT", "PUBLISHED", "RELEASED"].includes(req.params.status))
            return res.send(formatResult(400, "Invalid status"))

        // check if course exist
        let assignment = await findDocument(Assignment, {
            _id: req.params.id,
            user: req.user._id,
        })
        if (!assignment)
            return res.send(formatResult(404, 'assignment not found'))

        let unmarked = await countDocuments(Assignment_submission, {
            assignment: req.params.id,
            marked: false
        })

        if (req.params.status === "RELEASED" && unmarked)
            return res.send(formatResult(403, `Please mark the remaining ${unmarked} submission${unmarked > 1 ? 's' : ''} before releasing marks`))


        let result = await updateDocument(Assignment, req.params.id,
            {
                status: req.params.status
            })

        if (req.params.status === "RELEASED") {
            const date = new Date(assignment.dueDate)
            date.setHours(date.getHours() - 2)

            let callback = function () {
                sendLiveNotifications({instructor_category: req.user.category._id.toString(), id: req.params.id})
            }

            scheduleEvent(date, callback)

        }
        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

async function sendLiveNotifications({instructor_category, id}) {
    let assignment = await Assignment.find({_id: id})
    assignment = await addAssignmentTarget(assignment)
    assignment = assignment[0]

    let user_user_groups = await User_user_group.find({
        user_group: assignment.target.course.user_group._id.toString(),
    }).populate('user')
    user_user_groups = user_user_groups.filter(x => x.user.category !== instructor_category)
    const user_ids = user_user_groups.map(x => x.user._id.toString())

    const today = new Date()
    const scheduled = new Date(assignment.dueDate)

    if (today.getDate() !== scheduled.getDate() || today.getMonth() !== scheduled.getMonth() || today.getFullYear() !== scheduled.getFullYear())
        return

    let newDocument = new Notification({
            link: `/assessments/assignments/${id}`,
            content: `Assingment '${assignment.title}' is ending in 2 hours`
        }
    )
    const savedDocument = await newDocument.save()
    if (savedDocument) {

        for (const i in user_ids) {

            // create notification for user
            let userNotification = await User_notification.findOne({
                user: user_ids[i]
            })
            if (!userNotification) {
                userNotification = new User_notification({
                    user: user_ids[i],
                    notifications: [{
                        id: newDocument._id
                    }]
                })

            } else {
                userNotification.notifications.push({
                    id: newDocument._id
                })
            }

            let _newDocument = await userNotification.save()

            if (_newDocument) {
                let notification = simplifyObject(_newDocument.notifications[_newDocument.notifications.length - 1])
                notification.id = undefined
                notification.notification = newDocument

                // send the notification
                MyEmitter.emit('socket_event', {
                    name: `upcoming_livesession_${user_ids[i]}`, data: notification
                });


                await sendAssignmentExpirationEmail({
                    email: user_user_groups[i].user.email,
                    user_names: `Mr${user_user_groups[i].user.gender === 'female' ? 's' : ''} ${user_user_groups[i].user.sur_name} ${user_user_groups[i].user.other_names}`,
                    assignment_name: assignment.title,
                    link: `https://${process.env.FRONTEND_HOST}/assessments/assignments/${assignment._id}`
                })


            }

        }


    }
}

/**
 * @swagger
 * /assignments/{id}/attachment:
 *   post:
 *     tags:
 *       - Assignment
 *     description: Upload assignment attacments
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Assignment id
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
router.post('/:id/attachment', filterUsers(["INSTRUCTOR"]), async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const assignment = await findDocument(Assignment, {
            _id: req.params.id
        })
        if (!assignment)
            return res.send(formatResult(404, 'assignment not found'))

        const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/assignments/${req.params.id}`)

        req.kuriousStorageData = {
            dir: path,
        }

        let file_missing = false

        for (const i in assignment.attachments) {
            const file_found = await fs.exists(`${path}/${assignment.attachments[i].src}`)
            if (!file_found) {
                file_missing = true
            }
        }
        if (!file_missing)
            return res.send(formatResult(400, 'all attachments for this assignment were already uploaded'))

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
 * /assignments/{id}:
 *   delete:
 *     tags:
 *       - Assignment
 *     description: Delete a assignment
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

        // check if the assignment is never used
        let used = false

        const submission = await findDocument(Assignment_submission, {
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

        await updateDocument(Assignment, req.params.id, {
            status: "DELETED"
        })
        return res.send(formatResult(200, 'DELETED'))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// export the router
module.exports = router