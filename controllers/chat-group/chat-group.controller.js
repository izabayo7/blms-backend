
// coming mukanya
// import dependencies
const { express, multer, fs, Message, Student, Admin, Instructor, validateMessage, FacilityCollegeYear, normaliseDate, fileFilter, auth, _superAdmin, defaulPassword, _admin, validateObjectId, _student } = require('../../utils/imports')

// create router
const router = express.Router()

// configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/attachments')
  },
  filename: function (req, file, cb) {
    const fileName = normaliseDate(new Date().toISOString()) + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]
    cb(null, fileName)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
})


/**
 * @swagger
 * definitions:
 *   Message:
 *     properties:
 *       _id:
 *         type: string
 *       sender:
 *         type: string
 *       receivers  :
 *         type: array
 *         items:
 *            type: object
 *            properties:
 *              id:
 *                type: string
 *              read:
 *                type: boolean
 *       content:
 *         type: string
 *       attachments:
 *         type: string
 *       read:
 *          type: boolean
 *          default: false
 *     required:
 *       - sender
 *       - receivers
 *       - content
 */

/**
 * @swagger
 * /kurious/message:
 *   get:
 *     tags:
 *       - Message
 *     description: Get all messages
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', async (req, res) => {
  const messages = await Message.find()
  try {
    if (messages.length === 0)
      return res.send('Message list is empty').status(404)
    return res.send(messages).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

/**
 * @swagger
 * /kurious/message/user/{id}:
 *   get:
 *     tags:
 *       - Message
 *     description: Returns messages to and from a specified user
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
    return res.send(error.details[0].message).status(400)
  let userFound = await findUser(req.params.id)
  if (!userFound)
    return res.send('The User id is invalid')
  const sent = await Message.find({ sender: req.params.id })
  const recieved = await Message.find({ receiver: req.params.id })

  return res.send({ sent: sent, recieved: recieved }).status(200)
})

/**
 * @swagger
 * /kurious/message:
 *   post:
 *     tags:
 *       - Message
 *     description: Send a message
 *     parameters:
 *       - name: body
 *         description: Fields for a message
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Message'
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
router.post('/', upload.single('attachments'), async (req, res) => {
  const { error } = validateMessage(req.body)
  if (error)
    return res.send(error.details[0].message).status(400)

  let sender = await findUser(req.body.sender)
  if (!sender)
    return res.send(`Sender Not Found`)
  for (const i in req.body.receivers) {
    let receiver = await findUser(req.body.receivers[i].id)
    if (!receiver)
      return res.send(`Reciever Not Found`)
  }


  let newDocument = new Message({
    sender: req.body.sender,
    receivers: req.body.receivers,
    content: req.body.content,
    attachments: req.files === undefined ? undefined : req.files
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.send(saveDocument).status(201)
  return res.send('New Message not Registered').status(500)
})

/**
 * @swagger
 * /kurious/message/{id}:
 *   put:
 *     tags:
 *       - Message
 *     description: Update a message
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Message's Id
 *       - name: body
 *         description: Fields for a Message
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Message'
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
router.put('/:id', upload.single('attachments'), async (req, res) => {
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  error = validateMessage(req.body)
  error = error.error
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if message exist
  let message = await Message.findOne({ _id: req.params.id })
  if (!message)
    return res.send(`Message with code ${req.params.id} doens't exist`)

  const updateDocument = await Message.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201)
  return res.send("Error ocurred").status(500)

})

/**
 * @swagger
 * /kurious/message/{id}:
 *   delete:
 *     tags:
 *       - Message
 *     description: Delete a message
 *     parameters:
 *       - name: id
 *         description: Message's id
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
    return res.send(error.details[0].message).status(400)
  let message = await Message.findOne({ _id: req.params.id })
  if (!message)
    return res.send(`Message of Code ${req.params.id} Not Found`)
  // need to delete all attachments
  let deleteDocument = await Message.findOneAndDelete({ _id: req.params.id })
  if (!deleteDocument)
    return res.send('Message Not Deleted').status(500)
  return res.send(`Message ${deleteDocument._id} Successfully deleted`).status(200)
})

async function findUser(id) {
  let user = await Admin.findOne({ _id: id })
  if (user)
    return true
  user = await Instructor.findOne({ _id: id })
  if (user)
    return true
  user = await Student.findOne({ _id: id })
  if (user)
    return true
  return false
}

// export the router
module.exports = router
