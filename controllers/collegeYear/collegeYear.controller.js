// import dependencies
const { express, bcrypt, multer, fs, CollegeYear, College, validateCollegeYear, validateUserLogin, hashPassword, normaliseDate, fileFilter, auth, _superCollegeYear, defaulPassword, _admin, validateObjectId, _student, checkRequirements } = require('../../utils/imports')

// create router
const router = express.Router()

// Get all collegeYears
router.get('/', async (req, res) => {
  const collegeYears = await CollegeYear.find()
  try {
    if (collegeYears.length === 0)
      return res.send('CollegeYear list is empty').status(404)
    return res.send(collegeYears).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get all collegeYears in a specified college
router.get('/college/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let college = await College.findOne({ _id: req.params.id })
  if (!college)
    return res.send(`College ${req.params.id} Not Found`)
  const collegeYears = await CollegeYear.find({ college: req.params.id })
  try {
    if (collegeYears.length === 0)
      return res.send(`${college.name} collegeYear list is empty`).status(404)
    return res.send(collegeYears).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get all collegeYears in a specified college
router.get('/instructor/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let college = await College.findOne({ _id: req.params.id })
  if (!college)
    return res.send(`College ${req.params.id} Not Found`)
  const collegeYears = await CollegeYear.find({ college: req.params.id })
  try {
    if (collegeYears.length === 0)
      return res.send(`${college.name} collegeYear list is empty`).status(404)
    return res.send(collegeYears).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get specified collegeYear
router.get('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  const collegeYear = await CollegeYear.findOne({ _id: req.params.id })
  try {
    if (!collegeYear)
      return res.send(`CollegeYear ${req.params.id} Not Found`).status(404)
    return res.send(collegeYear).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// post an collegeYear
router.post('/', async (req, res) => {
  const { error } = validateCollegeYear(req.body)
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if collegeYear exist
  let collegeYear = await CollegeYear.findOne({ digit: req.body.digit })
  if (collegeYear)
    return res.send(`CollegeYear ${req.body.digit} arleady exist`)

  let newDocument = new CollegeYear({
    digit: req.body.digit
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.send(saveDocument).status(201)
  return res.send('New CollegeYear not Registered').status(500)
})

// delete a collegeYear
router.delete('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)

  let collegeYear = await CollegeYear.findOne({ _id: req.params.id })
  if (!collegeYear)
    return res.send(`CollegeYear of Code ${req.params.id} Not Found`)
    
  let deletedCollegeYear = await CollegeYear.findOneAndDelete({ _id: req.params.id })
  if (!deletedCollegeYear)
    return res.send('CollegeYear Not Deleted').status(500)
  return res.send(`CollegeYear ${deletedCollegeYear._id} Successfully deleted`).status(200)
})

// export the router
module.exports = router
