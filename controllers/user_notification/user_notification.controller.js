// import dependencies
const { express, fs, UserNotification, validateUserNotification, Notification, returnUser, validateObjectId } = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   UserNotification:
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
 * /kurious/user_notification:
 *   get:
 *     tags:
 *       - UserNotification
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
  const user_notifications = await UserNotification.find()
  try {
    if (user_notifications.length === 0)
      return res.status(404).send('UserNotification list is empty')
    return res.status(200).send(user_notifications)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/user_notification/user/{id}:
 *   get:
 *     tags:
 *       - UserNotification
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
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  let userFound = await returnUser(req.params.id)
  if (!userFound)
    return res.status(400).send('The User id is invalid')
  const user_notifications = await UserNotification.find({ user_id: req.params.id })

  return res.status(200).send({ user_notifications: user_notifications })
})

/**
 * @swagger
 * /kurious/user_notification:
 *   post:
 *     tags:
 *       - UserNotification
 *     description: save a user_notification
 *     parameters:
 *       - name: body
 *         description: Fields for a user_notification
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/UserNotification'
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
  const { error } = validateUserNotification(req.body)
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if notification exist
  let user_notification = await UserNotification.findOne({ user_id: req.body.user_id })
  if (user_notification)
    return res.status(404).send(`UserNotification already exist`)

  let user = await returnUser(req.body.user_id)
  if (!user)
    return res.status(404).send(`User Not Found`)

  // check if notification exist
  let notification = await Notification.findOne({ _id: req.body.notification_id })
  if (!notification)
    return res.status(404).send(`Notification with code ${req.body.notification_id} doens't exist`)

  let newDocument = new UserNotification({
    user_id: req.body.user_id,
    notifications: [{ id: req.body.notification_id }]
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.status(201).send(saveDocument)
  return res.status(500).send('New UserNotification not Registered')
})

/**
 * @swagger
 * /kurious/user_notification/{id}:
 *   put:
 *     tags:
 *       - UserNotification
 *     description: Update a notification
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: UserNotification's Id
 *       - name: body
 *         description: Fields for a UserNotification
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/UserNotification'
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
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  error = validateUserNotification(req.body)
  error = error.error
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if notification exist
  let user_notification = await UserNotification.findOne({ _id: req.params.id })
  if (!user_notification)
    return res.status(404).send(`UserNotification with code ${req.params.id} doens't exist`)

  let user = await returnUser(req.body.user_id)
  if (!user)
    return res.status(404).send(`User Not Found`)

  // check if notification exist
  let notification = await Notification.findOne({ _id: req.body.notification_id })
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
    user_notification.notifications.push({ id: req.body.notification_id })
  }

  const updateDocument = await user_notification.save()
  if (updateDocument)
    return res.status(201).send(updateDocument)
  return res.status(500).send("Error ocurred")
})

/**
 * @swagger
 * /kurious/user_notification/{id}:
 *   delete:
 *     tags:
 *       - UserNotification
 *     description: Delete a notification
 *     parameters:
 *       - name: id
 *         description: UserNotification's id
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
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  let notification = await UserNotification.findOne({ _id: req.params.id })
  if (!notification)
    return res.status(404).send(`UserNotification of Code ${req.params.id} Not Found`)
  // need to delete all attachments
  let deleteDocument = await UserNotification.findOneAndDelete({ _id: req.params.id })
  if (!deleteDocument)
    return res.status(500).send('UserNotification Not Deleted')
  return res.status(200).send(`UserNotification ${deleteDocument._id} Successfully deleted`)
})

// export the router
module.exports = router
