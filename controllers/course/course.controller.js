// import dependencies
const {
  express,
  fs,
  Course,
  getCollege,
  CollegeYear,
  College,
  Instructor,
  validateCourse,
  StudentFacultyCollegeYear,
  FacultyCollegeYear,
  FacultyCollege,
  Faculty,
  Student,
  injectChapters,
  _,
  validateObjectId,
  StudentProgress,
  removeDocumentVersion,
  injectUser,
  simplifyObject
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Course:
 *     properties:
 *       _id:
 *         type: string
 *       name:
 *         type: string
 *       instructor:
 *         type: string
 *       facultyCollegeYear:
 *         type: string
 *       description:
 *         type: string
 *       coverPicture:
 *         type: string
 *       published:
 *         type: boolean
 *     required:
 *       - name
 *       - instructor
 *       - facultyCollegeYear
 *       - description
 */

/**
 * @swagger
 * /kurious/course:
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

    let courses = await Course.find().lean()

    if (courses.length === 0)
      return res.status(404).send('Course list is empty')
    courses = await injectUser(courses, 'instructor')
    courses = await injectChapters(courses)
    return res.status(200).send(courses)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/course/college/{id}:
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
      return res.status(400).send(error.details[0].message)
    let college = await College.findOne({
      _id: req.params.id
    })
    if (!college)
      return res.status(404).send(`College ${req.params.id} Not Found`)

    let instructors = await Instructor.find({
      college: req.params.id
    })
    if (!instructors)
      return res.status(404).send(`Courses in ${college.name} Not Found`)

    let foundCourses = []

    for (const instructor of instructors) {
      let courses = await Course.find({
        instructor: instructor._id
      }).lean()
      if (courses.length > 0) {
        for (const course of courses) {
          foundCourses.push(course)
        }
      }
    }
    if (foundCourses.length === 0)
      return res.status(404).send(`${college.name} course list is empty`)
    foundCourses = await injectUser(foundCourses, 'instructor')
    foundCourses = await injectChapters(foundCourses)
    return res.status(200).send(foundCourses)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/course/instructor/{id}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns courses of a specified instructor
 *     parameters:
 *       - name: id
 *         description: Instructor id
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
router.get('/instructor/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.status(500).send(error.details[0].message)
    let instructor = await Instructor.findOne({
      _id: req.params.id
    })
    if (!instructor)
      return res.status(404).send(`Instructor ${req.params.id} Not Found`)
    let courses = await Course.find({
      instructor: req.params.id
    }).lean()

    if (courses.length === 0)
      return res.status(404).send(`${instructor.name} have No courses`)

    courses = await injectChapters(courses)
    course = await injectFacultyCollegeYear(courses)
    courses = await injectChapters(courses)

    return res.status(200).send(courses)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/course/instructor/{instructorId}/{courseName}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns a course with the specified name
 *     parameters:
 *       - name: instructorId
 *         description: Instructor id
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
router.get('/instructor/:instructorId/:courseName', async (req, res) => {
  try {
    // validate the instructorId
    const {
      error
    } = validateObjectId(req.params.instructorId)
    if (error)
      return res.status(400).send(error.details[0].message)

    // check if instructor exist
    let instructor = await Instructor.findOne({
      _id: req.params.instructorId
    })
    if (!instructor)
      return res.status(404).send(`Sudent with code ${req.params.instructorId} doens't exist`)

    let course = await Course.findOne({
      instructor: req.params.instructorId,
      name: req.params.courseName
    }).lean()
    if (!course)
      return res.status(404).send(`The requested course was not found`)

    course = await injectChapters([course])
    course = await injectFacultyCollegeYear(course)

    return res.status(200).send(course[0])
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/course/student/{id}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns courses of a student
 *     parameters:
 *       - name: id
 *         description: Student id
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
router.get('/student/:id', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.status(400).send(error.details[0].message)

    // check if student exist
    let student = await Student.findOne({
      _id: req.params.id
    })
    if (!student)
      return res.status(404).send(`Sudent with code ${req.params.id} doens't exist`)

    const studentFacultyCollegeYear = await StudentFacultyCollegeYear.findOne({
      student: student._id,
      status: 1
    }).lean()
    let courses = await Course.find({
      facultyCollegeYear: studentFacultyCollegeYear.facultyCollegeYear, published: true
    }).lean()
    if (courses.length === 0)
      return res.status(404).send(`There are no courses for student ${req.params.id}`)

    courses = await injectUser(courses, 'instructor')
    courses = await injectChapters(courses)
    courses = await injectStudentProgress(courses, student._id)

    return res.status(200).send(courses)
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/course/student/{studentId}/{courseName}:
 *   get:
 *     tags:
 *       - Course
 *     description: Returns a course with the specified name
 *     parameters:
 *       - name: studentId
 *         description: Student id
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
router.get('/student/:studentId/:courseName', async (req, res) => {
  try {
    // validate the studentId
    const {
      error
    } = validateObjectId(req.params.studentId)
    if (error)
      return res.status(400).send(error.details[0].message)

    // check if student exist
    let student = await Student.findOne({
      _id: req.params.studentId
    })
    if (!student)
      return res.status(404).send(`Sudent with code ${req.params.studentId} doens't exist`)

    const studentFacultyCollegeYear = await StudentFacultyCollegeYear.findOne({
      student: student._id,
      status: 1
    }).lean()

    let courses = await Course.find({
      facultyCollegeYear: studentFacultyCollegeYear.facultyCollegeYear, published: true
    }).lean()
    if (courses.length < 1)
      return res.status(404).send(`The requested course was not found`)
    let course = courses.filter(c => c.name == req.params.courseName)
    if (course.length < 1) {
      return res.status(404).send(`The requested course was not found`)
    }
    course = await injectUser(course, 'instructor')
    course = await injectChapters(course)
    course = await injectStudentProgress(course, student._id)

    return res.status(200).send(course[0])
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/course/{id}:
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
  const {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  let course = await Course.findOne({
    _id: req.params.id
  }).lean()
  try {
    if (!course)
      return res.status(404).send(`Course ${req.params.id} Not Found`)
    course = await injectUser([course], 'instructor')
    course = await injectChapters(course)
    return res.status(200).send(course[0])
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/course:
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
    } = validateCourse(req.body)
    if (error)
      return res.status(400).send(error.details[0].message)

    let facultyCollegeYear = await FacultyCollegeYear.findOne({
      _id: req.body.facultyCollegeYear
    })
    if (!facultyCollegeYear)
      return res.status(404).send(`facultyCollegeYear of Code ${req.body.facultyCollegeYear} Not Found`)

    let newDocument = new Course({
      name: req.body.name,
      instructor: req.body.instructor,
      facultyCollegeYear: req.body.facultyCollegeYear,
      description: req.body.description,
      coverPicture: req.file === undefined ? undefined : req.file.filename
    })

    let saveDocument = await newDocument.save()
    if (!saveDocument)
      return res.status(500).send('New Course not Registered')

    saveDocument = simplifyObject(saveDocument)
    saveDocument = await injectChapters([saveDocument])
    saveDocument = await injectFacultyCollegeYear(saveDocument)
    return res.status(201).send(saveDocument[0])
  } catch (error) {
    return res.status(500).send(error)
  }
})

/**
 * @swagger
 * /kurious/course/tooglePublishment/{id}:
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
router.put('/tooglePublishment/:id', async (req, res) => {
  let {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if course exist
  let course = await Course.findOne({
    _id: req.params.id
  })
  if (!course)
    return res.status(404).send(`Course with code ${req.params.id} doens't exist`)

  const now = new Date()

  const updateObject = {
    published: !course.published,
    publishedOn: !course.published ? now : undefined
  }

  let updateDocument = await Course.findOneAndUpdate({
    _id: req.params.id
  }, updateObject, {
    new: true
  }).lean()
  if (!updateDocument)
    return res.status(500).send("Error ocurred")

  updateDocument = await injectFacultyCollegeYear([updateDocument])
  return res.status(201).send(updateDocument[0])


})

/**
 * @swagger
 * /kurious/course/{id}:
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
  let {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  error = validateCourse(req.body)
  error = error.error
  if (error)
    return res.status(400).send(error.details[0].message)

  // check if course exist
  let course = await Course.findOne({
    _id: req.params.id
  })
  if (!course)
    return res.status(404).send(`Course with code ${req.params.id} doens't exist`)

  const updateDocument = await Course.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    new: true
  })
  if (updateDocument)
    return res.status(201).send(updateDocument)
  return res.status(500).send("Error ocurred")

})

/**
 * @swagger
 * /kurious/course/{id}:
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
  const {
    error
  } = validateObjectId(req.params.id)
  if (error)
    return res.status(400).send(error.details[0].message)
  let course = await Course.findOne({
    _id: req.params.id
  })
  if (!course)
    return res.status(404).send(`Course of Code ${req.params.id} Not Found`)
  let deletedCourse = await Course.findOneAndDelete({
    _id: req.params.id
  })
  if (!deletedCourse)
    return res.status(500).send('Course Not Deleted')
  const college = getCollege(course.facultyCollegeYear)
  const dir = `./uploads/schools/${college}/courses/${req.params.id}`
  fs.exists(dir, (err) => {
    if (err)
      return res.status(500).send(err)
    fs.remove(dir, { recursive: true }, (err) => {
      if (err)
        return res.status(500).send(err)
    })
  })
  return res.status(200).send(`Course ${deletedCourse._id} Successfully deleted`)
})

// replace instructor id by the instructor information
async function injectStudentProgress(courses, studentId) {
  for (const i in courses) {
    const studentProgress = await StudentProgress.findOne({
      course: courses[i]._id, student: studentId
    })

    courses[i].progress = studentProgress ? { id: studentProgress._id, progress: studentProgress.progress, dateStarted: studentProgress.createdAt } : undefined
  }
  return courses
}

// inject faculty college Year
async function injectFacultyCollegeYear(courses) {
  for (const i in courses) {
    const facultyCollegeYear = await FacultyCollegeYear.findOne({
      _id: courses[i].facultyCollegeYear
    }).lean()

    courses[i].facultyCollegeYear = removeDocumentVersion(facultyCollegeYear)

    const collegeYear = await CollegeYear.findOne({
      _id: facultyCollegeYear.collegeYear
    }).lean()
    courses[i].facultyCollegeYear.collegeYear = removeDocumentVersion(collegeYear)

    const facultyCollege = await FacultyCollege.findOne({
      _id: facultyCollegeYear.facultyCollege
    }).lean()
    courses[i].facultyCollegeYear.facultyCollege = removeDocumentVersion(facultyCollege)

    const faculty = await Faculty.findOne({
      _id: facultyCollege.faculty
    }).lean()
    courses[i].facultyCollegeYear.facultyCollege.faculty = removeDocumentVersion(faculty)

    const college = await College.findOne({
      _id: facultyCollege.college
    }).lean()

    courses[i].facultyCollegeYear.facultyCollege.college = removeDocumentVersion(college)
    if (courses[i].facultyCollegeYear.facultyCollege.college.logo) {
      courses[i].facultyCollegeYear.facultyCollege.college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}/${college.logo}`
    }
  }
  return courses
}

// export the router
module.exports = router