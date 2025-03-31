// import dependencies
const { express, bcrypt, multer, fs, Chapter, validateAttachment, Attachment, fileFilter, validateObjectId, getCourse } = require('../../utils/imports')

// create router
const router = express.Router()

// configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const college = getCollege(req.body.facilityCollegeYear, 'chapter')
    let dir = `./uploads/schools/${college}/courses`
    fs.exists(dir, exist => {
      if (!exist) {
        fs.mkdir(dir, error => cb(error, dir))
      }
      const course = getCourse(req.body.chapter)
      dir = `./uploads/schools/${college}/courses/${course}`
      fs.exists(dir, exist => {
        if (!exist) {
          fs.mkdir(dir, error => cb(error, dir))
        }
        dir = `./uploads/schools/${college}/courses/${course}/chapters`
        fs.exists(dir, exist => {
          if (!exist) {
            fs.mkdir(dir, error => cb(error, dir))
          }
          dir = `./uploads/schools/${college}/courses/${course}/chapters/${req.body.chapter}`
          fs.exists(dir, exist => {
            if (!exist) {
              fs.mkdir(dir, error => cb(error, dir))
            }
            dir = `./uploads/schools/${college}/courses/${course}/chapters/${req.body.chapter}/attachments`
            fs.exists(dir, exist => {
              if (!exist) {
                fs.mkdir(dir, error => cb(error, dir))
              }
              return cb(null, dir)
            })
          })
        })
      })

    })
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
})

// Get all attachments in a specified chapter
router.get('/chapter/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if chapter exist
  let chapter = await Chapter.findOne({ _id: req.params.id })
  if (!chapter)
    return res.send(`chapter with code ${req.params.id} doens't exist`)
  const college = getCollege(req.body.facilityCollegeYear, 'chapter')
  const attachments = fs.readdir(`./uploads/schools/${college}/chapters/${req.body.params}/${req.params.id}/attachments`, (err, folders) => {
    if (err)
      return (`An error occured while Reading files`)
    return res.status(200).send(folders)
  })
  try {
    if (chapters.length === 0)
      return res.send(`There are no chapters in ${chapter.name}`).status(404)
    return res.send(chapters).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// post an chapter
router.post('/', upload.single('attachment'), async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  req.body.name = req.file.filename
  error = validateAttachment(req.body)
  error = error.error
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if chapter exist
  let chapter = await Chapter.findOne({ _id: req.body.chapter })
  if (!chapter)
    return res.send(`chapter with code ${req.body.chapter} doens't exist`)

  let newDocument = new Chapter({
    name: req.body.name,
    chapter: req.body.chapter
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.send(saveDocument).status(201)
  return res.send('New Attachment not Registered').status(500)
})


// updated a chapter
router.put('/:id', upload.single('attachment'), async (req, res) => {
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  error = validateAttachment(req.body)
  error = error.error
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if attachment exist
  let attachment = await Attachment.findOne({ _id: req.params.id })
  if (!attachment)
    return res.send(`Attachment with code ${req.params.id} doens't exist`)

  // check if chapter exist
  let chapter = await Chapter.findOne({ _id: req.body.chapter })
  if (!chapter)
    return res.send(`Chapter with code ${req.body.chapter} doens't exist`)

  if (req.file && chapter.document) {
    fs.unlink(__dirname + '../../uploads/profile/chapter/' + chapter.document, (err) => {
      if (err)
        return res.send(err).status(500)
    })
  }
  if (req.file)
    req.body.name = req.file.filename
  const updateDocument = await Attachment.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201)
  return res.send("Error ocurred").status(500)

})

// delete a chapter
router.delete('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let attachment = await Attachment.findOne({ _id: req.params.id })
  if (!attachment)
    return res.send(`Attachment of Code ${req.params.id} Not Found`)
  let deletedDocument = await Chapter.findOneAndDelete({ _id: req.params.id })
  if (!deletedDocument)
    return res.send('Attachment Not Deleted').status(500)
  return res.send(`Attachment ${deletedDocument._id} Successfully deleted`).status(200)
})

// export the router
module.exports = router
