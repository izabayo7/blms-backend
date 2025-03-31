// import dependencies
const { express, College, validateCollege, findDocument } = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   College:
 *     properties:
 *       _id:
 *         type: string
 *       name:
 *         type: string
 *       email:
 *         type: string
 *       phone:
 *         type: string
 *       location:
 *         type: string
 *       logo:
 *         type: number
 *       disabled:
 *         type: string
 *     required:
 *       - name
 *       - email
 */

/**
 * @swagger
 * /kurious/college:
 *   get:
 *     tags:
 *       - College
 *     description: Get all Colleges
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
        let colleges = await College.find()
        if (colleges.length === 0)
            return res.status(404).send('College list is empty')
        colleges = await injectLogoMediaPaths(colleges)
        return res.status(200).send(colleges)
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/college/name/{name}:
 *   get:
 *     tags:
 *       - College
 *     description: Returns a specified college by name
 *     parameters:
 *       - name: id
 *         description: College's name
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
router.get('/name/:name', async (req, res) => {
    try {
        let college = await College.findOne({ name: req.params.name })
        if (!college)
            return res.status(404).send(`College ${req.params.name} Not Found`)
        college = await injectLogoMediaPaths([college])
        return res.status(200).send(college[0])
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/college/{id}:
 *   get:
 *     tags:
 *       - College
 *     description: Returns a specified college
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
router.get('/:id', async (req, res) => {
    try {
        let college = await findDocument(College, req.params.id)
        if (!college)
            return res.status(404).send(`College ${req.params.id} Not Found`)
        college = await injectLogoMediaPaths([college])
        return res.status(200).send(college[0])
    } catch (error) {
        return res.status(500).send(error)
    }
})


/**
 * @swagger
 * /kurious/college:
 *   post:
 *     tags:
 *       - College
 *     description: Create a college
 *     parameters:
 *       - name: body
 *         description: Fields for a college
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/College'
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server error
 */
router.post('/', async (req, res) => {
    try {
        const { error } = validateCollege(req.body)
        if (error)
            return res.status(400).send(error.details[0].message)

        let college = await College.findOne({ email: req.body.email })
        if (college)
            return res.status(400).send(`College with email ${req.body.email} arleady exist`)

        college = await College.findOne({ name: req.body.name })
        if (college)
            return res.status(400).send(`College with name ${req.body.name} arleady exist`)

        let newDocument = new College({
            name: req.body.name,
            email: req.body.email,
            logo: req.file === undefined ? undefined : req.file.filename

        })

        let saveDocument = await newDocument.save()
        if (saveDocument) {
            saveDocument = await injectLogoMediaPaths([saveDocument])
            return res.status(201).send(saveDocument[0])
        }
        return res.status(500).send('New College not Registered')
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/college/{id}:
 *   put:
 *     tags:
 *       - College
 *     description: Update college
 *     parameters:
 *        - name: id
 *          in: path
 *          type: string
 *          description: college's Id
 *        - name: body
 *          description: Fields for a college
 *          in: body
 *          required: true
 *          schema:
 *            $ref: '#/definitions/College'
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
    try {
        const { error } = validateCollege(req.body, 'update')
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if college exist
        let college = await findDocument(College, req.params.id)
        if (!college)
            return res.status(404).send(`College with code ${req.params.id} doens't exist`)

        let updateDocument = await College.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
        if (updateDocument) {
            updateDocument = await injectLogoMediaPaths([updateDocument])
            return res.status(201).send(updateDocument[0])
        }
        return res.status(500).send("Error ocurred")
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/college/{id}:
 *   delete:
 *     tags:
 *       - College
 *     description: Deletes a college
 *     parameters:
 *       - name: id
 *         description: college's id
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
    let college = await findDocument(College, req.params.id)
    if (!college)
        return res.status(404).send(`College of Code ${req.params.id} Not Found`)
    let deleteDocument = await College.findOneAndDelete({ _id: req.params.id })
    if (!deleteDocument)
        return res.status(500).send('College Not Deleted')
    return res.status(200).send(`College ${deleteDocument._id} Successfully deleted`)
})

async function injectLogoMediaPaths(colleges) {
    for (const i in colleges) {
        if (colleges[i].logo) {
            colleges[i].logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${colleges[i]._id}/${colleges[i].logo}`
        }
    }
    return colleges
}

// export the router
module.exports = router
