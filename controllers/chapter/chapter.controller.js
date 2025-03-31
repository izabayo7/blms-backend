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
  findFileType,
  upload_single,
  upload_multiple,
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
 *     security:
 *       - bearerAuth: -[]
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
    if (!chapter)
      return res.send(formatResult(404, 'chapter not found'))

    const course = await findDocument(Course, {
      _id: chapter.course
    })
    const faculty_college_year = await findDocument(Faculty_college_year, {
      _id: course.faculty_college_year
    })
    const faculty_college = await findDocument(Faculty_college, {
      _id: faculty_college_year.faculty_college
    })

    const file_path = `uploads/colleges/${faculty_college.college}/courses/${chapter.course}/chapters/${chapter._id}/main_content/index.html`

    const exists = await fs.exists(file_path)
    if (!exists)
      return res.send("")

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
 *     security:
 *       - bearerAuth: -[]
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
    if (!chapter)
      return res.send(formatResult(404, 'chapter not found'))

    if (!chapter.uploaded_video || (chapter.uploaded_video !== req.params.file_name))
      return res.send(formatResult(404, 'file not found'))

    const course = await findDocument(Course, {
      _id: chapter.course
    })
    const faculty_college_year = await findDocument(Faculty_college_year, {
      _id: course.faculty_college_year
    })
    const faculty_college = await findDocument(Faculty_college, {
      _id: faculty_college_year.faculty_college
    })

    const file_path = `./uploads/colleges/${faculty_college.college}/courses/${chapter.course}/chapters/${chapter._id}/video/${chapter.uploaded_video}`
    const exists = await fs.exists(file_path)
    if (!exists)
      return res.send(formatResult(404, 'file not found'))

    streamVideo(req, res, file_path)

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chapter/{id}/attachment/{file_name}:
 *   get:
 *     tags:
 *       - Chapter
 *     description: Returns the files attached to a specified chapter ( use format height and width only when the attachment is a picture)
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Chapter's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: file's name
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
router.get('/:id/attachment/:file_name', async (req, res) => {
  try {

    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const chapter = await findDocument(Chapter, {
      _id: req.params.id
    })
    if (!chapter)
      return res.send(formatResult(404, 'chapter not found'))

    let file_found = false

    for (const i in chapter.attachments) {
      if (chapter.attachments[i].src == req.params.file_name) {
        file_found = true
        break
      }
    }
    if (!file_found)
      return res.send(formatResult(404, 'file not found'))

    const course = await findDocument(Course, {
      _id: chapter.course
    })
    const faculty_college_year = await findDocument(Faculty_college_year, {
      _id: course.faculty_college_year
    })
    const faculty_college = await findDocument(Faculty_college, {
      _id: faculty_college_year.faculty_college
    })

    const file_path = `./uploads/colleges/${faculty_college.college}/courses/${chapter.course}/chapters/${chapter._id}/attachments/${req.params.file_name}`

    const file_type = await findFileType(req.params.file_name)

    if (file_type === 'image') {
      sendResizedImage(req, res, file_path)
    } else if (file_type == 'video') {
      streamVideo(req, res, file_path)
    } else {
      return res.sendFile(path.normalize(__dirname + '../../../' + file_path))
    }

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chapter/{id}/attachment/{file_name}/download:
 *   get:
 *     tags:
 *       - Chapter
 *     description: downloads the files attached to a specified chapter
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Chapter's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: file's name
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
router.get('/:id/attachment/:file_name/download', async (req, res) => {
  try {

    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const chapter = await findDocument(Chapter, {
      _id: req.params.id
    })
    if (!chapter)
      return res.send(formatResult(404, 'chapter not found'))

    let file_found = false

    for (const i in chapter.attachments) {
      if (chapter.attachments[i].src == req.params.file_name) {
        file_found = true
        break
      }
    }
    if (!file_found)
      return res.send(formatResult(404, 'file not found'))

    const course = await findDocument(Course, {
      _id: chapter.course
    })
    const faculty_college_year = await findDocument(Faculty_college_year, {
      _id: course.faculty_college_year
    })
    const faculty_college = await findDocument(Faculty_college, {
      _id: faculty_college_year.faculty_college
    })

    const file_path = `./uploads/colleges/${faculty_college.college}/courses/${chapter.course}/chapters/${chapter._id}/attachments/${req.params.file_name}`

    return res.download(file_path)

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
 *     security:
 *       - bearerAuth: -[]
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
    if (!course)
      return res.send(formatResult(404, 'course not found'))

    // avoid chapters with same names in the same course
    let chapter = await findDocument(Chapter, {
      course: req.body.course,
      name: req.body.name
    })
    if (chapter)
      return res.send(formatResult(403, 'name was taken'))

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
 *     security:
 *       - bearerAuth: -[]
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
    if (!chapter)
      return res.send(formatResult(404, 'chapter not found'))

    // check if course exist
    let course = await findDocument(Course, {
      _id: req.body.course
    })
    if (!course)
      return res.send(formatResult(404, 'course not found'))

    // avoid chapters with same names in the same course
    chapter = await findDocument(Chapter, {
      _id: {
        $ne: req.params.id
      },
      course: req.body.course,
      name: req.body.name
    })
    if (chapter)
      return res.send(formatResult(403, 'name was taken'))

    const result = await updateDocument(Chapter, req.params.id, req.body)
    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chapter/{id}/document:
 *   put:
 *     tags:
 *       - Chapter
 *     description: Update chapter content
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Chapter id
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         description: content to upload
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             content: 
 *               type: string
 *               required: true
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
router.put('/:id/document', async (req, res) => {
  try {
    let {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    error = validate_chapter(req.body, true)
    error = error.error
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const chapter = await findDocument(Chapter, {
      _id: req.params.id
    })
    if (!chapter)
      return res.send(formatResult(404, 'chapter not found'))

    const course = await findDocument(Course, {
      _id: chapter.course
    })
    const faculty_college_year = await findDocument(Faculty_college_year, {
      _id: course.faculty_college_year
    })
    const faculty_college = await findDocument(Faculty_college, {
      _id: faculty_college_year.faculty_college
    })

    const dir = `./uploads/colleges/${faculty_college.college}/courses/${chapter.course}/chapters/${req.params.id}/main_content`

    fs.createFile(`${dir}/index.html`, (error) => {
      if (error)
        res.send(formatResult(500, error))
      fs.writeFile(`${dir}/index.html`, req.body.content, (err) => {
        if (err)
          return res.send(formatResult(500, err))
        return res.send(formatResult(u, u, 'Content was successfully saved'))
      })
    })

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chapter/{id}/video:
 *   put:
 *     tags:
 *       - Chapter
 *     description: Update chapter video (video upload using swagger is still under construction)
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Chapter id
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
router.put('/:id/video', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const chapter = await findDocument(Chapter, {
      _id: req.params.id
    })
    if (!chapter)
      return res.send(formatResult(404, 'chapter not found'))

    const course = await findDocument(Course, {
      _id: chapter.course
    })
    const faculty_college_year = await findDocument(Faculty_college_year, {
      _id: course.faculty_college_year
    })
    const faculty_college = await findDocument(Faculty_college, {
      _id: faculty_college_year.faculty_college
    })

    req.kuriousStorageData = {
      dir: `./uploads/colleges/${faculty_college.college}/courses/${chapter.course}/chapters/${req.params.id}/video`,
    }
    upload_single(req, res, async (err) => {
      if (err)
        return res.send(formatResult(500, err.message))

      if (chapter.uploaded_video && chapter.uploaded_video != req.file.filename) {
        fs.unlink(`${req.kuriousStorageData.dir}/${chapter.uploaded_video}`, (err) => {
          if (err) {
            return res.send(formatResult(500, err))
          }
        })
      }

      const result = await updateDocument(Chapter, req.params.id, {
        uploaded_video: req.file.filename
      })
      result.data.uploaded_video = `http://${process.env.HOST}${process.env.BASE_PATH}/chapter/${req.params.id}/video/${result.data.uploaded_video}`
      return res.status(201).send(result)

    })

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chapter/{id}/attachments:
 *   post:
 *     tags:
 *       - Chapter
 *     description: Upload chapter attacments (file upload using swagger is still under construction)
 *     parameters:
 *       - name: id
 *         description: Chapter id
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
router.post('/:id/attachments', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const chapter = await findDocument(Chapter, {
      _id: req.params.id
    })
    if (!chapter)
      return res.send(formatResult(404, 'chapter not found'))

    const course = await findDocument(Course, {
      _id: chapter.course
    })
    const faculty_college_year = await findDocument(Faculty_college_year, {
      _id: course.faculty_college_year
    })
    const faculty_college = await findDocument(Faculty_college, {
      _id: faculty_college_year.faculty_college
    })

    req.kuriousStorageData = {
      dir: `./uploads/colleges/${faculty_college.college}/courses/${chapter.course}/chapters/${req.params.id}/attachments`,
    }
    let savedAttachments = []

    upload_multiple(req, res, async (err) => {
      if (err)
        return res.send(formatResult(500, err.message))
      for (const i in req.files) {
        const file_found = chapter.attachments.filter(attachment => attachment.src == req.files[i].filename)
        if (!file_found.length) {
          chapter.attachments.push({ src: req.files[i].filename })
        }
      }

      const result = await updateDocument(Chapter, req.params.id, {
        attachments: chapter.attachments
      })
      for (const i in result.data.attachments) {
        const obj = {
          download_link: `http://${process.env.HOST}${process.env.BASE_PATH}/chapter/${req.params.id}/attachment/${result.data.attachments[i].src}/download`,
          name: result.data.attachments[i].src
        }
        result.data.attachments[i] = obj
      }
      return res.send(result)
    })

  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /chapter/{id}/attachment:
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
 *       - name: file_name
 *         description: file's name
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
router.delete('/:id/attachment/:file_name', async (req, res) => {
  try {
    const {
      error
    } = validateObjectId(req.params.id)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const chapter = await findDocument(Chapter, {
      _id: req.params.id
    })
    if (!chapter)
      return res.send(formatResult(404, 'chapter not found'))

    let file_found = false

    for (const i in chapter.attachments) {
      if (chapter.attachments[i].src == req.params.file_name) {
        file_found = true
        chapter.attachments.splice(i, 1)
        break
      }
    }
    if (!file_found)
      return res.send(formatResult(404, 'file not found'))

    const course = await findDocument(Course, {
      _id: chapter.course
    })
    const faculty_college_year = await findDocument(Faculty_college_year, {
      _id: course.faculty_college_year
    })
    const faculty_college = await findDocument(Faculty_college, {
      _id: faculty_college_year.faculty_college
    })

    const file_path = `./uploads/colleges/${faculty_college.college}/courses/${chapter.course}/chapters/${chapter._id}/attachments/${req.params.file_name}`


    fs.unlink(file_path, async (err) => {
      if (err)
        return res.send(formatResult(500, err))

      const result = await updateDocument(Chapter, req.params.id, {
        attachments: chapter.attachments
      })
      result.message = 'DELETED'
      return res.status(201).send(result)
    })

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
    if (!chapter)
      return res.send(formatResult(404, 'chapter not found'))

    // check if the course is never used
    const chapter_used = false

    const progress = await findDocument(User_progress, {
      "finished_chapters.id": req.params.id
    })
    if (progress)
      chapter_used = true

    const quiz = await findDocument(Quiz, {
      "target.id": req.params.id
    })
    if (quiz)
      chapter_used = true

    if (!chapter_used) {

      const result = await deleteDocument(Chapter, req.params.id)

      // check if course exist
      let course = await findDocument(Course, {
        _id: chapter.course
      })

      let faculty_college_year = await findDocument(Faculty_college_year, {
        _id: course.faculty_college_year
      })

      let faculty_college = await findDocument(Faculty_college, {
        _id: faculty_college_year.faculty_college
      })

      const path = `./uploads/colleges/${faculty_college.college}/courses/${chapter.course}/chapters/${req.params.id}`
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
