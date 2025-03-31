// import dependencies
const {
  express,
  Comment,
  validate_comment,
  validateObjectId,
  formatResult,
  findDocument,
  User,
  findDocuments,
  u,
  Create_or_update_comment,
  deleteDocument,
  Live_session,
  createDocument
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Comment:
 *     properties:
 *       sender:
 *         type: string
 *       target  :
 *         type: object
 *         properties:
 *           type:
 *             type: string
 *           id:
 *             type: string
 *       content:
 *         type: string
 *       reply:
 *         type: string
 *     required:
 *       - sender
 *       - target
 *       - content
 */

/**
 * @swagger
 * /comment:
 *   get:
 *     tags:
 *       - Comment
 *     description: Get all comments
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
    const result = await findDocuments(Comment)
    if (!result.length)
      return res.send(formatResult(404, 'Comment list is empty'))

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /comment/user/{user_name}/:type:
 *   get:
 *     tags:
 *       - Comment
 *     description: Returns comments to and from a specified user
 *     parameters:
 *       - name: user_name
 *         description: Users's user_name
 *         in: path
 *         required: true
 *         type: string
 *       - name: type
 *         description: The type of comments you want (sent, received, all)
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

    let user = await findDocument(User, {
      user_name: req.params.user_name
    })
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    req.params.type = req.params.type.toLocaleLowerCase()

    if (req.params.type != 'sent' && req.params.type != 'received' && req.params.type != 'all')
      return res.send(formatResult(400, 'invalid type'))

    let sent, received, result = []

    if (req.params.type == 'sent' || req.params.type == 'all') {
      sent = await findDocuments(Comment, {
        sender: user._id
      })

      if (sent.length) {
        for (const i in sent) {
          result.push(sent[i])
        }
      }
    }
    if (req.params.type == 'received' || req.params.type == 'all') {
      received = await findDocuments(Comment, {
        receivers: {
          $elemMatch: {
            id: user._id
          }
        }
      })

      if (received.length) {
        for (const i in received) {
          result.push(received[i])
        }
      }
    }
    return res.send(formatResult(u, u, result))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /comment:
 *   post:
 *     tags:
 *       - Comment
 *     description: Send a comment
 *     parameters:
 *       - name: body
 *         description: Fields for a comment
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Comment'
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
    } = validate_comment(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].comment))

    req.body.target.type = req.body.target.type.toLowerCase()

    const allowedTargets = ['chapter', 'live_session']

    if (!allowedTargets.includes(req.body.target.type))
      return res.send(formatResult(400, 'invalid comment target_type'))

    let target

    switch (req.body.target.type) {
      case 'chapter':
        target = await findDocument(Chapter, {
          _id: req.body.target.id
        })
        break;

      case 'live_session':
        target = await findDocument(Live_session, {
          _id: req.body.target.id
        })
        break;

      default:
        break;
    }

    if (!target)
      return res.send(formatResult(404, 'comment target not found'))


    const result = await createDocument(Comment, req.body)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /comment/{id}:
 *   put:
 *     tags:
 *       - Comment
 *     description: Update a comment
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Comment's Id
 *       - name: body
 *         description: Fields for a Comment
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Comment'
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
      return res.send(formatResult(400, error.details[0].comment))
    error = validate_comment(req.body)
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].comment))

    const result = await Create_or_update_comment(req.body.sender, req.body.receiver, req.body.content, req.params.id)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /comment/{id}:
 *   delete:
 *     tags:
 *       - Comment
 *     description: Delete a comment
 *     parameters:
 *       - name: id
 *         description: Comment's id
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
      return res.send(formatResult(400, error.details[0].comment))

    let comment = await findDocument(Comment, {
      _id: req.params.id
    })
    if (!comment)
      return res.send(formatResult(404, 'comment not found'))

    // need to delete all attachments

    const result = await deleteDocument(Comment, req.params.id)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// export the router
module.exports = router