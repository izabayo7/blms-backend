// import dependencies
const {User_user_group} = require("../../models/user_user_group/user_user_group.model");
const {filterUsers} = require("../../middlewares/auth.middleware");
const {User_notification} = require("../../utils/imports");
const {simplifyObject} = require("../../utils/imports");
const {MyEmitter} = require("../../utils/imports");
const {scheduleEvent} = require("../../utils/imports");
const {handleChunk} = require("../../utils/imports");
const {
    express,
    Live_session,
    validate_live_session,
    validateObjectId,
    Notification,
    formatResult,
    findDocument,
    User,
    findDocuments,
    u,
    Quiz,
    Course,
    Create_or_update_live_session,
    deleteDocument,
    Chapter,
    updateDocument,
    createDocument
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Live_session:
 *     properties:
 *       target:
 *         type: object
 *         properties:
 *           type:
 *             type: string
 *           id:
 *             type: string
 *       date:
 *         type: date-time
 *       time:
 *         type: string
 *       record_session:
 *         type: boolean
 *       quiz:
 *         type: string
 *     required:
 *       - starting_time
 *       - target
 */

/**
 * @swagger
 * /live_session/{target}/{id}:
 *   get:
 *     tags:
 *       - Live_session
 *     description: Returns live_sessions to and from a specified user
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: target
 *         description: Target type of the live_session
 *         in: path
 *         required: true
 *         type: string
 *       - name: id
 *         description: Target id of the live_session
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
router.get('/:type/:id', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        req.params.type = req.params.type.toLocaleLowerCase()

        const allowedTargets = ['chapter']

        if (!allowedTargets.includes(req.params.type))
            return res.send(formatResult(400, 'invalid live_session target_type'))

        let target

        switch (req.params.type) {
            case 'chapter':
                target = await findDocument(Chapter, {
                    _id: req.params.id
                })
                break;
            default:
                break;
        }

        if (!target)
            return res.send(formatResult(404, 'live_session target not found'))

        const results = await findDocument(Live_session, {
            $and: [
                {"target.type": req.params.type},
                {"target.id": req.params.id}
            ]
        })

        return res.send(formatResult(u, u, results))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /live_session/{id}:
 *   get:
 *     tags:
 *       - Live_session
 *     description: Returns a specific live_session
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Live_session id
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

        const result = await Live_session.findById({
            _id: req.params.id
        }).lean()

        if (!result)
            return res.send(formatResult(404, 'live_session target not found'))

        const chapter = await Chapter.findById(result.target.id)

        result.course = await Course.findById(chapter.course)
        result.chapter = chapter

        if (req.user.category.name == "INSTRUCTOR") {
            result.quiz = await Quiz.findOne({
                "target.type": 'live_session',
                "target.id": result._id
            })
        } else {
            result.quiz = undefined
        }

        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /live_session:
 *   post:
 *     tags:
 *       - Live_session
 *     description: Send a live_session
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a live_session
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Live_session'
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
        } = validate_live_session(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        req.body.target.type = req.body.target.type.toLocaleLowerCase()

        const allowedTargets = ['chapter']

        if (!allowedTargets.includes(req.body.target.type))
            return res.send(formatResult(400, 'invalid live_session target_type'))

        let target

        switch (req.body.target.type) {
            case 'chapter':
                target = await Chapter.findOne({
                    _id: req.body.target.id
                }).populate('course')
                break;
            default:
                break;
        }

        if (!target)
            return res.send(formatResult(404, 'live_session target not found'))

        let quiz

        if (req.body.quiz) {
            quiz = await Quiz.findOne({
                _id: req.body.quiz
            })
            if (!quiz)
                return res.send(formatResult(404, 'quiz not found'))

            if (quiz.target.id) {
                return res.send(formatResult(404, 'quiz already taken'))
            }

        }

        const result = await createDocument(Live_session, req.body)

        const givenDate = new Date(req.body.date)
        const time = req.body.time.split(':')
        const date = new Date(givenDate.getFullYear(), givenDate.getMonth(), givenDate.getDate(), parseInt(time[0]), parseInt(time[1]), 0);
        date.setMinutes(date.getMinutes() - 5)

        let user_user_groups = await User_user_group.find({
            user_group: target.course.user_group,
        }).populate('user')

        user_user_groups = user_user_groups.filter(x => x.user.category !== req.user.category._id.toString())

        const user_ids = user_user_groups.map(x => x.user._id.toString())

        let callback = function () {
            sendLiveNotifications({user_ids})
        }


        scheduleEvent(date, callback)

        date.setMinutes(date.getMinutes() + 5)

        callback = function () {
            sendLiveNotifications({isLive: true, liveId: result.data._id, user_ids})
        }

        scheduleEvent(date, callback)

        if (quiz) {
            quiz.target = {
                type: 'live_session',
                id: result.data._id
            }
            await quiz.save()
        }

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /live_session/record/{id}:
 *   post:
 *     tags:
 *       - Live_session
 *     description: Record a live_session
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Live_session's Id
 *       - name: body
 *         description: Fields for a Live_session
 *         in: body
 *         required: true
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
router.put('/record/:id', async (req, res) => {
    try {
        // const {
        //     error
        // } = validate_live_session(req.body)
        // if (error)
        //     return res.send(formatResult(400, error.details[0].message))


        let live_session = await findDocument(Live_session, {
            _id: req.params.id
        })
        if (!live_session)
            return res.send(formatResult(404, 'live_session not found'))


        for await (const chunk of req) {
            await handleChunk(chunk, req.params.id);
        }

        return res.send("sawa")
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /live_session/{id}:
 *   put:
 *     tags:
 *       - Live_session
 *     description: Update a live_session
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Live_session's Id
 *       - name: body
 *         description: Fields for a Live_session
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Live_session'
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
        const {
            error
        } = validate_live_session(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))


        let live_session = await findDocument(Live_session, {
            _id: req.params.id
        })
        if (!live_session)
            return res.send(formatResult(404, 'live_session not found'))

        req.body.target.type = req.body.target.type.toLocaleLowerCase()

        const allowedTargets = ['chapter']

        if (!allowedTargets.includes(req.body.target.type))
            return res.send(formatResult(400, 'invalid live_session target_type'))

        let target

        switch (req.body.target.type) {
            case 'chapter':
                target = await findDocument(Chapter, {
                    _id: req.body.target.id
                })
                break;
            default:
                break;
        }

        if (!target)
            return res.send(formatResult(404, 'live_session target not found'))

        const result = await updateDocument(Live_session, req.params.id, req.body)

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /live_session/{id}/status/{status}:
 *   put:
 *     tags:
 *       - Live_session
 *     description: Update a live_session
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Live_session's Id
 *       - name: status
 *         in: path
 *         type: string
 *         enum: ["PENDING","LIVE","FINISHED"]
 *         description: Live_session's Id
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
router.put('/:id/status/:status', async (req, res) => {
    try {
        const allowed_statuses = ["PENDING", "LIVE", "FINISHED"]
        if (!allowed_statuses.includes(req.params.status))
            return res.send(formatResult(400, "Invalid status"))

        let live_session = await findDocument(Live_session, {
            _id: req.params.id
        })
        if (!live_session)
            return res.send(formatResult(404, 'live_session not found'))

        const result = await updateDocument(Live_session, req.params.id, {status: req.params.status})

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /live_session/{id}:
 *   delete:
 *     tags:
 *       - Live_session
 *     description: Delete a live_session
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Live_session's id
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
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let live_session = await findDocument(Live_session, {
            _id: req.params.id
        })
        if (!live_session)
            return res.send(formatResult(404, 'live_session not found'))

        // need to delete all attachments

        const result = await deleteDocument(Live_session, req.params.id)

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

async function sendLiveNotifications({isLive, liveId, user_ids}) {
    let newDocument = new Notification(isLive ? {
            link: `/live/${liveId}`,
            content: "Live session just started"
        } : {
            content: "you have a live class in 5 minutes",
        }
    )
    const saveDocument = await newDocument.save()
    if (saveDocument) {

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

            }

        }


    }
}

// export the router
module.exports = router
