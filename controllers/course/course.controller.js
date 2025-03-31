// import dependencies
const {
    express,
    fs,
    Course,
    College_year,
    College,
    User,
    validate_course,
    User_faculty_college_year,
    Faculty_college_year,
    Faculty_college,
    Faculty,
    injectChapters,
    _,
    validateObjectId,
    StudentProgress,
    removeDocumentVersion,
    injectUser,
    simplifyObject,
    injecUserProgress,
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
    Compress_images
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
 *       published:
 *         type: boolean
 *     required:
 *       - name
 *       - user
 *       - faculty_college_year
 *       - description
 */

/**
 * @swagger
 * /course:
 *   get:
 *     tags:
 *       - Course
 *     description: Get all courses
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
 * /course/college/{id}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns courses in a specified college
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
router.get('/college/:id', async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        let college = await findDocument(College, {
            _id: req.params.id
        })
        if (!college)
            return res.send(formatResult(404, 'college not found'))
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

        let faculty_college = await findDocuments(Faculty_college, {college: req.params.id})
        if (!faculty_college.length)
            return res.send(formatResult(404, 'courses not found'))

        for (const i in faculty_college) {
            let faculty_college_year = await findDocuments(Faculty_college_year, {faculty_college: faculty_college[i]._id})
            if (!faculty_college_year.length)
                continue

            for (const k in faculty_college_year) {
                let courses = await findDocuments(Course, {
                    faculty_college_year: faculty_college_year[i]._id
                })
                if (!courses.length)
                    continue

                for (const course of courses) {
                    foundCourses.push(course)
                }
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
 * /course/user/{user_name}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns courses of a specified user
 *     parameters:
 *       - name: id
 *         description: User name
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
router.get('/user/:user_name', async (req, res) => {
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
            return res.send(formatResult(200, undefined, []))

        let result = await findDocuments(Course, {
            faculty_college_year: user_faculty_college_year.faculty_college_year
        })

        // ******* while adding permissions remember to filter data according to the user requesting *******

        result = simplifyObject(result)

        result = await injectChapters(result)
        result = await injectFaculty_college_year(result)
        let user_category = await findDocument(User_category, {
            _id: user.category
        })

        if (user_category.name == 'STUDENT') {
            result = await injecUserProgress(result, user._id)
            result = await injectUser(result, 'user')
        }

        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/user/{userId}/{courseName}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns a course with the specified name
 *     parameters:
 *       - name: userId
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
            course = await injecUserProgress(course, user._id)
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

        // course = await injectUser([course], 'user')
        // course = await injectChapters(course)
        // course = course[0]

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

        const path = `./uploads/colleges/${faculty_college.college}/courses/${course._id}/${course.cover_picture}`

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
            user: req.body.user,
            faculty_college_year: req.body.faculty_college_year,
            description: req.body.description
        })

        // result = simplifyObject(result)
        // result = await injectChapters([result])
        // result = await injectFaculty_college_year(result)

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
            publishedOn: !course.published ? now : undefined
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
            user: req.body.user
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
 *     description: Upload course cover_picture (file upload using swagger is still under construction)
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
        const path = `./uploads/colleges/${faculty_college.college}/courses/${req.params.id}`
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
            result.data.cover_picture = `http://${process.env.HOST}${process.env.BASE_PATH}/course/${course.name}/cover_picture/${result.data.cover_picture}`
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
 *     description: Remove course cover_picture (file upload using swagger is still under construction)
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

        if (!course.cover_picture || course.cover_picture !== req.params.file_name)
            return res.send(formatResult(404, 'file not found'))

        let faculty_college_year = await findDocument(Faculty_college_year, {
            _id: course.faculty_college_year
        })

        let faculty_college = await findDocument(Faculty_college, {
            _id: faculty_college_year.faculty_college
        })

        const path = `./uploads/colleges/${faculty_college.college}/courses/${req.params.id}`

        fs.unlink(`${path}/${course.cover_picture}`, (err) => {
            if (err)
                return res.send(formatResult(500, err))
        })

        course.cover_picture = undefined
        await course.save()

        return res.send(formatResult(200, 'DELETED', course))

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /course/{id}/cover_picture/{file_name}:
 *   delete:
 *     tags:
 *       - Course
 *     description: remove Course cover_picture
 *     parameters:
 *       - name: id
 *         description: Chapter id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: File name
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
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if college exist
        const course = await findDocument(Course, {
            _id: req.params.id
        }, u, false)
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
        const path = `./uploads/colleges/${faculty_college.college}/courses/${req.params.id}/${course.cover_picture}`

        fs.unlink(path, (err) => {
            if (err)
                return res.send(formatResult(500, err))
        })
        course.cover_picture = u
        await course.save()
        return res.send(formatResult(u, u, course))

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

            let faculty_college_year = await findDocument(Faculty_college_year, {
                _id: course.faculty_college_year
            })

            let faculty_college = await findDocument(Faculty_college, {
                _id: faculty_college_year.faculty_college
            })

            const path = `./uploads/colleges/${faculty_college.college}/courses/${req.params.id}`
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

// inject faculty college Year
async function injectFaculty_college_year(courses) {
    for (const i in courses) {
        const faculty_college_year = await findDocument(Faculty_college_year, {
            _id: courses[i].faculty_college_year
        }, {_v: 0}, true, false)

        courses[i].faculty_college_year = faculty_college_year

        const collegeYear = await findDocument(College_year, {
            _id: faculty_college_year.college_year
        }, {_v: 0}, true, false)
        courses[i].faculty_college_year.college_year = collegeYear

        const faculty_college = await findDocument(Faculty_college, {
            _id: faculty_college_year.faculty_college
        }, {_v: 0}, true, false)
        courses[i].faculty_college_year.faculty_college = faculty_college

        const faculty = await findDocument(Faculty, {
            _id: faculty_college.faculty
        }, {_v: 0}, true, false)
        courses[i].faculty_college_year.faculty_college.faculty = faculty

        const college = await findDocument(College, {
            _id: faculty_college.college
        }, {_v: 0}, true, false)

        courses[i].faculty_college_year.faculty_college.college = college
        if (courses[i].faculty_college_year.faculty_college.college.logo) {
            courses[i].faculty_college_year.faculty_college.college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}/${college.logo}`
        }
    }
    return courses
}

// export the router
module.exports = router