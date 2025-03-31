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
  injectStudentProgress,
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
  Chapter
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

    if (result.data.length === 0)
      return res.send(formatResult(404, 'Course list is empty'))

    // result.data = await injectUser(result.data, 'user')
    // result.data = await injectChapters(result.data)

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
    if (!college.data)
      return res.send(formatResult(404, 'college not found'))
    /*
        let user_category = await findDocument(User_category, {
          name: 'INSTRUCTOR'
        })
    
        let users = await findDocuments(User, {
          college: req.params.id,
          category: user_category.data._id
        })
        if (!users.data.length)
          return res.send(formatResult(4040, `${college.data.name} course list is empty`))
    
        let foundCourses = []
    
        for (const user of users.data) {
          let courses = await findDocuments(Course, {
            user: user._id
          })
          if (courses.data.length > 0) {
            for (const course of courses.data) {
              foundCourses.push(course)
            }
          }
        }
    */

    let foundCourses = []

    let faculty_college = await findDocuments(Faculty_college, { college: req.params.id })
    if (!faculty_college.data.length)
      return res.send(formatResult(404, 'courses not found'))

    for (const i in faculty_college.data) {
      let faculty_college_year = await findDocuments(Faculty_college_year, { faculty_college: faculty_college.data[i]._id })
      if (!faculty_college_year.data.length)
        continue

      for (const k in faculty_college_year.data) {
        let courses = await findDocuments(Course, {
          faculty_college_year: faculty_college_year.data[i]._id
        })
        if (!courses.data.length)
          continue

        for (const course of courses.data) {
          foundCourses.push(course)
        }
      }

    }

    if (foundCourses.length === 0)
      return res.send(formatResult(404, `${college.data.name} course list is empty`))

    // foundCourses = await injectUser(foundCourses, 'user')
    // foundCourses = await injectChapters(foundCourses)

    return res.send(formatResult(u, u, foundCourses))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /course/user/{id}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns courses of a specified user
 *     parameters:
 *       - name: id
 *         description: User id
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
router.get('/user/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let user = await findDocument(User, {
      _id: req.params.id
    })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    const user_faculty_college_year = await findDocument(User_faculty_college_year, {
      user: user.data._id,
      status: 1
    })
    if (!user_faculty_college_year.data)
      return res.send(formatResult(404, 'courses not found'))

    let courses = await findDocuments(Course, {
      faculty_college_year: user_faculty_college_year.data.faculty_college_year
    })

    // ******* while adding permissions remember to filter data according to the user requesting *******

    if (courses.data.length === 0)
      return res.send(formatResult(404, 'courses not found'))

    // courses = await injectChapters(courses)
    // course = await injectFaculty_college_year(courses)
    // courses = await injectChapters(courses)

    return res.send(courses)
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
router.get('/user/:userId/:courseName', async (req, res) => {
  try {
    // validate the userId
    const {
      error
    } = validateObjectId(req.params.userId)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    let user = await findDocument(User, {
      _id: req.params.userId
    })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    const user_faculty_college_year = await findDocument(User_faculty_college_year, {
      user: user.data._id,
      status: 1
    })
    if (!user_faculty_college_year.data)
      return res.send(formatResult(404, 'course not found'))

    let course = await findDocument(Course, {
      faculty_college_year: user_faculty_college_year.data.faculty_college_year,
      name: req.params.courseName
    })

    // ******* while adding permissions remember to filter data according to the user requesting *******

    if (!course.data)
      return res.send(formatResult(404, 'course not found'))

    // course.data = await injectChapters([course.data])
    // course.data = await injectFaculty_college_year(course.data)
    // course.data = course.data[0]

    return res.status(200).send(course)
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

    if (!course.data)
      return res.send(formatResult(404, 'course not found'))

    // course.data = await injectUser([course.data], 'user')
    // course.data = await injectChapters(course.data)
    // course.data = course.data[0]

    return res.send(course)
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
    if (!faculty_college_year.data)
      return res.send(formatResult(404, 'faculty_college_year not found'))

    let user = await findDocument(User, {
      _id: req.body.user
    })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    let course = await findDocument(Course, {
      name: req.body.name
    })
    if (course.data)
      return res.send(formatResult(400, 'name was taken'))

    let result = await createDocument(Course, {
      name: req.body.name,
      user: req.body.user,
      faculty_college_year: req.body.faculty_college_year,
      description: req.body.description
    })

    // result.data = simplifyObject(result.data)
    // result.data = await injectChapters([result.data])
    // result.data = await injectFaculty_college_year(result.data)

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
    if (!course.data)
      return res.send(formatResult(404, 'course not found'))

    const now = new Date()

    const updateObject = {
      published: !course.data.published,
      publishedOn: !course.data.published ? now : undefined
    }

    let result = await updateDocument(Course, req.params.id, updateObject)

    // result.data = await injectFaculty_college_year([result.data])
    // result.data = result.data[0]

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

    // check if course exist
    let course = await findDocument(Course, {
      _id: req.params.id
    })
    if (!course.data)
      return res.send(formatResult(404, 'course not found'))

    let user = await findDocument(User, {
      _id: req.body.user
    })
    if (!user.data)
      return res.send(formatResult(404, 'user not found'))

    course = await findDocument(Course, {
      _id: {
        $ne: req.params.id
      },
      name: req.body.name
    })
    if (course.data)
      return res.send(formatResult(400, 'name was taken'))

    const result = await updateDocument(Course, req.params.id, req.body)

    return res.send(result)
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
 *         description: College id
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
    if (!course.data)
      return res.send(formatResult(404, 'course not found'))

    // check if the course is never used
    const course_used = false

    const progress = await findDocument(User_progress, {
      course: req.params.id
    })
    if (progress.data)
      course_used = true

    const quiz = await findDocument(Quiz, {
      "target.id": req.params.id
    })
    if (quiz.data)
      course_used = true

    if (!course_used) {



      const chapters = await findDocuments(Chapter, { course: req.params.id })

      if (chapters.data.length) {
        for (const i in chapters.data) {
          await deleteDocument(Chapter, chapters.data[i]._id)
        }
      }

      const result = await deleteDocument(Course, req.params.id)

      let faculty_college_year = await findDocument(Faculty_college_year, {
        _id: course.data.faculty_college_year
      })

      let faculty_college = await findDocument(Faculty_college, {
        _id: faculty_college_year.data.faculty_college
      })

      const path = `./uploads/colleges/${faculty_college.data.college}/courses/${req.params.id}`
      fs.exists(path, (exists) => {
        if (exists) {
          fs.remove(path, {
            recursive: true
          })
        }
      })

      return res.send(result)
    }

    const updated_course = await updateDocument(Course, req.params.id, {
      status: 0
    })
    return res.send(formatResult(200, `Course ${updated_course.data.user_name} couldn't be deleted because it was used, instead it was disabled`, updated_course.data))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// inject faculty college Year
async function injectFaculty_college_year(courses) {
  for (const i in courses) {
    const faculty_college_year = await Faculty_college_year.findOne({
      _id: courses[i].faculty_college_year
    }).lean()

    courses[i].faculty_college_year = removeDocumentVersion(faculty_college_year)

    const collegeYear = await College_year.findOne({
      _id: faculty_college_year.collegeYear
    }).lean()
    courses[i].faculty_college_year.collegeYear = removeDocumentVersion(collegeYear)

    const faculty_college = await Faculty_college.findOne({
      _id: faculty_college_year.faculty_college
    }).lean()
    courses[i].faculty_college_year.faculty_college = removeDocumentVersion(faculty_college)

    const faculty = await Faculty.findOne({
      _id: faculty_college.faculty
    }).lean()
    courses[i].faculty_college_year.faculty_college.faculty = removeDocumentVersion(faculty)

    const college = await College.findOne({
      _id: faculty_college.college
    }).lean()

    courses[i].faculty_college_year.faculty_college.college = removeDocumentVersion(college)
    if (courses[i].faculty_college_year.faculty_college.college.logo) {
      courses[i].faculty_college_year.faculty_college.college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}/${college.logo}`
    }
  }
  return courses
}

// export the router
module.exports = router