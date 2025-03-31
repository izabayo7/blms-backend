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
  createDocument,
  updateDocument
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
 * /comment/{target}/{id}:
 *   get:
 *     tags:
 *       - Comment
 *     description: Returns comments in the specified target
 *     parameters:
 *       - name: target
 *         description: target type
 *         in: path
 *         required: true
 *         type: string
 *       - name: id
 *         description: target id
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
router.get('/:target/:id', async (req, res) => {
  try {

    let {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].comment))

    const allowedTargetTypes = ['chapter', 'live_session']

    if (!allowedTargetTypes.includes(req.params.target)) {
      return res.send(formatResult(400, 'invalid target type'))
    }

    let target

    switch (req.params.target) {
      case 'chapter':
        target = await findDocument(Chapter, {
          _id: req.params.id
        })
        break;

      case 'live_session':
        target = await findDocument(Live_session, {
          _id: req.params.id
        })
        break;

      default:
        break;
    }

    if (!target)
      return res.send(formatResult(404, 'comment target not found'))

    const comments = await findDocuments(Comment, {
      "target.type": req.params.target,
      "target.id": req.params.id
    })

    return res.send(formatResult(u, u, comments))
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

    const comment = await findDocument(Comment, { _id: req.params.id })
    if (!comment)
      return res.send(formatResult(404, 'comment not found'))

    const result = await updateDocument(Comment, req.params.id, req.body)
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

    const comment = await findDocument(Comment, {
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