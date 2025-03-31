const {
  College
} = require('../../models/college/college.model')
// coming mukanya
// import dependencies
const {
  express,
  Chat_group,
  validate_chat_group,
  validateObjectId,
  returnUser,
  removeDocumentVersion,
  injectUser,
  findDocuments,
  formatResult,
  findDocument,
  createDocument,
  updateDocument,
  Message,
  User,
  deleteDocument,
  sendResizedImage
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Chat_group:
 *     properties:
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       members  :
 *         type: array
 *         items:
 *            type: object
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
 * /chat_group:
 *   get:
 *     tags:
 *       - Chat_group
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
    let result = await findDocuments(Chat_group)

    if (!result.data.length)
      return res.send(formatResult(404, 'Chat_group list is empty'))

    // chat_groups = await injectDetails(chat_groups)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/college/{id}:
 *   get:
 *     tags:
 *       - Chat_group
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
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let college = await findDocument(College, {
      _id: req.params.id
    })
    if (!college.data)
      return res.send(formatResult(404, 'college not found'))

    const result = await findDocuments(Chat_group, {
      college: req.params.id
    })

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/user/{id}:
 *   get:
 *     tags:
 *       - Chat_group
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
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let user = await findDocument(User, {
      _id: req.params.id
    })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    const result = await findDocuments(Chat_group, {
      members: {
        $elemMatch: {
          id: req.params.id,
          status: true
        }
      }
    })

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/{id}/profile/{file_name}:
 *   get:
 *     tags:
 *       - Chat_group
 *     description: Returns the profile_picture of a specified Chat_group
 *     parameters:
 *       - name: id
 *         description: Group's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: Groups's profile_picture filename
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
router.get('/:id/profile/:file_name', async (req, res) => {
  try {

    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if course exist
    const group = await findDocument(Chat_group, {
      _id: req.params.id
    })
    if (!group.data)
      return res.send(formatResult(404, 'group not found'))
console.log(group.data.profile)
    if (!group.data.profile || (group.data.profile != req.params.file_name))
      return res.send(formatResult(404, 'file not found'))

    path = `./uploads/colleges/${group.data.college}/chat/groups/${req.params.id}/${group.data.profile}`
    sendResizedImage(req, res, path)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group:
 *   post:
 *     tags:
 *       - Chat_group
 *     description: Send a chat_group
 *     parameters:
 *       - name: body
 *         description: Fields for a chat_group
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Chat_group'
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
    } = validate_chat_group(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let college = await findDocument(College, {
      _id: req.params.id
    })
    if (!college.data)
      return res.send(formatResult(404, 'college not found'))

    // check if name was not used
    let chat_group = await findDocument(Chat_group, {
      name: req.body.name
    })
    if (chat_group.data)
      return res.send(formatResult(403, 'name was taken'))

    for (const i in req.body.members) {
      let user = await findDocument(User, {
        _id: req.body.members[i].id
      })
      if (!user.data)
        return res.send(formatResult(400, `member ${parseInt(i) + 1} not found`))
    }

    let result = await createDocument(Chat_group, {
      name: req.body.name,
      description: req.body.description,
      private: req.body.private,
      members: req.body.members,
      college: req.body.college,
    })

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/{id}:
 *   put:
 *     tags:
 *       - Chat_group
 *     description: Update a chat_group
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Chat_group's Id
 *       - name: body
 *         description: Fields for a Chat_group
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Chat_group'
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

    error = validate_chat_group(req.body)
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if chat_group exist
    let chat_group = await findDocument(Chat_group, {
      _id: req.params.id
    })
    if (!chat_group.data)
      return res.send(formatResult(404, 'Chat_group not found'))

    // check if name was not used
    chat_group = await findDocument(Chat_group, {
      _id: {
        $ne: req.params.id
      },
      name: req.body.name
    })
    if (chat_group.data)
      return res.send(formatResult(403, 'name was taken'))

    const result = await updateDocument(Chat_group, req.params.id, req.body)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/{id}:
 *   delete:
 *     tags:
 *       - Chat_group
 *     description: Delete a chat_group
 *     parameters:
 *       - name: id
 *         description: Chat_group's id
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

    // check if chat_group exist
    let chat_group = await findDocument(Chat_group, {
      _id: req.params.id
    })
    if (!chat_group.data)
      return res.send(formatResult(404, 'Chat_group not found'))

    // check if the chat_group is never used
    let chat_group_used = false

    const message = await findDocument(Message, {
      "group": req.params.id
    })
    if (message.data)
      chat_group_used = true

    if (!chat_group_used) {

      const result = await deleteDocument(Chat_group, req.params.id)

      // make the design of the chat storage
      // const path = `./uploads/colleges/${chat_goup.data.college}/chat_groups/${req.params.id}`
      // fs.exists(path, (exists) => {
      //   if (exists) {
      //     fs.remove(path)
      //   }
      // })

      return res.send(result)
    }

    const updated_chat_group = await updateDocument(Chat_group, req.params.id, {
      status: 0
    })
    return res.send(formatResult(200, 'Chat_group couldn\'t be deleted because it was used, instead it was disabled', updated_chat_group.data))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
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

    // for (const k in chat_groups[i].members) {
    //   const member = await returnUser(chat_groups[i].members[k].id)
    //   chat_groups[i].members[k] = removeDocumentVersion(member)
    //   // add student profile media path
    //   if (chat_groups[i].members[k].profile) {
    //     chat_groups[i].members[k].profile = `http://${process.env.HOST}/kurious/file/studentProfile/${chat_groups[i]._id}/${student.profile}`
    //   }
    // }
    chat_groups[i].members = await injectUser(chat_groups[i].members, 'id', 'data')

  }
  return chat_groups
}

// export the router
module.exports = router