// import dependencies
const { express, bcrypt, multer, fs, Chapter, validateChapter, Course, normaliseDate, fileFilter, auth, _superAdmin, defaulPassword, _admin, validateObjectId, _chapter, checkRequirements } = require('../../utils/imports')

// create router
const router = express.Router()

// configure multer
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const college = getCollege(req.body.facilityCollegeYear, 'chapter')
//     let dir = `./uploads/schools/${college}/courses`
//     fs.exists(dir, exist => {
//       if (!exist) {
//         fs.mkdir(dir, error => cb(error, dir))
//       }
//       dir = `./uploads/schools/${college}/courses/${req.body.course}`
//       fs.exists(dir, exist => {
//         if (!exist) {
//           fs.mkdir(dir, error => cb(error, dir))
//         }
//         dir = `./uploads/schools/${college}/courses/${req.body.course}/chapters`
//         fs.exists(dir, exist => {
//           if (!exist) {
//             fs.mkdir(dir, error => cb(error, dir))
//           }
//           dir = `./uploads/schools/${college}/courses/${req.body.course}/chapters/${req.params.id}`
//           fs.exists(dir, exist => {
//             if (!exist) {
//               fs.mkdir(dir, error => cb(error, dir))
//             }
//             return cb(null, dir)
//           })
//         })
//       })

//     })
//   },
//   filename: (req, file, cb) => {
//     cb(null, `mainContent-${normaliseDate(new Date().toISOString())}.${file.originalname.split('.')[file.originalname.split('.').length - 1]}`)
//   }
// })

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 1024 * 1024 * 5
//   },
//   fileFilter: fileFilter
// })

// Get all chapters in a specified course
router.get('/course/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if course exist
  let course = await Course.findOne({ _id: req.params.id })
  if (!course)
    return res.send(`Course with code ${req.params.id} doens't exist`)

  const chapters = await Chapter.find({ course: req.params.id })
  try {
    if (chapters.length === 0)
      return res.send(`There are no chapters in ${course.name}`).status(404)
    return res.send(chapters).status(200)
  } catch (error) {
    return res.send(error).status(500)
  }
})

// post an chapter
router.post('/', async (req, res) => {

  const { error } = validateChapter(req.body)
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if course exist
  let course = await Course.findOne({ _id: req.body.course })
  if (!course)
    return res.send(`Course with code ${req.body.course} doens't exist`)

  const number = await Chapter.find({ course: req.body.course }).countDocuments() + 1

  let newDocument = new Chapter({
    name: req.body.name,
    description: req.body.description,
    number: number,
    course: req.body.course
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.send(saveDocument).status(201)
  return res.send('New Chapter not Registered').status(500)
})


// updated a chapter
// router.put('/:id', upload.single('mainContent'), async (req, res) => {
router.put('/:id', async (req, res) => {
  let { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  rror = validateChapter(req.body)
  if (error)
    return res.send(error.details[0].message).status(400)

  // check if chapter exist
  let chapter = await Chapter.findOne({ _id: req.params.id })
  if (!chapter)
    return res.send(`Chapter with code ${req.params.id} doens't exist`)

  if (req.file && chapter.document) {
    fs.unlink(__dirname + '../../uploads/profile/chapter/' + chapter.document, (err) => {
      if (err)
        return res.send(err).status(500)
    })
  }
  if (req.file)
    req.body.document = req.file.filename
  const updateDocument = await Chapter.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  if (updateDocument)
    return res.send(updateDocument).status(201)
  return res.send("Error ocurred").status(500)

})

// delete a chapter
router.delete('/:id', async (req, res) => {
  const { error } = validateObjectId(req.params.id)
  if (error)
    return res.send(error.details[0].message).status(400)
  let chapter = await Chapter.findOne({ _id: req.params.id })
  if (!chapter)
    return res.send(`Chapter of Code ${req.params.id} Not Found`)
  let deleteDocument = await Chapter.findOneAndDelete({ _id: req.params.id })
  if (!deleteDocument)
    return res.send('Chapter Not Deleted').status(500)
  return res.send(`Chapter ${deleteDocument._id} Successfully deleted`).status(200)
})

// export the router
module.exports = router
