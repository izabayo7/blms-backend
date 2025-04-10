// import dependencies
const {addMessageDetails} = require("../../utils/imports");
const {simplifyObject} = require("../../utils/imports");
const {MyEmitter} = require("../../utils/imports");
const {upload_audio} = require("../../utils/imports");
const {upload_single} = require("../../utils/imports");
const {fs} = require("../../utils/imports");
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

        const result = await Create_or_update_message(req.body.sender, req.body.receiver, req.body.content, u, u, u, req.body.reply)

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /message/{receiver}/forward/{message_id}:
 *   post:
 *     tags:
 *       - Message
 *     description: Update a message
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: receiver
 *         in: path
 *         type: string
 *         required: true
 *         description: Message receiver
 *       - name: message_id
 *         in: path
 *         type: string
 *         required: true
 *         description: Id of the message you want to forward
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
router.post('/:receiver/forward/:message_id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.message_id)
        if (error)
            return res.send(formatResult(400, "invalid message id"))

        const id = req.user._id
        let message = await findDocument(Message, {
            _id: req.params.message_id,
            $or: [
                {sender: id},
                {"receivers.id": id}
            ]
        })
        if (!message)
            return res.send(formatResult(404, 'message not found'))

        const {attachments, content} = message
        const {receiver} = req.params
        const isGroup = /^[0-9]{9}$/.test(receiver)
        if (!isGroup) {
            const Receiver = await findDocument(User, {user_name: receiver})
            const _content = `This is the begining of conversation between __user__${req.user._id} and __user__${Receiver._id}`
            const conversation_found = await Message.findOne({content: _content})
            if (!conversation_found) {
                await Create_or_update_message('SYSTEM', receiver, _content, u, req.user._id)
                MyEmitter.emit('socket_event', {
                    name: `conversation_created_${req.user._id}`,
                    data: receiver
                });
                MyEmitter.emit('socket_event', {
                    name: `conversation_created_${Receiver._id}`,
                    data: req.user.user_name
                });
            }
        }

        let result = await Create_or_update_message(req.user.user_name, isGroup ? parseInt(receiver) : receiver, content, undefined, undefined, attachments, undefined, true)

        result = simplifyObject(result)

        let msg = result.data

        if (attachments && attachments.length) {
            const dst_path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/chat/${msg.group ? '/groups/' + msg.group : 'userFiles'}/${req.user._id}`)
            const src_path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/chat/${message.group ? '/groups/' + message.group : 'userFiles'}/${message.sender}`)

            !fs.existsSync(dst_path) && fs.mkdirSync(dst_path, {recursive: true})

            for (const i in attachments) {
                fs.copyFile(`${src_path}${attachments[i].src}`, `${dst_path}${attachments[i].src}`);
            }
        }


        msg = await addMessageDetails(msg, msg.sender)

        MyEmitter.emit('socket_event', {
            name: `send_message_${msg.receivers[0].id}`,
            data: msg
        });
        msg.receiver = receiver
        MyEmitter.emit('socket_event', {
            name: `send_message_${req.user._id}`,
            data: msg
        });
        return res.send(formatResult(u, 'Message forwarded'))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /message/{receiver}/attachments:
 *   put:
 *     tags:
 *       - Message
 *     description: Update a message
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: receiver
 *         in: path
 *         type: string
 *         description: Message receiver
 *       - in: formData
 *         name: content
 *         type: string
 *         description: message content
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
router.put('/:receiver/attachements', async (req, res) => {
    try {

        let {content, attachments, reply} = req.query
        const {receiver} = req.params

        if (!attachments || !attachments.length)
            return res.send(formatResult(400, "attachments are required"))

        if (typeof attachments === "string")
            attachments = [attachments]

        if (content === "")
            content = undefined

        for (const i in attachments) {
            attachments[i] = {src: attachments[i]}
        }

        const {error} = validate_message({
            sender: req.user.user_name,
            receiver: receiver,
            content: content,
            attachments,
            reply
        })

        if (error)
            return res.send(formatResult(400, error.details[0].message))


        let result = await Create_or_update_message(req.user.user_name, /^[0-9]{9}$/.test(receiver) ? parseInt(receiver) : receiver, content, undefined, undefined, attachments, reply)

        result = simplifyObject(result)

        let msg = result.data


        const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/chat/${msg.group ? '/groups/' + msg.group : 'userFiles'}/${req.user._id}`)

        req.kuriousStorageData = {
            dir: path,
        }

        upload_multiple(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))
            msg = await addMessageDetails(msg, msg.sender)

            MyEmitter.emit('socket_event', {
                name: `send_message_${req.user._id}`,
                data: msg
            });
            for (const i in msg.receivers) {
                MyEmitter.emit('socket_event', {
                    name: `send_message_${msg.receivers[i].id}`,
                    data: msg
                });
            }
            return res.send(formatResult(u, 'All attachments were successfuly uploaded'))
        })
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /message/voiceNote/{receiver}:
 *   put:
 *     tags:
 *       - Message
 *     description: Upload a voicenote
 *     security:
 *       - bearerAuth: -[]
 *     consumes:
 *        - multipart/form-data
 *     parameters:
 *       - name: receiver
 *         in: path
 *         type: string
 *         description: Message receiver
 *       - in: formData
 *         name: file
 *         type: file
 *         description: attachment to upload
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
router.put('/voiceNote/:receiver', async (req, res) => {
    try {
        const {reply} = req.query
        const name = `voice_${req.params.receiver}_${new Date().getTime()}.mp3`

        const result = await Create_or_update_message(req.user.user_name, req.params.receiver, u, u, u, [{src: name}], reply)

        if (result.status !== 404) {
            let msg = result.data
            msg = simplifyObject(msg)
            const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/chat/${msg.group ? '/groups/' + msg.group : 'userFiles'}/${req.user._id}`)

            req.kuriousStorageData = {
                dir: path,
                name
            }

            upload_audio(req, res, async (err) => {
                if (err)
                    return res.send(formatResult(500, err.message))

                msg = await addMessageDetails(msg, msg.sender)
                MyEmitter.emit('socket_event', {
                    name: `send_message_${req.user._id}`,
                    data: msg
                });
                for (const i in msg.receivers) {
                    MyEmitter.emit('socket_event', {
                        name: `send_message_${msg.receivers[i].id}`,
                        data: msg
                    });
                }
                return res.send(formatResult(u, 'All attachments were successfuly uploaded'))
            })
        } else {
            return res.send(result)
        }
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
            return res.sendFile(file_path)
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
            _id: req.params.id,
        })
        if (!message)
            return res.send(formatResult(404, 'message not found'))

        if (message.sender !== req.user._id.toString())
            return res.send(formatResult(403, 'You can only delete your messages'))

        const result = await deleteDocument(Message, req.params.id)

        for (const i in message.attachments) {
            const file_path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/chat/${message.group ? '/groups/' + message.group : 'userFiles/' + req.user._id}/${message.attachments[i].src}`)
            fs.exists(file_path, (exists) => {
                if (exists) {
                    fs.unlink(file_path)
                }
            })
        }

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// export the router
module.exports = router