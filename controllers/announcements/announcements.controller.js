// import dependencies
const {College} = require("../../utils/imports");
const {Faculty_college} = require("../../utils/imports");
const {Course} = require("../../utils/imports");
const {User_group} = require("../../models/user_group/user_group.model");
const {filterUsers} = require("../../middlewares/auth.middleware");
const {
    express,
    Announcement,
    validate_announcement,
    validateObjectId,
    formatResult,
    findDocument,
    User,
    findDocuments,
    u,
    Create_or_update_announcement,
    deleteDocument,
    Live_session,
    createDocument,
    updateDocument,
    Chapter,
    injectUser,
    injectAnnouncementsReplys,
    simplifyObject,
    Quiz_submission
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * /announcement/{target}/{id}:
 *   get:
 *     tags:
 *       - Announcement
 *     description: Returns announcements in the specified target
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: target
 *         description: target type
 *         in: path
 *         required: true
 *         type: string
 *       - name: id
 *         description: target id
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
router.get('/:target/:id', async (req, res) => {
    try {

        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const allowedTargetTypes = ['chapter', 'live_session', 'quiz_submission', 'quiz_submission_answer']

        if (!allowedTargetTypes.includes(req.params.target)) {
            return res.send(formatResult(400, 'invalid target type'))
        }

        let target

        switch (req.params.target) {
            case 'chapter':
                target = await findDocument(Chapter, {
                    _id: req.params.id
                })
                break;

            case 'live_session':
                target = await findDocument(Live_session, {
                    _id: req.params.id
                })
                break;

            case 'quiz_submission':
                target = await findDocument(Quiz_submission, {
                    _id: req.params.id
                })
                break;

            case 'quiz_submission_answer':
                target = await findDocument(Quiz_submission, {
                    "answers._id": req.params.id
                })
                break;

            default:
                break;
        }

        if (!target)
            return res.send(formatResult(404, 'announcement target not found'))

        let announcements = await findDocuments(Announcement, {
            "target.type": req.params.target,
            "target.id": req.params.id,
            reply: undefined
        }, u, u, u, u, u, {_id: -1})
        announcements = await injectUser(announcements, 'sender')
        announcements = await injectAnnouncementsReplys(announcements)
        return res.send(formatResult(u, u, announcements))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /announcement:
 *   post:
 *     tags:
 *       - Announcement
 *     description: Send a announcement
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a announcement
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             content:
 *               type: string
 *               required: true
 *             target:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   enum: ['course', 'student_group', 'faculty', 'college']
 *                   required: true
 *                 id:
 *                   type: string
 *                   required: true
 *               required: true
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
router.post('/', filterUsers(["ADMIN", "INSTRUCTOR"]), async (req, res) => {
    try {
        const {
            error
        } = validate_announcement(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))


        req.body.sender = req.user._id

        req.body.target.type = req.body.target.type.toLowerCase()

        const allowedTargets = ['course', 'student_group', 'faculty', 'college']

        if (!allowedTargets.includes(req.body.target.type))
            return res.send(formatResult(400, 'invalid announcement target_type'))

        let target
        // TODO check if instructor has access to the target
        switch (req.body.target.type) {
            case 'course':
                target = await findDocument(Course, {
                    _id: req.body.target.id
                })
                break;

            case 'student_group':
                target = await findDocument(User_group, {
                    _id: req.body.target.id
                })
                break;

            case 'faculty':
                target = await findDocument(Faculty_college, {
                    _id: req.body.target.id
                })
                break;

            case 'college':
                target = await findDocument(College, {
                    _id: req.body.target.id
                })
                break;

            default:
                break;
        }

        if (!target)
            return res.send(formatResult(404, 'announcement target not found'))

        if(req.body.target.type === 'college' && req.body.target.id != req.user.college)
            return res.send(formatResult(403, 'You are not allowed to send announcement in another college'))

        if(req.body.target.type === 'college' && req.user.category.name === "INSTRUCTOR")
            return res.send(formatResult(403, 'You are not allowed to send announcement in the whole college'))


        let result = await createDocument(Announcement, req.body)
        result = simplifyObject(result)
        result.data = await injectUser([result.data], 'sender')
        result.data = result.data[0]

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /announcement/{id}:
 *   put:
 *     tags:
 *       - Announcement
 *     description: Update announcement
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Announcement's Id
 *       - name: body
 *         description: Fields for a Announcement
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             content:
 *               type: string
 *               required: true
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
router.put('/:id', filterUsers(["ADMIN", "INSTRUCTOR"]), async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))
        error = validate_announcement(req.body, 'update')
        error = error.error
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const announcement = await findDocument(Announcement, {_id: req.params.id})
        if (!announcement)
            return res.send(formatResult(404, 'announcement not found'))

        const result = await updateDocument(Announcement, req.params.id, req.body)
        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /announcement/{id}:
 *   delete:
 *     tags:
 *       - Announcement
 *     description: Delete announcement
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Announcement's id
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
router.delete('/:id', filterUsers(["ADMIN", "INSTRUCTOR"]), async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const announcement = await findDocument(Announcement, {
            _id: req.params.id
        })
        if (!announcement)
            return res.send(formatResult(404, 'announcement not found'))

        const result = await deleteDocument(Announcement, req.params.id)

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// export the router
module.exports = router