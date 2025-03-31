// import dependencies
const {
  express,
  fs,
  Notification,
  validate_notification,
  validateObjectId,
  findDocuments,
  formatResult,
  findDocument,
  User,
  createDocument,
  updateDocument,
  deleteDocument,
  User_notification
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Notification:
 *     properties:
 *       user_type:
 *         type: string
 *       user:
 *         type: string
 *       link:
 *         type: string
 *       content:
 *         type: string
 *     required:
 *       - user_type
 *       - user
 *       - content
 */

/**
 * @swagger
 * /notification:
 *   get:
 *     tags:
 *       - Notification
 *     description: Get all notifications
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
    const result = await findDocuments(Notification)

    if (!result.data.length)
      return res.send(formatResult(404, 'Notification list is empty'))

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /notification/user/{id}:
 *   get:
 *     tags:
 *       - Notification
 *     description: Returns notifications that were caused by a specified user
 *     parameters:
 *       - name: id
 *         description: Users's id
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
router.get('/user/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let user_found = await findDocument(User, {
      _id: req.params.id
    })
    if (!user_found.data)
      return res.send(formatResult(404, 'user not found'))

    const result = await findDocuments(Notification, {
      user: req.params.id
    })
    if (!result.data.length)
      return res.send(formatResult(404, 'notifications not found'))

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /notification:
 *   post:
 *     tags:
 *       - Notification
 *     description: Send a notification
 *     parameters:
 *       - name: body
 *         description: Fields for a notification
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Notification'
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
    } = validate_notification(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let user = await findDocument(User, { _id: req.body.user })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    let result = await createDocument(Notification, {
      user_type: req.body.user_type,
      user: req.body.user,
      content: req.body.content,
      link: req.body.link,
      content: req.body.content
    })

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /notification/{id}:
 *   put:
 *     tags:
 *       - Notification
 *     description: Update a notification
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Notification's Id
 *       - name: body
 *         description: Fields for a Notification
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Notification'
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

    error = validate_notification(req.body)
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if notification exist
    let notification = await findDocument(Notification, {
      _id: req.params.id
    })
    if (!notification.data)
      return res.send(formatResult(404, 'notification not found'))

    let user = await findDocument(User, { _id: req.body.user })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    const result = await updateDocument(Notification, req.params.id, req.body)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /notification/{id}:
 *   delete:
 *     tags:
 *       - Notification
 *     description: Delete a notification
 *     parameters:
 *       - name: id
 *         description: Notification's id
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
    let notification = await findDocument(Notification, {
      _id: req.params.id
    })
    if (!notification.data)
      return res.send(formatResult(404, 'notification not found'))

    const user_notifications = await findDocuments(User_notification, { "notifications.id": req.params.id })
    if (user_notifications.data.length) {
      for (const i in user_notifications.data) {
        let notifications = user_notifications.data[i].notifications
        for (const k in user_notifications.data[i].notifications) {
          if (user_notifications.data[i].notifications[k].id == req.params.id) {
            notifications.splice(k, 1)
          }
        }
        user_notifications.data[i].notifications = notifications
        await user_notifications.data[i].save()
      }
    }

    // need to delete all attachments
    let result = await deleteDocument(Notification, req.params.id)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// export the router
module.exports = router