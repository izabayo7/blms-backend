// import dependencies
const {
    express,
    _,
    User_faculty_college_year,
    findDocuments,
    formatResult,
    findDocument,
    Faculty_college_year,
    User,
    updateDocument,
    createDocument,
    simplifyObject,
    validateObjectId,
    deleteDocument,
    validate_user_faculty_college_year,
    User_category,
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   User_faculty_college_year:
 *     properties:
 *       _id:
 *         type: string
 *       user:
 *         type: string
 *       faculty_college_year:
 *         type: string
 *       status:
 *         type: number
 *     required:
 *       - user
 *       - faciltiyCollegeYear
 */

/**
 * @swagger
 * /user_faculty_college_year:
 *   get:
 *     tags:
 *       - User_faculty_college_year
 *     description: Get all user_faculty_college_year
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
        let result = await findDocuments(User_faculty_college_year)

        // result = await injectDetails(result)

        return res.send(formatResult(200, undefined, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user_faculty_college_year/user/{id}:
 *   get:
 *     tags:
 *       - User_faculty_college_year
 *     description: Get a user's current userFaculty_college_year
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: User's id
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

        let result = await findDocument(User_faculty_college_year, {
            user: req.params.id,
            status: 1
        })

        if (!result)
            return res.send(formatResult(404, `user_faculty_college_year for ${req.params.id} was not found`))

        // result = await injectDetails([result])
        // result = result[0]

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user_faculty_college_year:
 *   post:
 *     tags:
 *       - User_faculty_college_year
 *     description: Create userFaculty_college_year
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a userFaculty_college_year
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/User_faculty_college_year'
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
        } = validate_user_faculty_college_year(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if faculty_college_year exist
        let faculty_college_year = await findDocument(Faculty_college_year, {
            _id: req.body.faculty_college_year
        })
        if (!faculty_college_year)
            return res.send(formatResult(404, 'faculty_college_year not found'))

        // check if user exist
        let user = await findDocument(User, {
            user_name: req.body.user
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        let user_category = await findDocument(User_category, {
            _id: user.category
        })

        if (user_category.name !== 'STUDENT' && user_category.name !== 'INSTRUCTOR')
            return res.send(formatResult(400, 'Only students and instructors can have a connection with the faculty_college_year'))

        let last_active_u_f_c_y = await findDocument(User_faculty_college_year, {
            user: user._id,
            status: 1
        })
        if (last_active_u_f_c_y) {
            await updateDocument(User_faculty_college_year, last_active_u_f_c_y._id, {
                status: 0
            })
        }

        let user_faculty_college_year = await findDocument(User_faculty_college_year, {
            faculty_college_year: req.body.faculty_college_year,
            user: user._id
        })
        if (user_faculty_college_year)
            return res.send(formatResult(400, `user_faculty_college_year you want to create arleady exist`))

        let result = await createDocument(User_faculty_college_year, {
            faculty_college_year: req.body.faculty_college_year,
            user: user._id
        })

        // result = await injectDetails([simplifyObject(result)])
        // result = result[0]

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user_faculty_college_year/{id}:
 *   delete:
 *     tags:
 *       - User_faculty_college_year
 *     description: Delete a userFaculty_college_year
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: userFaculty_college_year's id
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

        let user_faculty_college_year = await findDocument(User_faculty_college_year, {
            _id: req.params.id
        })
        if (!user_faculty_college_year)
            return res.send(formatResult(404, 'user_faculty_college_year not found'))

        let result = await deleteDocument(User_faculty_college_year, req.params.id)
        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// link the user with his/her current college
async function injectDetails(usersFaculty_college_years) {
    for (const i in usersFaculty_college_years) {
        const faculty_college_year = await Faculty_college_year.findOne({
            _id: usersFaculty_college_years[i].faculty_college_year
        }).lean()
        usersFaculty_college_years[i].faculty_college_year = removeDocumentVersion(faculty_college_year)

        const collegeYear = await CollegeYear.findOne({
            _id: faculty_college_year.collegeYear
        }).lean()
        usersFaculty_college_years[i].faculty_college_year.collegeYear = removeDocumentVersion(collegeYear)

        const facultyCollege = await FacultyCollege.findOne({
            _id: faculty_college_year.facultyCollege
        }).lean()
        usersFaculty_college_years[i].faculty_college_year.facultyCollege = removeDocumentVersion(facultyCollege)

        const faculty = await Faculty.findOne({
            _id: facultyCollege.faculty
        }).lean()
        usersFaculty_college_years[i].faculty_college_year.facultyCollege.faculty = removeDocumentVersion(faculty)

        const college = await College.findOne({
            _id: facultyCollege.college
        }).lean()
        usersFaculty_college_years[i].faculty_college_year.facultyCollege.college = removeDocumentVersion(college)
        if (usersFaculty_college_years[i].faculty_college_year.facultyCollege.college.logo) {
            usersFaculty_college_years[i].faculty_college_year.facultyCollege.college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}`
        }
        let user = await User.findOne({
            _id: usersFaculty_college_years[i].user
        }).lean()
        usersFaculty_college_years[i].user = _.pick(user, ['_id', 'surName', 'otherNames', 'gender', 'phone', 'profile'])
        // add user profile media path
        if (user.profile) {
            usersFaculty_college_years[i].user.profile = `http://${process.env.HOST}/kurious/file/userProfile/${user._id}`
        }
    }
    return usersFaculty_college_years
}

// export the router
module.exports = router