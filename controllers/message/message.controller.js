// import dependencies
const {streamVideo} = require("../../utils/imports");
const {sendResizedImage} = require("../../utils/imports");
const {findFileType} = require("../../utils/imports");
const {upload_multiple} = require("../../utils/imports");
const {addStorageDirectoryToPath} = require("../../utils/imports");
const {
    express,
    Message,
    validate_message,
    validateObjectId,
    path,
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
 *     security:
 *       - bearerAuth: -[]
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
 *     security:
 *       - bearerAuth: -[]
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
            sent = await findDocuments(Message, {
                sender: user._id
            })

            if (sent.length) {
                for (const i in sent) {
                    result.push(sent[i])
                }
            }
        }
        if (req.params.type == 'received' || req.params.type == 'all') {
            received = await findDocuments(Message, {
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
 * /message:
 *   post:
 *     tags:
 *       - Message
 *     description: Send a message
 *     security:
 *       - bearerAuth: -[]
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
 * /message:
 *   post:
 *     tags:
 *       - Message
 *     description: Send a message
 *     security:
 *       - bearerAuth: -[]
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
 * /message/{id}/attachments:
 *   put:
 *     tags:
 *       - Message
 *     description: Update a message
 *     security:
 *       - bearerAuth: -[]
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
router.put('/:id/attachements', async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, "invalid id"))

        const msg = await findDocument(Message, {
            _id: req.params.id,
            sender: req.user._id
        })
        if (!msg)
            return res.send(formatResult(404, 'message not found'))

        const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/chat/${msg.group ? '/groups/' + msg.group : 'userFiles'}/${req.user._id}`)

        req.kuriousStorageData = {
            dir: path,
        }

        let file_missing = false

        for (const i in msg.attachments) {
            const file_found = await fs.exists(`${path}/${msg.attachments[i].src}`)
            if (!file_found) {
                file_missing = true
            }
        }
        if (!file_missing)
            return res.send(formatResult(400, 'all attachments for this message were already uploaded'))

        upload_multiple(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))

            return res.send(formatResult(u, 'All attachments were successfuly uploaded'))
        })
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /message/{id}/attachment/{file_name}:
 *   get:
 *     tags:
 *       - Quiz
 *     description: Returns the files attached to a specified message ( use format height and width only when the attachment is a picture)
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Quiz's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: file's name
 *         in: path
 *         required: true
 *         type: string
 *       - name: format
 *         description: File format one of (jpeg, jpg, png, webp)
 *         in: query
 *         type: string
 *       - name: height
 *         description: custom height
 *         in: query
 *         type: string
 *       - name: width
 *         description: custom width
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/:id/attachment/:file_name', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const msg = await findDocument(Message, {
            _id: req.params.id
        })
        if (!msg)
            return res.send(formatResult(404, 'message not found'))

        let file_found = false

        for (const i in msg.attachments) {
            if (msg.attachments[i].src === req.params.file_name) {
                file_found = true
                break
            }
        }

        if (!file_found)
            return res.send(formatResult(404, 'file not found'))

        const user = await findDocument(User, {
            _id: msg.sender
        })

        const file_path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/chat/${msg.group ? '/groups/' + msg.group : 'userFiles/' + user._id}/${req.params.file_name}`)

        const file_type = await findFileType(req.params.file_name)

        if (file_type === 'image') {
            sendResizedImage(req, res, file_path)
        } else if (file_type === 'video') {
            streamVideo(req, res, file_path)
        } else {
            return res.sendFile(path.normalize(__dirname + '../../../' + file_path))
        }

    } catch
        (error) {
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
 *     security:
 *       - bearerAuth: -[]
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