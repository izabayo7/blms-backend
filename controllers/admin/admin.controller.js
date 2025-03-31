// import dependencies
const { express, bcrypt, fs, Admin, College, validateAdmin, validateUserLogin, hashPassword, auth, _superAdmin, defaulPassword, _admin, validateObjectId } = require('../../utils/imports')

// create router
const router = express.Router()

// Get all admins
router.get('/', async (req, res) => {
    const admins = await Admin.find()
    try {
        if (admins.length === 0)
            return res.status(404).send('Admin list is empty')
        return res.status(200).send(admins)
    } catch (error) {
        return res.status(500).send(error)
    }
})

// Get specified admin
router.get('/:id', async (req, res) => {
    const { error } = validateObjectId(req.params.id)
    if (error)
        return res.status(412).send(error.details[0].message)
    const admin = await Admin.findOne({ _id: req.params.id })
    try {
        if (!admin)
            return res.status(404).send(`Admin ${req.params.id} Not Found`)
        return res.status(200).send(admin)
    } catch (error) {
        return res.status(500).send(error)
    }
})

// post an admin
router.post('/', async (req, res) => {
    const { error } = validateAdmin(req.body)
    if (error)
        return res.status(412).send(error.details[0].message)

    let admin = await Admin.findOne({ email: req.body.email })
    if (admin)
        return res.status(404).send(`Admin with email ${req.body.email} arleady exist`)

    admin = await Admin.findOne({ nationalId: req.body.nationalId })
    if (admin)
        return res.status(404).send(`Admin with nationalId ${req.body.nationalId} arleady exist`)

    admin = await Admin.findOne({ phone: req.body.phone })
    if (admin)
        return res.status(404).send(`Admin with phone ${req.body.phone} arleady exist`)

    let college = await College.findOne({ _id: req.body.college })
    if (!college)
        return res.status(404).send(`College ${req.body.college} Not Found`)

    admin = await Admin.findOne({ college: req.body.college })
    if (admin)
        return res.status(404).send(`Admin of college ${req.body.college} arleady exist`)

    let newDocument = new Admin({
        surName: req.body.surName,
        otherNames: req.body.otherNames,
        nationalId: req.body.nationalId,
        phone: req.body.phone,
        gender: req.body.gender,
        email: req.body.email,
        password: defaulPassword,
        college: req.body.college
    })

    newDocument.password = await hashPassword(newDocument.password)
    const saveDocument = await newDocument.save()
    if (saveDocument)
        return res.status(201).send(saveDocument)
    return res.status(500).send('New Admin not Registered')
})

// admin login
router.post('/login', async (req, res) => {
    const { error } = validateUserLogin(req.body)
    if (error)
        return res.status(412).send(error.details[0].message)

    // find admin
    let admin = await Admin.findOne({ email: req.body.email })
    if (!admin)
        return res.status(412).send('Invalid Email or Password')

    // check if passed password is valid
    const validPassword = await bcrypt.compare(req.body.password, admin.password)
    if (!validPassword)
        return res.status(412).send('Invalid Email or Password')
    // return token
    return res.status(200).send(admin.generateAuthToken())
})

// updated a admin
router.put('/:id', async (req, res) => {
    let { error } = validateObjectId(req.params.id)
    if (error)
        return res.status(412).send(error.details[0].message)
    error = validateAdmin(req.body)
    error = error.error
    if (error)
        return res.status(412).send(error.details[0].message)

    // check if admin exist
    let admin = await Admin.findOne({ _id: req.params.id })
    if (!admin)
        return res.status(404).send(`Admin with code ${req.params.id} doens't exist`)

    if (req.body.password)
        req.body.password = await hashPassword(req.body.password)
    const updateDocument = await Admin.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
    if (updateDocument)
        return res.status(201).send(updateDocument)
    return res.status(500).send("Error ocurred")

})

// delete a admin
router.delete('/:id', async (req, res) => {
    const { error } = validateObjectId(req.params.id)
    if (error)
        return res.status(412).send(error.details[0].message)
    let admin = await Admin.findOne({ _id: req.params.id })
    if (!admin)
        return res.status(404).send(`Admin of Code ${req.params.id} Not Found`)
    let deleteDocument = await Admin.findOneAndDelete({ _id: req.params.id })
    if (!deleteDocument)
        return res.status(500).send('Admin Not Deleted')
    if (admin.profile) {
        fs.unlink(`./uploads/colleges/${admin.college}/users/admin/${admin.profile}`, (err) => {
            if (err)
                return res.status(500).send(err)
        })
    }

    return res.status(200).send(`${admin.surName} ${admin.otherNames} was successfully deleted`)
})

// export the router
module.exports = router
