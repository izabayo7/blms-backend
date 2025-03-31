// import dependencies
const { express, bcrypt, multer, fs, Instructor, College, validateInstructor, validateUserLogin, hashPassword, normaliseDate, fileFilter, auth, _superAdmin, defaulPassword, _admin, validateObjectId, checkRequirements } = require('../../utils/imports')

// create router
const router = express.Router()

// configure multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profiles/instructor')
    },
    filename: function (req, file, cb) {
        const fileName = normaliseDate(new Date().toISOString()) + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]
        cb(null, fileName)
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
})


// Get all admins
router.get('/', async (req, res) => {
    const admins = await Instructor.find()
    try {
        if (admins.length === 0)
            return res.send('Instructor list is empty').status(404)
        return res.send(admins).status(200)
    } catch (error) {
        return res.send(error).status(500)
    }
})

// Get all instructors in a specified college
router.get('/college/:id', async (req, res) => {
    const { error } = validateObjectId(req.params.id)
    if (error)
        return res.send(error.details[0].message).status(400)
    let college = await College.findOne({ _id: req.params.id })
    if (!college)
        return res.send(`College ${req.params.id} Not Found`)
    const instructors = await Instructor.find({ college: req.params.id })
    try {
        if (instructors.length === 0)
            return res.send(`${college.name} instructor list is empty`).status(404)
        return res.send(instructors).status(200)
    } catch (error) {
        return res.send(error).status(500)
    }
})

// Get specified instructor
router.get('/:id', async (req, res) => {
    const { error } = validateObjectId(req.params.id)
    if (error)
        return res.send(error.details[0].message).status(400)
    const instructor = await Instructor.findOne({ _id: req.params.id })
    try {
        if (!instructor)
            return res.send(`Instructor ${req.params.id} Not Found`).status(404)
        return res.send(instructor).status(200)
    } catch (error) {
        return res.send(error).status(500)
    }
})

// post an instructor
router.post('/', [auth, _superAdmin], async (req, res) => {
    const { error } = validateInstructor(req.body)
    if (error)
        return res.send(error.details[0].message).status(400)

    const status = await checkRequirements('Instructor', req.body)
    if (status !== 'alright')
        return res.send(status).status(400)

    let newAdmin = new Instructor({
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

    newAdmin.password = await hashPassword(newAdmin.password)
    const saveDocument = await newAdmin.save()
    if (saveDocument)
        return res.send(saveDocument).status(201)
    return res.send('New Instructor not Registered').status(500)
})

// instructor login
router.post('/login', async (req, res) => {
    const { error } = validateUserLogin(req.body)
    if (error)
        return res.send(error.details[0].message).status(400)

    // find instructor
    let instructor = await Instructor.findOne({ email: req.body.email })
    if (!instructor)
        return res.send('Invalid Email or Password').status(400)

    // check if passed password is valid
    const validPassword = await bcrypt.compare(req.body.password, instructor.password)
    if (!validPassword)
        return res.send('Invalid Email or Password').status(400)
    // return token
    return res.send(instructor.generateAuthToken()).status(200)
})

// updated a instructor
router.put('/:id', upload.single('profile'), async (req, res) => {
    let { error } = validateObjectId(req.params.id)
    if (error)
        return res.send(error.details[0].message).status(400)
    rror = validateInstructor(req.body)
    if (error)
        return res.send(error.details[0].message).status(400)

    // check if instructor exist
    let instructor = await Instructor.findOne({ _id: req.params.id })
    if (!instructor)
        return res.send(`Instructor with code ${req.params.id} doens't exist`)

    if (req.file && instructor.profile) {
        fs.unlink(__dirname + '../../uploads/profile/instructor/' + instructor.profile, (err) => {
            if (err)
                return res.send(err).status(500)
        })
    }
    if (req.file)
        req.body.profile = req.file.filename
    if (req.body.password)
        req.body.password = await hashPassword(req.body.password)
    const updateDocument = await Instructor.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
    if (updateDocument)
        return res.send(updateDocument).status(201)
    return res.send("Error ocurred").status(500)

})

// delete a instructor
router.delete('/:id', [auth, _admin], async (req, res) => {
    const { error } = validateObjectId(req.params.id)
    if (error)
        return res.send(error.details[0].message).status(400)
    let instructor = await Instructor.findOne({ _id: req.params.id })
    if (!instructor)
        return res.send(`Instructor of Code ${req.params.id} Not Found`)
    let deletedAdmin = await Instructor.findOneAndDelete({ _id: req.params.id })
    if (!deletedAdmin)
        return res.send('Instructor Not Deleted').status(500)
    return res.send(`Instructor ${deletedAdmin._id} Successfully deleted`).status(200)
})

// export the router
module.exports = router
