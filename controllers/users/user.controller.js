// import dependencies
const {
  express,
  User,
  validate_user,
  formatResult
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
 *       roles  :
 *         type: array
 *         items:
 *            type: object
 *            properties:
 *              id:
 *                type: string
 *              status:
 *                type: number
 *                default: 1
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
 *       - roles
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
    let users = await User.find().lean()

    if (users.length === 0)
      return res.send(formatResult(404, 'User list is empty'))

    users = await injectDetails(users)

    return res.send(users)
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
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
      return res.status(400).send(error.details[0].message)
    let college = await College.findOne({
      _id: req.params.id
    })
    if (!college)
      return res.status(404).send(`College ${req.params.id} Not Found`)
    let users = await User.find({
      college: req.params.id
    }).lean()

    if (users.length === 0)
      return res.status(404).send(`${college.name} user list is empty`)
    users = await injectDetails(users)
    return res.send(users)
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
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
      return res.status(400).send(error.details[0].message)
    let user = await User.findOne({
      _id: req.params.id
    }).lean()

    if (!user)
      return res.status(404).send(`User ${req.params.id} Not Found`)
    user = await injectDetails([user])
    return res.send(user[0])
  } catch (error) {
    return res.status(500).send(error)
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
  const {
    error
  } = validate_user(req.body)
  if (error)
    return res.status(400).send(error.details[0].message)

  const status = await checkRequirements('User', req.body)
  if (status !== 'alright')
    return res.status(400).send(status)

  let newDocument = new User({
    surName: req.body.surName,
    otherNames: req.body.otherNames,
    nationalId: req.body.nationalId,
    phone: req.body.phone,
    gender: req.body.gender,
    email: req.body.email,
    phone: req.body.phone,
    password: defaulPassword,
    college: req.body.college,
    DOB: req.body.DOB
  })

  newDocument.password = await hashPassword(newDocument.password)
  let saveDocument = await newDocument.save()
  if (saveDocument)
    return res.status(201).send(saveDocument)
  return res.status(500).send('New User not Registered')
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
  const {
    error
  } = validate_userLogin(req.body)
  if (error)
    return res.status(400).send(error.details[0].message)

  // find user
  let user = await User.findOne({
    email: req.body.email
  })
  if (!user)
    return res.status(400).send('Invalid Email or Password')

  // check if passed password is valid
  const validPassword = await bcrypt.compare(req.body.password, user.password)

  if (!validPassword)
    return res.status(400).send('Invalid Email or Password')
  // return token
  return res.send(user.generateAuthToken())
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
  let {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)

  error = validate_user(req.body)
  error = error.error
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if user exist
  let user = await User.findOne({
    _id: req.params.id
  })
  if (!user)
    return res.status(404).send(`User with code ${req.params.id} doens't exist`)

  if (req.body.password)
    req.body.password = await hashPassword(req.body.password)
  let updateDocument = await User.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    new: true
  })
  if (updateDocument) {
    updateDocument = await injectDetails([updateDocument])
    return res.status(201).send(updateDocument[0])
  }
  return res.status(500).send("Error ocurred")

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
  const {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  let user = await User.findOne({
    _id: req.params.id
  })
  if (!user)
    return res.status(404).send(`User of Code ${req.params.id} Not Found`)
  let deleteDocument = await User.findOneAndDelete({
    _id: req.params.id
  })
  if (!deleteDocument)
    return res.status(500).send('User Not Deleted')
  if (user.profile) {
    fs.unlink(`./uploads/colleges/${user.college}/users/users/${user.profile}`, (err) => {
      if (err)
        return res.status(500).send(err)
    })
  }
  return res.send(`${user.surName} ${user.otherNames} was successfully deleted`)
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