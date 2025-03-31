// import dependencies
const { express, bcrypt, fs, Instructor, College, validateInstructor, validateUserLogin, hashPassword, auth, _superAdmin, defaulPassword, _admin, validateObjectId, checkRequirements } = require('../../utils/imports')

// create router
const router = express.Router()

// Get all admins
router.get('/', async (req, res) => {
    const admins = await Instructor.find()
    try {
        if (admins.length === 0)
            return res.status(404).send('Instructor list is empty')
        return res.status(200).send(admins)
    } catch (error) {
        return res.status(500).send(error)
    }
})

// Get all instructors in a specified college
router.get('/college/:id', async (req, res) => {
    const { error } = validateObjectId(req.params.id)
    if (error)
        return res.status(400).send(error.details[0].message)
    let college = await College.findOne({ _id: req.params.id })
    if (!college)
        return res.status(404).send(`College ${req.params.id} Not Found`)
    const instructors = await Instructor.find({ college: req.params.id })
    try {
        if (instructors.length === 0)
            return res.status(404).send(`${college.name} instructor list is empty`)
        return res.status(200).send(instructors)
    } catch (error) {
        return res.status(500).send(error)
    }
})

// Get specified instructor
router.get('/:id', async (req, res) => {
    const { error } = validateObjectId(req.params.id)
    if (error)
        return res.status(400).send(error.details[0].message)
    const instructor = await Instructor.findOne({ _id: req.params.id })
    try {
        if (!instructor)
            return res.status(404).send(`Instructor ${req.params.id} Not Found`)
        return res.status(200).send(instructor)
    } catch (error) {
        return res.status(500).send(error)
    }
})

// post an instructor
router.post('/', async (req, res) => {
    const { error } = validateInstructor(req.body)
    if (error)
        return res.status(400).send(error.details[0].message)

    const status = await checkRequirements('Instructor', req.body)
    if (status !== 'alright')
        return res.status(400).send(status)

    let newDocument = new Instructor({
        surName: req.body.surName,
        otherNames: req.body.otherNames,
        nationalId: req.body.nationalId,
        phone: req.body.phone,
        gender: req.body.gender,
        email: req.body.email,
        phone: req.body.phone,
        password: defaulPassword,
        college: req.body.college
    })

    newDocument.password = await hashPassword(newDocument.password)
    const saveDocument = await newDocument.save()
    if (saveDocument)
        return res.status(201).send(saveDocument)
    return res.status(500).send('New Instructor not Registered')
})

// instructor login
router.post('/login', async (req, res) => {
    const { error } = validateUserLogin(req.body)
    if (error)
        return res.status(400).send(error.details[0].message)

    // find instructor
    let instructor = await Instructor.findOne({ email: req.body.email })
    if (!instructor)
        return res.status(400).send('Invalid Email or Password')

    // check if passed password is valid
    const validPassword = await bcrypt.compare(req.body.password, instructor.password)
    if (!validPassword)
        return res.status(400).send('Invalid Email or Password')
    // return token
    return res.status(200).send(instructor.generateAuthToken())
})

// updated a instructor
router.put('/:id', async (req, res) => {
    let { error } = validateObjectId(req.params.id)
    if (error)
        return res.status(400).send(error.details[0].message)
    error = validateInstructor(req.body)
    error = error.error
    if (error)
        return res.status(400).send(error.details[0].message)

    // check if instructor exist
    let instructor = await Instructor.findOne({ _id: req.params.id })
    if (!instructor)
        return res.status(404).send(`Instructor with code ${req.params.id} doens't exist`)

    if (req.body.password)
        req.body.password = await hashPassword(req.body.password)
    const updateDocument = await Instructor.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
    if (updateDocument)
        return res.status(201).send(updateDocument)
    return res.status(500).send("Error ocurred")

})

// delete a instructor
router.delete('/:id', async (req, res) => {
    const { error } = validateObjectId(req.params.id)
    if (error)
        return res.status(400).send(error.details[0].message)
    let instructor = await Instructor.findOne({ _id: req.params.id })
    if (!instructor)
        return res.status(404).send(`Instructor of Code ${req.params.id} Not Found`)
    let deleteDocument = await Instructor.findOneAndDelete({ _id: req.params.id })
    if (!deleteDocument)
        return res.status(500).send('Instructor Not Deleted')
    if (instructor.profile) {
        fs.unlink(`./uploads/colleges/${instructor.college}/users/instructors/${instructor.profile}`, (err) => {
            if (err)
                return res.status(500).send(err)
        })
    }
    return res.status(200).send(`${instructor.surName} ${instructor.otherNames} was successfully deleted`)
})

// export the router
module.exports = router
