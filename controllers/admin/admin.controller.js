// import dependencies
const {
    express,
    bcrypt,
    fs,
    Admin,
    College,
    validateAdmin,
    validateUserLogin,
    hashPassword,
    defaulPassword,
    validateObjectId,
    removeDocumentVersion
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Admin:
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
 * /kurious/admin:
 *   get:
 *     tags:
 *       - Admin
 *     description: Get all Admins
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
        let admins = await Admin.find().lean()

        if (admins.length === 0)
            return res.status(404).send('Admin list is empty')

        admins = await injectDetails(admins)

        return res.status(200).send(admins)
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/admin/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     description: Returns a specified admin
 *     parameters:
 *       - name: id
 *         description: Admin's id
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
        let admin = await Admin.findOne({
            _id: req.params.id
        }).lean()

        if (!admin)
            return res.status(404).send(`Admin ${req.params.id} Not Found`)

        admin = await injectDetails([admin])

        return res.status(200).send(admin[0])
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/admin/college/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     description: Returns admin of a specified college
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

        let admin = await Admin.findOne({
            college: req.params.id
        }).lean()

        if (!admin)
            return res.status(404).send(`Admin of ${college.name} Not Found`)

        admin = await injectDetails([admin])

        return res.status(200).send(admin[0])
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/admin:
 *   post:
 *     tags:
 *       - Admin
 *     description: Create Admin
 *     parameters:
 *       - name: body
 *         description: Fields for an Admin
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Admin'
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
    } = validateAdmin(req.body)
    if (error)
        return res.status(400).send(error.details[0].message)

    let admin = await Admin.findOne({
        email: req.body.email
    })
    if (admin)
        return res.status(404).send(`Admin with email ${req.body.email} arleady exist`)

    admin = await Admin.findOne({
        nationalId: req.body.nationalId
    })
    if (admin)
        return res.status(404).send(`Admin with nationalId ${req.body.nationalId} arleady exist`)

    admin = await Admin.findOne({
        phone: req.body.phone
    })
    if (admin)
        return res.status(404).send(`Admin with phone ${req.body.phone} arleady exist`)

    let college = await College.findOne({
        _id: req.body.college
    })
    if (!college)
        return res.status(404).send(`College ${req.body.college} Not Found`)

    admin = await Admin.findOne({
        college: req.body.college
    })
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

/**
 * @swagger
 * /kurious/admin/login:
 *   post:
 *     tags:
 *       - Admin
 *     description: Admin login
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

    // find admin
    let admin = await Admin.findOne({
        email: req.body.email
    })
    if (!admin)
        return res.status(404).send('Invalid Email or Password')

    // check if passed password is valid
    const validPassword = await bcrypt.compare(req.body.password, admin.password)
    if (!validPassword)
        return res.status(404).send('Invalid Email or Password')
    // return token
    return res.status(200).send(admin.generateAuthToken())
})

/**
 * @swagger
 * /kurious/admin/{id}:
 *   put:
 *     tags:
 *       - Admin
 *     description: Update Admin
 *     parameters:
 *        - name: id
 *          in: path
 *          type: string
 *          description: Admin's Id
 *        - name: body
 *          description: Fields for a Admin
 *          in: body
 *          required: true
 *          schema:
 *            $ref: '#/definitions/Admin'
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
    error = validateAdmin(req.body)
    error = error.error
    if (error)
        return res.status(400).send(error.details[0].message)

    // check if admin exist
    let admin = await Admin.findOne({
        _id: req.params.id
    })
    if (!admin)
        return res.status(404).send(`Admin with code ${req.params.id} doens't exist`)

    if (req.body.password)
        req.body.password = await hashPassword(req.body.password)
    const updateDocument = await Admin.findOneAndUpdate({
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
 * /kurious/admin/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     description: Delete an Admin
 *     parameters:
 *       - name: id
 *         description: Admin's id
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
    let admin = await Admin.findOne({
        _id: req.params.id
    })
    if (!admin)
        return res.status(404).send(`Admin of Code ${req.params.id} Not Found`)
    let deleteDocument = await Admin.findOneAndDelete({
        _id: req.params.id
    })
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

// replace relation ids with their references
async function injectDetails(admins) {
    for (const i in admins) {
        const college = await College.findOne({
            _id: admins[i].college
        }).lean()
        admins[i].college = removeDocumentVersion(college)
        if (admins[i].college.logo) {
            admins[i].college.logo = `${process.env.HOST}/kurious/file/collegeLogo/${college._id}`
        }
        // add admin profile media path
        if (admins[i].profile) {
            admins[i] = `${process.env.HOST}/kurious/file/adminProfile/${admins[i]._id}`
        }
    }
    return admins
}

// export the router
module.exports = router