// import dependencies
const {
  express,
  Chapter,
  Attachment,
  validateObjectId,
} = require("../../utils/imports");

// create router
const router = express.Router();


/**
 * @swagger
 * /file/quizAttachedFiles/{quiz}/{file_name}:
 *   get:
 *     tags:
 *       - FileUploading
 *     description: Returns the images attached to a specified quiz
 *     parameters:
 *       - name: quiz
 *         description: Quiz's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: picture
 *         description: picture's name
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
router.get('/quizAttachedFiles/:quiz/:file_name', async (req, res) => {
  try {

      const {
          error
      } = validateObjectId(req.params.quiz)
      if (error)
          return res.send(formatResult(400, error.details[0].message))

      const quiz = await Quiz.findOne({
          _id: req.params.quiz
      })
      if (!quiz)
          return res.send(formatResult(404, `Quiz with code ${req.params.quiz} doens't exist`))

      const instructor = await Instructor.findOne({
          _id: quiz.instructor
      })

      path = `./uploads/colleges/${instructor.college}/assignments/${req.params.quiz}/${req.params.file_name}`

      sendResizedImage(req, res, path)

  } catch (error) {
      return res.send(formatResult(500, error))
  }
})

/**
* @swagger
* /file/submissionAttachedFiles/{submission}/{file}:
*   get:
*     tags:
*       - FileUploading
*     description: Returns the images attached to a specified quiz
*     parameters:
*       - name: quiz
*         description: Submission's id
*         in: path
*         required: true
*         type: string
*       - name: picture
*         description: file's name
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
router.get('/submissionAttachedFiles/:quiz/:file', async (req, res) => {
  try {

      const {
          error
      } = validateObjectId(req.params.quiz)
      if (error)
          return res.send(formatResult(400, error.details[0].message))

      const submission = await QuizSubmission.findOne({
          _id: req.params.submission
      })
      if (!submission)
          return res.send(formatResult(404, `QuizSubmission with code ${req.params.submission} doens't exist`))

      const quiz = await Quiz.findOne({
          _id: submission.quiz
      })
      if (!quiz)
          return res.send(formatResult(404, `Quiz with code ${submission.quiz} doens't exist`))

      const instructor = await Instructor.findOne({
          _id: quiz.instructor
      })

      path = `./uploads/colleges/${instructor.college}/assignments/${submission.quiz}/submissions/${req.params.submission}/${req.params.file}`

      fs.exists(path, (exists) => {
          if (!exists) {
              return res.send(formatResult(404, `${req.params.file_name} was not found`))
          } else {
              // katurebe
          }
      })



  } catch (error) {
      return res.send(formatResult(500, error))
  }
})

/**
* @swagger
* /file/getAttachments/{id}:
*   get:
*     tags:
*       - FileUploading
*     description: Returns the attachments of a specified chapter
*     parameters:
*       - name: id
*         description: Chapter id
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
router.get('/getAttachments/:id', async (req, res) => {
  try {

      const {
          error
      } = validateObjectId(req.params.id)
      if (error)
          return res.send(formatResult(400, error.details[0].message))

      // check if chapter exist
      const chapter = await Chapter.findOne({
          _id: req.params.id
      })
      if (!chapter)
          return res.send(formatResult(404, `Chapter with code ${req.params.id} doens't exist`))

      // fetch chapter attachments
      const attachments = await Attachment.find({
          chapter: req.params.id
      })
      if (attachments.length < 1)
          return res.send(formatResult(404, `Chapter ${chapter.name} don't have attachmets`))

      return res.status(200).send(attachments)
  } catch (error) {
      return res.send(formatResult(500, error))
  }
})

// to be continued

// get an attachment
router.get('/getAttachment/:id', async (req, res) => {
  try {

      const {
          error
      } = validateObjectId(req.params.id)
      if (error)
          return res.send(formatResult(400, error.details[0].message))

      // check if attachment exist
      const attachment = await Attachment.findOne({
          _id: req.params.id
      })
      if (!attachment)
          return res.send(formatResult(404, `Attachment with code ${req.params.id} doens't exist`))

      const chapter = await Chapter.findOne({
          _id: attachment.chapter
      })
      const course = await Course.findOne({
          _id: chapter.course
      })
      const facultyCollegeYear = await FacultyCollegeYear.findOne({
          _id: course.facultyCollegeYear
      })
      const facultyCollege = await FacultyCollege.findOne({
          _id: facultyCollegeYear.facultyCollege
      })

      filepath = `./uploads/colleges/${facultyCollege.college}/courses/${chapter.course}/chapters/${attachment.chapter}/attachments/${attachment.name}`
      const pic = fs.readFileSync(filepath)
      res.contentType('image/jpeg') // wp kbx
      return res.status(200).send(pic)
  } catch (error) {
      return res.send(formatResult(500, error))
  }
})

// download an attachment
router.get('/downloadAttachment/:id', async (req, res) => {
  try {

      const {
          error
      } = validateObjectId(req.params.id)
      if (error)
          return res.send(formatResult(400, error.details[0].message))

      // check if attachment exist
      const attachment = await Attachment.findOne({
          _id: req.params.id
      })
      if (!attachment)
          return res.send(formatResult(404, `Attachment with code ${req.params.id} doens't exist`))

      const chapter = await Chapter.findOne({
          _id: attachment.chapter
      })
      const course = await Course.findOne({
          _id: chapter.course
      })
      const facultyCollegeYear = await FacultyCollegeYear.findOne({
          _id: course.facultyCollegeYear
      })
      const facultyCollege = await FacultyCollege.findOne({
          _id: facultyCollegeYear.facultyCollege
      })

      filepath = `./uploads/colleges/${facultyCollege.college}/courses/${chapter.course}/chapters/${attachment.chapter}/attachments/${attachment.name}`
      // res.setHeader('Content-Disposition', 'attachment')
      return res.download(filepath)
  } catch (error) {
      return res.send(formatResult(500, error))
  }
})

// delete an attachment
router.delete("/:id", async (req, res) => {
  const {
    error
  } = validateObjectId(req.params.id);
  if (error) return res.send(error.details[0].message).status(400);
  let attachment = await Attachment.findOne({
    _id: req.params.id
  });
  if (!attachment)
    return res.send(`Attachment of Code ${req.params.id} Not Found`);
  let deletedDocument = await Chapter.findOneAndDelete({
    _id: req.params.id
  });
  if (!deletedDocument) return res.send("Attachment Not Deleted").status(500);
  return res
    .send(`Attachment ${deletedDocument._id} Successfully deleted`)
    .status(200);
});

// export the router
module.exports = router;