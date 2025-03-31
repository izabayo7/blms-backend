// import dependencies
const { express, fs, Course, validateObjectId } = require('../../utils/imports')

// create router
const router = express.Router()

router.get('/courseCover/:id', async (req, res) => {
    const { error } = validateObjectId(req.params.id)
    if (error)
      return res.send(error.details[0].message).status(400)
  
    // check if course exist
    let course = await Course.findOne({ _id: req.params.id })
    if (!course)
      return res.send(`Course with code ${req.params.id} doens't exist`)
    filepath ='./uploads/courses/' + course.coverPicture
    let pic = fs.readFileSync(filepath)
    res.contentType('image/jpeg');
   return res.send(pic).status(200)
});
router.get('/video/:name', async (req, res) => {
    filepath ='./uploads/video/' + req.params.name
    let pic = fs.readFileSync(filepath)
    res.contentType('video/mp4');
   return res.send(pic).status(200)
});

// export the router
module.exports = router
