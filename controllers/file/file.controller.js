// import dependencies
const {
    express,
    fs,
    multer,
    fileFilter,
    validateObjectId,
    FacultyCollegeYear,
    FacultyCollege,
    Attachment,
    Chapter,
    Course,
    SuperAdmin,
    Admin,
    Instructor,
    Student,
    QuizSubmission,
    College,
    Quiz,
    sendResizedImage,
    ChatGroup,
    streamVideo,
    addAttachmentMediaPaths,
    formatResult
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   FileUploading:
 *     description: This is not a model. Instead its apis for file uploading
 */



// add quiz attached images
router.post('/quizAttachedFiles/:quiz', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.quiz)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let quiz = await Quiz.findOne({
            _id: req.params.quiz
        }).lean()
        if (!quiz)
            return res.send(formatResult(404, `Quiz with code ${req.params.quiz} doens't exist`))

        const instructor = await Instructor.findOne({
            _id: quiz.instructor
        })

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${instructor.college}/assignments/${req.params.quiz}`,
        }

        uploadPlus(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))

            quiz = await addAttachmentMediaPaths([quiz])

            return res.status(201).send(quiz[0])
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// add quiz attached images
router.post('/submissionAttachedFiles/:submission', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.submission)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let submission = await QuizSubmission.findOne({
            _id: req.params.submission
        }).lean()
        if (!submission)
            return res.send(formatResult(404, `QuizSubmission with code ${req.params.submission} doens't exist`))

        let quiz = await Quiz.findOne({
            _id: submission.quiz
        }).lean()
        if (!quiz)
            return res.send(formatResult(404, `Quiz with code ${submission.quiz} doens't exist`))

        const instructor = await Instructor.findOne({
            _id: quiz.instructor
        })

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${instructor.college}/assignments/${submission.quiz}/submissions/${req.params.submission}`,
        }

        uploadPlus(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))

            quiz = await addAttachmentMediaPaths([quiz])
            submission.quiz = quiz[0]

            return res.status(201).send(submission)
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// updated a course profiles
router.put('/updateGroupProfilePicture/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if course exist
        const group = await ChatGroup.findOne({
            _id: req.params.id
        })
        if (!group)
            return res.send(formatResult(404, `Group with code ${req.params.id} doens't exist`))

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${group.college}/chat/${req.params.id}`,
        }
        upload(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))
            if (group.profile) {
                fs.unlink(`${req.kuriousStorageData.dir}/${group.profile}`, (err) => {
                    if (err)
                        return res.send(formatResult(500, err))
                })
            }
            const updateDocument = await ChatGroup.findOneAndUpdate({
                _id: req.params.id
            }, {
                profile: req.file.filename
            }, {
                new: true
            })
            if (updateDocument) {
                updateDocument.profile = `http://${process.env.HOST}/kurious/file/groupProfilePicture/${req.params.id}/${updateDocument.profile}`
                return res.status(201).send(updateDocument)
            }
            return res.send(formatResult(500, "Error ocurred"))
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// export the router
module.exports = router