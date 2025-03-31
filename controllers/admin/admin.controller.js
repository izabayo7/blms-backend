// import dependencies
const { express, bcrypt, fs, Admin, College, validateAdmin, validateUserLogin, hashPassword, auth, _superAdmin, defaulPassword, _admin, validateObjectId } = require('../../utils/imports')

// create router
const router = express.Router()

// Get all admins
router.get('/', async (req, res) => {
    const admins = await Admin.find()
    try {
        if (admins.length === 0)
            return res.send('Admin list is empty').status(404)
        return res.send(admins).status(200)
    } catch (error) {
        return res.send(error).status(500)
    }
})

// Get specified admin
router.get('/:id', async (req, res) => {
    const { error } = validateObjectId(req.params.id)
    if (error)
        return res.send(error.details[0].message).status(412)
    const admin = await Admin.findOne({ _id: req.params.id })
    try {
        if (!admin)
            return res.send(`Admin ${req.params.id} Not Found`)
        return res.send(admin).status(200)
    } catch (error) {
        return res.send(error).status(500)
    }
})

// post an admin
router.post('/', async (req, res) => {
    const { error } = validateAdmin(req.body)
    if (error)
        return res.send(error.details[0].message).status(412)

    let admin = await Admin.findOne({ email: req.body.email })
    if (admin)
        return res.send(`Admin with email ${req.body.email} arleady exist`)

    admin = await Admin.findOne({ nationalId: req.body.nationalId })
    if (admin)
        return res.send(`Admin with nationalId ${req.body.nationalId} arleady exist`)

    admin = await Admin.findOne({ phone: req.body.phone })
    if (admin)
        return res.send(`Admin with phone ${req.body.phone} arleady exist`)

    let college = await College.findOne({ _id: req.body.college })
    if (!college)
        return res.send(`College ${req.body.college} Not Found`)

    admin = await Admin.findOne({ college: req.body.college })
    if (admin)
        return res.send(`Admin of college ${req.body.college} arleady exist`)

    let newDocument = new Admin({
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
        return res.send(saveDocument).status(201)
    return res.send('New Admin not Registered').status(500)
})

// admin login
router.post('/login', async (req, res) => {
    const { error } = validateUserLogin(req.body)
    if (error)
        return res.send(error.details[0].message).status(412)

    // find admin
    let admin = await Admin.findOne({ email: req.body.email })
    if (!admin)
        return res.send('Invalid Email or Password').status(412)

    // check if passed password is valid
    const validPassword = await bcrypt.compare(req.body.password, admin.password)
    if (!validPassword)
        return res.send('Invalid Email or Password').status(412)
    // return token
    return res.send(admin.generateAuthToken()).status(200)
})

// updated a admin
router.put('/:id', async (req, res) => {
    let { error } = validateObjectId(req.params.id)
    if (error)
        return res.send(error.details[0].message).status(412)
    error = validateAdmin(req.body)
    error = error.error
    if (error)
        return res.send(error.details[0].message).status(412)

    // check if admin exist
    let admin = await Admin.findOne({ _id: req.params.id })
    if (!admin)
        return res.send(`Admin with code ${req.params.id} doens't exist`)

    if (req.body.password)
        req.body.password = await hashPassword(req.body.password)
    const updateDocument = await Admin.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
    if (updateDocument)
        return res.send(updateDocument).status(201)
    return res.send("Error ocurred").status(500)

})

// delete a admin
router.delete('/:id', async (req, res) => {
    const { error } = validateObjectId(req.params.id)
    if (error)
        return res.send(error.details[0].message).status(412)
    let admin = await Admin.findOne({ _id: req.params.id })
    if (!admin)
        return res.send(`Admin of Code ${req.params.id} Not Found`)
    let deleteDocument = await Admin.findOneAndDelete({ _id: req.params.id })
    if (!deleteDocument)
        return res.send('Admin Not Deleted').status(500)
    if (admin.profile) {
        fs.unlink(`./uploads/colleges/${admin.college}/users/admin/${admin.profile}`, (err) => {
            if (err)
                return res.send(err).status(500)
        })
    }

    return res.status(200).send(`${admin.surName} ${admin.otherNames} was successfully deleted`)
})

// export the router
module.exports = router
