// import dependencies
const {
  express,
  Message,
  validate_message,
  validateObjectId,
  formatResult,
  findDocument,
  User,
  findDocuments,
  u,
  Create_or_update_message,
  deleteDocument
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Message:
 *     properties:
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
 *       group:
 *         type: string
 *       attachments:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             src:
 *               type: string
 *     required:
 *       - sender
 *       - receivers
 *       - content
 */

/**
 * @swagger
 * /message:
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
  try {
    const result = await findDocuments(Message)
    if (!result.length)
      return res.send(formatResult(404, 'Message list is empty'))

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /message/user/{user_name}/:type:
 *   get:
 *     tags:
 *       - Message
 *     description: Returns messages to and from a specified user
 *     parameters:
 *       - name: user_name
 *         description: Users's user_name
 *         in: path
 *         required: true
 *         type: string
 *       - name: type
 *         description: The type of messages you want (sent, received, all)
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
router.get('/user/:user_name/:type', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let user = await findDocument(User, {
      _id: req.params.user_name
    })
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    req.params.type = req.params.type.toLocaleLowerCase()

    if (req.params.type != 'sent' && req.params.type != 'recieved' && req.params.type != 'all')
      return res.send(formatResult(400, 'invalid type'))

    let sent, recieved, result

    if (req.params.type.to == 'sent' || req.params.type == 'all')
      sent = await findDocuments(Message, {
        sender: user._id
      })

    if (sent.length) {
      for (const i in sent) {
        result.push(sent[i])
      }
    }

    if (req.params.type.to == 'received' || req.params.type == 'all')
      recieved = await findDocuments(Message, {
        receivers: {
          $elemMatch: {
            id: user._id
          }
        }
      })

    if (recieved.length) {
      for (const i in recieved) {
        result.push(recieved[i])
      }
    }

    return res.send(formatResult(u, u, result))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /message:
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
router.post('/', async (req, res) => {
  try {
    const {
      error
    } = validate_message(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const result = await Create_or_update_message(req.body.sender, req.body.receiver, req.body.content)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /message/{id}:
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
router.put('/:id', async (req, res) => {
  try {
    let {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))
    error = validate_message(req.body)
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const result = await Create_or_update_message(req.body.sender, req.body.receiver, req.body.content, req.params.id)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /message/{id}:
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
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let message = await findDocument(Message, {
      _id: req.params.id
    })
    if (!message)
      return res.send(formatResult(404, 'message not found'))

    // need to delete all attachments

    const result = await deleteDocument(Message, req.params.id)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// export the router
module.exports = router