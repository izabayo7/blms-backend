// import dependencies
const {
    express,
    fs,
    multer,
    fileFilter,
    validateObjectId,
    FacultyCollegeYear,
    FacultyCollege,
    normaliseDate,
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
    addAttachmentMediaPaths
} = require('../../utils/imports')

// create router
const router = express.Router()

// configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const {
            dir
        } = req.kuriousStorageData
        fs.exists(dir, exist => {
            if (!exist) {
                return fs.mkdir(dir, {
                    recursive: true
                }, error => cb(error, dir))
            }
            return cb(null, dir)
        })
    },
    filename: (req, file, cb) => {
        cb(null, `${file.originalname}`)
    }
})

// file size limits needed
// type checking also needed

const upload = multer({
    storage: storage,
    // limits: {
    //     fileSize: 1024 * 1024 * 5
    // },
    // fileFilter: fileFilter
}).single('file')


// for multiple filies
const uploadPlus = multer({
    storage: storage
}).any()

/**
 * @swagger
 * definitions:
 *   FileUploading:
 *     description: This is not a model. Instead its apis for file uploading
 */

/**
 * @swagger
 * /kurious/file/collegeLogo/{id}/{file_name}:
 *   get:
 *     tags:
 *       - FileUploading
 *     description: Returns the logo of a specified college
 *     parameters:
 *       - name: id
 *         description: College id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: College logo file name
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
router.get('/collegeLogo/:id/:file_name', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if college exist
        const college = await College.findOne({
            _id: req.params.id
        })
        if (!college)
            return res.status(404).send(`College with code ${req.params.id} doens't exist`)

        if (!college.logo)
            return res.status(404).send(`College ${req.params.id} have not yet uploaded their logo`)

        if (college.logo !== req.params.file_name)
            return res.status(404).send(`${req.params.file_name} was not found`)

        path = `./uploads/colleges/${req.params.id}/${college.logo}`

        sendResizedImage(req, res, path)
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/superAdminProfile/{id}/{file_name}:
 *   get:
 *     tags:
 *       - FileUploading
 *     description: Returns the profilePicture of a SuperAdmin
 *     parameters:
 *       - name: id
 *         description: superAdmin's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: superAdmin's profile filename
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
router.get('/superAdminProfile/:id/:file_name', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if superAdmin exist
        const superAdmin = await SuperAdmin.findOne({
            _id: req.params.id
        })
        if (!superAdmin)
            return res.status(404).send(`SuperAdmin with code ${req.params.id} doens't exist`)

        if (!superAdmin.profile)
            return res.status(404).send(`SuperAdmin ${req.params.id} have not yet uploaded ${superAdmin.gender === 'Male' ? 'his' : 'her'} profile`)

        if (superAdmin.profile !== req.params.file_name)
            return res.status(404).send(`${req.params.file_name} was not found`)

        path = `./uploads/system/superAdmin/${superAdmin.profile}`
        sendResizedImage(req, res, path)
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/adminProfile/{id}/{file_name}:
 *   get:
 *     tags:
 *       - FileUploading
 *     description: Returns the profilePicture of a specified Admin
 *     parameters:
 *       - name: id
 *         description: Admin's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: Admin's profile filename
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
router.get('/adminProfile/:id/:file_name', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if admin exist
        const admin = await Admin.findOne({
            _id: req.params.id
        })
        if (!admin)
            return res.status(404).send(`Admin with code ${req.params.id} doens't exist`)

        if (!admin.profile)
            return res.status(404).send(`Admin ${req.params.id} have not yet uploaded ${admin.gender === 'Male' ? 'his' : 'her'} profile`)

        if (admin.profile !== req.params.file_name)
            return res.status(404).send(`${req.params.file_name} was not found`)

        path = `./uploads/colleges/${admin.college}/users/admin/${admin.profile}`
        sendResizedImage(req, res, path)
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/instructorProfile/{id}/{file_name}:
 *   get:
 *     tags:
 *       - FileUploading
 *     description: Returns the profilePicture of a specified Instructor
 *     parameters:
 *       - name: id
 *         description: Instructor's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: Instructor's profile filename
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
router.get('/instructorProfile/:id/:file_name', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if instructor exist
        const instructor = await Instructor.findOne({
            _id: req.params.id
        })
        if (!instructor)
            return res.status(404).send(`Instructor with code ${req.params.id} doens't exist`)

        if (!instructor.profile)
            return res.status(404).send(`Instructor ${req.params.id} have not yet uploaded ${instructor.gender === 'Male' ? 'his' : 'her'} profile`)

        if (instructor.profile !== req.params.file_name)
            return res.status(404).send(`${req.params.file_name} was not found`)

        path = `./uploads/colleges/${instructor.college}/users/instructors/${req.params.id}/${instructor.profile}`
        sendResizedImage(req, res, path)
    } catch (error) {
        return res.status(500).send(error)
    }
})
/**
 * @swagger
 * /kurious/file/studentProfile/{id}/{file_name}:
 *   get:
 *     tags:
 *       - FileUploading
 *     description: Returns the profilePicture of a specified Student
 *     parameters:
 *       - name: id
 *         description: Student's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: Student's profile filename
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
router.get('/studentProfile/:id/:file_name', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if student exist
        const student = await Student.findOne({
            _id: req.params.id
        })
        if (!student)
            return res.status(404).send(`Student with code ${req.params.id} doens't exist`)

        if (!student.profile)
            return res.status(404).send(`Student ${req.params.id} have not yet uploaded ${student.gender === 'Male' ? 'his' : 'her'} profile`)

        if (student.profile !== req.params.file_name)
            return res.status(404).send(`${req.params.file_name} was not found`)

        path = `./uploads/colleges/${student.college}/users/students/${student.profile}`
        sendResizedImage(req, res, path)
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/courseCoverPicture/{id}/{file_name}:
 *   get:
 *     tags:
 *       - FileUploading
 *     description: Returns the coverPicture of a specified Course
 *     parameters:
 *       - name: id
 *         description: Course's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: Course's coverPicture filename
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
router.get('/courseCoverPicture/:id/:file_name', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if course exist
        const course = await Course.findOne({
            _id: req.params.id
        })
        if (!course)
            return res.status(404).send(`Course with code ${req.params.id} doens't exist`)

        if (!course.coverPicture)
            return res.status(404).send(`Course ${req.params.id} does not have a cover picture`)

        if (course.coverPicture !== req.params.file_name)
            return res.status(404).send(`${req.params.file_name} was not found`)

        const facultyCollegeYear = await FacultyCollegeYear.findOne({
            _id: course.facultyCollegeYear
        })
        const facultyCollege = await FacultyCollege.findOne({
            _id: facultyCollegeYear.facultyCollege
        })

        path = `./uploads/colleges/${facultyCollege.college}/courses/${req.params.id}/${course.coverPicture}`
        sendResizedImage(req, res, path)
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/groupProfilePicture/{id}/{file_name}:
 *   get:
 *     tags:
 *       - FileUploading
 *     description: Returns the profilePicture of a specified Course
 *     parameters:
 *       - name: id
 *         description: Group's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: Groups's profilePicture filename
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
router.get('/groupProfilePicture/:id/:file_name', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if course exist
        const group = await ChatGroup.findOne({
            _id: req.params.id
        })
        if (!group)
            return res.status(404).send(`Group with code ${req.params.id} doens't exist`)

        if (!group.profile)
            return res.status(404).send(`Group ${req.params.id} does not have a profile picture`)

        if (group.profile !== req.params.file_name)
            return res.status(404).send(`${req.params.file_name} was not found`)

        path = `./uploads/colleges/${group.college}/chat/${req.params.id}/${group.profile}`
        sendResizedImage(req, res, path)
    } catch (error) {
        return res.status(500).send(error)
    }
})


/**
 * @swagger
 * /kurious/file/chapterDocument/{id}:
 *   get:
 *     tags:
 *       - FileUploading
 *     description: Returns the mainContent of a specified Chapter
 *     parameters:
 *       - name: id
 *         description: Chapter's id
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
router.get('/chapterDocument/:id', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if chapter exist
        const chapter = await Chapter.findOne({
            _id: req.params.id
        })
        if (!chapter)
            return res.status(404).send(`Chapter with code ${req.params.id} doens't exist`)

        const course = await Course.findOne({
            _id: chapter.course
        })
        const facultyCollegeYear = await FacultyCollegeYear.findOne({
            _id: course.facultyCollegeYear
        })
        const facultyCollege = await FacultyCollege.findOne({
            _id: facultyCollegeYear.facultyCollege
        })

        filepath = `./uploads/colleges/${facultyCollege.college}/courses/${chapter.course}/chapters/${req.params.id}/mainContent/index.html`
        const content = fs.readFileSync(filepath)
        return res.status(200).send(content)
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/chapterMainVideo/{id}/{file_name}:
 *   get:
 *     tags:
 *       - FileUploading
 *     description: Returns the mainVideo of a specified Chapter
 *     parameters:
 *       - name: id
 *         description: Chapter's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: Chapter's video filename
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
router.get('/chapterMainVideo/:id/:file_name', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if chapter exist
        const chapter = await Chapter.findOne({
            _id: req.params.id
        })
        if (!chapter)
            return res.status(404).send(`Chapter with code ${req.params.id} doens't exist`)

        if (!chapter.mainVideo)
            return res.status(404).send(`Chapter ${chapter.name} doesn't have a mainVideo`)

        if (chapter.mainVideo !== req.params.file_name)
            return res.status(404).send(`${req.params.file_name} was not found`)

        const course = await Course.findOne({
            _id: chapter.course
        })
        const facultyCollegeYear = await FacultyCollegeYear.findOne({
            _id: course.facultyCollegeYear
        })
        const facultyCollege = await FacultyCollege.findOne({
            _id: facultyCollegeYear.facultyCollege
        })

        path = `./uploads/colleges/${facultyCollege.college}/courses/${chapter.course}/chapters/${req.params.id}/video/${chapter.mainVideo}`

        streamVideo(req, res, path)
        
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/quizAttachedFiles/{quiz}/{file_name}:
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
            return res.status(400).send(error.details[0].message)

        const quiz = await Quiz.findOne({
            _id: req.params.quiz
        })
        if (!quiz)
            return res.status(404).send(`Quiz with code ${req.params.quiz} doens't exist`)

        const instructor = await Instructor.findOne({
            _id: quiz.instructor
        })

        path = `./uploads/colleges/${instructor.college}/assignments/${req.params.quiz}/${req.params.file_name}`

        sendResizedImage(req, res, path)

    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/submissionAttachedFiles/{submission}/{file}:
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
            return res.status(400).send(error.details[0].message)

        const submission = await QuizSubmission.findOne({
            _id: req.params.submission
        })
        if (!submission)
            return res.status(404).send(`QuizSubmission with code ${req.params.submission} doens't exist`)

        const quiz = await Quiz.findOne({
            _id: submission.quiz
        })
        if (!quiz)
            return res.status(404).send(`Quiz with code ${submission.quiz} doens't exist`)

        const instructor = await Instructor.findOne({
            _id: quiz.instructor
        })

        path = `./uploads/colleges/${instructor.college}/assignments/${submission.quiz}/submissions/${req.params.submission}/${req.params.file}`

        fs.exists(path, (exists) => {
            if (!exists) {
                return res.status(404).send(`${req.params.file_name} was not found`)
            } else {
                // katurebe
            }
        })



    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/getAttachments/{id}:
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
            return res.status(400).send(error.details[0].message)

        // check if chapter exist
        const chapter = await Chapter.findOne({
            _id: req.params.id
        })
        if (!chapter)
            return res.status(404).send(`Chapter with code ${req.params.id} doens't exist`)

        // fetch chapter attachments
        const attachments = await Attachment.find({
            chapter: req.params.id
        })
        if (attachments.length < 1)
            return res.status(404).send(`Chapter ${chapter.name} don't have attachmets`)

        return res.status(200).send(attachments)
    } catch (error) {
        return res.status(500).send(error)
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
            return res.status(400).send(error.details[0].message)

        // check if attachment exist
        const attachment = await Attachment.findOne({
            _id: req.params.id
        })
        if (!attachment)
            return res.status(404).send(`Attachment with code ${req.params.id} doens't exist`)

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
        return res.status(500).send(error)
    }
})

// download an attachment
router.get('/downloadAttachment/:id', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if attachment exist
        const attachment = await Attachment.findOne({
            _id: req.params.id
        })
        if (!attachment)
            return res.status(404).send(`Attachment with code ${req.params.id} doens't exist`)

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
        return res.status(500).send(error)
    }
})

// updated a college logo
router.put('/updateCollegeLogo/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const college = await College.findOne({
            _id: req.params.id
        })
        if (!college)
            return res.status(404).send(`College with code ${req.params.id} doens't exist`)

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${req.params.id}`,
        }

        upload(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)
            if (college.logo) {
                fs.unlink(`${req.kuriousStorageData.dir}/${college.logo}`, (err) => {
                    if (err)
                        return res.status(500).send(err)
                })
            }
            const updateDocument = await College.findOneAndUpdate({
                _id: req.params.id
            }, {
                logo: req.file.filename
            }, {
                new: true
            })
            if (updateDocument) {
                updateDocument.coverPicture = `http://${process.env.HOST}/kurious/file/collegeLogo/${req.params.id}/${updateDocument.logo}`
                return res.status(201).send(updateDocument)
            }
            return res.status(500).send("Error ocurred")
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// updated a superAdmin profile
router.put('/updateSuperAdminProfile/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const superAdmin = await SuperAdmin.findOne({
            _id: req.params.id
        })
        if (!superAdmin)
            return res.status(404).send(`SuperAdmin with code ${req.params.id} doens't exist`)

        req.kuriousStorageData = {
            dir: './uploads/system/superAdmin',
        }

        upload(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)
            if (superAdmin.profile) {
                fs.unlink(`${req.kuriousStorageData.dir}/${superAdmin.profile}`, (err) => {
                    if (err)
                        return res.status(500).send(err)
                })
            }
            const updateDocument = await SuperAdmin.findOneAndUpdate({
                _id: req.params.id
            }, {
                profile: req.file.filename
            }, {
                new: true
            })
            if (updateDocument)
                return res.status(201).send(updateDocument)
            return res.status(500).send("Error ocurred")
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// updated a admin profiles
router.put('/updateAdminProfile/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const admin = await Admin.findOne({
            _id: req.params.id
        })
        if (!admin)
            return res.status(404).send(`Admin with code ${req.params.id} doens't exist`)

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${admin.college}/users/admin`,
        }

        upload(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)
            if (admin.profile) {
                fs.unlink(`${req.kuriousStorageData.dir}/${admin.profile}`, (err) => {
                    if (err)
                        return res.status(500).send(err)
                })
            }
            const updateDocument = await Admin.findOneAndUpdate({
                _id: req.params.id
            }, {
                profile: req.file.filename
            }, {
                new: true
            })
            if (updateDocument)
                return res.status(201).send(updateDocument)
            return res.status(500).send("Error ocurred")
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// updated a instructor profiles
router.put('/updateInstructorProfile/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const instructor = await Instructor.findOne({
            _id: req.params.id
        })
        if (!instructor)
            return res.status(404).send(`Instructor with code ${req.params.id} doens't exist`)

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${instructor.college}/users/instructors/${req.params.id}`,
        }

        upload(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)
            if (instructor.profile) {
                fs.unlink(`${req.kuriousStorageData.dir}/${instructor.profile}`, (err) => {
                    if (err)
                        return res.status(500).send(err)
                })
            }
            const updateDocument = await Instructor.findOneAndUpdate({
                _id: req.params.id
            }, {
                profile: req.file.filename
            }, {
                new: true
            })
            if (updateDocument)
                return res.status(201).send(updateDocument)
            return res.status(500).send("Error ocurred")
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// add quiz attached images
router.post('/quizAttachedFiles/:quiz', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.quiz)
        if (error)
            return res.status(400).send(error.details[0].message)

        let quiz = await Quiz.findOne({
            _id: req.params.quiz
        }).lean()
        if (!quiz)
            return res.status(404).send(`Quiz with code ${req.params.quiz} doens't exist`)

        const instructor = await Instructor.findOne({
            _id: quiz.instructor
        })

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${instructor.college}/assignments/${req.params.quiz}`,
        }

        uploadPlus(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)

            quiz = await addAttachmentMediaPaths([quiz])

            return res.status(201).send(quiz[0])
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// add quiz attached images
router.post('/submissionAttachedFiles/:submission', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.submission)
        if (error)
            return res.status(400).send(error.details[0].message)

        let submission = await QuizSubmission.findOne({
            _id: req.params.submission
        }).lean()
        if (!submission)
            return res.status(404).send(`QuizSubmission with code ${req.params.submission} doens't exist`)

        let quiz = await Quiz.findOne({
            _id: submission.quiz
        }).lean()
        if (!quiz)
            return res.status(404).send(`Quiz with code ${submission.quiz} doens't exist`)

        const instructor = await Instructor.findOne({
            _id: quiz.instructor
        })

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${instructor.college}/assignments/${submission.quiz}/submissions/${req.params.submission}`,
        }

        uploadPlus(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)

            quiz = await addAttachmentMediaPaths([quiz])
            submission.quiz = quiz[0]

            return res.status(201).send(submission)
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// updated a student profiles
router.put('/updateStudentProfile/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const student = await Student.findOne({
            _id: req.params.id
        })
        if (!student)
            return res.status(404).send(`Student with code ${req.params.id} doens't exist`)

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${student.college}/users/students`,
        }

        upload(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)
            if (student.profile) {
                fs.unlink(`${req.kuriousStorageData.dir}/${student.profile}`, (err) => {
                    if (err)
                        return res.status(500).send(err)
                })
            }
            const updateDocument = await Student.findOneAndUpdate({
                _id: req.params.id
            }, {
                profile: req.file.filename
            }, {
                new: true
            })
            if (updateDocument)
                return res.status(201).send(updateDocument)
            return res.status(500).send("Error ocurred")
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// updated a course profiles
router.put('/updateCourseCoverPicture/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const course = await Course.findOne({
            _id: req.params.id
        })
        if (!course)
            return res.status(404).send(`Course with code ${req.params.id} doens't exist`)
        const facultyCollegeYear = await FacultyCollegeYear.findOne({
            _id: course.facultyCollegeYear
        })
        const facultyCollege = await FacultyCollege.findOne({
            _id: facultyCollegeYear.facultyCollege
        })

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${facultyCollege.college}/courses/${req.params.id}`,
        }
        upload(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)
            if (course.coverPicture) {
                fs.unlink(`${req.kuriousStorageData.dir}/${course.coverPicture}`, (err) => {
                    if (err)
                        return res.status(500).send(err)
                })
            }
            const updateDocument = await Course.findOneAndUpdate({
                _id: req.params.id
            }, {
                coverPicture: req.file.filename
            }, {
                new: true
            })
            if (updateDocument) {
                updateDocument.coverPicture = `http://${process.env.HOST}/kurious/file/courseCoverPicture/${req.params.id}/${updateDocument.coverPicture}`
                return res.status(201).send(updateDocument)
            }
            return res.status(500).send("Error ocurred")
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// updated a course profiles
router.put('/updateGroupProfilePicture/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if course exist
        const group = await ChatGroup.findOne({
            _id: req.params.id
        })
        if (!group)
            return res.status(404).send(`Group with code ${req.params.id} doens't exist`)

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${group.college}/chat/${req.params.id}`,
        }
        upload(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)
            if (group.profile) {
                fs.unlink(`${req.kuriousStorageData.dir}/${group.profile}`, (err) => {
                    if (err)
                        return res.status(500).send(err)
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
            return res.status(500).send("Error ocurred")
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})


// updated a chapter content
router.put('/updateChapterContent/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const chapter = await Chapter.findOne({
            _id: req.params.id
        })
        if (!chapter)
            return res.status(404).send(`Chapter with code ${req.params.id} doens't exist`)

        const course = await Course.findOne({
            _id: chapter.course
        })
        const facultyCollegeYear = await FacultyCollegeYear.findOne({
            _id: course.facultyCollegeYear
        })
        const facultyCollege = await FacultyCollege.findOne({
            _id: facultyCollegeYear.facultyCollege
        })

        const dir = `./uploads/colleges/${facultyCollege.college}/courses/${chapter.course}/chapters/${req.params.id}/mainContent`

        fs.createFile(`${dir}/index.html`, (error) => {
            if (error)
                res.status(500).send(error)
            fs.writeFile(`${dir}/index.html`, req.body.content, (err) => {
                if (err)
                    return res.status(500).send(err)
                return res.status(201).send('Content was successfully saved')
            })
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// update a mainVideo of chapter
router.put('/updateMainVideo/:chapter', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.chapter)
        if (error)
            return res.status(400).send(error.details[0].message)

        const chapter = await Chapter.findOne({
            _id: req.params.chapter
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

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${facultyCollege.college}/courses/${chapter.course}/chapters/${req.params.chapter}/video`,
        }
        upload(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)

            if (chapter.mainVideo) {
                fs.unlink(`${req.kuriousStorageData.dir}/${chapter.mainVideo}`, (err) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send(err)
                    }
                })
            }

            const updateDocument = await Chapter.findOneAndUpdate({
                _id: req.params.chapter
            }, {
                mainVideo: req.file.filename
            }, {
                new: true
            })
            if (updateDocument)
                return res.status(201).send({
                    message: 'Chapter Main Video was successfully uploaded',
                    filepath: `http://${process.env.HOST}/kurious/file/chapterMainVideo/${req.params.chapter}/${updateDocument.mainVideo}`
                })
            return res.status(500).send("Error ocurred")
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// add an attachment
router.post('/addAttachments/:chapter', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.chapter)
        if (error)
            return res.status(400).send(error.details[0].message)

        const chapter = await Chapter.findOne({
            _id: req.params.chapter
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

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${facultyCollege.college}/courses/${chapter.course}/chapters/${req.params.chapter}/attachments`,
        }
        let savedAttachments = []
        uploadPlus(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)
            const status = true
            for (const i in req.files) {
                const newDocument = new Attachment({
                    name: req.files[i].filename,
                    chapter: req.params.chapter
                })

                const saveDocument = await newDocument.save()
                if (!saveDocument) {
                    status = false
                    return res.status(400).send({
                        message: 'Erro occured',
                        index: i
                    })
                }
                savedAttachments.push(saveDocument)
            }
            return res.status(201).send(savedAttachments)
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// remove an attachment
router.delete('/removeAttachment/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const attachment = await Attachment.findOne({
            _id: req.params.id
        })
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


        fs.unlink(`./uploads/colleges/${facultyCollege.college}/courses/${chapter.course}/chapters/${attachment.chapter}/attachments/${attachment.name}`, async (err) => {
            if (err)
                return res.status(500).send(err)

            const deletedDocument = await Attachment.findOneAndDelete({
                _id: req.params.id
            })
            if (!deletedDocument)
                return res.status(500).send('Attachment Not Deleted')
            return res.status(200).send(`Attachment ${deletedDocument._id} Successfully deleted`)
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// export the router
module.exports = router