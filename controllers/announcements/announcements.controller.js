// import dependencies
const { User, getUserAnnouncements, injectTarget, Faculty } = require("../../utils/imports");
const { Announcement } = require("../../models/announcements/announcements.model");
const { validate_announcement } = require("../../models/announcements/announcements.model");
const { User_user_group } = require("../../models/user_user_group/user_user_group.model");
const { College } = require("../../utils/imports");
const { Faculty_college } = require("../../utils/imports");
const { Course } = require("../../utils/imports");
const { User_group } = require("../../models/user_group/user_group.model");
const { filterUsers } = require("../../middlewares/auth.middleware");
const {
    express,
    validateObjectId,
    formatResult,
    MyEmitter,
    findDocument,
    u,
    deleteDocument,
    createDocument,
    updateDocument,
    injectUser,
    simplifyObject,
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * /announcement/user:
 *   get:
 *     tags:
 *       - Announcement
 *     description: Returns announcements in the specified target
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
router.get('/user', async (req, res) => {
    try {


        const announcements = await getUserAnnouncements(req.user)

        return res.send(formatResult(u, u, announcements))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /announcement/{receivers}:
 *   post:
 *     tags:
 *       - Announcement
 *     description: Send a announcement
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: receivers
 *         in: path
 *         type: string
 *         enum: ['group','specific_users']
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
 *             title:
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
 *             specific_receivers:
 *               type: array
 *               items:
 *                  type: string
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
router.post('/:receivers', filterUsers(["ADMIN", "INSTRUCTOR"]), async (req, res) => {
    try {
        const {
            error
        } = validate_announcement(req.body, 'create', req.params.receivers)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        if (!['group', 'specific_users'].includes(req.params.receivers))
            return res.send(formatResult(400, "invalid receivers parameter value"))

        req.body.sender = req.user._id

        let target

        if (req.params.receivers === "group") {

            req.body.target.type = req.body.target.type.toLowerCase()

            const allowedTargets = ['course', 'student_group', 'faculty', 'college']

            if (!allowedTargets.includes(req.body.target.type))
                return res.send(formatResult(400, 'invalid announcement target_type'))
            
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

            if (req.body.target.type === 'college' && req.body.target.id !== req.user.college)
                return res.send(formatResult(403, 'You are not allowed to send announcement in another college'))

            if (req.body.target.type === 'college' && req.user.category.name === "INSTRUCTOR")
                return res.send(formatResult(403, 'You are not allowed to send announcement in the whole college'))

        } else {
            for (const i in req.body.specific_receivers) {
                const user = await User.findOne({ user_name: req.body.specific_receivers[i] })
                if (!user)
                    return res.send(formatResult(403, `User ${req.body.specific_receivers[i]} not found`))
                req.body.specific_receivers[i] = user._id
            }
        }
        let result = await createDocument(Announcement, req.body)
        result = simplifyObject(result)
        result.data = await injectUser([result.data], 'sender')
        result.data = await injectTarget(result.data)
        result.data = result.data[0]

        if (req.params.receivers === "specific_users") {
            for (const i in req.body.specific_receivers) {
                MyEmitter.emit('socket_event', {
                    name: `send_message_${req.body.specific_receivers[i]}`,
                    data: result.data
                });
            }
        } else {
            let user_groups = []
            switch (req.body.target.type) {
                case 'course':
                    user_groups.push(target.user_group)
                    break;

                case 'student_group':
                    user_groups.push(req.body.target.id)
                    break;

                case 'faculty':
                    user_groups = await User_group.distinct("_id", {
                        faculty: req.body.target.id
                    })
                    break;

                case 'college':
                    {
                        const faculties = await findDocument(Faculty, {
                            college: req.body.target.id
                        })
                        user_groups = await User_group.distinct("_id", {
                            faculty: { $in: faculties.map(x => x._id.toString()) }
                        })
                    }
                    break;

                default:
                    break;
            }
            const users = await User_user_group.distinct('user', { user_group: { $in: user_groups.map(x => x.toString()) } })
            for (const i in users) {
                MyEmitter.emit('socket_event', {
                    name: `send_message_${users[i]}`,
                    data: result.data
                });
            }
        }

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
 *             title:
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

        const announcement = await findDocument(Announcement, { _id: req.params.id })
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
 * /announcement/viewed/{id}:
 *   put:
 *     tags:
 *       - Announcement
 *     description: Record announcement viewers
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
router.put('/viewed/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, "invalid id"))

        const announcement = await Announcement.findOne({
            _id: req.params.id
        })
        if (!announcement)
            return res.send(formatResult(404, 'announcement not found'))

        if (announcement.viewers.includes(req.user._id.toString()))
            return res.send(formatResult(200, 'view already recorded'))

        announcement.viewers.push(req.user._id.toString())
        await announcement.save()

        return res.send(formatResult(u, u, "View successfully recorded"))
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
            _id: req.params.id,
            sender: req.user._id
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