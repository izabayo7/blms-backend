// import dependencies
const { User_group } = require('../../models/user_group/user_group.model')
const { User_user_group, validate_user_user_group } = require('../../models/user_user_group/user_user_group.model')
const {
    express,
    _,
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
    User_category,
    u,
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   User_user_group:
 *     properties:
 *       _id:
 *         type: string
 *       user:
 *         type: string
 *       user_group:
 *         type: string
 *       status:
 *         type: number
 *     required:
 *       - user
 *       - faciltiyCollegeYear
 */

/**
 * @swagger
 * /user_user_group:
 *   get:
 *     tags:
 *       - User_user_group
 *     description: Get all user_user_group
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
        let result = await findDocuments(User_user_group)

        // result = await injectDetails(result)

        return res.send(formatResult(200, undefined, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user_user_group/user/{id}:
 *   get:
 *     tags:
 *       - User_user_group
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

        let result = await findDocument(User_user_group, {
            user: req.params.id,
            status: "ACTIVE"
        })

        if (!result)
            return res.send(formatResult(404, `user_user_group for ${req.params.id} was not found`))

        // result = await injectDetails([result])
        // result = result[0]

        return res.send(formatResult(u,u,result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user_user_group:
 *   post:
 *     tags:
 *       - User_user_group
 *     description: Create userFaculty_college_year
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a userFaculty_college_year
 *         in: body
 *         required: true
 *         schema:
 *           properties:
 *             user_group:
 *               type: string
 *             user:
 *               type: string
 *           required:
 *             - user_group
 *             - user
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
        } = validate_user_user_group(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if user_group exist
        let user_group = await findDocument(User_group, {
            _id: req.body.user_group
        })
        if (!user_group)
            return res.send(formatResult(404, 'user_group not found'))

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
            return res.send(formatResult(400, 'Only students and instructors can have a connection with the user_group'))

        let last_active_u_f_c_y = await findDocument(User_user_group, {
            user: user._id,
            status: 'ACTIVE'
        })
        if (last_active_u_f_c_y) {
            await updateDocument(User_user_group, last_active_u_f_c_y._id, {
                status: 'INACTIVE'
            })
        }

        let user_user_group = await findDocument(User_user_group, {
            user_group: req.body.user_group,
            user: user._id
        })
        if (user_user_group)
            return res.send(formatResult(400, `user_user_group you want to create arleady exist`))

        let result = await createDocument(User_user_group, {
            user_group: req.body.user_group,
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
 * /user_user_group/{id}:
 *   delete:
 *     tags:
 *       - User_user_group
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

        let user_user_group = await findDocument(User_user_group, {
            _id: req.params.id
        })
        if (!user_user_group)
            return res.send(formatResult(404, 'user_user_group not found'))

        let result = await deleteDocument(User_user_group, req.params.id)
        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// link the user with his/her current college
async function injectDetails(usersFaculty_college_years) {
    for (const i in usersFaculty_college_years) {
        const user_group = await Faculty_college_year.findOne({
            _id: usersFaculty_college_years[i].user_group
        }).lean()
        usersFaculty_college_years[i].user_group = removeDocumentVersion(user_group)

        const collegeYear = await CollegeYear.findOne({
            _id: user_group.collegeYear
        }).lean()
        usersFaculty_college_years[i].user_group.collegeYear = removeDocumentVersion(collegeYear)

        const facultyCollege = await FacultyCollege.findOne({
            _id: user_group.facultyCollege
        }).lean()
        usersFaculty_college_years[i].user_group.facultyCollege = removeDocumentVersion(facultyCollege)

        const faculty = await Faculty.findOne({
            _id: facultyCollege.faculty
        }).lean()
        usersFaculty_college_years[i].user_group.facultyCollege.faculty = removeDocumentVersion(faculty)

        const college = await College.findOne({
            _id: facultyCollege.college
        }).lean()
        usersFaculty_college_years[i].user_group.facultyCollege.college = removeDocumentVersion(college)
        if (usersFaculty_college_years[i].user_group.facultyCollege.college.logo) {
            usersFaculty_college_years[i].user_group.facultyCollege.college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}`
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