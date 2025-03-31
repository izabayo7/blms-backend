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
  Search,

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
    let result = await findDocuments(User)

    if (result.data.length === 0)
      return res.send(formatResult(404, 'User list is empty'))

    // result.data = await injectDetails([result.data])
    // result.data = result.data[0]

    return res.send(result)
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
    if (!college.data)
      return res.send(formatResult(404, `College ${req.params.id} Not Found`))

    let result = await findDocuments(User, {
      college: req.params.id
    })

    if (result.data.length === 0)
      return res.send(formatResult(404, `${college.data.name} user list is empty`))

    // result.data = await injectDetails([result.data])
    // result.data = result.data[0]

    return res.send(result)
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
    let result = await findDocument(User, {
      _id: req.params.id
    })

    if (!result.data)
      return res.send(formatResult(404, `User ${req.params.id} Not Found`))

    // result.data = await injectDetails([result.data])
    // result.data = result.data[0]

    return res.send(result)
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
 *       - name: query
 *         description: the search query
 *         in: body
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
router.post('/search', async (req, res) => {
  try {
    const {
      data,
      error
    } = await Search(User, {
      $or: [{
        sur_name: {
          $regex: req.body.query,
          $options: '$i'
        }
      }, {
        other_names: {
          $regex: req.body.query,
          $options: '$i'
        }
      }, {
        user_name: {
          $regex: req.body.query,
          $options: '$i'
        }
      }, {
        email: {
          $regex: req.body.query,
          $options: '$i'
        }
      }]
    }, {
      sur_name: 1,
      other_names: 1,
      user_name: 1,
      profile: 1,
      email: 1
    }, req.query.page, req.query.limit)

    if (error)
      return res.send(formatResult(400, error))

    res.send(formatResult(u, u, data))
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

    if (user.data) {
      const phoneFound = req.body.phone == user.data.phone
      const national_idFound = req.body.national_id == user.data.national_id
      const emailFound = req.body.email == user.data.email
      return res.send(formatResult(400, `User with ${phoneFound ? 'same phone ' : emailFound ? 'same email ' : national_idFound ? 'same national_id ' : ''} arleady exist`))
    }

    let user_category = await findDocument(User_category, {
      _id: req.body.category
    })
    if (!user_category.data)
      return res.send(formatResult(404, `User_category of Code ${req.body.category} Not Found`))

    if (req.body.college) {
      let college = await findDocument(College, {
        _id: req.body.college
      })
      if (!college.data)
        return res.send(formatResult(404, `College with code ${req.body.college} Not Found`))
    }
    let result = await createDocument(User, {
      user_name: random_user_name,
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

    // result.data = await injectDetails([result.data])
    // result.data = result.data[0]
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

    const erroMessage = 'Invalid email, user_name, phone or password'

    if (!user.data)
      return res.send(formatResult(400, erroMessage))

    // check if passed password is valid
    const validPassword = await bcrypt.compare(req.body.password, user.data.password)

    if (!validPassword)
      return res.send(formatResult(400, erroMessage))
    // return token
    return res.send(formatResult(u, u, await generateAuthToken(user.data)))
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
    if (!user.data)
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

    if (user.data) {
      const phoneFound = req.body.phone == user.data.phone
      const national_idFound = req.body.national_id == user.data.national_id
      const emailFound = req.body.email == user.data.email
      const user_nameFound = req.body.user_name == user.data.user_name
      return res.send(formatResult(400, `User with ${phoneFound ? 'same phone ' : emailFound ? 'same email ' : national_idFound ? 'same national_id ' : user_nameFound ? 'same user_name ' : ''} arleady exist`))
    }

    let user_category = await findDocument(User_category, {
      _id: req.body.category
    })
    if (!user_category.data)
      return res.send(formatResult(404, `User_category of Code ${req.body.category} Not Found`))

    if (req.body.college) {
      let college = await findDocument(College, {
        _id: req.body.college
      })
      if (!college.data)
        return res.send(formatResult(404, `College with code ${req.body.college} Not Found`))
    }

    if (req.body.password)
      req.body.password = await hashPassword(req.body.password)
    let result = await updateDocument(User, req.params.id, req.body)

    // result.data = await injectDetails([result.data])
    // result.data = result.data[0]
    return res.send(result)
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
    if (!user.data)
      return res.send(formatResult(400, `User with code ${req.params.id} doens't exist`))

    // check if the user is never used
    const user_found = await findDocument(User_faculty_college_year, {
      user: req.params.id
    })
    if (!user_found.data) {

      const result = await deleteDocument(User, req.params.id)

      if (!user.data.profile) {
        // delete the profile
        const path = `./uploads/colleges/${user.data.college}/users/${user.data.profile}`
        fs.exists(path, (exists) => {
          if (exists)
            fs.unlink(path, {
              recursive: true
            })
        })
      }
      return res.send(result)
    }

    const update_user = await updateDocument(User, req.params.id, {
      "status.stillMember": false
    })
    return res.send(formatResult(200, `User ${update_user.data.user_name} couldn't be deleted because it was used, instead it was disabled`))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// link the user with his/her current college
async function injectDetails(users) {
  for (const i in users) {
    const userFacultyCollegeYear = await UserFacultyCollegeYear.findOne({
      user: users[i]._id,
      status: 1
    }).lean()
    users[i].userFacultyCollegeYear = removeDocumentVersion(userFacultyCollegeYear)

    const facultyCollegeYear = await FacultyCollegeYear.findOne({
      _id: userFacultyCollegeYear.facultyCollegeYear
    }).lean()
    users[i].userFacultyCollegeYear.facultyCollegeYear = removeDocumentVersion(facultyCollegeYear)

    const collegeYear = await CollegeYear.findOne({
      _id: facultyCollegeYear.collegeYear
    }).lean()
    users[i].userFacultyCollegeYear.facultyCollegeYear.collegeYear = removeDocumentVersion(collegeYear)

    const facultyCollege = await FacultyCollege.findOne({
      _id: facultyCollegeYear.facultyCollege
    }).lean()
    users[i].userFacultyCollegeYear.facultyCollegeYear.facultyCollege = removeDocumentVersion(facultyCollege)

    const faculty = await Faculty.findOne({
      _id: facultyCollege.faculty
    }).lean()
    users[i].userFacultyCollegeYear.facultyCollegeYear.facultyCollege.faculty = removeDocumentVersion(faculty)

    const college = await College.findOne({
      _id: facultyCollege.college
    }).lean()
    users[i].userFacultyCollegeYear.facultyCollegeYear.facultyCollege.college = removeDocumentVersion(college)
    if (users[i].userFacultyCollegeYear.facultyCollegeYear.facultyCollege.college.logo) {
      users[i].userFacultyCollegeYear.facultyCollegeYear.facultyCollege.college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}`
    }
    // add user profile media path
    if (users[i].profile) {
      users[i] = `http://${process.env.HOST}/kurious/file/userProfile/${users[i]._id}/${user.profile}`
    }
  }
  return users
}

// export the router
module.exports = router