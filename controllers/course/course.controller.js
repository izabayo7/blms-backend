// import dependencies
const {
  express,
  fs,
  Course,
  getCollege,
  College,
  Instructor,
  validateCourse,
  StudentFacilityCollegeYear,
  FacilityCollegeYear,
  Student,
  Attachment,
  _,
  validateObjectId,
  StudentProgress,
} = require('../../utils/imports')
const { Chapter } = require('../../models/chapter/chapter.model')

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
 *       facilityCollegeYear:
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
 *       - facilityCollegeYear
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
    courses = await injectInstructor(courses)
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
    foundCourses = await injectInstructor(foundCourses)
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

    for (const i in courses) {
      if (courses[i].coverPicture) {
        courses[i].coverPicture = `${process.env.HOST}/kurious/file/courseCoverPicture/${courses[i]._id}`
      }
    }

    courses = await injectChapters(courses)

    return res.status(200).send(courses)
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

    const studentFacilityCollegeYear = await StudentFacilityCollegeYear.findOne({
      student: student._id,
      status: 1
    }).lean()

    let courses = await Course.find({
      facilityCollegeYear: studentFacilityCollegeYear.facilityCollegeYear, published: true
    }).lean()

    if (courses.length === 0)
      return res.status(404).send(`There are no courses with facilityCollegeYear ${req.params.id}`)

    courses = await injectInstructor(courses)
    courses = await injectChapters(courses)
    courses = await injectStudentProgress(courses, student._id)

    return res.status(200).send(courses)
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
    course = await injectInstructor([course])
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
  const {
    error
  } = validateCourse(req.body)
  if (error)
    return res.status(400).send(error.details[0].message)

  let facilityCollegeYear = await FacilityCollegeYear.findOne({
    _id: req.body.facilityCollegeYear
  })
  if (!facilityCollegeYear)
    return res.status(404).send(`facilityCollegeYear of Code ${req.body.facilityCollegeYear} Not Found`)

  let newDocument = new Course({
    name: req.body.name,
    instructor: req.body.instructor,
    facilityCollegeYear: req.body.facilityCollegeYear,
    description: req.body.description,
    coverPicture: req.file === undefined ? undefined : req.file.filename
  })

  const saveDocument = await newDocument.save()
  if (saveDocument)
    return res.status(201).send(saveDocument)
  return res.status(500).send('New Course not Registered')
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
  const college = getCollege(course.facilityCollegeYear)
  const dir = `./uploads/schools/${college}/courses/${req.params.id}`
  fs.exists(dir, (err) => {
    if (err)
      return res.status(500).send(err)
    fs.remove(dir, (err) => {
      if (err)
        return res.status(500).send(err)
    })
  })
  return res.status(200).send(`Course ${deletedCourse._id} Successfully deleted`)
})

// replace instructor id by the instructor information
async function injectInstructor(courses) {
  for (const i in courses) {
    const instructor = await Instructor.findOne({
      _id: courses[i].instructor
    })
    courses[i].instructor = _.pick(instructor, ['_id', 'surName', 'otherNames', 'gender', 'phone', "profile"])
    if (courses[i].instructor.profile) {
      courses[i].instructor.profile = `${process.env.HOST}/kurious/file/instructorProfile/${instructor._id}`
    }

    if (courses[i].coverPicture) {
      courses[i].coverPicture = `${process.env.HOST}/kurious/file/courseCoverPicture/${courses[i]._id}`
    }
  }
  return courses
}

// add chapters in their parent courses
async function injectChapters(courses) {
  for (const i in courses) {
    let chapters = await Chapter.find({
      course: courses[i]._id
    }).lean()
    courses[i].chapters = chapters
    for (const k in courses[i].chapters) {
      // remove course and documentVersion
      courses[i].chapters[k].course = undefined
      courses[i].chapters[k].__v = undefined

      // add media path of the content
      courses[i].chapters[k].mainDocument = `${process.env.HOST}/kurious/file/chapterDocument/${courses[i].chapters[k]._id}`
      // add media path of the video
      if (courses[i].chapters[k].mainVideo) {
        courses[i].chapters[k].mainVideo = `${process.env.HOST}/kurious/file/chapterMainVideo/${courses[i].chapters[k]._id}`
      }
      // add chapters
      const attachments = await Attachment.find({
        chapter: courses[i].chapters[k]._id
      })
      courses[i].chapters[k].attachments = attachments
    }
  }
  return courses
}

// replace instructor id by the instructor information
async function injectStudentProgress(courses, studentId) {
  for (const i in courses) {
    const studentProgress = await StudentProgress.findOne({
      course: courses[i]._id, student: studentId
    })
    courses[i].progress = studentProgress.progress
  }
  return courses
}

// export the router
module.exports = router