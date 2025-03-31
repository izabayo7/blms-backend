const {exist} = require('joi')
// import dependencies
const {
    express,
    College,
    User,
    fs,
    validate_college,
    findDocument,
    findDocuments,
    formatResult,
    createDocument,
    updateDocument,
    deleteDocument,
    validateObjectId,
    sendResizedImage,
    u,
    upload_single_image,
    addStorageDirectoryToPath,
    auth
} = require('../../utils/imports')

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
 * /college:
 *   get:
 *     tags:
 *       - College
 *     description: Get all Colleges
 *     security:
 *       - bearerAuth: -[]
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', auth, async (req, res) => {
    try {
        let colleges = await findDocuments(College)
        if (!colleges.length)
            return res.send(formatResult(404, 'College list is empty'))
        colleges = await injectLogoMediaPaths(colleges)
        return res.send(formatResult(u, u, colleges))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /college/name/{name}:
 *   get:
 *     tags:
 *       - College
 *     description: Returns a specified college by name
 *     security:
 *       - bearerAuth: -[]
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
router.get('/name/:name', auth, async (req, res) => {
    try {
        let college = await findDocument(College, {
            name: req.params.name
        })
        if (!college)
            return res.send(formatResult(404, 'College not found'))
        college = await injectLogoMediaPaths([college])
        college = college[0]
        return res.send(formatResult(u, u, college))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /college/open/{name}:
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
router.get('/open/:name', async (req, res) => {
    try {
        let college = await findDocument(College, {
            name: req.params.name
        }, {name: 1, logo: true})
        if (!college)
            return res.send(formatResult(404, 'College not found'))
        college = await injectLogoMediaPaths([college])
        college = college[0]
        return res.send(formatResult(u, u, college))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /college/{id}:
 *   get:
 *     tags:
 *       - College
 *     description: Returns a specified college
 *     security:
 *       - bearerAuth: -[]
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
router.get('/:id', auth, async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let college = await findDocument(College, {
            _id: req.params.id
        })
        if (!college)
            return res.status(404).send(`College ${req.params.id} Not Found`)
        college = await injectLogoMediaPaths([college])
        college = college[0]
        return res.send(formatResult(u, u, college))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /college/checkNameExistance/{college_name}:
 *   get:
 *     tags:
 *       - College
 *     description: tells if the given name is taken or available
 *     parameters:
 *       - name: college_name
 *         description: College name
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
router.get('/checkNameExistance/:college_name', checkCollegeNameExistance)

/**
 * @swagger
 * /college/{college_name}/logo/{file_name}:
 *   get:
 *     tags:
 *       - College
 *     description: Returns the logo of a specified college
 *     parameters:
 *       - name: college_name
 *         description: College name
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: File name
 *         in: path
 *         required: true
 *         type: string
 *       - name: format
 *         description: File format one of (jpeg, jpg, png, webp)
 *         in: query
 *         type: string
 *       - name: height
 *         description: custom height
 *         in: query
 *         type: string
 *       - name: width
 *         description: custom width
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/:college_name/logo/:file_name', async (req, res) => {
    try {

        // check if college exist
        const college = await findDocument(College, {
            name: req.params.college_name
        })
        if (!college)
            return res.send(formatResult(404, 'college not found'))

        if (!college.logo || (college.logo !== req.params.file_name))
            return res.send(formatResult(404, 'file not found'))

        const path = addStorageDirectoryToPath(`./uploads/colleges/${college._id}/${college.logo}`)

        sendResizedImage(req, res, path)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /college:
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
        const {
            error
        } = validate_college(req.body)
        if (error)
            return res.send(formatResult(404, error.details[0].message))

        // check if the name or email were not used
        let college = await findDocument(College, {
            $or: [
                //   {
                //   email: req.body.email
                // },
                {
                    name: req.body.name
                }
                // , {
                //   phone: req.body.phone
                // }
            ]
        })

        if (college) {
            // const phoneFound = req.body.phone == college.phone
            const phoneFound = false
            const nameFound = req.body.name == college.name
            // const emailFound = req.body.email == college.email
            const emailFound = false
            return res.send(formatResult(403, `College with ${phoneFound ? 'same phone ' : emailFound ? 'same email ' : nameFound ? 'same name ' : ''} arleady exist`))
        }

        let result = await createDocument(College, {
            name: req.body.name,
            // email: req.body.email,
            // location: req.body.location,
            // phone: req.body.phone
        })

        result = await injectLogoMediaPaths([result])
        result = result[0]
        return res.send(result)

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /college/{id}:
 *   put:
 *     tags:
 *       - College
 *     description: Update college
 *     security:
 *       - bearerAuth: -[]
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
router.put('/:id', auth, async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        error = validate_college(req.body, 'update')
        error = error.error

        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if college exist
        let college = await findDocument(College, {_id: req.params.id})
        if (!college)
            return res.send(formatResult(404, `College with code ${req.params.id} doens't exist`))

        const arr = []

        if (req.body.email)
            arr.push({
                email: req.body.email
            })

        if (req.body.name)
            arr.push({
                name: req.body.name
            })

        if (req.body.phone)
            arr.push({
                phone: req.body.phone
            })
        if (arr.length) {
            // check if the name or email were not used
            college = await findDocument(College, {
                _id: {
                    $ne: req.params.id
                },
                $or: arr
            })

            if (college) {
                const phoneFound = req.body.phone == college.phone
                const nameFound = req.body.name == college.name
                const emailFound = req.body.email == college.email
                return res.send(formatResult(403, `College with ${phoneFound ? 'same phone ' : emailFound ? 'same email ' : nameFound ? 'same name ' : ''} arleady exist`))
            }
        }

        let result = await updateDocument(College, req.params.id, req.body)
        result = await injectLogoMediaPaths([result])
        result = result[0]
        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /college/{id}/logo:
 *   put:
 *     tags:
 *       - College
 *     description: Upload college logo (file upload using swagger is still under construction)
 *     security:
 *       - bearerAuth: -[]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: id
 *         description: College id
 *         in: path
 *         required: true
 *         type: string
 *       - in: formData
 *         name: file
 *         type: file
 *         description: college logo to upload.
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
router.put('/:id/logo', auth, async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if college exist
        const college = await findDocument(College, {
            _id: req.params.id
        })
        if (!college)
            return res.send(formatResult(404, 'college not found'))

        const path = addStorageDirectoryToPath(`./uploads/colleges/${req.params.id}`)
        req.kuriousStorageData = {
            dir: path,
        }
        upload_single_image(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))

            if (college.logo && college.logo != req.file.filename) {
                fs.unlink(`${path}/${college.logo}`, (err) => {
                    if (err)
                        return res.send(formatResult(500, err))
                })
            }
            const result = await updateDocument(College, req.params.id, {
                logo: req.file.filename
            })
            result.data.logo = `http://${process.env.HOST}${process.env.BASE_PATH}/college/${college.name}/logo/${result.data.logo}`
            return res.send(result)
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /college/{id}/logo/{file_name}:
 *   delete:
 *     tags:
 *       - College
 *     description: remove College logo
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Chapter id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: File name
 *         in: path
 *         required: true
 *         type: string
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
router.delete('/:id/logo/:file_name', auth, async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if college exist
        const college = await findDocument(College, {
            _id: req.params.id
        }, u, false)
        if (!college)
            return res.send(formatResult(404, 'college not found'))

        if (!college.logo || college.logo !== req.params.file_name)
            return res.send(formatResult(404, 'file not found'))

        const path = addStorageDirectoryToPath(`./uploads/colleges/${req.params.id}/${college.logo}`)

        fs.unlink(path, (err) => {
            if (err)
                return res.send(formatResult(500, err))
        })
        college.logo = u
        await college.save()
        return res.send(formatResult(u, u, college))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /college/{id}:
 *   delete:
 *     tags:
 *       - College
 *     description: Deletes a college
 *     security:
 *       - bearerAuth: -[]
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
router.delete('/:id', auth, async (req, res) => {
    try {

        let college = await findDocument(College, {_id: req.params.id})
        if (!college)
            return res.send(formatResult(404, `College with code ${req.params.id} Not Found`))
        // check if the college is never used
        const user = await findDocument(User, {
            college: req.params.id
        })
        if (!user) {
            const result = await deleteDocument(College, req.params.id)

            // delete files if available
            const path = addStorageDirectoryToPath(`./uploads/colleges/${req.params.id}`)
            fs.exists(path, (exists) => {
                if (exists) {
                    fs.remove(path)
                }
            })

            return res.send(result)
        }

        const update_college = await updateDocument(College, req.params.id, {
            status: 0
        })
        return res.send(formatResult(200, `College ${college.name} couldn't be deleted because it was used, instead it was disabled`, update_college.data))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * Check Email Existence
 * @param req
 * @param res
 */
async function checkCollegeNameExistance(req, res) {
    try {
        const college = await College.findOne({name: req.params.college_name, status: 1});
        if (college) return res.send(formatResult(200, 'Name Already Taken', {exists: true}));
        return res.send(formatResult(200, 'Name Available', {exists: false}));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
};

async function injectLogoMediaPaths(colleges) {
    for (const i in colleges) {
        if (colleges[i].logo) {
            colleges[i].logo = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/college/${colleges[i].name}/logo/${colleges[i].logo}`
        }
    }
    return colleges
}

// export the router
module.exports = router