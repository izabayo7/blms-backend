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

/***
 * Get faculty statistics
 * @param req
 * @param res
 */
exports.getFacultyStatistics = async (req, res) => {
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
}

// handle all users down here

/***
 * Get faculties
 * @param req
 * @param res
 */
exports.getFaculties = async (req, res) => {
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
}


/***
 * Create faculty
 * @param req
 * @param res
 */
exports.createFaculty = async (req, res) => {
  try {
    const {
      error
    } = validate_faculty(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    req.body.college = req.user.college
    req.body.created_by = req.user._id

    // ensure no redundancy
    req.body.name = req.body.name.toLowerCase();

    // check name is available
    let faculty = await findDocument(Faculty, {
      name: req.body.name,
      college: req.user.college,
    })
    if (faculty)
      return res.send(formatResult(403, 'name was taken'))

    let result = await createDocument(Faculty, req.body)

    return res.send(result)
  } catch (error) {
    return res.send(formatResult(500, error))
  }
}


/***
 * Update faculty
 * @param req
 * @param res
 */
exports.updateFaculty = async (req, res) => {
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
}

/***
 * Delete faculty
 * @param req
 * @param res
 */
exports.deleteFaculty = async (req, res) => {
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
}

async function injectDetails(faculties, faculty_colleges) {
  // add head teacher
  for (const i in faculties) {
    let all_attendants = 0, total_courses = 0;
    const faculty_collegeYears = await Faculty_college_year.find({
      faculty_college: faculty_colleges[i]._id
    })
    for (const k in faculty_collegeYears) {
      const attendants = await User_faculty_college_year.find({
        faculty_college_year: faculty_collegeYears[k]._id.toString()
      }).countDocuments()
      total_courses += await countDocuments(Course, { faculty_college_year: faculty_collegeYears[k]._id })
      all_attendants += attendants
    }
    faculties[i].total_student_groups = faculty_collegeYears.length
    faculties[i].total_students = all_attendants
    faculties[i].total_courses = total_courses
    faculties[i].description = faculty_colleges[i].description
    faculties[i].attendants = all_attendants
  }
  return faculties
}