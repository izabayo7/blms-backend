// import dependencies
const { User_group, validate_user_group } = require('../../models/user_group/user_group.model')
const { User_user_group } = require('../../models/user_user_group/user_user_group.model')
const {
    express,
    Faculty_college,
    College_year,
    findDocuments,
    formatResult,
    findDocument,
    Faculty,
    u,
    createDocument,
    deleteDocument,
    validate_user_groups,
    User_user_groups,
    College,
    validateObjectId,
    updateDocument,
    removeDocumentVersion,
    countDocuments,
    simplifyObject,
    User,
    Course,
    User_category,
    User_faculty_college_year
} = require('../../utils/imports')
// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   User_group:
 *     properties:
 *       faculty:
 *         type: string
 *       name:
 *         type: string
 *       created_by:
 *         type: string
 *       status:
 *         type: string
 *         enum: ['ACTIVE', 'INACTIVE']
 *     required:
 *       - faculty
 *       - name
 *       - created_by
 */

/**
 * @swagger
 * /user_groups/statistics:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get user_groups statistics
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
        let total_student_groups = 0
        if (req.user.category.name == "SUPERADMIN") {
            total_student_groups = await countDocuments(User_group)
        } else {

            let faculties = await findDocuments(Faculty, { college: req.user.college })
            for (const i in faculties) {
                let user_groups = await countDocuments(User_group, { faculty: faculties[i]._id })
                total_student_groups += user_groups
            }
        }
        return res.send(formatResult(u, u, { total_student_groups }))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user_groups:
 *   get:
 *     tags:
 *       - User_group
 *     description: Get all user_groups
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
    // need improvement
    try {
        let result = await findDocuments(User_group)

        // result = await injectDetails(result)

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user_groups/college/{faculty}:
 *   get:
 *     tags:
 *       - User_group
 *     description: Returns user_groups in a specified college
 *     parameters:
 *       - name: faculty
 *         description: Faculty Id *use ALL in case you need to see for all faculties
 *         in: path
 *         required: true
 *         type: string
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
router.get('/college/:faculty', async (req, res) => {
    try {
        const fetch_all_faculties = req.params.faculty === "ALL"
        if (!fetch_all_faculties) {
            const faculty = await findDocument(Faculty, {
                _id: req.params.faculty
            })
            if (!faculty)
                return res.send(formatResult(404, 'faculty not found'))
        }
        let user_groups = await findDocuments(Faculty_college, fetch_all_faculties ? {
            college: req.user.college
        } : {
            college: req.user.college, faculty: req.params.faculty
        })

        let foundUser_groups = []

        for (const faculty_college of user_groups) {

            const faculty_details = await findDocument(Faculty, {
                _id: faculty_college.faculty
            })

            const response = await findDocuments(User_group, {
                faculty_college: faculty_college._id
            })

            for (const user_groups of response) {

                const year_details = await findDocument(College_year, {
                    _id: user_groups.college_year
                })

                foundUser_groups.push({
                    _id: user_groups._id,
                    faculty_college: user_groups.faculty_college,
                    college_year: user_groups.college_year,
                    name: `${faculty_details.name} Year ${year_details.digit}`
                })
            }
        }

        foundFaculty_acollege_years = await injectDetails(foundUser_groups)

        return res.send(formatResult(u, u, foundUser_groups))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /user_groups/user:
 *   get:
 *     tags:
 *       - User_group
 *     description: Returns user_groups for a specified user
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
router.get('/user', async (req, res) => {
    try {

        let user_user_groups = await findDocuments(User_user_group, {
            user: req.user._id,
            status: "ACTIVE"
        })

        // console.log(user_user_groups)

        let foundUser_groups = []

        for (const user_user_group of user_user_groups) {

            const user_group = await User_group.findOne({
                _id: user_user_group.user_group
            }).populate('college')

            foundUser_groups.push(user_group)

        }
        // foundFaculty_acollege_years = await injectDetails(foundUser_groups)

        return res.send(formatResult(u, u, foundUser_groups))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user_groups:
 *   post:
 *     tags:
 *       - User_group
 *     description: Create user_groups
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a user_groups
 *         in: body
 *         required: true
 *         schema:
 *           properties:
 *             name:
 *               type: string
 *             faculty:
 *               type: string
 *           required:
 *             - name
 *             - faculty
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
        } = validate_user_group(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if faculty exist
        let faculty = await findDocument(Faculty, {
            _id: req.body.faculty
        })
        if (!faculty)
            return res.send(formatResult(404, `Faculty with code ${req.body.faculty} doens't exist`))


        let dupplicate = await findDocument(User_group, {
            faculty: req.body.faculty,
            name: req.body.name
        })
        if (dupplicate)
            return res.send(formatResult(400, `user_group you want to create arleady exist`))

        let result = await createDocument(User_group, {
            faculty: req.body.faculty,
            name: req.body.name
        })

        // result = await injectDetails([simplifyObject(result)])

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user_groups/{id}:
 *   delete:
 *     tags:
 *       - User_group
 *     description: Delete a user_groups
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: user_groups's id
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

        let user_groups = await findDocument(User_group, {
            _id: req.params.id
        })
        if (!user_groups)
            return res.send(formatResult(404, `user_groups of Code ${req.params.id} Not Found`))

        // check if the user_groups is never used
        const user_groups_found = await findDocument(User_faculty_college_year, {
            user_groups: req.params.id
        })
        if (!user_groups_found) {
            let result = await deleteDocument(User_group, req.params.id)
            return res.send(result)
        }

        const update_user_groups = await updateDocument(User_group, req.params.id, {
            status: 0
        })
        return res.send(formatResult(200, `User ${update_user_groups._id} couldn't be deleted because it was used, instead it was disabled`, update_user_groups.data))

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// link the student with his/her current college
async function injectDetails(user_groupss) {
    const student_category = await findDocument(User_category, { name: "STUDENT" })
    const instructor_category = await findDocument(User_category, { name: "INSTRUCTOR" })

    for (const i in user_groups) {

        const faculty_college = await findDocument(Faculty_college, {
            _id: user_groups[i].faculty_college
        })
        user_groups[i].faculty_college = simplifyObject(removeDocumentVersion(faculty_college))

        const faculty = await findDocument(Faculty, {
            _id: user_groups[i].faculty_college.faculty
        })
        user_groups[i].faculty_college.faculty = simplifyObject(removeDocumentVersion(faculty))

        const college = await findDocument(College, {
            _id: user_groups[i].faculty_college.college
        })
        user_groups[i].faculty_college.college = simplifyObject(removeDocumentVersion(college))
        if (user_groupss[i].faculty_college.college.logo) {
            user_groups[i].faculty_college.college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}/${college.logo}`
        }

        const college_year = await findDocument(College_year, {
            _id: user_groups[i].college_year
        })
        user_groups[i].college_year = removeDocumentVersion(college_year)

        const total_courses = await countDocuments(Course, {
            user_groups: user_groups[i]._id
        })
        // add courses
        user_groups[i].total_courses = total_courses

        // add the number of students
        const attendants = await User_user_groups.find({
            user_groups: user_groups[i]._id
        }).populate('user')

        let total_students = 0, total_instructors = 0

        for (const j in attendants) {
            if (attendants[j].user.category == student_category._id) {
                total_students++
            }
            if (attendants[j].user.category == instructor_category._id) {
                total_instructors++
            }
        }
        user_groups[i].total_students = total_students
        user_groups[i].total_instructors = total_instructors
    }
    return user_groups
}

// export the router
module.exports = router