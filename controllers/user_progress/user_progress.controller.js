// import dependencies
const {
  express,
  User,
  User_progress,
  Course,
  Chapter,
  validate_user_progress,
  validateObjectId,
  findDocuments,
  formatResult,
  findDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  User_category,
  User_faculty_college_year,
  u
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   User_progress:
 *     properties:
 *       user:
 *         type: string
 *       course:
 *         type: string
 *       progress:
 *         type: number
 *     required:
 *       - user
 *       - course
 */

/**
 * @swagger
 * /user_progress:
 *   get:
 *     tags:
 *       - User_progress
 *     description: Get all user_progresses
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
    const result = await findDocuments(User_progress)
    if (!result.length)
      return res.send(formatResult(404, 'User_progress list is empty'))

    return res.send(formatResult(u, u, result))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user_progress/{id}:
 *   get:
 *     tags:
 *       - User_progress
 *     description: Returns a specified user_progress
 *     parameters:
 *       - name: id
 *         description: user_progress's id
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

    const result = await findDocument(User_progress, {
      _id: req.params.id
    })
    if (!result)
      return res.send(formatResult(404, 'user_progress not found'))

    return res.send(formatResult(u, u, result))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user_progress/user/{user_id}/{course_id}:
 *   get:
 *     tags:
 *       - User_progress
 *     description: Returns user_progress of a given user in a specified course
 *     parameters:
 *       - name: user
 *         description: User's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: course
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
router.get('/user/:user_id/:course_id', async (req, res) => {
  try {
    let {
      error
    } = validateObjectId(req.params.user_id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    error = validateObjectId(req.params.course_id)
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if user exist
    let user = await findDocument(User, {
      _id: req.params.user_id
    })
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    // check if course exist
    let course = await findDocument(Course, {
      _id: req.params.course_id
    })
    if (!course)
      return res.send(formatResult(404, 'course not found'))

    const user_progress = await findDocument(User_progress, {
      user: req.params.user_id,
      course: req.params.course_id
    })

    if (!user_progress)
      return res.send(formatResult(404, 'user_progress not found'))

    return res.send(formatResult(u, u, user_progress))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user_progress:
 *   post:
 *     tags:
 *       - User_progress
 *     description: Create user_progress
 *     parameters:
 *       - name: body
 *         description: Fields for a user_progress
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/User_progress'
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
    } = validate_user_progress(req.body, 'post')
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if user exist
    let user = await findDocument(User, {
      user_name: req.body.user
    })
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    let user_category = await findDocument(User_category, {
      _id: user.category
    })

    if (user_category.name != 'STUDENT')
      return res.send(formatResult(403, 'user is not allowed to have a progress'))

    // check if course exist
    let course = await findDocument(Course, {
      _id: req.body.course
    })
    if (!course)
      return res.send(formatResult(404, 'course not found'))

    // check if user_progress exist
    let user_progress = await findDocument(User_progress, {
      user: req.body.user,
      course: req.body.course
    })
    if (user_progress)
      return res.send(formatResult(400, 'User_progress arleady exist'))

    let result = await createDocument(User_progress, {
      user: user._id,
      course: req.body.course,
      progress: 0,
    })

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user_progress/{id}:
 *   put:
 *     tags:
 *       - User_progress
 *     description: Create user_progress
 *     parameters:
 *       - name: id
 *         description: user_progress id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: Fields for a user_progress
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/User_progress'
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

    error = validate_user_progress(req.body)
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if user_progress exist
    let user_progress = await findDocument(User_progress, {
      _id: req.params.id
    })
    if (!user_progress)
      return res.send(formatResult(404, 'User_progress not found'))

    // check if user exist
    let user = await findDocument(User, {
      user_name: req.body.user
    })
    if (!user)
      return res.send(formatResult(404, 'user not found'))

    let user_category = await findDocument(User_category, {
      _id: user.category
    })

    if (user_category.name != 'STUDENT')
      return res.send(formatResult(403, 'user is not allowed to have a progress'))

    // check if course exist
    let course = await findDocument(Course, {
      _id: req.body.course
    })
    if (!course)
      return res.send(formatResult(404, 'course not found'))

    const user_faculty_college_year = await findDocument(User_faculty_college_year, {
      user: user._id,
      status: 1
    })
    if (course.faculty_college_year != user_faculty_college_year.faculty_college_year)
      return res.send(formatResult(403, 'user is not allowed to study this course'))

    // check if chapter exist
    let chapter = await findDocument(Chapter, {
      _id: req.body.chapter
    })
    if (!chapter)
      return res.send(formatResult(404, 'chapter not found'))

    if (chapter.course !== req.body.course)
      return res.send(formatResult(400, 'chapter don\'t belong to the course'))

    if (findFinishedChapter(user_progress.finished_chapters, req.body.chapter))
      return res.send(formatResult(400, 'progress already exists'))

    user_progress.finished_chapters.push({ id: req.body.chapter })

    const chapters = await findDocuments(Chapter, {
      course: req.body.course
    })

    let finished_chapters = 0

    for (const i in chapters) {
      if (findFinishedChapter(user_progress.finished_chapters, chapters[i]._id)) {
        finished_chapters++
      }
    }

    const progress = (finished_chapters / chapters.length) * 100

    let updateObject = {
      user: user._id,
      course: req.body.course,
      progress: progress,
      finished_chapters: user_progress.finished_chapters
    }

    const result = await updateDocument(User_progress, req.params.id, updateObject)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /user_progress/{id}:
 *   delete:
 *     tags:
 *       - User_progress
 *     description: Delete a user_progress
 *     parameters:
 *       - name: id
 *         description: User_progress id
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

    // check if user_progress exist
    let user_progress = await findDocument(User_progress, {
      _id: req.params.id
    })
    if (!user_progress)
      return res.send(formatResult(404, 'User_progress not found'))

    const result = await deleteDocument(User_progress, req.params.id)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// find if the id is arleady in finished chapters
function findFinishedChapter(finished_chapters, id) {
  for (const k in finished_chapters) {
    if (finished_chapters[k].id == id) {
      return true
    }
  }
  return false
}

// export the router
module.exports = router