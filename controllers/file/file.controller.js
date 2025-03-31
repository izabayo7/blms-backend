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
    resizeImage
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
        const {
            model
        } = req.kuriousStorageData
        cb(null, `${model}-${normaliseDate(new Date().toISOString())}.${file.originalname.split('.')[file.originalname.split('.').length - 1]}`)
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
 * /kurious/file/collegeLogo/{id}:
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
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/collegeLogo/:id', async (req, res) => {
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

        filepath = `./uploads/colleges/${req.params.id}/${college.logo}`
        const pic = fs.readFileSync(filepath)
        res.contentType('image/jpeg')
        return res.status(200).send(pic)
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/superAdminProfile/{id}:
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
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/superAdminProfile/:id', async (req, res) => {
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

        path = `./uploads/system/superAdmin/${superAdmin.profile}`
        fs.exists(path, (exists) => {
            if (!exists) {
                return res.status(404).send(`${req.params.picture} was not found`)
            } else {
                const widthString = req.query.width
                const heightString = req.query.height
                const format = req.query.format

                // Parse to integer if possible
                let width, height
                if (widthString) {
                    width = parseInt(widthString)
                }
                if (heightString) {
                    height = parseInt(heightString)
                }
                // Set the content-type of the response
                res.type(`image/${format || 'png'}`)

                // Get the resized image
                resizeImage(path, format, width, height).pipe(res)
            }
        })
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/adminProfile/{id}:
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
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/adminProfile/:id', async (req, res) => {
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

        path = `./uploads/colleges/${admin.college}/users/admin/${admin.profile}`
        fs.exists(path, (exists) => {
            if (!exists) {
                return res.status(404).send(`${req.params.picture} was not found`)
            } else {
                const widthString = req.query.width
                const heightString = req.query.height
                const format = req.query.format

                // Parse to integer if possible
                let width, height
                if (widthString) {
                    width = parseInt(widthString)
                }
                if (heightString) {
                    height = parseInt(heightString)
                }
                // Set the content-type of the response
                res.type(`image/${format || 'png'}`)

                // Get the resized image
                resizeImage(path, format, width, height).pipe(res)
            }
        })
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/instructorProfile/{id}:
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
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/instructorProfile/:id', async (req, res) => {
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

        path = `./uploads/colleges/${instructor.college}/users/instructors/${req.params.id}/${instructor.profile}`
        fs.exists(path, (exists) => {
            if (!exists) {
                return res.status(404).send(`${req.params.picture} was not found`)
            } else {
                const widthString = req.query.width
                const heightString = req.query.height
                const format = req.query.format

                // Parse to integer if possible
                let width, height
                if (widthString) {
                    width = parseInt(widthString)
                }
                if (heightString) {
                    height = parseInt(heightString)
                }
                // Set the content-type of the response
                res.type(`image/${format || 'png'}`)

                // Get the resized image
                resizeImage(path, format, width, height).pipe(res)
            }
        })
    } catch (error) {
        return res.status(500).send(error)
    }
})
/**
 * @swagger
 * /kurious/file/studentProfile/{id}:
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
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/studentProfile/:id', async (req, res) => {
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

        path = `./uploads/colleges/${student.college}/users/students/${student.profile}`
        fs.exists(path, (exists) => {
            if (!exists) {
                return res.status(404).send(`${req.params.picture} was not found`)
            } else {
                const widthString = req.query.width
                const heightString = req.query.height
                const format = req.query.format

                // Parse to integer if possible
                let width, height
                if (widthString) {
                    width = parseInt(widthString)
                }
                if (heightString) {
                    height = parseInt(heightString)
                }
                // Set the content-type of the response
                res.type(`image/${format || 'png'}`)

                // Get the resized image
                resizeImage(path, format, width, height).pipe(res)
            }
        })
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/courseCoverPicture/{id}:
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
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/courseCoverPicture/:id', async (req, res) => {
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

        const facultyCollegeYear = await FacultyCollegeYear.findOne({
            _id: course.facultyCollegeYear
        })
        const facultyCollege = await FacultyCollege.findOne({
            _id: facultyCollegeYear.facultyCollege
        })

        path = `./uploads/colleges/${facultyCollege.college}/courses/${req.params.id}/${course.coverPicture}`
        fs.exists(path, (exists) => {
            if (!exists) {
                return res.status(404).send(`${req.params.picture} was not found`)
            } else {
                const widthString = req.query.width
                const heightString = req.query.height
                const format = req.query.format

                // Parse to integer if possible
                let width, height
                if (widthString) {
                    width = parseInt(widthString)
                }
                if (heightString) {
                    height = parseInt(heightString)
                }
                // Set the content-type of the response
                res.type(`image/${format || 'png'}`)

                // Get the resized image
                resizeImage(path, format, width, height).pipe(res)
            }
        })
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
 * /kurious/file/chapterMainVideo/{id}:
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
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/chapterMainVideo/:id', async (req, res) => {
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

        fs.stat(path, (err, stat) => {

            // Handle file not found
            if (err !== null && err.code === 'ENOENT') {
                res.sendStatus(404);
            }

            const fileSize = stat.size
            const range = req.headers.range
            if (range) {

                const parts = range.replace(/bytes=/, "").split("-");

                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(path, {
                    start,
                    end
                });
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                }

                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                }

                res.writeHead(200, head);
                fs.createReadStream(path).pipe(res);
            }
        });
    } catch (error) {
        return res.status(500).send(error)
    }
})

/**
 * @swagger
 * /kurious/file/quizAttachedFiles/{quiz}/{picture}:
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
router.get('/quizAttachedFiles/:quiz/:picture', async (req, res) => {
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

        path = `./uploads/colleges/${instructor.college}/users/instructors/${quiz.instructor}/unpublishedQuizAttachments/${req.params.quiz}/${req.params.picture}`

        fs.exists(path, (exists) => {
            if (!exists) {
                return res.status(404).send(`${req.params.picture} was not found`)
            } else {
                const widthString = req.query.width
                const heightString = req.query.height
                const format = req.query.format

                // Parse to integer if possible
                let width, height
                if (widthString) {
                    width = parseInt(widthString)
                }
                if (heightString) {
                    height = parseInt(heightString)
                }
                // Set the content-type of the response
                res.type(`image/${format || 'png'}`)

                // Get the resized image
                resizeImage(path, format, width, height).pipe(res)
            }
        })

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

        path = `./uploads/colleges/${instructor.college}/users/instructors/${quiz.instructor}/unpublishedQuizAttachments/${submission.quiz}/submissions/${req.params.submission}/${req.params.file}`

        fs.exists(path, (exists) => {
            if (!exists) {
                return res.status(404).send(`${req.params.picture} was not found`)
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
            model: 'college'
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
            if (updateDocument)
                return res.status(201).send(updateDocument)
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
            model: 'superAdmin'
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
            model: 'admin'
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
            model: 'instructor'
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

        const quiz = await Quiz.findOne({
            _id: req.params.quiz
        })
        if (!quiz)
            return res.status(404).send(`Quiz with code ${req.params.quiz} doens't exist`)

        const instructor = await Instructor.findOne({
            _id: quiz.instructor
        })

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${instructor.college}/users/instructors/${quiz.instructor}/unpublishedQuizAttachments/${req.params.quiz}`,
            model: 'quizAttachment'
        }

        uploadPlus(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)
            const questions = []
            for (const question of quiz.questions) {
                if (
                    question.type.includes("file") &&
                    question.options.choices.length > 0
                ) {
                    for (const index in question.options.choices) {
                        for (const f_index in req.files) {
                            if (question.options.choices[index].src === req.files[f_index].originalname) {
                                question.options.choices[index].src = req.files[f_index].filename
                            }
                        }
                    }
                }
                questions.push(question);
            }

            const updateDocument = await Quiz.findOneAndUpdate({
                _id: req.params.quiz
            }, {
                questions: questions
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
router.post('/submissionAttachedFiles/:submission', async (req, res) => {
    try {

        const {
            error
        } = validateObjectId(req.params.submission)
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

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${instructor.college}/users/instructors/${quiz.instructor}/unpublishedQuizAttachments/${submission.quiz}/submissions/${req.params.submission}`,
            model: 'submissionAttachment'
        }

        uploadPlus(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)
            const answers = []

            for (const i in quiz.questions) {
                if (
                    quiz.questions[i].type.includes("upload")
                ) {
                    for (const f_index in req.files) {
                        if (submission.answers[i].src === req.files[f_index].originalname) {
                            submission.answers[i].src = req.files[f_index].filename
                        }
                    }
                }
                answers.push(submission.answers[i])
            }

            const updateDocument = await QuizSubmission.findOneAndUpdate({
                _id: req.params.submission
            }, {
                answers: answers
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
            model: 'student'
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
            model: 'course'
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
            if (updateDocument)
                return res.status(201).send(updateDocument)
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
            model: 'mainVideo'
        }
        upload(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)

            if (chapter.mainVideo) {
                fs.unlink(`${req.kuriousStorageData.dir}/${chapter.mainVideo}`, (err) => {
                    if (err)
                        return res.status(500).send(err)
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
                return res.status(201).send('Chapter Main Video was successfully uploaded')
            return res.status(500).send("Error ocurred")
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// add an attachment
router.post('/addAttachments/:chapter', async (req, res) => {
    try {
        console.log(req)
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
            model: 'attachment'
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
router.post('/removeAttachment/:id', async (req, res) => {
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

            const deletedDocument = await Attachment.findOneAndDeconste({
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