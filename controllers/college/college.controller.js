// import dependencies
const { express, fs, College, validateCollege, findDocument, normaliseDate, fileFilter, auth, _superAdmin, _admin } = require('../../utils/imports')

// create router
const router = express.Router()

// Get college
router.get('/', async (req, res) => {
    try {
        const colleges = await College.find()
        if (colleges.length === 0)
            return res.send('College list is empty').status(404)

        return res.send(colleges).status(200)
    } catch (error) {
        return res.send(error).status(500)
    }
})

// Get college
router.get('/:id', async (req, res) => {
    try {
        const college = await findDocument(College, req.params.id)
        if (!college)
            return res.send(`College ${req.params.id} Not Found`).status(404)
        return res.send(college).status(200)
    } catch (error) {
        return res.send(error).status(500)
    }
})

// post an college
router.post('/', async (req, res) => {
    try {
        const { error } = validateCollege(req.body)
        if (error)
            return res.send(error.details[0].message).status(400)

        let college = await College.findOne({ email: req.body.email })
        if (college)
            return res.send(`College with email ${req.body.email} arleady exist`)

        let newDocument = new College({
            name: req.body.name,
            email: req.body.email,
            logo: req.file === undefined ? undefined : req.file.filename

        })

        const saveDocument = await newDocument.save()
        if (saveDocument)
            return res.send(saveDocument).status(201)
        return res.send('New College not Registered').status(500)
    } catch (error) {
        return res.send(error).status(500)
    }
})

// updated a college
router.put('/:id', async (req, res) => {
    try {
        const { error } = validateCollege(req.body, 'update')
        if (error)
            return res.send(error.details[0].message).status(400)

        // check if college exist
        let college = await findDocument(College, req.params.id)
        if (!college)
            return res.send(`College with code ${req.params.id} doens't exist`)

        const updateDocument = await College.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
        if (updateDocument)
            return res.send(updateDocument).status(201)
        return res.send("Error ocurred").status(500)
    } catch (error) {
        return res.send(error).status(500)
    }
})

// delete a college
router.delete('/:id', [auth, _superAdmin], async (req, res) => {
    let college = await findDocument(College, req.params.id)
    if (!college)
        return res.send(`College of Code ${req.params.id} Not Found`)
    let deleteDocument = await College.findOneAndDelete({ _id: req.params.id })
    if (!deleteDocument)
        return res.send('College Not Deleted').status(500)
    return res.send(`College ${deleteDocument._id} Successfully deleted`).status(200)
})

// export the router
module.exports = router
