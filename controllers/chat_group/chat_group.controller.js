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
  add_user_details,
  Message,
  User,
  College,
  deleteDocument,
  sendResizedImage,
  u,
  upload_single_image,
  Compress_images,
  fs,
  Create_or_update_message,
  Search,
  simplifyObject,
  generateGroupCode
} = require('../../utils/imports')

// create router
const router = express.Router()

// add college validations cz user is logged in

/**
 * @swagger
 * definitions:
 *   Chat_group:
 *     properties:
 *       code:
 *         type: number
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
 * /chat_group/college/{name}:
 *   get:
 *     tags:
 *       - Chat_group
 *     description: Returns chat_groups in a specified college
 *     parameters:
 *       - name: name
 *         description: College's name
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
router.get('/college/:name', async (req, res) => {
  try {
    let college = await findDocument(College, {
      name: req.params.name
    })
    if (!college)
      return res.send(formatResult(404, 'college not found'))

    const result = await findDocuments(Chat_group, {
      college: college._id
    })

    return res.send(formatResult(u, u, result))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/user/{user_name}:
 *   get:
 *     tags:
 *       - Chat_group
 *     description: Returns chat_groups a specified user belongs in
 *     parameters:
 *       - name: user_name
 *         description: Users's user_name
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
router.get('/user/:user_name', async (req, res) => {
  try {
    let user = await findDocument(User, {
      user_name: req.params.user_name
    })
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    const result = await findDocuments(Chat_group, {
      members: {
        $elemMatch: {
          id: user._id,
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
 * /chat_group/{code}/profile/{file_name}:
 *   get:
 *     tags:
 *       - Chat_group
 *     description: Returns the profile_picture of a specified Chat_group
 *     parameters:
 *       - name: code
 *         description: Group's code
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
router.get('/:code/profile/:file_name', async (req, res) => {
  try {
    // check if course exist
    const group = await findDocument(Chat_group, {
      code: req.params.code
    })
    if (!group)
      return res.send(formatResult(404, 'group not found'))

    if (!group.profile || (group.profile != req.params.file_name))
      return res.send(formatResult(404, 'file not found'))

    path = `./uploads/colleges/${group.college}/chat/groups/${group._id}/${group.profile}`
    sendResizedImage(req, res, path)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/{code}/search_members:
 *   post:
 *     tags:
 *       - Chat_group
 *     description: Search users
 *     parameters:
 *       - name: code
 *         description: Group's code
 *         in: path
 *         required: true
 *         type: string
 *       - name: data
 *         description: search value
 *         in: query
 *         type: string
 *         required: true
 *       - name: page
 *         description: page number
 *         in: query
 *         required: true
 *         type: string
 *       - name: limit
 *         description: limit number
 *         in: query
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
router.get('/:code/search_members', async (req, res) => {
  try {
    const group = await findDocument(Chat_group, {
      code: req.params.code
    })
    if (!group)
      return res.send(formatResult(404, 'group not found'))

    let member_ids = []

    for (const i in group.members) {
      member_ids.push(group.members[i].id)
    }

    let {
      data,
      error
    } = await Search(User, {
      _id: { $nin: member_ids },
      college: req.user.college,
      $or: [{
        sur_name: {
          $regex: req.query.data,
          $options: '$i'
        }
      }, {
        other_names: {
          $regex: req.query.data,
          $options: '$i'
        }
      }, {
        user_name: {
          $regex: req.query.data,
          $options: '$i'
        }
      }, {
        email: {
          $regex: req.query.data,
          $options: '$i'
        }
      }]
    }, {
      phone: 0,
      national_id: 0,
      _id: 0,
      password: 0,
      createdAt: 0,
      updatedAt: 0,
      status: 0
    }, req.query.page, req.query.limit)

    if (error)
      return res.send(formatResult(400, error))

    data = simplifyObject(data)

    data.results = await add_user_details(data.results)

    res.send(formatResult(u, u, data))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/{code}:
 *   get:
 *     tags:
 *       - Chat_group
 *     description: Get all chat_groups
 *     params:
 *       - name: code
 *         description: Chat_group's id
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
router.get('/:code', async (req, res) => {
  try {
    let result = await findDocument(Chat_group, { code: req.params.code })

    if (!result)
      return res.send(formatResult(404, 'Chat_group not found'))

    result = await injectDetails([result])
    result = result[0]

    return res.send(formatResult(u, u, result))
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

    // check if name was not used in the same college
    const chat_group = await findDocument(Chat_group, {
      name: req.body.name,
      college: req.body.college
    })
    if (chat_group)
      return res.send(formatResult(403, 'name was taken'))

    const creator = await findDocument(User, {
      user_name: req.user.user_name
    })

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

      members.push({ id: user._id, isAdmin: user._id === creator._id })
    }

    if (!members.includes({ id: req.user._id, isAdmin: true }))
      members.push({ id: req.user._id, isAdmin: true })

    let result = await createDocument(Chat_group, {
      name: req.body.name,
      code: await generateGroupCode(),
      description: req.body.description,
      private: req.body.private,
      members: members,
      college: req.body.college,
    })
    // ndanareba uko nahita menyesha abantu thinking about exporting socket for global usage
    await Create_or_update_message('SYSTEM', result.data.name, `This channel was created by __user__${user._id} at __time__${new Date().toISOString()}`, u, user._id)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/{code}:
 *   put:
 *     tags:
 *       - Chat_group
 *     description: Update a chat_group
 *     parameters:
 *       - name: code
 *         in: path
 *         type: string
 *         description: Chat_group's code
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
router.put('/:code', async (req, res) => {
  try {
    let { error } = validate_chat_group(req.body, 'update')
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if chat_group exist
    const chat_group = await findDocument(Chat_group, {
      code: req.params.code
    })
    if (!chat_group)
      return res.send(formatResult(404, 'Chat_group not found'))

    // check if name was not used
    const _chat_group = await findDocument(Chat_group, {
      _id: {
        $ne: chat_group._id
      },
      name: req.body.name,
      college: chat_group.college
    })
    if (_chat_group)
      return res.send(formatResult(403, 'name was taken'))

    const result = await updateDocument(Chat_group, chat_group._id, req.body)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/{code}/profile:
 *   put:
 *     tags:
 *       - Chat_group
 *     description: Upload chat_group profile (file upload using swagger is still under construction)
 *     parameters:
 *       - name: code
 *         description: Chat_group code
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
router.put('/:code/profile', async (req, res) => {
  try {
    // check if chat_group exist
    const chat_group = await findDocument(Chat_group, {
      code: req.params.code
    })
    if (!chat_group)
      return res.send(formatResult(404, 'chat_group not found'))

    const path = `./uploads/colleges/${chat_group.college}/chat/groups/${chat_group._id}`
    const temp_path = `./uploads/colleges/${chat_group.college}/temp`
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

      if (chat_group.profile && chat_group.profile != req.file.filename) {
        fs.unlink(`${path}/${chat_group.profile}`, (err) => {
          if (err)
            return res.send(formatResult(500, err))
        })
      }
      const result = await updateDocument(Chat_group, chat_group._id, {
        profile: req.file.filename
      })
      result.data.profile = `http://${process.env.HOST}${process.env.BASE_PATH}/chat_group/${chat_group.code}/profile/${result.data.profile}`
      return res.send(result)
    })

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chat_group/{code}/add_members:
 *   put:
 *     tags:
 *       - Chat_group
 *     description: Add a group member
 *     parameters:
 *       - name: code
 *         in: path
 *         type: string
 *         description: Chat_group's code
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
router.put('/:code/add_members', async (req, res) => {
  try {
    error = validate_chat_group(req.body, 'add_members')
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if chat_group exist
    let chat_group = await findDocument(Chat_group, {
      code: req.params.code
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
 * /chat_group/{code}/toogle_isAdmin/{member_user_name}:
 *   put:
 *     tags:
 *       - Chat_group
 *     description: Remove a group member
 *     parameters:
 *       - name: code
 *         in: path
 *         type: string
 *         description: Chat_group's code
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
router.put('/:code/toogle_isAdmin/:member_user_name', async (req, res) => {
  try {
    /** only admins can make members admins or the member him self can change from admin */

    // check if chat_group exist
    let chat_group = await findDocument(Chat_group, {
      code: req.params.code
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
 * /chat_group/{code}/remove_member/{member_user_name}:
 *   put:
 *     tags:
 *       - Chat_group
 *     description: Remove a group member
 *     parameters:
 *       - name: code
 *         in: path
 *         type: string
 *         description: Chat_group's code
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
router.put('/:code/remove_member/:member_user_name', async (req, res) => {
  try {
    // check if chat_group exist
    let chat_group = await findDocument(Chat_group, {
      code: req.params.code
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
 * /chat_group/{code}:
 *   delete:
 *     tags:
 *       - Chat_group
 *     description: Delete a chat_group
 *     parameters:
 *       - name: code
 *         description: Chat_group's code
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
router.delete('/:code', async (req, res) => {
  try {
    // check if chat_group exist
    let chat_group = await findDocument(Chat_group, {
      _id: req.params.code
    })
    if (!chat_group)
      return res.send(formatResult(404, 'Chat_group not found'))

    // check if the chat_group is never used
    let chat_group_used = false

    const message = await findDocument(Message, {
      "group": chat_group._id
    })
    if (message)
      chat_group_used = true

    if (!chat_group_used) {

      const result = await deleteDocument(Chat_group, chat_group._id)

      // make the design of the chat storage
      const path = `./uploads/colleges/${chat_group.college}/chat/groups/${chat_group._id}`
      fs.exists(path, (exists) => {
        if (exists) {
          fs.remove(path)
        }
      })

      return res.send(result)
    }

    const updated_chat_group = await updateDocument(Chat_group, chat_group._id, {
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
    if (chat_groups[i].profile) {
      chat_groups[i].profile = `http://${process.env.HOST}${process.env.BASE_PATH}/chat_group/${chat_groups[i].college}/profile/${chat_groups[i].profile}`
    }
  }
  return chat_groups
}

// export the router
module.exports = router