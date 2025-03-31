// import dependencies
const { compare, hash } = require('bcryptjs')
const { validateUserPasswordUpdate, validate_admin } = require('../../models/user/user.model')
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
  Chat_group,
  Quiz,
  date,
  auth,
  validate_chat_group_profile_udpate,
  savedecodedBase64Image,
  addStorageDirectoryToPath,
  countDocuments,
  MyEmitter
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
 *         type: string
 *         format: date
 *       gender:
 *         type: string
 *         enum: ['male', 'female']
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
* definitions:
*   UserLogin:
*     properties:
*       email_user_name_or_phone:
*         type: string
*       password:
*         type: string
*/

/**
 * @swagger
 * /user:
 *   get:
 *     tags:
 *       - User
 *     description: Get all Users
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
router.get('/', auth, async (req, res) => {
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
 * /user/statistics:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get User statistics
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
router.get('/statistics', auth, async (req, res) => {
  try {
    let total_users, total_students, total_instructors, total_staff;
    const student_category = await findDocument(User_category, { name: "STUDENT" })
    const instructor_category = await findDocument(User_category, { name: "INSTRUCTOR" })

    if (req.user.category.name == "SUPERADMIN") {
      total_users = await countDocuments(User)
      total_students = await countDocuments(User, { category: student_category._id })
      total_instructors = await countDocuments(User, { category: instructor_category._id })
      total_staff = await countDocuments(User, {
        $and: [
          {
            category: {
              $ne: student_category._id
            },
          },
          {
            category: {
              $ne: instructor_category._id
            },
          }
        ]
      })
    } else {
      total_users = await countDocuments(User, { college: req.user.college })
      total_students = await countDocuments(User, { college: req.user.college, category: student_category._id })
      total_instructors = await countDocuments(User, { college: req.user.college, category: instructor_category._id })
      total_staff = await countDocuments(User, {
        college: req.user.college, $and: [
          {
            category: {
              $ne: student_category._id
            },
          },
          {
            category: {
              $ne: instructor_category._id
            },
          }
        ]
      })
    }
    return res.send(formatResult(u, u, { total_users, total_students, total_instructors, total_staff }))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/statistics/user_joins:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get User statistics of how user joined
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: start_date
 *         description: The starting date
 *         in: query
 *         required: true
 *         type: string
 *       - name: end_date
 *         description: The ending date
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
router.get('/statistics/user_joins', auth, async (req, res) => {
  try {
    const {start_date, end_date} = req.query
    const result = await User.aggregate([
      { "$match": { createdAt: { $gt: date(start_date), $lte: date(end_date) } } },
      { "$match": { college: req.user.college } },
      {
        "$group": {
          "_id": {
            "$subtract": [
              "$createdAt",
              {
                "$mod": [
                  { "$subtract": ["$createdAt", date("1970-01-01T00:00:00.000Z")] },
                  1000 * 60 * 60 * 24
                ]
              }
            ]
          },
          "total_users": { "$sum": 1 }
        }
      },
      { "$sort": { "_id": 1 } }
    ])
    return res.send(formatResult(u, u, result))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/college/{id}/{category}:
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
 *       - name: category
 *         description: User category
 *         in: path
 *         required: true
 *         type: string
 *         enum: ['STUDENT','INSTRUCTOR', 'ALL']
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
router.get('/college/:id/:category', auth, async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    if (!['STUDENT', 'INSTRUCTOR', 'ALL'].includes(req.params.category))
      return res.send(formatResult(400, "Invalid category"))

    let user_category = await findDocument(User_category, {
      name: req.params.category
    })

    let users = await findDocuments(User, req.params.category == 'ALL' ? {
      college: req.user.college
    } : {
        college: req.user.college,
        category: user_category._id
      })

    users = await add_user_details(users)

    return res.send(formatResult(u, u, users))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/faculty/{id}/{category}:
 *   get:
 *     tags:
 *       - User
 *     description: Returns users in a specified faculty in your college depending on who you are
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Faculty's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: category
 *         description: User category
 *         in: path
 *         required: true
 *         type: string
 *         enum: ['STUDENT','INSTRUCTOR']
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/faculty/:id/:category', auth, async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    if (!['STUDENT', 'INSTRUCTOR'].includes(req.params.category))
      return res.send(formatResult(400, "Invalid category"))

    let faculty = await findDocument(Faculty, {
      _id: req.params.id
    })
    if (!faculty)
      return res.send(formatResult(404, 'Faculty Not Found'))

    let faculty_colleges = await findDocuments(Faculty_college, {
      faculty: req.params.id,
    })

    let user_category = await findDocument(User_category, {
      name: req.params.category
    })

    const result = []

    for (const i in faculty_colleges) {
      let faculty_college_years = await findDocuments(Faculty_college_year, {
        faculty_college: faculty_colleges[i]._id,
      })
      for (const k in faculty_college_years) {
        let user_faculty_college_years = await User_faculty_college_year.find({
          faculty_college_year: faculty_college_years[k]._id,
        }).populate('user')
        for (const j in user_faculty_college_years) {
          if (user_faculty_college_years[j].user.category == user_category._id)
            result.push(user_faculty_college_years[j].user)
        }
      }
    }

    users = await add_user_details(result)

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
router.get('/search', auth, async (req, res) => {
  try {

    let {
      data,
      error
    } = await Search(User, {
      email: {
        $ne: req.user.email
      },
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
 * /user/{user_name}:
 *   get:
 *     tags:
 *       - User
 *     description: Returns a specified user
 *     parameters:
 *       - name: user_name
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
router.get('/:user_name', async (req, res) => {
  try {
    let user = await findDocument(User, {
      user_name: req.params.user_name
    })

    if (!user)
      return res.send(formatResult(404, 'user not found'))

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

    let path = addStorageDirectoryToPath(user.college ? `./uploads/colleges/${user.college}/user_profiles/${user.profile}` : `./uploads/system/user_profiles/${user.profile}`)

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
      email: req.body.email
    })

    if (user) {
      return res.send(formatResult(400, `User with same email is arleady registered`))
    }

    // avoid user_name === group name
    let chat_group = await findDocument(Chat_group, {
      name: req.body.user_name
    })
    if (chat_group)
      return res.send(formatResult(403, 'user_name was taken'))

    let user_category = await findDocument(User_category, {
      name: req.body.category
    })
    if (!user_category)
      return res.send(formatResult(404, 'category not found'))

    let college

    if (user_category.name !== 'SUPER_ADMIN') {
      if (!req.body.college) {
        return res.send(formatResult(400, `${user_category.name.toLowerCase()} must have a college`))
      }

      college = await findDocument(College, {
        name: req.body.college
      })
      if (!college)
        return res.send(formatResult(404, `College ${req.body.college} Not Found`))

      if (user_category.name === 'ADMIN') {
        const find_admin = await findDocument(User, {
          category: user_category._id,
          college: college._id
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
      user_name: req.body.user_name,
      sur_name: req.body.sur_name,
      other_names: req.body.other_names,
      national_id: req.body.national_id,
      phone: req.body.phone,
      gender: req.body.gender,
      email: req.body.email,
      phone: req.body.phone,
      password: await hashPassword(req.body.password),
      college: college._id,
      category: user_category._id,
      date_of_birth: req.body.date_of_birth
    })

    // notify the admin that a new user joined
    MyEmitter.emit(`new_user_in_${college._id}`, result.data);

    // result = await add_user_details([result])
    // result = result[0]
    return res.status(201).send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/admin:
 *   post:
 *     tags:
 *       - User
 *     description: Create Admin
 *     parameters:
 *       - name: body
 *         description: Fields for an User
 *         in: body
 *         required: true
 *         schema:
 *           properties:
 *             sur_name:
 *               type: string
 *             other_names:
 *               type: string
 *             user_name:
 *               type: string
 *             gender:
 *               type: string
 *               enum: ['male', 'female']
 *             email:
 *               type: string
 *             password:
 *               type: string  
 *             college:
 *               type: string
 *             position:
 *               type: string
 *             maximum_users:
 *               type: number
 *     required:
 *       - sur_name
 *       - other_names
 *       - user_name
 *       - gender
 *       - password
 *       - email
 *       - college
 *       - position
 *       - maximum_users
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
router.post('/admin', async (req, res) => {
  try {
    const {
      error
    } = validate_admin(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if the name or email were not used
    let user = await findDocument(User, {
      email: req.body.email
    })

    if (user)
      return res.send(formatResult(400, `User with same email is arleady registered`))


    // avoid user_name === group name
    let chat_group = await findDocument(Chat_group, {
      name: req.body.user_name
    })
    if (chat_group)
      return res.send(formatResult(403, 'user_name was taken'))

    let user_category = await findDocument(User_category, {
      name: "ADMIN"
    })
    if (!user_category)
      return res.send(formatResult(404, 'ADMIN category not found'))

    // check if the name or email were not used
    let college = await findDocument(College, {
      name: req.body.college
    })
    if (college)
      return res.send(formatResult(403, `College with same name is arleady registered`))


    let saved_college = await createDocument(College, {
      name: req.body.college,
      maximum_users: req.body.maximum_users
    })

    console.log(saved_college)

    let result = await createDocument(User, {
      user_name: req.body.user_name,
      sur_name: req.body.sur_name,
      other_names: req.body.other_names,
      gender: req.body.gender,
      email: req.body.email,
      password: await hashPassword(req.body.password),
      college: saved_college.data._id,
      category: user_category._id
    })

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
 *         description: Fields for an User
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/UserLogin'
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
      user.profile = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/user/${user.user_name}/profile/${user.profile}`
    }

    // return token
    return res.send(formatResult(u, u, await generateAuthToken(user)))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user:
 *   put:
 *     tags:
 *       - User
 *     description: Update User
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *        - name: body
 *          description: Fields for a User
 *          in: body
 *          required: true
 *          schema:
 *            properties:
 *              sur_name:
 *                type: string
 *              other_names:
 *               type: string
 *              user_name:
 *                type: string
 *              national_id:
 *                type: string
 *              date_of_birth:
 *                type: string
 *                format: date
 *              gender:
 *                type: string
 *                enum: ['male', 'female']
 *              phone:
 *                type: string
 *              email:
 *                type: string
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
router.put('/', auth, async (req, res) => {
  try {
    const {
      error
    } = validate_user(req.body, 'update')
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if the name or email were not used
    const user = await findDocument(User, {
      _id: {
        $ne: req.user._id
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


    let result = await updateDocument(User, req.user._id, req.body)

    let user_category = await findDocument(User_category, {
      _id: result.data.category
    })
    result = simplifyObject(result)
    result.data.category = _.pick(user_category, 'name')

    return res.send(formatResult(200, 'UPDATED', await generateAuthToken(result.data)))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/password:
 *   put:
 *     tags:
 *       - User
 *     description: Update User password
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *        - name: body
 *          description: Fields for a User
 *          in: body
 *          required: true
 *          schema:
 *            properties:
 *              current_password:
 *                type: string
 *              new_password:
 *                type: string
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
router.put('/password', auth, async (req, res) => {
  try {

    const {
      error
    } = validateUserPasswordUpdate(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const validPassword = await compare(req.body.current_password, req.user.password);
    if (!validPassword) return res.send(formatResult(400, 'Invalid password'));

    const hashedPassword = await hashPassword(req.body.new_password);
    await updateDocument(User, req.user._id, {
      password: hashedPassword
    });
    return res.send(formatResult(201, "PASSWORD WAS UPDATED SUCESSFULLY"))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/profile:
 *   put:
 *     tags:
 *       - User
 *     description: Upload user profile
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for user profile upload (profile takes base64 encoded string)
 *         in: body
 *         required: true
 *         schema:
 *           properties:
 *             profile:
 *               type: string
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
router.put('/profile', auth, async (req, res) => {
  try {

    const { error } = validate_chat_group_profile_udpate(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const path = addStorageDirectoryToPath(req.user.college ? `./uploads/colleges/${req.user.college}/user_profiles` : `./uploads/system/user_profiles`)
    const { filename } = await savedecodedBase64Image(req.body.profile, path)

    if (req.user.profile) {
      fs.unlink(`${path}/${req.user.profile}`, (err) => {
        if (err)
          return res.send(formatResult(500, err))
      })
    }
    let result = await User.findByIdAndUpdate(req.user._id, {
      profile: filename
    })
    let user_category = await findDocument(User_category, {
      _id: req.user.category
    })
    result = simplifyObject(result)
    result.category = _.pick(user_category, 'name')
    result.profile = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/user/${req.user.user_name}/profile/${filename}`
    return res.send(formatResult(200, 'UPDATED', await generateAuthToken(result)))


  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user/profile/{file_name}:
 *   delete:
 *     tags:
 *       - User
 *     description: remove User profile
  *     security:
  *       - bearerAuth: -[]
 *     parameters:
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
router.delete('/profile/:file_name', auth, async (req, res) => {
  try {

    // check if user exist
    let user = await findDocument(User, {
      user_name: req.user.user_name
    }, u, false)
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    if (!user.profile || user.profile !== req.params.file_name)
      return res.send(formatResult(404, 'file not found'))

    const path = addStorageDirectoryToPath(user.college ? `./uploads/colleges/${user.college}/user_profiles/${user.profile}` : `./uploads/system/user_profiles/${user.profile}`)

    fs.unlink(path, (err) => {
      if (err)
        return res.send(formatResult(500, err))
    })
    user.profile = u
    user.gender = user.gender.toLowerCase()
    await user.save()
    let user_category = await findDocument(User_category, {
      _id: user.category
    })
    user = simplifyObject(user)
    user.category = _.pick(user_category, 'name')
    return res.send(formatResult(200, 'OK', await generateAuthToken(user)))
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
 *     security:
 *       - bearerAuth: -[]
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
router.delete('/:id', auth, async (req, res) => {
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
        const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/users/${user.profile}`)
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