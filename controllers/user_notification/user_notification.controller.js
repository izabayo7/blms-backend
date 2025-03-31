// import dependencies
const {
    express,
    fs,
    User_notification,
    Notification,
    returnUser,
    validateObjectId,
    injectNotification,
    findDocuments,
    formatResult,
    User,
    createDocument,
    findDocument,
    updateDocument,
    validate_user_notification,
    deleteDocument,
    u
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   User_notification:
 *     properties:
 *       user:
 *         type: string
 *       notifications:
 *         type: array
 *         items:
 *            type: object
 *            properties:
 *              id:
 *                type: string
 *              status:
 *                type: number
 *     required:
 *       - user
 *       - notification.id
 */

/**
 * @swagger
 * /user_notification/user:
 *   get:
 *     tags:
 *       - User_notification
 *     description: Returns user_notifications for the logged in user
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

        let result = await findDocuments(User_notification, {
            user: req.user._id
        })

        result = await injectNotification(result)
        if (result.length)
            result = result[0].notifications.reverse()
        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user_notification:
 *   post:
 *     tags:
 *       - User_notification
 *     description: save a user_notification
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a user_notification
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/User_notification'
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
router.post('/', async (req, res) => {
    try {
        const {
            error
        } = validate_user_notification(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if notification exist
        let user_notification = await findDocument(User_notification, {
            user: req.user._id
        })
        if (user_notification)
            return res.send(formatResult(404, 'User_notification already exist'))

        // check if notification exist
        let notification = await findDocument(Notification, {
            _id: req.body.notification
        })
        if (!notification)
            return res.send(formatResult(404, 'notification not found'))

        let result = await createDocument(User_notification, {
            user: req.user._id,
            notifications: [{
                id: req.body.notification
            }]
        })

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user_notification/allSeen:
 *   put:
 *     tags:
 *       - User_notification
 *     description: Update a notification
 *     security:
 *       - bearerAuth: -[]
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
router.put('/allSeen', async (req, res) => {
    try {

        // check if notification exist
        let user_notification = await findDocument(User_notification, {
            user: req.user._id.toString()
        }, u, false)
        if (!user_notification)
            return res.send(formatResult(404, 'user_notification not found'))


        for (const i in user_notification.notifications) {
            if (user_notification.notifications[i].status === 3) {
                user_notification.notifications[i].status = 2
            }
        }

        const updated_document = await user_notification.save()

        return res.send(formatResult(200, 'UPDATED'))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user_notification/{notification}/read:
 *   put:
 *     tags:
 *       - User_notification
 *     description: Update a notification
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: notification
 *         in: path
 *         type: string
 *         description: Notification Id
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
router.put('/:notification/read', async (req, res) => {
    try {

        // check if notification exist
        let user_notification = await findDocument(User_notification, {
            user: req.user._id.toString()
        }, u, false)
        if (!user_notification)
            return res.send(formatResult(404, 'user_notification not found'))


        let notification_found = false
        for (const i in user_notification.notifications) {
            if (user_notification.notifications[i].id === req.params.notification) {
                user_notification.notifications[i].status = 1
            }
        }

        const updated_document = await user_notification.save()

        return res.send(formatResult(200, 'UPDATED'))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /user_notification/{id}:
 *   put:
 *     tags:
 *       - User_notification
 *     description: Update a notification
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: User_notification's Id
 *       - name: body
 *         description: Fields for a User_notification
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/User_notification'
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

        error = validate_user_notification(req.body)
        error = error.error
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if notification exist
        let user_notification = await findDocument(User_notification, {
            _id: req.params.id
        })
        if (!user_notification)
            return res.send(formatResult(404, 'user_notification not found'))


        // check if notification exist
        let notification = await findDocument(Notification, {
            _id: req.body.notification
        })
        if (!notification)
            return res.send(formatResult(404, 'notification not found'))

        let notification_found = false

        for (const i in user_notification.notifications) {
            if (user_notification.notifications[i].id == req.body.notification) {
                notification_found = true
                if (!req.body.status)
                    return res.send(formatResult(400, `Notification already exist`))
                user_notification.notifications[i].status = req.body.status
                break
            }
        }

        if (!notification_found) {
            user_notification.notifications.push({
                id: req.body.notification
            })
        }

        const updated_document = await user_notification.save()

        return res.send(formatResult(200, 'UPDATED', updated_document))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user_notification/{id}:
 *   delete:
 *     tags:
 *       - User_notification
 *     description: Delete a notification
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: User_notification's id
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

        // check if notification exist
        let user_notification = await findDocument(User_notification, {
            _id: req.params.id
        })
        if (!user_notification)
            return res.send(formatResult(404, 'user_notification not found'))

        let result = await deleteDocument(User_notification, req.params.id)

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// export the router
module.exports = router