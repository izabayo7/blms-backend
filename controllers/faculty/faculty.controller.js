// import dependencies
const {User_group} = require('../../models/user_group/user_group.model')
const {User_user_group} = require('../../models/user_user_group/user_user_group.model')
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
            total_faculties = await countDocuments(Faculty, {college: req.user.college})
        }
        return res.send(formatResult(u, u, {total_faculties}))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
}

// handle all users down here
// super admin
// admin
// instructor

/***
 * Get faculties
 * @param req
 * @param res
 */
exports.getFaculties = async (req, res) => {
    try {

        let foundFaculties = []
        const fetch_all_faculties = req.params.faculty_id === "ALL"

        let faculties;

        if (!fetch_all_faculties) {
            const {
                error
            } = validateObjectId(req.params.faculty_id)
            if (error)
                return res.send(formatResult(400, error.details[0].message))

            faculties = await findDocuments(Faculty, req.user.category.name == "ADMIN" ? {
                _id: req.params.faculty_id,
                college: req.user.college
            } : {
                _id: req.params.faculty_id,
            })
        } else {
            faculties = await findDocuments(Faculty, req.user.category.name == "ADMIN" ? {
                    college: req.user.college
                } : {}
            )

        }
        foundFaculties = await injectDetails(faculties)
        foundFaculties = faculties
        return res.send(formatResult(u, u, foundFaculties.length ? fetch_all_faculties ? foundFaculties : foundFaculties[0] : []))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
}

/***
 * Get faculties for user
 * @param req
 * @param res
 */
exports.getUserFaculties = async (req, res) => {
    try {

        const user_groups = await User_user_group.find({
            user: req.user._id,
            status: "ACTIVE"
        }, {user_group: 1});

        let faculties = await User_group.distinct('faculty', {_id: {$in: user_groups.map(x => x.user_group.toString())}}).populate('faculty')

        faculties = await Faculty.find({_id: {$in: faculties}})
        return res.send(formatResult(u, u, faculties))
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
        } = validateObjectId(req.params.faculty_id)
        if (error)
            return res.send(formatResult(400, 'invalid id'))

        // check if faculty exist
        let faculty = await findDocument(Faculty, {
            _id: req.params.faculty_id
        })
        if (!faculty)
            return res.send(formatResult(404, 'faculty not found'))

        req.body.name = req.body.name.toLowerCase();

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
    } = validateObjectId(req.params.faculty_id)
    if (error)
        return res.send(formatResult(400, "invalid id"))

    let faculty = await findDocument(Faculty, {
        _id: req.params.faculty_id
    })
    if (!faculty)
        return res.send(formatResult(404, `Faculty of Code ${req.params.faculty_id} Not Found`))


    // check if the faculty is never used
    const faculty_college_found = await findDocument(User_group, {
        faculty: req.params.faculty_id
    })
    if (!faculty_college_found) {
        let result = await deleteDocument(Faculty, req.params.faculty_id)
        return res.send(result)
    }

    return res.send(formatResult(200, `Faculty ${faculty.name} couldn't be deleted because it was used`))
}

async function injectDetails(faculties) {
    // add head teacher
    for (const i in faculties) {
        let all_attendants = 0, total_courses = 0;
        const user_groups = await User_group.find({
            faculty: faculties[i]._id,
            status: "ACTIVE"
        })
        for (const k in user_groups) {
            const attendants = await User_user_group.find({
                user_group: user_groups[k]._id,
                status: "ACTIVE"
            }).countDocuments()
            total_courses += await countDocuments(Course, {user_group: user_groups[k]._id})
            all_attendants += attendants
        }
        faculties[i].total_student_groups = user_groups.length
        faculties[i].total_students = all_attendants
        faculties[i].total_courses = total_courses
        faculties[i].attendants = all_attendants
    }
    return faculties
}