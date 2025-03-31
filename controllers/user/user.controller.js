// import dependencies
const {
  express,
  User,
  User_category,
  College,
  u,
  User_faculty_college_year,
  fs,
  bcrypt,
  default_password,
  random_user_name,
  validate_user,
  formatResult,
  findDocument,
  findDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  hashPassword,
  validateObjectId,
  validateUserLogin,
  generateAuthToken,
  add_user_details,
  Search,
  Course,
  User_progress,
  Quiz_submission,
  sendResizedImage,
  simplifyObject,
  _,
  College_year,
  Faculty_college,
  Faculty,
  Faculty_college_year,
  upload_single_image,
  Compress_images,
  Chat_group,
  Quiz
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   User:
 *     properties:
 *       sur_name:
 *         type: string
 *       other_names:
 *         type: string
 *       user_name:
 *         type: string
 *       national_id:
 *         type: number
 *       date_of_birth:
 *         type: date
 *       gender:
 *         type: string
 *       phone:
 *         type: string
 *       email:
 *         type: string
 *       college:
 *         type: string
 *       category:
 *         type: string
 *       password:
 *         type: string
 *       status:
 *         type: object
 *         properties:
 *           stillMember:
 *             type: boolean
 *           active:
 *             type: boolean
 *       profile:
 *         type: string
 *     required:
 *       - sur_name
 *       - other_names
 *       - national_id
 *       - gender
 *       - phone
 *       - email
 *       - category
 */

/**
 * @swagger
 * /user:
 *   get:
 *     tags:
 *       - User
 *     description: Get all Users
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
    let users = await findDocuments(User)

    if (!users.length)
      return res.send(formatResult(404, 'User list is empty'))

    users = await add_user_details(users)

    return res.send(formatResult(u, u, users))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/college/{id}:
 *   get:
 *     tags:
 *       - User
 *     description: Returns users in a specified college
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
      return res.send(formatResult(404, `College ${req.params.id} Not Found`))

    let users = await findDocuments(User, {
      college: req.params.id
    })

    if (!users.length)
      return res.send(formatResult(404, `${college.name} user list is empty`))

    users = await add_user_details(users)

    return res.send(formatResult(u, u, users))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/search:
 *   post:
 *     tags:
 *       - User
 *     description: Search users
 *     parameters:
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
router.get('/search', async (req, res) => {
  try {
    // add college limit
    let {
      data,
      error
    } = await Search(User, {
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
 * /user/{id}:
 *   get:
 *     tags:
 *       - User
 *     description: Returns a specified user
 *     parameters:
 *       - name: id
 *         description: User's id
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
router.get('/:id', async (req, res) => {
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
      return res.send(formatResult(404, `User ${req.params.id} Not Found`))

    user = await add_user_details([user])
    user = user[0]

    return res.send(formatResult(u, u, user))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/{user_name}/profile/{file_name}:
 *   get:
 *     tags:
 *       - User
 *     description: Returns the profile of a specified user
 *     parameters:
 *       - name: user_name
 *         description: User name
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: File name
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
router.get('/:user_name/profile/:file_name', async (req, res) => {
  try {

    // check if college exist
    const user = await findDocument(User, {
      user_name: req.params.user_name
    })
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    if (!user.profile || (user.profile != req.params.file_name))
      return res.send(formatResult(404, 'file not found'))

    let path

    if (user.college) {
      path = `./uploads/colleges/${user.college}/user_profiles/${user.profile}`
    } else {
      path = `./uploads/system/user_profiles/${user.profile}`
    }

    sendResizedImage(req, res, path)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user:
 *   post:
 *     tags:
 *       - User
 *     description: Create User
 *     parameters:
 *       - name: body
 *         description: Fields for an User
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/User'
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
    } = validate_user(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if the name or email were not used
    let user = await findDocument(User, {
      $or: [{
        email: req.body.email
      }, {
        national_id: req.body.national_id
      }, {
        phone: req.body.phone
      }],
    })

    if (user) {
      const phoneFound = req.body.phone == user.phone
      const national_idFound = req.body.national_id == user.national_id
      const emailFound = req.body.email == user.email
      return res.send(formatResult(400, `User with ${phoneFound ? 'same phone ' : emailFound ? 'same email ' : national_idFound ? 'same national_id ' : ''} arleady exist`))
    }

    // avoid user_name === group name
    let chat_group = await findDocument(Chat_group, {
      name: req.body.user_name
    })
    if (chat_group)
      return res.send(formatResult(403, 'user_name was taken'))

    let user_category = await findDocument(User_category, {
      _id: req.body.category
    })
    if (!user_category)
      return res.send(formatResult(404, 'category not found'))

    if (user_category.name !== 'SUPER_ADMIN') {
      if (!req.body.college) {
        return res.send(formatResult(400, `${user_category.name.toLowerCase()} must have a college`))
      }

      let college = await findDocument(College, {
        _id: req.body.college
      })
      if (!college)
        return res.send(formatResult(404, `College with code ${req.body.college} Not Found`))

      if (user_category.name === 'ADMIN') {
        const find_admin = await findDocument(User, {
          _id: {
            $ne: req.params.id
          },
          category: user_category._id,
          college: req.body.college
        })

        if (find_admin)
          return res.send(formatResult(404, `College ${college.name} can't have more than one admin`))
      }
    } else {
      const find_super_admin = await findDocument(User, {
        category: req.body.category
      })

      if (find_super_admin)
        return res.send(formatResult(404, `System can't have more than one super_admin`))
    }

    let result = await createDocument(User, {
      user_name: await random_user_name(),
      sur_name: req.body.sur_name,
      other_names: req.body.other_names,
      national_id: req.body.national_id,
      phone: req.body.phone,
      gender: req.body.gender,
      email: req.body.email,
      phone: req.body.phone,
      password: await hashPassword(default_password),
      college: req.body.college,
      category: req.body.category,
      date_of_birth: req.body.date_of_birth
    })

    // result = await add_user_details([result])
    // result = result[0]
    return res.status(201).send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/login:
 *   post:
 *     tags:
 *       - User
 *     description: User login
 *     parameters:
 *       - name: body
 *         description: Login credentials
 *         in: body
 *         required: true
 *         schema:
 *           email:
 *             type: email
 *             required: true
 *           password:
 *             type: string
 *             required: true
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
router.post('/login', async (req, res) => {
  try {
    const {
      error
    } = validateUserLogin(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // find user
    let user = await findDocument(User, {
      $or: [{
        email: req.body.email_user_name_or_phone
      }, {
        user_name: req.body.email_user_name_or_phone
      }, {
        phone: req.body.email_user_name_or_phone
      }]
    })

    const erroMessage = 'invalid credentials'

    if (!user)
      return res.send(formatResult(400, erroMessage))

    // check if passed password is valid
    const validPassword = await bcrypt.compare(req.body.password, user.password)

    if (!validPassword)
      return res.send(formatResult(400, erroMessage))

    let user_category = await findDocument(User_category, {
      _id: user.category
    })
    user = simplifyObject(user)
    user.category = _.pick(user_category, 'name')
    if (user.profile) {
      user.profile = `http://${process.env.HOST}${process.env.BASE_PATH}/user/${user.user_name}/profile/${user.profile}`
    }

    // return token
    return res.send(formatResult(u, u, await generateAuthToken(user)))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     tags:
 *       - User
 *     description: Update User
 *     parameters:
 *        - name: id
 *          in: path
 *          type: string
 *          description: User's Id
 *        - name: body
 *          description: Fields for a User
 *          in: body
 *          required: true
 *          schema:
 *            $ref: '#/definitions/User'
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

    error = validate_user(req.body, 'update')
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if user exist
    let user = await findDocument(User, {
      _id: req.params.id
    })
    if (!user)
      return res.send(formatResult(400, `User with code ${req.params.id} doens't exist`))

    // check if the name or email were not used
    user = await findDocument(User, {
      _id: {
        $ne: req.params.id
      },
      $or: [{
        email: req.body.email
      }, {
        national_id: req.body.national_id
      }, {
        user_name: req.body.user_name
      }, {
        phone: req.body.phone
      }],
    })

    if (user) {
      const phoneFound = req.body.phone == user.phone
      const national_idFound = req.body.national_id == user.national_id
      const emailFound = req.body.email == user.email
      const user_nameFound = req.body.user_name == user.user_name
      return res.send(formatResult(403, `User with ${phoneFound ? 'same phone ' : emailFound ? 'same email ' : national_idFound ? 'same national_id ' : user_nameFound ? 'same user_name ' : ''} arleady exist`))
    }

    // avoid user_name === group name
    let chat_group = await findDocument(Chat_group, {
      name: req.body.user_name
    })
    if (chat_group)
      return res.send(formatResult(403, 'user_name was taken'))

    let user_category = await findDocument(User_category, {
      _id: req.body.category
    })
    if (!user_category)
      return res.send(formatResult(404, `User_category of Code ${req.body.category} Not Found`))

    if (req.body.password)
      req.body.password = await hashPassword(req.body.password)
    let result = await updateDocument(User, req.params.id, req.body)

    // result = await add_user_details([result])
    // result = result[0]
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/{id}/profile:
 *   put:
 *     tags:
 *       - User
 *     description: Upload user profile (file upload using swagger is still under construction)
 *     parameters:
 *       - name: id
 *         description: User id
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

    // check if user exist
    const user = await findDocument(User, {
      _id: req.params.id
    })
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    const path = user.college ? `./uploads/colleges/${user.college}/user_profiles` : `./uploads/system/user_profiles`
    const temp_path = user.college ? `./uploads/colleges/${user.college}/temp` : `./uploads/system/temp`
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

      if (user.profile && user.profile != req.file.filename) {
        fs.unlink(`${path}/${user.profile}`, (err) => {
          if (err)
            return res.send(formatResult(500, err))
        })
      }
      const result = await updateDocument(User, req.params.id, {
        profile: req.file.filename
      })
      result.data.profile = `http://${process.env.HOST}${process.env.BASE_PATH}/user/${user.user_name}/profile/${result.data.profile}`
      return res.send(result)
    })

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/{id}/profile/{file_name}:
 *   delete:
 *     tags:
 *       - User
 *     description: remove User profile
 *     parameters:
 *       - name: id
 *         description: Chapter id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: File name
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
router.delete('/:id/profile/:file_name', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if user exist
    const user = await findDocument(User, {
      _id: req.params.id
    }, u, false)
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    if (!user.profile || user.profile !== req.params.file_name)
      return res.send(formatResult(404, 'file not found'))

    const path = user.college ? `./uploads/colleges/${user.college}/user_profiles/${user.profile}` : `./uploads/system/user_profiles/${user.profile}`

    fs.unlink(path, (err) => {
      if (err)
        return res.send(formatResult(500, err))
    })
    user.profile = u
    await user.save()
    return res.send(formatResult(u, u, user))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     tags:
 *       - User
 *     description: Delete as User
 *     parameters:
 *       - name: id
 *         description: User's id
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
    let {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if user exist
    let user = await findDocument(User, {
      _id: req.params.id
    })
    if (!user)
      return res.send(formatResult(400, `User with code ${req.params.id} doens't exist`))

    // check if the user is never used
    let user_used = false

    const user_faculty_college_year = await findDocument(User_faculty_college_year, {
      user: req.params.id
    })
    if (user_faculty_college_year)
      user_used = true

    const course = await findDocument(Course, {
      user: req.params.id
    })
    if (course)
      user_used = true

    const quiz = await findDocument(Quiz, {
      user: req.params.id
    })
    if (quiz)
      user_used = true

    const progress = await findDocument(User_progress, {
      user: req.params.id
    })
    if (progress)
      user_used = true

    const submission = await findDocument(Quiz_submission, {
      user: req.params.id
    })
    if (submission)
      user_used = true

    if (!user_used) {

      const result = await deleteDocument(User, req.params.id)

      if (!user.profile) {
        // delete the profile
        const path = `./uploads/colleges/${user.college}/users/${user.profile}`
        fs.exists(path, (exists) => {
          if (exists)
            fs.unlink(path)
        })
      }
      return res.send(result)
    }

    const update_user = await updateDocument(User, req.params.id, {
      "status.disabled": 1
    })
    return res.send(formatResult(200, 'User couldn\'t be deleted because it was used, instead it was disabled', update_user.data))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// export the router
module.exports = router