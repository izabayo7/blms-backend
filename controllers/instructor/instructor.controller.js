// import dependencies
const { express, bcrypt, fs, Instructor, College, validateInstructor, validateUserLogin, hashPassword, defaulPassword, validateObjectId, checkRequirements } = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Instructor:
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
 * /kurious/instructor:
 *   get:
 *     tags:
 *       - Instructor
 *     description: Get all Instructors
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', async (req, res) => {
    const instructors = await Instructor.find()
    try {
        if (instructors.length === 0)
            return res.status(404).send('Instructor list is empty')
        return res.status(200).send(instructors)
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/instructor/college/{id}:
 *   get:
 *     tags:
 *       - Instructor
 *     description: Returns instructors in a specified college
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

/**
 * @swagger
 * /kurious/instructor/{id}:
 *   get:
 *     tags:
 *       - Instructor
 *     description: Returns a specified instructor
 *     parameters:
 *       - name: id
 *         description: Instructor's id
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

/**
 * @swagger
 * /kurious/instructor:
 *   post:
 *     tags:
 *       - Instructor
 *     description: Create Instructor
 *     parameters:
 *       - name: body
 *         description: Fields for an Instructor
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Instructor'
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

/**
 * @swagger
 * /kurious/instructor/login:
 *   post:
 *     tags:
 *       - Instructor
 *     description: Instructor login
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
    const { error } = validateUserLogin(req.body)
    if (error)
        return res.status(400).send(error.details[0].message)
    // find instructor
    let instructor = await Instructor.findOne({ email: req.body.email })
    if (!instructor)
        return res.status(404).send('Invalid Email or Password')

    // check if passed password is valid
    const validPassword = await bcrypt.compare(req.body.password, instructor.password)
    if (!validPassword)
        return res.status(404).send('Invalid Email or Password')
    // return token
    return res.status(200).send(instructor.generateAuthToken())
})

/**
 * @swagger
 * /kurious/instructor/{id}:
 *   put:
 *     tags:
 *       - Instructor
 *     description: Update Instructor
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Instructor's Id
 *       - name: body
 *         description: Fields for a Instructor
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Instructor'
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

/**
 * @swagger
 * /kurious/instructor/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     description: Delete as Instructor
 *     parameters:
 *       - name: id
 *         description: Instructor's id
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
