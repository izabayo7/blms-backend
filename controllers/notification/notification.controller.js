// import dependencies
const { express, fs, Notification, validateNotification, returnUser, validateObjectId } = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Notification:
 *     properties:
 *       _id:
 *         type: string
 *       doer_type:
 *         type: string
 *       doer_id:
 *         type: string
 *       link:
 *         type: string
 *       content:
 *         type: string
 *     required:
 *       - doer_type
 *       - doer_id
 *       - content
 */

/**
 * @swagger
 * /kurious/notification:
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
  const notifications = await Notification.find()
  try {
    if (notifications.length === 0)
      return res.status(404).send('Notification list is empty')
    return res.status(200).send(notifications)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/notification/user/{id}:
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
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  let userFound = await returnUser(req.params.id)
  if (!userFound)
    return res.status(400).send('The User id is invalid')
  const notifications = await Notification.find({ doer_id: req.params.id })

  return res.status(200).send({ notifications: notifications })
})

/**
 * @swagger
 * /kurious/notification:
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
  const { error } = validateNotification(req.body)
  if (error)
    return res.status(400).send(error.details[0].message)

  let doer = await returnUser(req.body.doer_id)
  if (!doer)
    return res.status(404).send(`Doer Not Found`)
  const allowed_doer_types = ['User']
  if (!allowed_doer_types.includes(req.body.doer_type))
    return res.status(400).send(`${req.body.doer_type} is not allowed`)

  let newDocument = new Notification({
    doer_type: req.body.doer_type,
    doer_id: req.body.doer_id,
    content: req.body.content,
    link: req.body.link,
    content: req.body.content
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.status(201).send(saveDocument)
  return res.status(500).send('New Notification not Registered')
})

/**
 * @swagger
 * /kurious/notification/{id}:
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
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  error = validateNotification(req.body)
  error = error.error
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if notification exist
  let notification = await Notification.findOne({ _id: req.params.id })
  if (!notification)
    return res.status(404).send(`Notification with code ${req.params.id} doens't exist`)

  const updateDocument = await Notification.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.status(201).send(updateDocument)
  return res.status(500).send("Error ocurred")
})

/**
 * @swagger
 * /kurious/notification/{id}:
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
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  let notification = await Notification.findOne({ _id: req.params.id })
  if (!notification)
    return res.status(404).send(`Notification of Code ${req.params.id} Not Found`)
  // need to delete all attachments
  let deleteDocument = await Notification.findOneAndDelete({ _id: req.params.id })
  if (!deleteDocument)
    return res.status(500).send('Notification Not Deleted')
  return res.status(200).send(`Notification ${deleteDocument._id} Successfully deleted`)
})

// export the router
module.exports = router
