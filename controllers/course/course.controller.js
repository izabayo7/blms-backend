// import dependencies
const {Live_session} = require("../../utils/imports");
const {User_attendance} = require("../../models/user_attendance/user_attendance.model");
const {Quiz_submission} = require("../../utils/imports");
const {add_user_details} = require("../../utils/imports");
const {filterUsers} = require("../../middlewares/auth.middleware");
const {User_group} = require('../../models/user_group/user_group.model')
const {User_user_group} = require('../../models/user_user_group/user_user_group.model')
const {
    express,
    fs,
    Course,
    College,
    User,
    validate_course,
    User_faculty_college_year,
    Faculty_college_year,
    Faculty_college,
    injectChapters,
    _,
    validateObjectId,
    Comment,
    injectUser,
    simplifyObject,
    injectUserProgress,
    findDocuments,
    formatResult,
    findDocument,
    User_category,
    u,
    createDocument,
    updateDocument,
    deleteDocument,
    User_progress,
    Quiz,
    Chapter,
    sendResizedImage,
    upload_single_image,
    injectFaculty_college_year,
    addStorageDirectoryToPath,
    Faculty,
    countDocuments,
    date
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Course:
 *     properties:
 *       name:
 *         type: string
 *       user:
 *         type: string
 *       faculty_college_year:
 *         type: string
 *       description:
 *         type: string
 *       cover_picture:
 *         type: string
 *       maximum_marks:
 *         type: number
 *       published:
 *         type: boolean
 *     required:
 *       - name
 *       - user
 *       - faculty_college_year
 *       - description
 *       - maximum_marks
 */

/**
 * @swagger
 * /course:
 *   get:
 *     tags:
 *       - Course
 *     description: Get all courses
 *     security:
 *       - bearerAuth: -[]
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/', async (req, res) => {
    try {

        let result = await findDocuments(Course)

        if (result.length === 0)
            return res.send(formatResult(404, 'Course list is empty'))

        result = simplifyObject(result)
        result = await injectUser(result, 'user')
        result = await injectChapters(result)

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/statistics:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get Courses statistics
 *     security:
 *       - bearerAuth: -[]
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/statistics', async (req, res) => {
    try {
        let total_courses = 0
        if (req.user.category.name == "SUPERADMIN") {
            total_courses = await countDocuments(Course)
        } else {

            let faculties = await findDocuments(Faculty, {college: req.user.college})
            for (const i in faculties) {
                let user_groups = await findDocuments(User_group, {faculty: faculties[i]._id})
                if (!user_groups.length)
                    continue

                for (const k in user_groups) {
                    let courses = await countDocuments(Course, {
                        user_group: user_groups[k]._id
                    })
                    total_courses += courses
                }

            }
        }
        return res.send(formatResult(u, u, {total_courses}))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/statistics/user:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get Courses statistics for a user
 *     security:
 *       - bearerAuth: -[]
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/statistics/user', async (req, res) => {
    try {
        let total_courses = 0
        if (req.user.category.name == "INSTRUCTOR") {

            let courses = await Course.find({user: req.user._id}, {_id: 1, name: 1})
            const course_ids = courses.map(x => x._id.toString())
            let students = await User_progress.distinct('user', {course: {$in: course_ids}})

            let chapters = await Chapter.find({course: {$in: course_ids}}, {_id: 1, name: 1, course: 1})

            let comments = await Comment.find({
                "target.type": 'chapter',
                "target.id": {$in: chapters.map(x => x._id.toString())}
            }).populate('sender',
                {sur_name: 1, other_names: 1, user_name: 1, _id: 0}
            ).sort({_id: -1}).limit(4)

            comments = simplifyObject(comments)

            for (const i in comments) {
                for (const iKey in chapters) {
                    if (chapters[iKey]._id.toString() === comments[i].target.id) {
                        comments[i].chapter = chapters[iKey].name
                        comments[i].course = courses.filter(x => x._id.toString() === chapters[iKey].course)[0]
                        break
                    }
                }
            }

            return res.send(formatResult(u, u, {
                total_courses: courses.length,
                total_students: students.length,
                latestComments: comments
            }))
        }
    } catch
        (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/statistics/course/{id}:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get Courses statistics for students in a course
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Course id
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
router.get('/statistics/course/:id', filterUsers(["INSTRUCTOR"]), async (req, res) => {
    try {
        let course = await Course.findOne({user: req.user._id, _id: req.params.id})
        if (!course)
            return res.send(formatResult(404, 'course not found'))

        let students_progress = await User_progress.find({course: req.params.id})

        let students = await User.find({_id: {$in: students_progress.map(x => x.user.toString())}})
        students = await add_user_details(students)


        let chapters = await Chapter.find({course: req.params.id}, {_id: 1, name: 1})

        let quiz = await Quiz.find({
            "target.type": "chapter",
            "target.id": {$in: chapters.map(x => x._id.toString())}
        }, {_id: 1})

        const submissions = await Quiz_submission.find({
            marked: true,
            quiz: {$in: quiz.map(x => x._id.toString())}
        }).populate('quiz',
            {total_marks: 1}
        ).sort({_id: -1})

        let live_sessions = await Live_session.find({
            "target.type": "chapter",
            "target.id": {$in: chapters.map(x => x._id.toString())}
        }, {_id: 1})

        const attendances = await User_attendance.find({
            live_session: {$in: live_sessions.map(x => x._id.toString())}
        }).populate('live_session',
            {attendance_check: 1, _id: 0}
        )

        let total_required_marks = 0
        let total_got_marks = 0
        let total_attendance = 0


        for (const i in students) {
            for (const iKey in students_progress) {
                if (students_progress[iKey].user.toString() === students[i]._id.toString()) {
                    students[i].progress = students_progress[iKey].progress
                    break
                }
            }
            let student_required_marks = 0
            let student_got_marks = 0
            for (const iKey in submissions) {
                if (submissions[iKey].user.toString() === students[i]._id.toString()) {
                    student_required_marks += submissions[iKey].quiz.total_marks
                    student_got_marks += submissions[iKey].total_marks
                }
            }

            if (student_required_marks) {
                total_required_marks += student_required_marks
                total_got_marks += student_got_marks
                students[i].perfomance = (student_got_marks / student_required_marks) * 100
            } else {
                students[i].perfomance = 0
            }

            let student_total_attendance = 0
            let student_attendance_count = 0

            for (const iKey in attendances) {
                if (attendances[iKey].user.toString() === students[i]._id.toString()) {
                    console.log(attendances[iKey].attendance)
                    student_total_attendance += (attendances[iKey].attendance / attendances[iKey].live_session.attendance_check)
                    student_attendance_count++
                    break
                }
            }

            if (student_attendance_count) {
                total_attendance += (student_total_attendance / student_attendance_count)
                students[i].attendance = (student_total_attendance / student_attendance_count)
            } else {
                students[i].attendance = 0
            }

            if (!students[i].perfomance)
                students[i].perfomance = 0
        }

        return res.send(formatResult(u, u, {
            students: students,
            total_perfomance: total_required_marks ? (total_got_marks / total_required_marks) * 100 : 0,
            total_attendance: students.length ? total_attendance / students.length : 0
        }))
    } catch
        (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /course/college:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns courses in a specified college
 *     security:
 *       - bearerAuth: -[]
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/college', filterUsers("ADMIN"), async (req, res) => {
    try {

        let faculty_college = await findDocuments(Faculty, {college: req.user.college})

        const user_groups = await User_group.find({faculty: {$in: faculty_college.map(x => x._id.toString())}})
        const courses = await Course.find({user_group: {$in: user_groups.map(x => x._id.toString())}, published: true})

        return res.send(formatResult(u, u, courses))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/faculty/{id}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns courses in a specified faculty in your college
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Faculty id
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
router.get('/faculty/:id', filterUsers(["ADMIN"]), async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let faculty = await findDocument(Faculty, {
            _id: req.params.id
        })
        if (!faculty)
            return res.send(formatResult(404, 'faculty not found'))

        let foundCourses = []

        let user_groups = await findDocuments(User_group, {faculty: faculty._id, status: "ACTIVE"})

        for (const k in user_groups) {
            let courses = await findDocuments(Course, {
                user_group: user_groups[k]._id
            })
            if (!courses.length)
                continue

            for (const course of courses) {
                foundCourses.push(course)
            }


        }

        foundCourses = await injectUser(foundCourses, 'user')
        foundCourses = await injectChapters(foundCourses)
        foundCourses = await injectFaculty_college_year(foundCourses)

        return res.send(formatResult(u, u, foundCourses))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

//

/**
 * @swagger
 * /course/{id}/attendants:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns students who studies the given course
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Course id
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
router.get('/:id/attendants', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let course = await findDocument(Course, {
            _id: req.params.id
        })
        if (!course)
            return res.send(formatResult(404, 'course not found'))

        const attendants = await User_progress.find({course: req.params.id}, {
            user: 1,
            progress: 1,
            createdAt: 1
        }).populate({
            path: 'user',
            select: {'sur_name': 1, 'other_names': 1, 'gender': 1}
        })

        return res.send(formatResult(u, u, attendants))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/user:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns courses of a specified user
 *     security:
 *       - bearerAuth: -[]
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/user', async (req, res) => {
    try {
        let result
        if (req.user.category.name === 'STUDENT') {
            const user_user_group = await findDocuments(User_user_group, {
                user: req.user._id,
                status: "ACTIVE"
            }, {user_group: 1})
            if (!user_user_group.length)
                return res.send(formatResult(200, undefined, []))

            result = await Course.find({
                user_group: {$in: user_user_group.map(x => x.user_group.toString())},
                published: true
            }).sort({createdAt: -1})

            result = simplifyObject(result)
            result = await injectUserProgress(result, req.user._id + '')
            result = await injectUser(result, 'user')
        } else {
            result = await Course.find({
                user: req.user._id
            }).sort({createdAt: -1})
            result = simplifyObject(result)
        }
        // ******* while adding permissions remember to filter data according to the user requesting *******


        result = await injectChapters(result, req.user.category.name == 'STUDENT' ? req.user._id : undefined)
        result = await injectFaculty_college_year(result)

        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/user/{user_name}/{courseName}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns a course with the specified name
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: user_name
 *         description: User id
 *         in: path
 *         required: true
 *         type: string
 *       - name: courseName
 *         description: Course name
 *         in: path
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/user/:user_name/:courseName', async (req, res) => {
    try {
        let user = await findDocument(User, {
            user_name: req.params.user_name
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        const user_faculty_college_year = await findDocument(User_faculty_college_year, {
            user: user._id,
            status: 1
        })
        if (!user_faculty_college_year)
            return res.send(formatResult(404, 'course not found'))

        let course = await findDocument(Course, {
            faculty_college_year: user_faculty_college_year.faculty_college_year,
            name: req.params.courseName
        })

        // ******* while adding permissions remember to filter data according to the user requesting *******

        if (!course)
            return res.send(formatResult(404, 'course not found'))

        course = simplifyObject(course)
        course = await injectChapters([course])
        course = await injectFaculty_college_year(course)

        let user_category = await findDocument(User_category, {
            _id: user.category
        })

        if (user_category.name == 'STUDENT') {
            course = await injectUserProgress(course, user._id)
            course = await injectUser(course, 'user')
        }

        course = course[0]

        return res.status(200).send(formatResult(u, u, course))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/{id}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns a specific course
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Course id
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
router.get('/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let course = await findDocument(Course, {
            _id: req.params.id
        })

        if (!course)
            return res.send(formatResult(404, 'course not found'))

        course = await injectUser([course], 'user')
        course = await injectChapters(course)
        course = course[0]

        return res.send(course)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/{course_name}/cover_picture/{file_name}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns the cover_picture of a specified course
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: course_name
 *         description: Course name
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: File name
 *         in: path
 *         required: true
 *         type: string
 *       - name: format
 *         description: File format one of (jpeg, jpg, png, webp)
 *         in: query
 *         type: string
 *       - name: height
 *         description: custom height
 *         in: query
 *         type: string
 *       - name: width
 *         description: custom width
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/:course_name/cover_picture/:file_name', async (req, res) => {
    try {

        // check if college exist
        const course = await findDocument(Course, {
            name: req.params.course_name
        })
        if (!course)
            return res.send(formatResult(404, 'course not found'))

        if (!course.cover_picture || course.cover_picture !== req.params.file_name)
            return res.send(formatResult(404, 'file not found'))

        const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/courses/${course._id}/${course.cover_picture}`)

        sendResizedImage(req, res, path)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course:
 *   post:
 *     tags:
 *       - Course
 *     description: Create course
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a course
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Course'
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.post('/', async (req, res) => {
    try {
        const {
            error
        } = validate_course(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))
        let user_group = await findDocument(User_group, {
            _id: req.body.user_group
        })
        if (!user_group)
            return res.send(formatResult(404, 'User_group not found'))

        if (req.user.category.name != "INSTRUCTOR")
            return res.send(formatResult(404, 'you can\'t create course'))

        let course = await findDocument(Course, {
            name: req.body.name
        })
        if (course)
            return res.send(formatResult(403, 'name was taken'))

        let result = await createDocument(Course, {
            name: req.body.name,
            user: req.user._id,
            user_group: req.body.user_group,
            description: req.body.description,
            maximum_marks: req.body.maximum_marks
        })

        result = simplifyObject(result)
        result.data = await injectFaculty_college_year([result.data])
        result.data = result.data[0]
        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/toogle_publishment_status/{id}:
 *   put:
 *     tags:
 *       - Course
 *     description: Publish or unPublish a course
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Course id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.put('/toogle_publishment_status/:id', async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if course exist
        let course = await findDocument(Course, {
            _id: req.params.id
        })
        if (!course)
            return res.send(formatResult(404, 'course not found'))

        const now = new Date()

        const updateObject = {
            published: !course.published,
            published_on: !course.published ? now : undefined
        }

        let result = await updateDocument(Course, req.params.id, updateObject)

        // result = await injectFaculty_college_year([result])
        // result = result[0]

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/{id}:
 *   put:
 *     tags:
 *       - Course
 *     description: Update course
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Course id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: Fields for a course
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Course'
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.put('/:id', async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        error = validate_course(req.body)
        error = error.error
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let user_group = await findDocument(User_group, {
            _id: req.body.user_group
        })
        if (!user_group)
            return res.send(formatResult(404, 'User_group not found'))

        if (req.user.category.name != "INSTRUCTOR")
            return res.send(formatResult(404, 'you can\'t create course'))

        // check if course exist
        let course = await findDocument(Course, {
            _id: req.params.id,
            user: req.user._id
        })
        if (!course)
            return res.send(formatResult(404, 'course not found'))

        course = await findDocument(Course, {
            _id: {
                $ne: req.params.id
            },
            name: req.body.name
        })
        if (course)
            return res.send(formatResult(403, 'name was taken'))
        req.body.user = req.user._id
        const result = await updateDocument(Course, req.params.id, req.body)

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/{id}/cover_picture:
 *   put:
 *     tags:
 *       - Course
 *     description: Upload course cover_picture
 *     security:
 *       - bearerAuth: -[]
 *     consumes:
 *        - multipart/form-data
 *     parameters:
 *       - name: id
 *         description: Course id
 *         in: path
 *         required: true
 *         type: string
 *       - in: formData
 *         name: file
 *         type: file
 *         description: course coverpicture to upload.
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.put('/:id/cover_picture', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if college exist
        const course = await findDocument(Course, {
            _id: req.params.id
        })
        if (!course)
            return res.send(formatResult(404, 'course not found'))

        const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/courses/${req.params.id}`)
        req.kuriousStorageData = {
            dir: path,
        }
        upload_single_image(req, res, async (err) => {
            if (err)
                return res.send(formatResult(500, err.message))

            if (course.cover_picture && course.cover_picture != req.file.filename) {
                fs.unlink(`${path}/${course.cover_picture}`, (err) => {
                    if (err)
                        return res.send(formatResult(500, err))
                })
            }
            const result = await updateDocument(Course, req.params.id, {
                cover_picture: req.file.filename
            })
            result.data.cover_picture = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/course/${course.name}/cover_picture/${result.data.cover_picture}`
            return res.send(result)
        })

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/{id}/cover_picture:
 *   delete:
 *     tags:
 *       - Course
 *     description: Remove course cover_picture
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Course id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.delete('/:id/cover_picture/:file_name', async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if college exist
        const course = await findDocument(Course, {
            _id: req.params.id
        }, undefined, false)
        if (!course)
            return res.send(formatResult(404, 'course not found'))

        if (!course.cover_picture || course.cover_picture !== req.params.file_name)
            return res.send(formatResult(404, 'file not found'))

        const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/courses/${req.params.id}`)


        fs.unlink(`${path}/${course.cover_picture}`, (err) => {
            error = err
        })

        if (error)
            return res.send(formatResult(500, error))

        course.cover_picture = undefined
        await course.save()

        return res.send(formatResult(200, 'DELETED', course))

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /course/{id}:
 *   delete:
 *     tags:
 *       - Course
 *     description: Delete a course
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Course id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.delete('/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let course = await findDocument(Course, {
            _id: req.params.id
        })
        if (!course)
            return res.send(formatResult(404, 'course not found'))

        // check if the course is never used
        let course_used = false

        const progress = await findDocument(User_progress, {
            course: req.params.id
        })
        if (progress)
            course_used = true

        const quiz = await findDocument(Quiz, {
            "target.id": req.params.id
        })
        if (quiz)
            course_used = true

        if (!course_used) {

            const chapters = await findDocuments(Chapter, {course: req.params.id})

            if (chapters.length) {
                for (const i in chapters) {
                    await deleteDocument(Chapter, chapters[i]._id)
                }
            }

            const result = await deleteDocument(Course, req.params.id)


            const path = addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}/courses/${req.params.id}`)
            fs.exists(path, (exists) => {
                if (exists) {
                    fs.remove(path)
                }
            })

            return res.send(result)
        }

        const updated_course = await updateDocument(Course, req.params.id, {
            status: 0
        })
        return res.send(formatResult(200, 'Course couldn\'t be deleted because it was used, instead it was disabled', updated_course.data))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// export the router
module.exports = router
