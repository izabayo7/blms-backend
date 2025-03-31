// import dependencies
const { User_group } = require('../../models/user_group/user_group.model')
const { User_user_group } = require('../../models/user_user_group/user_user_group.model')
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
 *       coverPicture:
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

            let faculties = await findDocuments(Faculty, { college: req.user.college })
            for (const i in faculties) {
                let user_groups = await findDocuments(User_group, { faculty: faculties[i]._id })
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
        return res.send(formatResult(u, u, { total_courses }))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// not done
/**
 * @swagger
 * /course/statistics/user_access:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get User statistics of how user joined
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: start_date
 *         description: The starting date
 *         in: query
 *         required: true
 *         type: string
 *       - name: end_date
 *         description: The ending date
 *         in: query
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
router.get('/statistics/user_access', async (req, res) => {
    try {
        const { start_date, end_date } = req.query
        const result = await User.aggregate([
            { "$match": { createdAt: { $gt: date(start_date), $lte: date(end_date) } } },
            { "$match": { college: req.user.college } },
            {
                "$group": {
                    "_id": {
                        "$subtract": [
                            "$createdAt",
                            {
                                "$mod": [
                                    { "$subtract": ["$createdAt", date("1970-01-01T00:00:00.000Z")] },
                                    1000 * 60 * 60 * 24
                                ]
                            }
                        ]
                    },
                    "total_users": { "$sum": 1 }
                }
            },
            { "$sort": { "_id": 1 } }
        ])
        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})
// not done
/**
 * @swagger
 * /course/statistics/creations:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get User statistics of how courses are created per day
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: start_date
 *         description: The starting date
 *         in: query
 *         required: true
 *         type: string
 *       - name: end_date
 *         description: The ending date
 *         in: query
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
router.get('/statistics/creations', async (req, res) => {
    try {
        const { start_date, end_date } = req.query

        const faculty_college_years = []

        let faculty_college = await findDocuments(Faculty_college, { college: req.user.college })
        if (!faculty_college.length)
            return res.send(formatResult(404, 'courses not found'))

        for (const i in faculty_college) {
            let faculty_college_year = await findDocuments(Faculty_college_year, { faculty_college: faculty_college[i]._id })
            if (!faculty_college_year.length)
                continue

            for (const k in faculty_college_year) {
                faculty_college_years.push(faculty_college_year[k]._id.toString())
            }

        }

        const result = await Course.aggregate([
            { "$match": { createdAt: { $gt: date(start_date), $lte: date(end_date) } } },
            { "$match": { faculty_college_year: { $in: faculty_college_years } } },
            {
                "$group": {
                    "_id": {
                        "$subtract": [
                            "$createdAt",
                            {
                                "$mod": [
                                    { "$subtract": ["$createdAt", date("1970-01-01T00:00:00.000Z")] },
                                    1000 * 60 * 60 * 24
                                ]
                            }
                        ]
                    },
                    "total_courses": { "$sum": 1 }
                }
            },
            { "$sort": { "_id": 1 } }
        ])
        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})
// not done
/**
 * @swagger
 * /course/statistics/user_access:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get User statistics of how courses are accessed per day
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: start_date
 *         description: The starting date
 *         in: query
 *         required: true
 *         type: string
 *       - name: end_date
 *         description: The ending date
 *         in: query
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
router.get('/statistics/user_access', async (req, res) => {
    try {
        const { start_date, end_date } = req.query

        const faculty_college_years = []

        let faculty_college = await findDocuments(Faculty_college, { college: req.user.college })
        if (!faculty_college.length)
            return res.send(formatResult(404, 'courses not found'))

        for (const i in faculty_college) {
            let faculty_college_year = await findDocuments(Faculty_college_year, { faculty_college: faculty_college[i]._id })
            if (!faculty_college_year.length)
                continue

            for (const k in faculty_college_year) {
                faculty_college_years.push(faculty_college_year[k]._id.toString())
            }

        }

        const result = await Course.aggregate([
            { "$match": { createdAt: { $gt: date(start_date), $lte: date(end_date) } } },
            { "$match": { faculty_college_year: { $in: faculty_college_years } } },
            {
                "$group": {
                    "_id": {
                        "$subtract": [
                            "$createdAt",
                            {
                                "$mod": [
                                    { "$subtract": ["$createdAt", date("1970-01-01T00:00:00.000Z")] },
                                    1000 * 60 * 60 * 24
                                ]
                            }
                        ]
                    },
                    "total_courses": { "$sum": 1 }
                }
            },
            { "$sort": { "_id": 1 } }
        ])
        return res.send(formatResult(u, u, result))
    } catch (error) {
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
router.get('/college', async (req, res) => {
    try {
        /*
            let user_category = await findDocument(User_category, {
              name: 'INSTRUCTOR'
            })

            let users = await findDocuments(User, {
              college: req.params.id,
              category: user_category._id
            })
            if (!users.length)
              return res.send(formatResult(4040, `${college.name} course list is empty`))

            let foundCourses = []

            for (const user of users) {
              let courses = await findDocuments(Course, {
                user: user._id
              })
              if (courses.length > 0) {
                for (const course of courses) {
                  foundCourses.push(course)
                }
              }
            }
        */

        let foundCourses = []

        let faculty_college = await findDocuments(Faculty_college, { college: req.user.college })
        if (!faculty_college.length)
            return res.send(formatResult(404, 'courses not found'))

        for (const i in faculty_college) {
            let faculty_college_year = await findDocuments(Faculty_college_year, { faculty_college: faculty_college[i]._id })
            if (!faculty_college_year.length)
                continue

            for (const k in faculty_college_year) {
                let courses = await findDocuments(Course, {
                    faculty_college_year: faculty_college_year[k]._id
                })
                if (!courses.length)
                    continue

                for (const i in courses) {
                    let total_students = await countDocuments(User_progress, { course: courses[i]._id })
                    courses[i].total_students = total_students

                    let total_chapters = await countDocuments(Chapter, { course: courses[i]._id })
                    courses[i].total_topics = total_chapters

                    if (!courses[i].total_marks)
                        courses[i].total_marks = 0

                    foundCourses.push(courses[i])
                }
            }

        }

        // foundCourses = await injectUser(foundCourses, 'user')
        // foundCourses = await injectChapters(foundCourses)

        return res.send(formatResult(u, u, foundCourses))
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
router.get('/faculty/:id', async (req, res) => {
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

        let user_groups = await findDocuments(User_group, { faculty: faculty._id })

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

        if (foundCourses.length === 0)
            return res.send(formatResult(404, `${college.name} course list is empty`))

        // foundCourses = await injectUser(foundCourses, 'user')
        // foundCourses = await injectChapters(foundCourses)

        return res.send(formatResult(u, u, foundCourses))
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

        if (req.user.category.name == 'STUDENT') {
            const user_user_group = await findDocument(User_user_group, {
                user: req.user._id,
                status: "ACTIVE"
            })
            if (!user_user_group)
                return res.send(formatResult(200, undefined, []))

            result = await findDocuments(Course, {
                faculty_college_year: user_user_group.user_group,
                published: true
            })
            result = simplifyObject(result)
            result = await injectUserProgress(result, user._id + '')
            result = await injectUser(result, 'user')
        } else {
            result = await findDocuments(Course, {
                user: user._id
            })
            result = simplifyObject(result)
        }
        // ******* while adding permissions remember to filter data according to the user requesting *******


        result = await injectChapters(result)
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

        let faculty_college_year = await findDocument(Faculty_college_year, {
            _id: course.faculty_college_year
        })

        let faculty_college = await findDocument(Faculty_college, {
            _id: faculty_college_year.faculty_college
        })

        const path = addStorageDirectoryToPath(`./uploads/colleges/${faculty_college.college}/courses/${course._id}/${course.cover_picture}`)

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

        let faculty_college_year = await findDocument(Faculty_college_year, {
            _id: req.body.faculty_college_year
        })
        if (!faculty_college_year)
            return res.send(formatResult(404, 'faculty_college_year not found'))

        let user_category = await findDocument(User_category, {
            name: 'INSTRUCTOR'
        })

        let user = await findDocument(User, {
            user_name: req.body.user
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        if (user.category != user_category._id)
            return res.send(formatResult(404, 'user can\'t create course'))

        let course = await findDocument(Course, {
            name: req.body.name
        })
        if (course)
            return res.send(formatResult(403, 'name was taken'))

        let result = await createDocument(Course, {
            name: req.body.name,
            user: user._id,
            faculty_college_year: req.body.faculty_college_year,
            description: req.body.description
        })

        result = simplifyObject(result)
        console.log(result.data)
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

        let user_category = await findDocument(User_category, {
            name: 'INSTRUCTOR'
        })

        let user = await findDocument(User, {
            user_name: req.body.user
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        if (user.category != user_category._id)
            return res.send(formatResult(404, 'user can\'t create course'))

        // check if course exist
        let course = await findDocument(Course, {
            _id: req.params.id,
            user: user._id
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
        req.body.user = user._id
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

        let faculty_college_year = await findDocument(Faculty_college_year, {
            _id: course.faculty_college_year
        })

        let faculty_college = await findDocument(Faculty_college, {
            _id: faculty_college_year.faculty_college
        })
        const path = addStorageDirectoryToPath(`./uploads/colleges/${faculty_college.college}/courses/${req.params.id}`)
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

        let faculty_college_year = await findDocument(Faculty_college_year, {
            _id: course.faculty_college_year
        })

        let faculty_college = await findDocument(Faculty_college, {
            _id: faculty_college_year.faculty_college
        })

        const path = addStorageDirectoryToPath(`./uploads/colleges/${faculty_college.college}/courses/${req.params.id}`)


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

            const chapters = await findDocuments(Chapter, { course: req.params.id })

            if (chapters.length) {
                for (const i in chapters) {
                    await deleteDocument(Chapter, chapters[i]._id)
                }
            }

            const result = await deleteDocument(Course, req.params.id)

            let faculty_college_year = await findDocument(Faculty_college_year, {
                _id: course.faculty_college_year
            })

            let faculty_college = await findDocument(Faculty_college, {
                _id: faculty_college_year.faculty_college
            })

            const path = addStorageDirectoryToPath(`./uploads/colleges/${faculty_college.college}/courses/${req.params.id}`)
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