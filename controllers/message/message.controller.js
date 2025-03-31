// import dependencies
const { express, multer, fs, Message, Student, Admin, Instructor, validateMessage, FacilityCollegeYear, normaliseDate, fileFilter, auth, _superAdmin, defaulPassword, _admin, validateObjectId, _student } = require('../../utils/imports')

// create router
const router = express.Router()

// configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/attachments')
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


// Get all messages
router.get('/', async (req, res) => {
  const messages = await Message.find()
  try {
    if (messages.length === 0)
      return res.send('Message list is empty').status(404)
    return res.send(messages).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// Get all messages in a specified college
router.get('/user/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let userFound = await findUser(req.params.id)
  if (!userFound)
    return res.send('The User id is invalid')
  const sent = await Message.find({ sender: req.params.id })
  const recieved = await Message.find({ reciever: req.params.id })

  return res.send({ sent: sent, recieved: recieved }).status(200)
})


// post an message
router.post('/', upload.single('attachments'), async (req, res) => {
  const { error } = validateMessage(req.body)
  if (error)
    return res.send(error.details[0].message).status(400)

  let sender = await findUser(req.body.sender)
  if (!sender)
    return res.send(`Sender Not Found`)

  let reciever = await findUser(req.body.reciever)
  if (!reciever)
    return res.send(`Reciever Not Found`)

  let newDocument = new Message({
    sender: req.body.sender,
    reciever: req.body.reciever,
    content: req.body.content,
    attachments: req.files === undefined ? undefined : req.files
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.send(saveDocument).status(201)
  return res.send('New Message not Registered').status(500)
})

// updated a message
router.put('/:id', upload.single('attachments'), async (req, res) => {
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  error = validateMessage(req.body)
  error = error.error
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if message exist
  let message = await Message.findOne({ _id: req.params.id })
  if (!message)
    return res.send(`Message with code ${req.params.id} doens't exist`)

  const updateDocument = await Message.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201)
  return res.send("Error ocurred").status(500)

})

// delete a message
router.delete('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let message = await Message.findOne({ _id: req.params.id })
  if (!message)
    return res.send(`Message of Code ${req.params.id} Not Found`)
  // need to delete all attachments
  let deleteDocument = await Message.findOneAndDelete({ _id: req.params.id })
  if (!deleteDocument)
    return res.send('Message Not Deleted').status(500)
  return res.send(`Message ${deleteDocument._id} Successfully deleted`).status(200)
})

async function findUser(id) {
  let user = await Admin.findOne({ _id: id })
  if (user)
    return true
  user = await Instructor.findOne({ _id: id })
  if (user)
    return true
  user = await Student.findOne({ _id: id })
  if (uer)
    return true
  return false
}

// export the router
module.exports = router
