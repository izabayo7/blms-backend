const {
  express,
  Chat_group,
  validate_chat_group,
  validateObjectId,
  returnUser,
  injectUser,
  findDocuments,
  formatResult,
  findDocument,
  createDocument,
  updateDocument,
  Message,
  User,
  College,
  deleteDocument,
  sendResizedImage,
  u,
  upload_single_image,
  Compress_images,
  fs,
  Create_or_update_message
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

    if (!result.length)
      return res.send(formatResult(404, 'Chat_group list is empty'))

    result = await injectDetails(result)

    return res.send(formatResult(u, u, result))
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
    if (!college)
      return res.send(formatResult(404, 'college not found'))

    const result = await findDocuments(Chat_group, {
      college: req.params.id
    })

    return res.send(formatResult(u, u, result))
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
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    const result = await findDocuments(Chat_group, {
      members: {
        $elemMatch: {
          id: req.params.id,
          status: true
        }
      }
    })

    return res.send(formatResult(u, u, result))
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
    if (!group)
      return res.send(formatResult(404, 'group not found'))
    console.log(group.profile)
    if (!group.profile || (group.profile != req.params.file_name))
      return res.send(formatResult(404, 'file not found'))

    path = `./uploads/colleges/${group.college}/chat/groups/${req.params.id}/${group.profile}`
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
 *         type: object
 *         properties:
 *           name:
 *             type: string
 *           description:
 *             type: string
 *           college:
 *             type: string
 *           members  :
 *             type: array
 *             items:
 *                type: object
 *                properties:
 *                  user_name:
 *                    type: string
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
      _id: req.body.college
    })
    if (!college)
      return res.send(formatResult(404, 'college not found'))

    // check if name was not used
    let chat_group = await findDocument(Chat_group, {
      name: req.body.name
    })
    if (chat_group)
      return res.send(formatResult(403, 'name was taken'))

    // avoid user_name === group name
    let user = await findDocument(User, {
      user_name: req.body.name
    })
    if (user)
      return res.send(formatResult(403, 'name was taken'))

    let members = []

    for (const i in req.body.members) {
      let user = await findDocument(User, {
        user_name: req.body.members[i].user_name
      })
      if (!user)
        return res.send(formatResult(404, `member ${parseInt(i) + 1} not found`))

      const dupplicate = req.body.members.filter(m => m.user_name == user.user_name)
      if (dupplicate.length > 1)
        return res.send(formatResult(403, `member ${parseInt(i) + 1} is dupplicated`))

      if (user.college != college._id)
        return res.send(formatResult(403, `member ${parseInt(i) + 1} can't join this group`))

      members.push({ id: user._id })
    }

    user = await findDocument(User, {
      user_name: req.user.user_name
    })
    if (!members.includes({ id: user._id }))
      members.push({ id: user._id })

    let result = await createDocument(Chat_group, {
      name: req.body.name,
      description: req.body.description,
      private: req.body.private,
      members: members,
      college: req.body.college,
    })

    await Create_or_update_message(`SYSTEM`, result.data.name, `This channel was created by __user__${user._id} at __time__${new Date().toISOString()}`)
    
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
 *         type: object
 *         properties:
 *           name:
 *             type: string
 *           description:
 *             type: string
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

    error = validate_chat_group(req.body, 'update')
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if chat_group exist
    let chat_group = await findDocument(Chat_group, {
      _id: req.params.id
    })
    if (!chat_group)
      return res.send(formatResult(404, 'Chat_group not found'))

    // check if name was not used
    chat_group = await findDocument(Chat_group, {
      _id: {
        $ne: req.params.id
      },
      name: req.body.name
    })
    if (chat_group)
      return res.send(formatResult(403, 'name was taken'))

    // avoid user_name === group name
    let user = await findDocument(User, {
      user_name: req.body.name
    })
    if (user)
      return res.send(formatResult(403, 'name was taken'))

    const result = await updateDocument(Chat_group, req.params.id, req.body)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/{id}/profile:
 *   put:
 *     tags:
 *       - Chat_group
 *     description: Upload chat_group profile (file upload using swagger is still under construction)
 *     parameters:
 *       - name: id
 *         description: Chat_group id
 *         in: path
 *         required: true
 *         type: string
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
router.put('/:id/profile', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if chat_group exist
    const chat_goup = await findDocument(Chat_group, {
      _id: req.params.id
    })
    if (!chat_goup)
      return res.send(formatResult(404, 'chat_group not found'))

    const path = `./uploads/colleges/${chat_goup.college}/chat/groups/${req.params.id}`
    const temp_path = `./uploads/colleges/${chat_goup.college}/temp`
    req.kuriousStorageData = {
      dir: temp_path,
    }
    upload_single_image(req, res, async (err) => {
      if (err)
        return res.send(formatResult(500, err.message))

      await Compress_images(temp_path, path)

      setTimeout(() => {
        fs.unlink(`${temp_path}/${req.file.filename}`, (err) => {
          if (err)
            return res.send(formatResult(500, err))
        })
      }, 1000);

      if (chat_goup.profile && chat_goup.profile != req.file.filename) {
        fs.unlink(`${path}/${chat_goup.profile}`, (err) => {
          if (err)
            return res.send(formatResult(500, err))
        })
      }
      const result = await updateDocument(Chat_group, req.params.id, {
        profile: req.file.filename
      })
      result.data.profile = `http://${process.env.HOST}${process.env.BASE_PATH}/chat_group/${req.params.id}/profile/${result.data.profile}`
      return res.send(result)
    })

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/{id}/add_members:
 *   put:
 *     tags:
 *       - Chat_group
 *     description: Add a group member
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Chat_group's Id
 *       - name: body
 *         description: Fields for a Chat_group
 *         in: body
 *         required: true
 *         type: object
 *         properties:
 *           members  :
 *             type: array
 *             items:
 *                type: object
 *                properties:
 *                  user_name:
 *                    type: string
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
router.put('/:id/add_members', async (req, res) => {
  try {
    let {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    error = validate_chat_group(req.body, 'add_members')
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if chat_group exist
    let chat_group = await findDocument(Chat_group, {
      _id: req.params.id
    }, u, false)
    if (!chat_group)
      return res.send(formatResult(404, 'chat_group not found'))

    for (const i in req.body.members) {
      let user = await findDocument(User, {
        user_name: req.body.members[i].user_name
      })
      if (!user)
        return res.send(formatResult(404, `member ${parseInt(i) + 1} not found`))

      const member_exit = chat_group.members.filter(m => m.id == user._id)
      if (member_exit.length)
        return res.send(formatResult(403, `member ${parseInt(i) + 1} is already registered`))

      const dupplicate = req.body.members.filter(m => m.user_name == user.user_name)
      if (dupplicate.length > 1)
        return res.send(formatResult(403, `member ${parseInt(i) + 1} is dupplicated`))

      if (user.college != chat_group.college)
        return res.send(formatResult(403, `member ${parseInt(i) + 1} can't join this group`))

      chat_group.members.push({ id: user._id })
    }

    const updateDocument = await chat_group.save()

    return res.send(formatResult(u, 'UPDATED', updateDocument))

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/{group_id}/toogle_isAdmin/{member_user_name}:
 *   put:
 *     tags:
 *       - Chat_group
 *     description: Remove a group member
 *     parameters:
 *       - name: group_id
 *         in: path
 *         type: string
 *         description: Chat_group's Id
 *       - name: member_user_name
 *         in: path
 *         type: string
 *         description: Member's user_name
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
router.put('/:group_id/toogle_isAdmin/:member_user_name', async (req, res) => {
  try {
    /** only admins can make members admins or the member him self can change from admin */
    let {
      error
    } = validateObjectId(req.params.group_id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if chat_group exist
    let chat_group = await findDocument(Chat_group, {
      _id: req.params.group_id
    }, u, false)
    if (!chat_group)
      return res.send(formatResult(404, 'chat_group not found'))

    let member_found = false

    let user = await findDocument(User, {
      user_name: req.params.member_user_name
    })
    if (!user)
      return res.send(formatResult(404, 'member not found'))

    for (const i in chat_group.members) {
      if (chat_group.members[i].id == user._id) {
        member_found = true
        chat_group.members[i].isAdmin = !chat_group.members[i].isAdmin
      }
    }

    if (!member_found)
      return res.send(formatResult(403, 'member not found'))

    const updateDocument = await chat_group.save()

    return res.send(formatResult(u, 'UPDATED', updateDocument))

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/{group_id}/remove_member/{member_user_name}:
 *   put:
 *     tags:
 *       - Chat_group
 *     description: Remove a group member
 *     parameters:
 *       - name: group_id
 *         in: path
 *         type: string
 *         description: Chat_group's Id
 *       - name: member_user_name
 *         in: path
 *         type: string
 *         description: Member's user_name
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
router.put('/:group_id/remove_member/:member_user_name', async (req, res) => {
  try {
    let {
      error
    } = validateObjectId(req.params.group_id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if chat_group exist
    let chat_group = await findDocument(Chat_group, {
      _id: req.params.group_id
    }, u, false)
    if (!chat_group)
      return res.send(formatResult(404, 'chat_group not found'))

    let user = await findDocument(User, {
      user_name: req.params.member_user_name
    })
    if (!user)
      return res.send(formatResult(404, 'member not found'))

    const member_exit = chat_group.members.filter(m => m.id == user._id)
    if (!member_exit.length)
      return res.send(formatResult(403, 'member not found'))

    const index = chat_group.members.indexOf(member_exit[0])

    chat_group.members.splice(index, 1)

    const updateDocument = await chat_group.save()

    return res.send(formatResult(u, 'UPDATED', updateDocument))

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
    if (!chat_group)
      return res.send(formatResult(404, 'Chat_group not found'))

    // check if the chat_group is never used
    let chat_group_used = false

    const message = await findDocument(Message, {
      "group": req.params.id
    })
    if (message)
      chat_group_used = true

    if (!chat_group_used) {

      const result = await deleteDocument(Chat_group, req.params.id)

      // make the design of the chat storage
      // const path = `./uploads/colleges/${chat_goup.college}/chat_groups/${req.params.id}`
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
    return res.send(formatResult(200, 'Chat_group couldn\'t be deleted because it was used, instead it was disabled', updated_chat_group))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// add missing Information
async function injectDetails(chat_groups) {
  for (const i in chat_groups) {

    const college = await findDocument(College, {
      _id: chat_groups[i].college
    }, {
      _v: 0
    })
    chat_groups[i].college = college
    if (college.logo) {
      chat_groups[i].college.logo = `http://${process.env.HOST}${process.env.BASE_PATH}/college/${college.name}/logo/${college.logo}`
    }
    chat_groups[i].members = await injectUser(chat_groups[i].members, 'id', 'data')
  }
  return chat_groups
}

// export the router
module.exports = router