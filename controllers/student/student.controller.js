// import dependencies
const { express, bcrypt, fs, Student, College, validateStudent, validateUserLogin, hashPassword, auth, _superAdmin, defaulPassword, _admin, validateObjectId, _student, checkRequirements } = require('../../utils/imports')

// create router
const router = express.Router()


// Get all students
router.get('/', async (req, res) => {
  const students = await Student.find()
  try {
    if (students.length === 0)
      return res.send('Student list is empty').status(404)
    return res.send(students).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get all students in a specified college
router.get('/college/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let college = await College.findOne({ _id: req.params.id })
  if (!college)
    return res.send(`College ${req.params.id} Not Found`)
  const students = await Student.find({ college: req.params.id })
  try {
    if (students.length === 0)
      return res.send(`${college.name} student list is empty`).status(404)
    return res.send(students).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get specified student
router.get('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  const student = await Student.findOne({ _id: req.params.id })
  try {
    if (!student)
      return res.send(`Student ${req.params.id} Not Found`).status(404)
    return res.send(student).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// post an student
router.post('/', async (req, res) => {
  const { error } = validateStudent(req.body)
  if (error)
    return res.send(error.details[0].message).status(400)

  const status = await checkRequirements('Student', req.body)
  if (status !== 'alright')
    return res.send(status).status(400)

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
    return res.send(saveDocument).status(201)
  return res.send('New Student not Registered').status(500)
})

// student login
router.post('/login', async (req, res) => {
  const { error } = validateUserLogin(req.body)
  if (error)
    return res.send(error.details[0].message).status(400)

  // find student
  let student = await Student.findOne({ email: req.body.email })
  if (!student)
    return res.send('Invalid Email or Password').status(400)

  // check if passed password is valid
  const validPassword = await bcrypt.compare(req.body.password, student.password)

  if (!validPassword)
    return res.send('Invalid Email or Password').status(400)
  // return token
  return res.send(student.generateAuthToken()).status(200)
})

// updated a student
router.put('/:id', async (req, res) => {
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)

  error = validateStudent(req.body)
  error = error.error
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if student exist
  let student = await Student.findOne({ _id: req.params.id })
  if (!student)
    return res.send(`Student with code ${req.params.id} doens't exist`)

  if (req.body.password)
    req.body.password = await hashPassword(req.body.password)
  const updateDocument = await Student.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201)
  return res.send("Error ocurred").status(500)

})

// delete a student
router.delete('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let student = await Student.findOne({ _id: req.params.id })
  if (!student)
    return res.send(`Student of Code ${req.params.id} Not Found`)
  let deleteDocument = await Student.findOneAndDelete({ _id: req.params.id })
  if (!deleteDocument)
    return res.send('Student Not Deleted').status(500)
  if (student.profile) {
    fs.unlink(`./uploads/colleges/${student.college}/users/students/${student.profile}`, (err) => {
      if (err)
        return res.send(err).status(500)
    })
  }
  return res.send(`${student.surName} ${student.otherNames} was successfully deleted`).status(200)
})

// export the router
module.exports = router
