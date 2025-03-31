// import dependencies
const {
  express,
  bcrypt,
  fs,
  Student,
  College,
  validateStudent,
  validateUserLogin,
  hashPassword,
  auth,
  _superAdmin,
  defaulPassword,
  _admin,
  validateObjectId,
  _student,
  checkRequirements
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Student:
 *     properties:
 *       _id:
 *         type: string
 *       surName:
 *         type: string
 *       otherNames:
 *         type: string
 *       nationalId:
 *         type: number
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
 *       - surName
 *       - otherNames
 *       - nationalId
 *       - gender
 *       - phone
 *       - email
 *       - college
 */

/**
 * @swagger
 * /kurious/student:
 *   get:
 *     tags:
 *       - Student
 *     description: Get all Students
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', async (req, res) => {
  const students = await Student.find()
  try {
    if (students.length === 0)
      return res.status(404).send('Student list is empty')
    return res.status(200).send(students)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/student/college/{id}:
 *   get:
 *     tags:
 *       - Student
 *     description: Returns students in a specified college
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
  const students = await Student.find({
    college: req.params.id
  })
  try {
    if (students.length === 0)
      return res.status(404).send(`${college.name} student list is empty`)
    return res.status(200).send(students)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/student/{id}:
 *   get:
 *     tags:
 *       - Student
 *     description: Returns a specified student
 *     parameters:
 *       - name: id
 *         description: Student's id
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
  const {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  const student = await Student.findOne({
    _id: req.params.id
  })
  try {
    if (!student)
      return res.status(404).send(`Student ${req.params.id} Not Found`)
    return res.status(200).send(student)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/student:
 *   post:
 *     tags:
 *       - Student
 *     description: Create Student
 *     parameters:
 *       - name: body
 *         description: Fields for an Student
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Student'
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
  } = validateStudent(req.body)
  if (error)
    return res.status(400).send(error.details[0].message)

  const status = await checkRequirements('Student', req.body)
  if (status !== 'alright')
    return res.status(400).send(status)

  let newDocument = new Student({
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
  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.status(201).send(saveDocument)
  return res.status(500).send('New Student not Registered')
})

/**
 * @swagger
 * /kurious/student/login:
 *   post:
 *     tags:
 *       - Student
 *     description: Student login
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
  } = validateUserLogin(req.body)
  if (error)
    return res.status(400).send(error.details[0].message)

  // find student
  let student = await Student.findOne({
    email: req.body.email
  })
  if (!student)
    return res.status(400).send('Invalid Email or Password')

  // check if passed password is valid
  const validPassword = await bcrypt.compare(req.body.password, student.password)

  if (!validPassword)
    return res.status(400).send('Invalid Email or Password')
  // return token
  return res.status(200).send(student.generateAuthToken())
})

/**
 * @swagger
 * /kurious/student/{id}:
 *   put:
 *     tags:
 *       - Student
 *     description: Update Student
 *     parameters:
 *        - name: id
 *          in: path
 *          type: string
 *          description: Student's Id
 *        - name: body
 *          description: Fields for a Student
 *          in: body
 *          required: true
 *          schema:
 *            $ref: '#/definitions/Student'
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

  error = validateStudent(req.body)
  error = error.error
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if student exist
  let student = await Student.findOne({
    _id: req.params.id
  })
  if (!student)
    return res.status(404).send(`Student with code ${req.params.id} doens't exist`)

  if (req.body.password)
    req.body.password = await hashPassword(req.body.password)
  const updateDocument = await Student.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    new: true
  })
  if (updateDocument)
    return res.status(201).send(updateDocument)
  return res.status(500).send("Error ocurred")

})

/**
 * @swagger
 * /kurious/student/{id}:
 *   delete:
 *     tags:
 *       - Student
 *     description: Delete as Student
 *     parameters:
 *       - name: id
 *         description: Student's id
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
  let student = await Student.findOne({
    _id: req.params.id
  })
  if (!student)
    return res.status(404).send(`Student of Code ${req.params.id} Not Found`)
  let deleteDocument = await Student.findOneAndDelete({
    _id: req.params.id
  })
  if (!deleteDocument)
    return res.status(500).send('Student Not Deleted')
  if (student.profile) {
    fs.unlink(`./uploads/colleges/${student.college}/users/students/${student.profile}`, (err) => {
      if (err)
        return res.status(500).send(err)
    })
  }
  return res.status(200).send(`${student.surName} ${student.otherNames} was successfully deleted`)
})

// export the router
module.exports = router