const {
  College
} = require('../../models/college/college.model')
// coming mukanya
// import dependencies
const {
  express,
  ChatGroup,
  validatechatGroup,
  validateObjectId,
  returnUser
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   ChatGroup:
 *     properties:
 *       _id:
 *         type: string
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       members  :
 *         type: array
 *         items:
 *            type: objec\t
 *            properties:
 *              id:
 *                type: string
 *              isCreator:
 *                type: boolean
 *                unique: true
 *              isAdmin:
 *                type: boolean
 *              status:
 *                type: boolean
 *       private:
 *         type: boolean
 *       profile:
 *         type: string
 *       college:
 *          type: string
 *       status:
 *          type: boolean
 *          default: false
 *     required:
 *       - name
 *       - members
 *       - college
 */

/**
 * @swagger
 * /kurious/chat_group:
 *   get:
 *     tags:
 *       - ChatGroup
 *     description: Get all chat_groups
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
    const chat_groups = await ChatGroup.find()

    if (chat_groups.length === 0)
      return res.status(404).send('ChatGroup list is empty')
      
    return res.status(200).send(chat_groups)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/chat_group/college/{id}:
 *   get:
 *     tags:
 *       - ChatGroup
 *     description: Returns chat_groups in a specified college
 *     parameters:
 *       - name: id
 *         description: College's id
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
router.get('/college/:id', async (req, res) => {
  const {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].chat_group)
  let college = await College.findOne({
    _id: req.params.id
  })
  if (!college)
    return res.status(400).send('The College was not found')
  const chat_groups = await ChatGroup.find({
    college: req.params.id
  })
  return res.status(200).send(chat_groups)
})

/**
 * @swagger
 * /kurious/chat_group/user/{id}:
 *   get:
 *     tags:
 *       - ChatGroup
 *     description: Returns chat_groups a specified user belongs in
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
    return res.status(400).send(error.details[0].chat_group)
  let userFound = await returnUser(req.params.id)
  if (!userFound)
    return res.status(400).send('The User id is invalid')
  const chat_groups = await ChatGroup.find({
    members: {
      $elemMatch: {
        id: req.params.id,
        status: true
      }
    }
  })
  return res.status(200).send(chat_groups)
})

/**
 * @swagger
 * /kurious/chat_group:
 *   post:
 *     tags:
 *       - ChatGroup
 *     description: Send a chat_group
 *     parameters:
 *       - name: body
 *         description: Fields for a chat_group
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
  const {
    error
  } = validatechatGroup(req.body)
  if (error)
    return res.status(400).send(error.details[0].chat_group)

  let college = await College.findOne({
    _id: req.body.college
  })
  if (!college)
    return res.status(400).send('The College was not found')

  for (const i in req.body.members) {
    let receiver = await returnUser(req.body.members[i].id)
    if (!receiver)
      return res.status(400).send(`Member ${req.body.members[i].id} was Not Found`)
  }

  let newDocument = new ChatGroup({
    name: req.body.name,
    description: req.body.description,
    private: req.body.private,
    members: req.body.members,
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.status(201).send(saveDocument)
  return res.status(500).send('New ChatGroup not Registered')
})

/**
 * @swagger
 * /kurious/chat_group/{id}:
 *   put:
 *     tags:
 *       - ChatGroup
 *     description: Update a chat_group
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
  let {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].chat_group)
  error = validatechatGroup(req.body)
  error = error.error
  if (error)
    return res.status(400).send(error.details[0].chat_group)

  // check if chat_group exist
  let chat_group = await ChatGroup.findOne({
    _id: req.params.id
  })
  if (!chat_group)
    return res.status(400).send(`ChatGroup with code ${req.params.id} doens't exist`)

  const updateDocument = await ChatGroup.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    new: true
  })
  if (updateDocument)
    return res.status(201).send(updateDocument)
  return res.status(500).send("Error ocurred")

})

/**
 * @swagger
 * /kurious/chat_group/{id}:
 *   delete:
 *     tags:
 *       - ChatGroup
 *     description: Delete a chat_group
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
  const {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].chat_group)
  let chat_group = await ChatGroup.findOne({
    _id: req.params.id
  })
  if (!chat_group)
    return res.status(400).send(`ChatGroup of Code ${req.params.id} Not Found`)
  // need to delete all attachments
  let deleteDocument = await ChatGroup.findOneAndDelete({
    _id: req.params.id
  })
  if (!deleteDocument)
    return res.status(500).send('ChatGroup Not Deleted')
  return res.status(200).send(`ChatGroup ${deleteDocument._id} Successfully deleted`)
})

// add missing Information
async function injectDetails(chat_groups) {
  for (const i in chat_groups) {

    const college = await College.findOne({
      _id: chat_groups[i].college
    }).lean()
    chat_groups[i].college = removeDocumentVersion(college)
    if (chat_groups[i].college.logo) {
      chat_groups[i].college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}`
    }

    for (const k in chat_groups[i].members) {
      const member = await returnUser(chat_groups[i].members[k].id)
      hat_groups[i].members[k] = removeDocumentVersion(member)
      // add student profile media path
      if (chat_groups[i].members[k].profile) {
        chat_groups[i].members[k].profile = `http://${process.env.HOST}/kurious/file/studentProfile/${chat_groups[i]._id}/${student.profile}`
      }
    }

  }
  return chat_groups
}

// export the router
module.exports = router