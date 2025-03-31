// import dependencies
const {
  express,
  fs,
  User_notification,
  validateUser_notification,
  Notification,
  returnUser,
  validateObjectId,
  injectNotification
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   User_notification:
 *     properties:
 *       _id:
 *         type: string
 *       user_id:
 *         type: string
 *       notifications:
 *         type: array
 *         items:
 *            type: object
 *            properties:
 *              id:
 *                type: string
 *              status:
 *                type: Number
 *     required:
 *       - user_id
 *       - notification.id
 */

/**
 * @swagger
 * /user_notification:
 *   get:
 *     tags:
 *       - User_notification
 *     description: Get all user_notifications
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', async (req, res) => {
  let user_notifications = await User_notification.find().lean()
  try {
    if (user_notifications.length === 0)
      return res.status(404).send('User_notification list is empty')
    user_notifications = await injectNotification(user_notifications)
    return res.status(200).send(user_notifications)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /user_notification/user/{id}:
 *   get:
 *     tags:
 *       - User_notification
 *     description: Returns user_notifications for a specified user
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
  const {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  let userFound = await returnUser(req.params.id)
  if (!userFound)
    return res.status(400).send('The User id is invalid')
  let user_notifications = await User_notification.find({
    user_id: req.params.id
  }).lean()
  if (user_notifications.length === 0)
    return res.status(404).send('User_notification list is empty')
  user_notifications = await injectNotification(user_notifications)
  user_notifications = user_notifications[0].notifications.reverse()
  return res.status(200).send(user_notifications)
})

/**
 * @swagger
 * /user_notification:
 *   post:
 *     tags:
 *       - User_notification
 *     description: save a user_notification
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
  const {
    error
  } = validateUser_notification(req.body)
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if notification exist
  let user_notification = await User_notification.findOne({
    user_id: req.body.user_id
  })
  if (user_notification)
    return res.status(404).send(`User_notification already exist`)

  let user = await returnUser(req.body.user_id)
  if (!user)
    return res.status(404).send(`User Not Found`)

  // check if notification exist
  let notification = await Notification.findOne({
    _id: req.body.notification_id
  })
  if (!notification)
    return res.status(404).send(`Notification with code ${req.body.notification_id} doens't exist`)

  let newDocument = new User_notification({
    user_id: req.body.user_id,
    notifications: [{
      id: req.body.notification_id
    }]
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.status(201).send(saveDocument)
  return res.status(500).send('New User_notification not Registered')
})

/**
 * @swagger
 * /user_notification/{id}:
 *   put:
 *     tags:
 *       - User_notification
 *     description: Update a notification
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
  let {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  error = validateUser_notification(req.body)
  error = error.error
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if notification exist
  let user_notification = await User_notification.findOne({
    _id: req.params.id
  })
  if (!user_notification)
    return res.status(404).send(`User_notification with code ${req.params.id} doens't exist`)

  let user = await returnUser(req.body.user_id)
  if (!user)
    return res.status(404).send(`User Not Found`)

  // check if notification exist
  let notification = await Notification.findOne({
    _id: req.body.notification_id
  })
  if (!notification)
    return res.status(404).send(`Notification with code ${req.params.id} doens't exist`)

  let notificationFound = false

  for (const i in user_notification.notifications) {
    if (user_notification.notifications[i].id == req.body.notification_id) {
      notificationFound = true
      if (!req.body.status)
        return res.status(400).send(`Notification already exist`)
      user_notification.notifications[i].status = req.body.status
      break
    }
  }

  if (!notificationFound) {
    user_notification.notifications.push({
      id: req.body.notification_id
    })
  }

  const updateDocument = await user_notification.save()
  if (updateDocument)
    return res.status(201).send(updateDocument)
  return res.status(500).send("Error ocurred")
})

/**
 * @swagger
 * /user_notification/{id}:
 *   delete:
 *     tags:
 *       - User_notification
 *     description: Delete a notification
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
  const {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  let notification = await User_notification.findOne({
    _id: req.params.id
  })
  if (!notification)
    return res.status(404).send(`User_notification of Code ${req.params.id} Not Found`)
  // need to delete all attachments
  let deleteDocument = await User_notification.findOneAndDelete({
    _id: req.params.id
  })
  if (!deleteDocument)
    return res.status(500).send('User_notification Not Deleted')
  return res.status(200).send(`User_notification ${deleteDocument._id} Successfully deleted`)
})

// export the router
module.exports = router