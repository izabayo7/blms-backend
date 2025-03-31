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
 * /file/groupProfilePicture/{id}/{file_name}:
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
            return res.send(formatResult(400, error.details[0].message))

        // check if course exist
        const group = await ChatGroup.findOne({
            _id: req.params.id
        })
        if (!group)
            return res.send(formatResult(404, `Group with code ${req.params.id} doens't exist`))

        if (!group.profile)
            return res.send(formatResult(404, `Group ${req.params.id} does not have a profile picture`))

        if (group.profile !== req.params.file_name)
            return res.send(formatResult(404, `${req.params.file_name} was not found`))

        path = `./uploads/colleges/${group.college}/chat/${req.params.id}/${group.profile}`
        sendResizedImage(req, res, path)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})





// updated a college logo
router.put('/updateCollegeLogo/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const college = await College.findOne({
            _id: req.params.id
        })
        if (!college)
            return res.send(formatResult(404, `College with code ${req.params.id} doens't exist`))

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${req.params.id}`,
        }

        upload(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))
            if (college.logo) {
                fs.unlink(`${req.kuriousStorageData.dir}/${college.logo}`, (err) => {
                    if (err)
                        return res.send(formatResult(500, err))
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
            return res.send(formatResult(500, "Error ocurred"))
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// updated a superAdmin profile
router.put('/updateSuperAdminProfile/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const superAdmin = await SuperAdmin.findOne({
            _id: req.params.id
        })
        if (!superAdmin)
            return res.send(formatResult(404, `SuperAdmin with code ${req.params.id} doens't exist`))

        req.kuriousStorageData = {
            dir: './uploads/system/superAdmin',
        }

        upload(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))
            if (superAdmin.profile) {
                fs.unlink(`${req.kuriousStorageData.dir}/${superAdmin.profile}`, (err) => {
                    if (err)
                        return res.send(formatResult(500, err))
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
            return res.send(formatResult(500, "Error ocurred"))
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// updated a admin profiles
router.put('/updateAdminProfile/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const admin = await Admin.findOne({
            _id: req.params.id
        })
        if (!admin)
            return res.send(formatResult(404, `Admin with code ${req.params.id} doens't exist`))

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${admin.college}/users/admin`,
        }

        upload(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))
            if (admin.profile) {
                fs.unlink(`${req.kuriousStorageData.dir}/${admin.profile}`, (err) => {
                    if (err)
                        return res.send(formatResult(500, err))
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
            return res.send(formatResult(500, "Error ocurred"))
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// updated a instructor profiles
router.put('/updateInstructorProfile/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const instructor = await Instructor.findOne({
            _id: req.params.id
        })
        if (!instructor)
            return res.send(formatResult(404, `Instructor with code ${req.params.id} doens't exist`))

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${instructor.college}/users/instructors/${req.params.id}`,
        }

        upload(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))
            if (instructor.profile) {
                fs.unlink(`${req.kuriousStorageData.dir}/${instructor.profile}`, (err) => {
                    if (err)
                        return res.send(formatResult(500, err))
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
            return res.send(formatResult(500, "Error ocurred"))
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

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

// updated a student profiles
router.put('/updateStudentProfile/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const student = await Student.findOne({
            _id: req.params.id
        })
        if (!student)
            return res.send(formatResult(404, `Student with code ${req.params.id} doens't exist`))

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${student.college}/users/students`,
        }

        upload(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))
            if (student.profile) {
                fs.unlink(`${req.kuriousStorageData.dir}/${student.profile}`, (err) => {
                    if (err)
                        return res.send(formatResult(500, err))
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
            return res.send(formatResult(500, "Error ocurred"))
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// updated a course profiles
router.put('/updateCourseCoverPicture/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const course = await Course.findOne({
            _id: req.params.id
        })
        if (!course)
            return res.send(formatResult(404, `Course with code ${req.params.id} doens't exist`))
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
                return res.send(formatResult(500, err.message))
            if (course.coverPicture) {
                fs.unlink(`${req.kuriousStorageData.dir}/${course.coverPicture}`, (err) => {
                    if (err)
                        return res.send(formatResult(500, err))
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
            return res.send(formatResult(500, "Error ocurred"))
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


// updated a chapter content
router.put('/updateChapterContent/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const chapter = await Chapter.findOne({
            _id: req.params.id
        })
        if (!chapter)
            return res.send(formatResult(404, `Chapter with code ${req.params.id} doens't exist`))

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
                res.send(formatResult(500, error))
            fs.writeFile(`${dir}/index.html`, req.body.content, (err) => {
                if (err)
                    return res.send(formatResult(500, err))
                return res.status(201).send('Content was successfully saved')
            })
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// update a mainVideo of chapter
router.put('/updateMainVideo/:chapter', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.chapter)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

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
                return res.send(formatResult(500, err.message))

            if (chapter.mainVideo) {
                fs.unlink(`${req.kuriousStorageData.dir}/${chapter.mainVideo}`, (err) => {
                    if (err) {
                        console.log(err)
                        return res.send(formatResult(500, err))
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
            return res.send(formatResult(500, "Error ocurred"))
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// add an attachment
router.post('/addAttachments/:chapter', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.chapter)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

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
                return res.send(formatResult(500, err.message))
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
        return res.send(formatResult(500, error))
    }
})

// remove an attachment
router.delete('/removeAttachment/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

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
                return res.send(formatResult(500, err))

            const deletedDocument = await Attachment.findOneAndDelete({
                _id: req.params.id
            })
            if (!deletedDocument)
                return res.send(formatResult(500, 'Attachment Not Deleted'))
            return res.status(200).send(`Attachment ${deletedDocument._id} Successfully deleted`)
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// export the router
module.exports = router