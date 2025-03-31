
// coming mukanya
// import dependencies
const { express, multer, fs, ChatGroup, Student, Admin, Instructor, validatechatGroup, FacilityCollegeYear, normaliseDate, fileFilter, auth, _superAdmin, defaulPassword, _admin, validateObjectId, _student } = require('../../utils/imports')

// create router
const router = express.Router()

// get groups
// get group members
// get all users able to join
// create group
// update group
// delete group


/**
 * @swagger
 * definitions:
 *   ChatGroup:
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
 *       - ChatGroup
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
  const messages = await ChatGroup.find()
  try {
    if (messages.length === 0)
      return res.send('ChatGroup list is empty').status(404)
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
 *       - ChatGroup
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
  const sent = await ChatGroup.find({ sender: req.params.id })
  const recieved = await ChatGroup.find({ receiver: req.params.id })

  return res.send({ sent: sent, recieved: recieved }).status(200)
})

/**
 * @swagger
 * /kurious/message:
 *   post:
 *     tags:
 *       - ChatGroup
 *     description: Send a message
 *     parameters:
 *       - name: body
 *         description: Fields for a message
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/ChatGroup'
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
  const { error } = validateChatGroup(req.body)
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


  let newDocument = new ChatGroup({
    sender: req.body.sender,
    receivers: req.body.receivers,
    content: req.body.content,
    attachments: req.files === undefined ? undefined : req.files
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.send(saveDocument).status(201)
  return res.send('New ChatGroup not Registered').status(500)
})

/**
 * @swagger
 * /kurious/message/{id}:
 *   put:
 *     tags:
 *       - ChatGroup
 *     description: Update a message
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: ChatGroup's Id
 *       - name: body
 *         description: Fields for a ChatGroup
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/ChatGroup'
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
    return res.send(error.details[0].message).status(400)
  error = validateChatGroup(req.body)
  error = error.error
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if message exist
  let message = await ChatGroup.findOne({ _id: req.params.id })
  if (!message)
    return res.send(`ChatGroup with code ${req.params.id} doens't exist`)

  const updateDocument = await ChatGroup.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201)
  return res.send("Error ocurred").status(500)

})

/**
 * @swagger
 * /kurious/message/{id}:
 *   delete:
 *     tags:
 *       - ChatGroup
 *     description: Delete a message
 *     parameters:
 *       - name: id
 *         description: ChatGroup's id
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
  let message = await ChatGroup.findOne({ _id: req.params.id })
  if (!message)
    return res.send(`ChatGroup of Code ${req.params.id} Not Found`)
  // need to delete all attachments
  let deleteDocument = await ChatGroup.findOneAndDelete({ _id: req.params.id })
  if (!deleteDocument)
    return res.send('ChatGroup Not Deleted').status(500)
  return res.send(`ChatGroup ${deleteDocument._id} Successfully deleted`).status(200)
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
