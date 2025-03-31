// import dependencies
const {
  express,
  Chapter,
  fs,
  validate_chapter,
  Course,
  validateObjectId,
  formatResult,
  findDocument,
  countDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  Faculty_college,
  Faculty_college_year,
  User_progress,
  Quiz,
  u,
  path,
  streamVideo,
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * remove script staff in chapter document to avoid hacking
 */


/**
 * @swagger
 * definitions:
 *   Chapter:
 *     properties:
 *       name:
 *         type: string
 *       course:
 *         type: string
 *       description:
 *         type: string
 *       number:
 *         type: string
 *       uploaded_video:
 *         type: string
 *       liveVideo:
 *         type: string
 *     required:
 *       - name
 *       - course
 */

/**
 * @swagger
 * /chapter/{id}/document:
 *   get:
 *     tags:
 *       - Chapter
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
router.get('/:id/document', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(404, error.details[0].message))

    // check if chapter exist
    const chapter = await findDocument(Chapter, {
      _id: req.params.id
    })
    if (!chapter.data)
      return res.send(formatResult(404, 'chapter not found'))

    const course = await findDocument(Course, {
      _id: chapter.data.course
    })
    const faculty_college_year = await findDocument(Faculty_college_year, {
      _id: course.data.faculty_college_year
    })
    const faculty_college = await findDocument(Faculty_college, {
      _id: faculty_college_year.data.faculty_college
    })

    file_path = `uploads/colleges/${faculty_college.data.college}/courses/${chapter.data.course}/chapters/${chapter.data._id}/main_content/index.html`
    return res.sendFile(path.normalize(__dirname + '../../../' + file_path))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
* @swagger
* /chapter/{id}/video/{file_name}:
*   get:
*     tags:
*       - Chapter
*     description: Returns the uploaded_video of a specified Chapter
*     parameters:
*       - name: id
*         description: Chapter's id
*         in: path
*         required: true
*         type: string
*       - name: file_name
*         description: Chapter's video filename
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
router.get('/:id/video/:file_name', async (req, res) => {
  try {

    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(404, error.details[0].message))

    // check if chapter exist
    const chapter = await findDocument(Chapter, {
      _id: req.params.id
    })
    if (!chapter.data)
      return res.send(formatResult(404, 'chapter not found'))

    if (!chapter.data.uploaded_video || (chapter.data.uploaded_video !== req.params.file_name))
      return res.send(formatResult(404, 'file not found'))

    const course = await findDocument(Course, {
      _id: chapter.data.course
    })
    const faculty_college_year = await findDocument(Faculty_college_year, {
      _id: course.data.faculty_college_year
    })
    const faculty_college = await findDocument(Faculty_college, {
      _id: faculty_college_year.data.faculty_college
    })

    file_path = `./uploads/colleges/${faculty_college.data.college}/courses/${chapter.data.course}/chapters/${chapter.data._id}/video/${chapter.data.uploaded_video}`

    streamVideo(req, res, file_path)

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chapter:
 *   post:
 *     tags:
 *       - Chapter
 *     description: Create chapter
 *     parameters:
 *       - name: body
 *         description: Fields for a chapter
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Chapter'
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
    } = validate_chapter(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if course exist
    let course = await findDocument(Course, {
      _id: req.body.course
    })
    if (!course.data)
      return res.send(formatResult(404, 'course not found'))

    // avoid chapters with same names in the same course
    let chapter = await findDocument(Chapter, {
      course: req.body.course,
      name: req.body.name
    })
    if (chapter.data)
      return res.send(formatResult(400, 'name was taken'))

    const number = await countDocuments(Chapter, {
      course: req.body.course
    }) + 1

    let result = await createDocument(Chapter, {
      name: req.body.name,
      description: req.body.description,
      number: number,
      course: req.body.course
    })

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})


/**
 * @swagger
 * /chapter/{id}:
 *   put:
 *     tags:
 *       - Chapter
 *     description: Update chapter
 *     parameters:
 *       - name: id
 *         description: Chapter id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: Fields for a chapter
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Chapter'
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

    error = validate_chapter(req.body)
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check if chapter exist
    let chapter = await findDocument(Chapter, {
      _id: req.params.id
    })
    if (!chapter.data)
      return res.send(formatResult(404, 'chapter not found'))

    // check if course exist
    let course = await findDocument(Course, {
      _id: req.body.course
    })
    if (!course.data)
      return res.send(formatResult(404, 'course not found'))

    // avoid chapters with same names in the same course
    chapter = await findDocument(Chapter, {
      _id: {
        $ne: req.params.id
      },
      course: req.body.course,
      name: req.body.name
    })
    if (chapter.data)
      return res.send(formatResult(400, 'name was taken'))

    const result = await updateDocument(Chapter, req.params.id, req.body)
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chapter/{id}:
 *   delete:
 *     tags:
 *       - Course
 *     description: Delete a chapter
 *     parameters:
 *       - name: id
 *         description: Chapter id
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

    let chapter = await findDocument(Chapter, {
      _id: req.params.id
    })
    if (!chapter.data)
      return res.send(formatResult(404, 'chapter not found'))

    // check if the course is never used
    const chapter_used = false

    const progress = await findDocument(User_progress, {
      "finished_chapters.id": req.params.id
    })
    if (progress.data)
      chapter_used = true

    const quiz = await findDocument(Quiz, {
      "target.id": req.params.id
    })
    if (quiz.data)
      chapter_used = true

    if (!chapter_used) {

      const result = await deleteDocument(Chapter, req.params.id)

      // check if course exist
      let course = await findDocument(Course, {
        _id: chapter.data.course
      })

      let faculty_college_year = await findDocument(Faculty_college_year, {
        _id: course.data.faculty_college_year
      })

      let faculty_college = await findDocument(Faculty_college, {
        _id: faculty_college_year.data.faculty_college
      })

      const path = `./uploads/colleges/${faculty_college.data.college}/courses/${chapter.data.course}/chapters/${req.params.id}`
      fs.exists(path, (exists) => {
        if (exists) {
          fs.remove(path, {
            recursive: true
          })
        }
      })

      return res.send(result)
    }

    const updated_chapter = await updateDocument(Chapter, req.params.id, {
      status: 0
    })
    return res.send(formatResult(200, 'chapter couldn\'t be deleted because it was used, instead it was disabled', updated_chapter.data))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

// export the router
module.exports = router