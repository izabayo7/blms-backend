// import dependencies
const {
  express,
  findDocuments,
  formatResult,
  validateObjectId,
  findDocument,
  Faculty_college,
  u,
  Faculty,
  createDocument,
  updateDocument,
  deleteDocument,
  validate_faculty,
  College,
  Faculty_college_year,
  User_faculty_college_year,
  countDocuments,
  Course,
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Faculty:
 *     properties:
 *       name:
 *         type: string
 *     required:
 *       - name
 */

/**
 * @swagger
 * /faculty:
 *   get:
 *     tags:
 *       - Faculty
 *     description: Get all Faculties
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
    const result = await findDocuments(Faculty)
    if (!result.length)
      return res.send(formatResult(404, 'Faculty list is empty'))
    return res.send(formatResult(u, u, result))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /faculty/statistics:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get Faculty statistics
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
    let total_faculties
    if (req.user.category.name == "SUPERADMIN") {
      total_faculties = await countDocuments(Faculty)
    } else {
      total_faculties = await countDocuments(Faculty_college, { college: req.user.college })
    }
    return res.send(formatResult(u, u, { total_faculties }))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /faculty/college/{faculty}:
 *   get:
 *     tags:
 *       - Faculty
 *     description: Returns faculties in a specified college
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: faculty
 *         description: Faculty Id *use ALL in case you need to see for all faculties
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
router.get('/college/:faculty', async (req, res) => {
  try {

    let foundFaculties = []
    const fetch_all_faculties = req.params.faculty === "ALL"
    const faculty_colleges = await findDocuments(Faculty_college, fetch_all_faculties ? {
      college: req.user.college
    } : {
        college: req.user.college,
        faculty: req.params.faculty
      }
    );
    if (!fetch_all_faculties) {
      const {
        error
      } = validateObjectId(req.params.faculty)
      if (error)
        return res.send(formatResult(400, error.details[0].message))

      const faculty = await findDocument(Faculty, {
        _id: req.params.faculty
      })
      if (!faculty)
        return res.send(formatResult(404, 'faculty not found'))
      foundFaculties.push(faculty)
    }
    else {
      if (!faculty_colleges.length)
        return res.send(formatResult(404, `College ${college.name} has no faculties`))

      for (const faculty_college of faculty_colleges) {
        const faculty = await findDocument(Faculty, {
          _id: faculty_college.faculty
        })
        if (!faculty)
          return res.send(formatResult(404, `Faculty ${faculty_college.faculty} Not Found`)) // recheck use case
        foundFaculties.push(faculty)
      }

    }

    foundFaculties = await injectDetails(foundFaculties, faculty_colleges)
    return res.send(formatResult(u, u, foundFaculties.length ? fetch_all_faculties ? foundFaculties : foundFaculties[0] : []))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /faculty/import/college/{id}:
 *   get:
 *     tags:
 *       - Faculty
 *     description: Returns faculties that are not in a college hence importable
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: College's id
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
router.get('/import/college/:id', async (req, res) => {
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
      return res.send(formatResult(404, `College ${req.params.id} Not Found`))

    const all_faculties = await findDocuments(Faculty)

    let foundFaculties = []

    for (const i in all_faculties) {
      const faculty_college = await findDocument(Faculty_college, {
        college: req.params.id,
        faculty: all_faculties[i]._id
      })
      if (!faculty_college)
        foundFaculties.push(all_faculties[i]);
    }

    if (foundFaculties.length < 1)
      return res.send(formatResult(404, `College ${college.name} has no importable faculties`))

    return res.send(formatResult(u, u, foundFaculties))
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})


/**
 * @swagger
 * /faculty/{id}:
 *   get:
 *     tags:
 *       - Faculty
 *     description: Returns a specified faculty
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Faculty's id
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

    const result = await findDocument(Faculty, {
      _id: req.params.id
    })
    if (!result)
      return res.send(formatResult(404, `Faculty ${req.params.id} Not Found`))

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /faculty:
 *   post:
 *     tags:
 *       - Faculty
 *     description: Create Faculty
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a Faculty
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Faculty'
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
    } = validate_faculty(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    // check name is available
    let faculty = await findDocument(Faculty, {
      name: req.body.name
    })
    if (faculty)
      return res.send(formatResult(403, 'name was taken'))

    let result = await createDocument(Faculty, {
      name: req.body.name,
    })

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /faculty/{id}:
 *   put:
 *     tags:
 *       - Faculty
 *     description: Update Faculty
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Faculty's Id
 *       - name: body
 *         description: Fields for a Faculty
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Faculty'
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

    // check if faculty exist
    let faculty = await findDocument(Faculty, {
      _id: req.params.id
    })
    if (!faculty)
      return res.send(formatResult(404, 'faculty not found'))

    // check if faculty exist
    let _faculty = await findDocument(Faculty, {
      _id: {
        $ne: faculty._id
      },
      name: req.body.name
    })
    if (_faculty)
      return res.send(formatResult(403, 'name was taken'))

    const result = await updateDocument(Faculty, faculty._id, req.body)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
})

/**
 * @swagger
 * /faculty/{id}:
 *   delete:
 *     tags:
 *       - Faculty
 *     description: Delete as Faculty
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Faculty's id
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
    return res.send(formatResult(400, error.details[0].message))

  let faculty = await findDocument(Faculty, {
    _id: req.params.id
  })
  if (!faculty)
    return res.send(formatResult(404, `Faculty of Code ${req.params.id} Not Found`))



  // check if the faculty is never used
  const faculty_college_found = await findDocument(Faculty_college, {
    faculty: req.params.id
  })
  if (!faculty_college_found) {
    let result = await deleteDocument(Faculty, req.params.id)
    return res.send(result)
  }

  return res.send(formatResult(200, `Faculty ${faculty.name} couldn't be deleted because it was used`))
})

async function injectDetails(faculties, faculty_colleges) {
  // add head teacher
  for (const i in faculties) {
    let all_attendants = 0, total_courses = 0;
    const faculty_collegeYears = await Faculty_college_year.find({
      faculty_college: faculty_colleges[i]._id
    })
    for (const k in faculty_collegeYears) {
      const attendants = await User_faculty_college_year.find({
        faculty_collegeYear: faculty_collegeYears[k]._id
      }).countDocuments()
      total_courses += await countDocuments(Course, { faculty_college_year: faculty_collegeYears[k]._id })
      all_attendants += attendants
    }
    faculties[i].total_student_groups = faculty_collegeYears.length
    faculties[i].total_students = all_attendants
    faculties[i].total_courses = total_courses
    faculties[i].attendants = all_attendants
  }
  return faculties
}

// export the router
module.exports = router