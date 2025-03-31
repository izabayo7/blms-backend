// import dependencies
const { express, bcrypt, fs, SuperAdmin, validateObjectId, validateSuperAdmin, validateUserLogin, hashPassword, defaulPassword } = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   SuperAdmin:
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
 */


/**
 * @swagger
 * /kurious/super-admin:
 *   get:
 *     tags:
 *       - SuperAdmin
 *     description: Get super Admin
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
    let superAdmin = await SuperAdmin.findOne().lean()

    if (!superAdmin)
      return res.status(404).send('SuperAdmin not yet registered')
    if (superAdmin.profile) {
      superAdmin.profile = `http://${process.env.HOST}/kurious/file/superAdminProfile/${superAdmin._id}`
    }
    return res.status(200).send(superAdmin)
  } catch (error) {
    return res.status(500).send(error)
  }
})


/**
 * @swagger
 * /kurious/super-admin:
 *   post:
 *     tags:
 *       - SuperAdmin
 *     description: Create a superAdmin
 *     parameters:
 *       - name: body
 *         description: Fields for a superAdmin
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/SuperAdmin'
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server error
 */
router.post('/', async (req, res) => {
  const { error } = validateSuperAdmin(req.body)
  if (error)
    return res.status(400).send(error.details[0].message)

  const availableDocuments = await SuperAdmin.find().countDocuments()
  if (availableDocuments > 0)
    return res.status(400).send(`Can't register more than one SuperAdmin to the system`)

  let newDocument = new SuperAdmin({
    surName: req.body.surName,
    otherNames: req.body.otherNames,
    nationalId: req.body.nationalId,
    phone: req.body.phone,
    gender: req.body.gender,
    email: req.body.email,
    phone: req.body.phone,
    password: defaulPassword,
  })

  newDocument.password = await hashPassword(newDocument.password)
  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.status(201).send(saveDocument)
  return res.status(500).send('New SuperAdmin not Registered')
})

/**
 * @swagger
 * /kurious/super-admin/login:
 *   post:
 *     tags:
 *       - SuperAdmin
 *     description: superAdmin login
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
    return res.status(400)
      .send(error.details[0].message)
  // find superAdmin
  let superAdmin = await SuperAdmin.findOne({ email: req.body.email })
  if (!superAdmin)
    return res.status(404).send('Invalid Email or Password')

  // check if passed password is valid
  const validPassword = await bcrypt.compare(req.body.password, superAdmin.password)
  if (!validPassword)
    return res.status(404).send('Invalid Email or Password')
  // return token
  return res.status(200).send(superAdmin.generateAuthToken())
})

/**
 * @swagger
 * /kurious/super-admin/{id}:
 *   put:
 *     tags:
 *       - SuperAdmin
 *     description: Update superAdmin
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: superAdmin's Id
 *       - name: body
 *         description: Fields for a superAdmin
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/SuperAdmin'
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
  error = validateSuperAdmin(req.body)
  error = error.error
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if superAdmin exist
  let superAdmin = await SuperAdmin.findOne({ _id: req.params.id })
  if (!superAdmin)
    return res.status(404).send(`SuperAdmin with code ${req.params.id} doens't exist`)

  if (req.body.password)
    req.body.password = await hashPassword(req.body.password)
  const updateDocument = await SuperAdmin.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.status(201).send(updateDocument)
  return res.status(500).send("Error ocurred")

})

/**
 * @swagger
 * /kurious/super-admin/{id}:
 *   delete:
 *     tags:
 *       - SuperAdmin
 *     description: Deletes a superAdmin
 *     parameters:
 *       - name: id
 *         description: superAdmin's id
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
  let superAdmin = await SuperAdmin.findOne({ _id: req.params.id })
  if (!superAdmin)
    return res.status(404).send(`SuperAdmin of Code ${req.params.id} Not Found`)
  let deleteDocument = await SuperAdmin.findOneAndDelete({ _id: req.params.id })
  if (!deleteDocument)
    return res.status(500).send('SuperAdmin Not Deleted')
  if (superAdmin.profile) {
    fs.unlink(`./uploads/system/super-admin/${superAdmin.profile}`, (err) => {
      if (err)
        return res.status(500).send(err)
    })
  }
  return res.status(200).send(`${superAdmin.surName} ${superAdmin.otherNames} was successfully deleted`)
})

// export the router
module.exports = router
