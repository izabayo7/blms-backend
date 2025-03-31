// import dependencies
const { express, fs, multer, fileFilter, validateObjectId, FacilityCollegeYear, FacilityCollege, normaliseDate, Attachment, Chapter, Course, SuperAdmin, Admin, Instructor, Student, College } = require('../../utils/imports')

// create router
const router = express.Router()

// configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { dir } = req.kuriousStorageData
        fs.exists(dir, exist => {
            if (!exist) {
                return fs.mkdir(dir, { recursive: true }, error => cb(error, dir))
            }
            return cb(null, dir)
        })
    },
    filename: (req, file, cb) => {
        const { model } = req.kuriousStorageData
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

// get college logo
router.get('/collegeLogo/:id', async (req, res) => {
    try {

        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if college exist
        const college = await College.findOne({ _id: req.params.id })
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
// get superAdmin profile
router.get('/superAdminProfile/:id', async (req, res) => {
    try {

        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if superAdmin exist
        const superAdmin = await SuperAdmin.findOne({ _id: req.params.id })
        if (!superAdmin)
            return res.status(404).send(`SuperAdmin with code ${req.params.id} doens't exist`)

        if (!superAdmin.profile)
            return res.status(404).send(`SuperAdmin ${req.params.id} have not yet uploaded ${superAdmin.gender === 'Male' ? 'his' : 'her'} profile`)

        filepath = `./uploads/system/superAdmin/${superAdmin.profile}`
        const pic = fs.readFileSync(filepath)
        res.contentType('image/jpeg')
        return res.status(200).send(pic)
    } catch (error) {
        return res.status(500).send(error)
    }
})
// get admin profile
router.get('/adminProfile/:id', async (req, res) => {
    try {
        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if admin exist
        const admin = await Admin.findOne({ _id: req.params.id })
        if (!admin)
            return res.status(404).send(`Admin with code ${req.params.id} doens't exist`)

        if (!admin.profile)
            return res.status(404).send(`Admin ${req.params.id} have not yet uploaded ${admin.gender === 'Male' ? 'his' : 'her'} profile`)

        filepath = `./uploads/colleges/${admin.college}/users/admin/${admin.profile}`
        const pic = fs.readFileSync(filepath)
        res.contentType('image/jpeg')
        return res.status(200).send(pic)
    } catch (error) {
        return res.status(500).send(error)
    }
})
// get instructor profile
router.get('/instructorProfile/:id', async (req, res) => {
    try {

        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if instructor exist
        const instructor = await Instructor.findOne({ _id: req.params.id })
        if (!instructor)
            return res.status(404).send(`Instructor with code ${req.params.id} doens't exist`)

        if (!instructor.profile)
            return res.status(404).send(`Instructor ${req.params.id} have not yet uploaded ${instructor.gender === 'Male' ? 'his' : 'her'} profile`)

        filepath = `./uploads/colleges/${instructor.college}/users/instructors/${instructor.profile}`
        const pic = fs.readFileSync(filepath)
        res.contentType('image/jpeg')
        return res.status(200).send(pic)
    } catch (error) {
        return res.status(500).send(error)
    }
})
// get student profile
router.get('/studentProfile/:id', async (req, res) => {
    try {

        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if student exist
        const student = await Student.findOne({ _id: req.params.id })
        if (!student)
            return res.status(404).send(`Student with code ${req.params.id} doens't exist`)

        if (!student.profile)
            return res.status(404).send(`Student ${req.params.id} have not yet uploaded ${student.gender === 'Male' ? 'his' : 'her'} profile`)

        filepath = `./uploads/colleges/${student.college}/users/students/${student.profile}`
        const pic = fs.readFileSync(filepath)
        res.contentType('image/jpeg')
        return res.status(200).send(pic)
    } catch (error) {
        return res.status(500).send(error)
    }
})
// get course coverPicture
router.get('/courseCoverPicture/:id', async (req, res) => {
    try {

        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if course exist
        const course = await Course.findOne({ _id: req.params.id })
        if (!course)
            return res.status(404).send(`Course with code ${req.params.id} doens't exist`)

        if (!course.coverPicture)
            return res.status(404).send(`Course ${req.params.id} does not have a cover picture`)

        const facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: course.facilityCollegeYear })
        const facilityCollege = await FacilityCollege.findOne({ _id: facilityCollegeYear.facilityCollege })

        filepath = `./uploads/colleges/${facilityCollege.college}/courses/${req.params.id}/${course.coverPicture}`
        const pic = fs.readFileSync(filepath)
        res.contentType('image/jpeg')
        return res.status(200).send(pic)
    } catch (error) {
        return res.status(500).send(error)
    }
})

// get chapter main document
router.get('/chapterDocument/:id', async (req, res) => {
    try {

        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if chapter exist
        const chapter = await Chapter.findOne({ _id: req.params.id })
        if (!chapter)
            return res.status(404).send(`Chapter with code ${req.params.id} doens't exist`)

        const course = await Course.findOne({ _id: chapter.course })
        const facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: course.facilityCollegeYear })
        const facilityCollege = await FacilityCollege.findOne({ _id: facilityCollegeYear.facilityCollege })

        filepath = `./uploads/colleges/${facilityCollege.college}/courses/${chapter.course}/chapters/${req.params.id}/mainContent/index.html`
        const content = fs.readFileSync(filepath)
        return res.status(200).send(content)
    } catch (error) {
        return res.status(500).send(error)
    }
})

// get chapter main document
router.get('/chapterMainVideo/:id', async (req, res) => {
    try {

        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if chapter exist
        const chapter = await Chapter.findOne({ _id: req.params.id })
        if (!chapter)
            return res.status(404).send(`Chapter with code ${req.params.id} doens't exist`)

        if (!chapter.mainVideo)
            return res.status(404).send(`Chapter ${chapter.name} doesn't have a mainVideo`)

        const course = await Course.findOne({ _id: chapter.course })
        const facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: course.facilityCollegeYear })
        const facilityCollege = await FacilityCollege.findOne({ _id: facilityCollegeYear.facilityCollege })

        path = `./uploads/colleges/${facilityCollege.college}/courses/${chapter.course}/chapters/${req.params.id}/video/${chapter.mainVideo}`

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
                const file = fs.createReadStream(path, { start, end });
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

// get attachments
router.get('/getAttachments/:id', async (req, res) => {
    try {

        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if chapter exist
        const chapter = await Chapter.findOne({ _id: req.params.id })
        if (!chapter)
            return res.status(404).send(`Chapter with code ${req.params.id} doens't exist`)

        // fetch chapter attachments
        const attachments = await Attachment.find({ chapter: req.params.id })
        if (attachments.length < 1)
            return res.status(404).send(`Chapter ${chapter.name} don't have attachmets`)

        return res.status(200).send(attachments)
    } catch (error) {
        return res.status(500).send(error)
    }
})

// get an attachment
router.get('/getAttachment/:id', async (req, res) => {
    try {

        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if attachment exist
        const attachment = await Attachment.findOne({ _id: req.params.id })
        if (!attachment)
            return res.status(404).send(`Attachment with code ${req.params.id} doens't exist`)

        const chapter = await Chapter.findOne({ _id: attachment.chapter })
        const course = await Course.findOne({ _id: chapter.course })
        const facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: course.facilityCollegeYear })
        const facilityCollege = await FacilityCollege.findOne({ _id: facilityCollegeYear.facilityCollege })

        filepath = `./uploads/colleges/${facilityCollege.college}/courses/${chapter.course}/chapters/${attachment.chapter}/attachments/${attachment.name}`
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

        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        // check if attachment exist
        const attachment = await Attachment.findOne({ _id: req.params.id })
        if (!attachment)
            return res.status(404).send(`Attachment with code ${req.params.id} doens't exist`)

        const chapter = await Chapter.findOne({ _id: attachment.chapter })
        const course = await Course.findOne({ _id: chapter.course })
        const facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: course.facilityCollegeYear })
        const facilityCollege = await FacilityCollege.findOne({ _id: facilityCollegeYear.facilityCollege })

        filepath = `./uploads/colleges/${facilityCollege.college}/courses/${chapter.course}/chapters/${attachment.chapter}/attachments/${attachment.name}`
        // res.setHeader('Content-Disposition', 'attachment')
        return res.download(filepath)
    } catch (error) {
        return res.status(500).send(error)
    }
})

// updated a college logo
router.put('/updateCollegeLogo/:id', async (req, res) => {
    try {
        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const college = await College.findOne({ _id: req.params.id })
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
            const updateDocument = await College.findOneAndUpdate({ _id: req.params.id }, { logo: req.file.filename }, { new: true })
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
        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const superAdmin = await SuperAdmin.findOne({ _id: req.params.id })
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
            const updateDocument = await SuperAdmin.findOneAndUpdate({ _id: req.params.id }, { profile: req.file.filename }, { new: true })
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
        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const admin = await Admin.findOne({ _id: req.params.id })
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
            const updateDocument = await Admin.findOneAndUpdate({ _id: req.params.id }, { profile: req.file.filename }, { new: true })
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
        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const instructor = await Instructor.findOne({ _id: req.params.id })
        if (!instructor)
            return res.status(404).send(`Instructor with code ${req.params.id} doens't exist`)

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${instructor.college}/users/instructors`,
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
            const updateDocument = await Instructor.findOneAndUpdate({ _id: req.params.id }, { profile: req.file.filename }, { new: true })
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
        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const student = await Student.findOne({ _id: req.params.id })
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
            const updateDocument = await Student.findOneAndUpdate({ _id: req.params.id }, { profile: req.file.filename }, { new: true })
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
        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const course = await Course.findOne({ _id: req.params.id })
        if (!course)
            return res.status(404).send(`Course with code ${req.params.id} doens't exist`)
        const facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: course.facilityCollegeYear })
        const facilityCollege = await FacilityCollege.findOne({ _id: facilityCollegeYear.facilityCollege })

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${facilityCollege.college}/courses/${req.params.id}`,
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
            const updateDocument = await Course.findOneAndUpdate({ _id: req.params.id }, { coverPicture: req.file.filename }, { new: true })
            if (updateDocument)
                return res.status(201).send(updateDocument)
            return res.status(500).send("Error ocurred")
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// updated a chapter content
router.post('/updateChapterContent/:id', async (req, res) => {
    try {
        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const chapter = await Chapter.findOne({ _id: req.params.id })
        if (!chapter)
            return res.status(404).send(`Chapter with code ${req.params.id} doens't exist`)

        const course = await Course.findOne({ _id: chapter.course })
        const facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: course.facilityCollegeYear })
        const facilityCollege = await FacilityCollege.findOne({ _id: facilityCollegeYear.facilityCollege })

        const dir = `./uploads/colleges/${facilityCollege.college}/courses/${chapter.course}/chapters/${req.params.id}/mainContent`

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

// add a mainVideo to chapter
router.post('/addMainVideo/:chapter', async (req, res) => {
    try {
        const { error } = validateObjectId(req.params.chapter)
        if (error)
            return res.status(400).send(error.details[0].message)

        const chapter = await Chapter.findOne({ _id: req.params.chapter })
        const course = await Course.findOne({ _id: chapter.course })
        const facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: course.facilityCollegeYear })
        const facilityCollege = await FacilityCollege.findOne({ _id: facilityCollegeYear.facilityCollege })

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${facilityCollege.college}/courses/${chapter.course}/chapters/${req.params.chapter}/video`,
            model: 'mainVideo'
        }
        upload(req, res, async (err) => {
            if (err)
                return res.status(500).send(err.message)
            const updateDocument = await Chapter.findOneAndUpdate({ _id: req.params.chapter }, { mainVideo: req.file.filename }, { new: true })
            if (updateDocument)
                return res.status(201).send('Chapter Main Video was successfully uploaded')
            return res.status(500).send("Error ocurred")
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// add an attachment
router.post('/AddAttachments/:chapter', async (req, res) => {
    try {
        const { error } = validateObjectId(req.params.chapter)
        if (error)
            return res.status(400).send(error.details[0].message)

        const chapter = await Chapter.findOne({ _id: req.params.chapter })
        const course = await Course.findOne({ _id: chapter.course })
        const facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: course.facilityCollegeYear })
        const facilityCollege = await FacilityCollege.findOne({ _id: facilityCollegeYear.facilityCollege })

        req.kuriousStorageData = {
            dir: `./uploads/colleges/${facilityCollege.college}/courses/${chapter.course}/chapters/${req.params.chapter}/attachments`,
            model: 'attachment'
        }
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
                    return res.status(400).send({ message: 'Erro occured', index: i })
                }
            }
            return res.status(201).send({ message: 'All attachments were successfully uploaded' })
        })

    } catch (error) {
        return res.status(500).send(error)
    }
})

// remove an attachment
router.post('/removeAttachment/:id', async (req, res) => {
    try {
        const { error } = validateObjectId(req.params.id)
        if (error)
            return res.status(400).send(error.details[0].message)

        const attachment = await Attachment.findOne({ _id: req.params.id })
        const chapter = await Chapter.findOne({ _id: attachment.chapter })
        const course = await Course.findOne({ _id: chapter.course })
        const facilityCollegeYear = await FacilityCollegeYear.findOne({ _id: course.facilityCollegeYear })
        const facilityCollege = await FacilityCollege.findOne({ _id: facilityCollegeYear.facilityCollege })


        fs.unlink(`./uploads/colleges/${facilityCollege.college}/courses/${chapter.course}/chapters/${attachment.chapter}/attachments/${attachment.name}`, async (err) => {
            if (err)
                return res.status(500).send(err)

            const deletedDocument = await Attachment.findOneAndDeconste({ _id: req.params.id })
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
