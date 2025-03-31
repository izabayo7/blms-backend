// import dependencies
const {
    express,
    Faculty_college_year,
    Faculty_college,
    College_year,
    findDocuments,
    formatResult,
    findDocument,
    Faculty,
    u,
    createDocument,
    deleteDocument,
    validate_faculty_college_year,
    User_faculty_college_year,
    College,
    validateObjectId,
    updateDocument,
    removeDocumentVersion,
    countDocuments,
    simplifyObject,
    User
} = require('../../utils/imports')
// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Faculty_college_year:
 *     properties:
 *       faculty_college:
 *         type: string
 *       college_year:
 *         type: string
 *     required:
 *       - faculty_college
 *       - college_year
 */

/**
 * @swagger
 * /faculty_college_year:
 *   get:
 *     tags:
 *       - Faculty_college_year
 *     description: Get all faculty_college_years
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
        let result = await findDocuments(Faculty_college_year)

        if (result.length === 0)
            return res.send(formatResult(404, 'faculty_college_year list is empty'))

        // result = await injectDetails(result)

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /faculty_college_year/college/{id}:
 *   get:
 *     tags:
 *       - Faculty_college_year
 *     description: Returns faculty_college_years in a specified college
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
router.get('/college/:id', async (req, res) => {
    try {
        // check if college exist
        let college = await findDocument(College, {
            _id: req.params.id
        })
        if (!college)
            return res.send(formatResult(404, `College with code ${req.params.id} doens't exist`))

        let faculty_college_years = await findDocuments(Faculty_college, {
            college: req.params.id
        })
        if (faculty_college_years.length < 1)
            return res.send(formatResult(404, `faculty_college in ${college.name} Not Found`))

        let foundFaculty_college_years = []

        for (const faculty_college of faculty_college_years) {

            const faculty_details = await findDocument(Faculty, {
                _id: faculty_college.faculty
            })

            const response = await findDocuments(Faculty_college_year, {
                faculty_college: faculty_college._id
            })

            for (const faculty_college_year of response) {

                const year_details = await findDocument(College_year, {
                    _id: faculty_college_year.college_year
                })

                foundFaculty_college_years.push({
                    _id: faculty_college_year._id,
                    faculty_college: faculty_college_year.faculty_college,
                    college_year: faculty_college_year.college_year,
                    name: `${faculty_details.name} Year ${year_details.digit}`
                })
            }
        }
        if (foundFaculty_college_years.length < 1)
            return res.send(formatResult(404, `There are no Faculty College Years in ${college.name}`))

        foundFaculty_acollege_years = await injectDetails(foundFaculty_college_years)

        return res.send(formatResult(u, u, foundFaculty_college_years))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /faculty_college_year/user/{user_name}:
 *   get:
 *     tags:
 *       - Faculty_college_year
 *     description: Returns faculty_college_years for a specified user
 *     parameters:
 *       - name: id
 *         description: User's user_name
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
router.get('/user/:user_name', async (req, res) => {
    try {
        // check if college exist
        let user = await findDocument(User, {
            user_name: req.params.user_name
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        let user_faculty_college_years = await findDocuments(User_faculty_college_year, {
            user: user._id,
            status: 1
        })

        let foundFaculty_college_years = []

        for (const user_faculty_college_year of user_faculty_college_years) {

            const faculty_college_year = await findDocument(Faculty_college_year, {
                _id: user_faculty_college_year.faculty_college_year
            })

            const faculty_college = await findDocument(Faculty_college, {
                _id: faculty_college_year.faculty_college
            })

            const faculty = await findDocument(Faculty, {
                _id: faculty_college.faculty
            })


            const year = await findDocument(College_year, {
                _id: faculty_college_year.college_year
            })

            foundFaculty_college_years.push({
                _id: faculty_college_year._id,
                faculty_college: faculty_college_year.faculty_college,
                college_year: faculty_college_year.college_year,
                name: `${faculty.name} Year ${year.digit}`
            })

        }

        foundFaculty_acollege_years = await injectDetails(foundFaculty_college_years)

        return res.send(formatResult(u, u, foundFaculty_college_years))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /faculty_college_year:
 *   post:
 *     tags:
 *       - Faculty_college_year
 *     description: Create faculty_college_year
 *     parameters:
 *       - name: body
 *         description: Fields for a faculty_college_year
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Faculty_college_year'
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
        } = validate_faculty_college_year(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if faculty_college exist
        let faculty_college = await findDocument(Faculty_college, {
            _id: req.body.faculty_college
        })
        if (!faculty_college)
            return res.send(formatResult(404, `Faculty_college with code ${req.body.faculty_college} doens't exist`))

        // check if college_year exist
        let college_year = await findDocument(College_year, {
            _id: req.body.college_year
        })
        if (!college_year)
            return res.send(formatResult(404, `College_year with code ${req.body.college_year} doens't exist`))

        let faculty_college_year = await findDocument(Faculty_college_year, {
            faculty_college: req.body.faculty_college,
            college_year: req.body.college_year
        })
        if (faculty_college_year)
            return res.send(formatResult(400, `faculty_college_year you want to create arleady exist`))

        let result = await createDocument(Faculty_college_year, {
            faculty_college: req.body.faculty_college,
            college_year: req.body.college_year
        })

        // result = await injectDetails([simplifyObject(result)])

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /faculty_college_year/{id}:
 *   delete:
 *     tags:
 *       - Faculty_college_year
 *     description: Delete a faculty_college_year
 *     parameters:
 *       - name: id
 *         description: faculty_college_year's id
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

        let faculty_college_year = await findDocument(Faculty_college_year, {
            _id: req.params.id
        })
        if (!faculty_college_year)
            return res.send(formatResult(404, `faculty_college_year of Code ${req.params.id} Not Found`))

        // check if the faculty_college_year is never used
        const faculty_college_year_found = await findDocument(User_faculty_college_year, {
            faculty_college_year: req.params.id
        })
        if (!faculty_college_year_found) {
            let result = await deleteDocument(Faculty_college_year, req.params.id)
            return res.send(result)
        }

        const update_faculty_college_year = await updateDocument(Faculty_college_year, req.params.id, {
            status: 0
        })
        return res.send(formatResult(200, `User ${update_faculty_college_year._id} couldn't be deleted because it was used, instead it was disabled`, update_faculty_college_year.data))

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// link the student with his/her current college
async function injectDetails(faculty_college_years) {
    for (const i in faculty_college_years) {

        const faculty_college = await findDocument(Faculty_college, {
            _id: faculty_college_years[i].faculty_college
        })
        faculty_college_years[i].faculty_college = simplifyObject(removeDocumentVersion(faculty_college))

        const faculty = await findDocument(Faculty, {
            _id: faculty_college_years[i].faculty_college.faculty
        })
        faculty_college_years[i].faculty_college.faculty = simplifyObject(removeDocumentVersion(faculty))

        const college = await findDocument(College, {
            _id: faculty_college_years[i].faculty_college.college
        })
        faculty_college_years[i].faculty_college.college = simplifyObject(removeDocumentVersion(college))
        if (faculty_college_years[i].faculty_college.college.logo) {
            faculty_college_years[i].faculty_college.college.logo = `http://${process.env.HOST}/kurious/file/collegeLogo/${college._id}/${college.logo}`
        }

        const college_year = await findDocument(College_year, {
            _id: faculty_college_years[i].college_year
        })
        faculty_college_years[i].college_year = removeDocumentVersion(college_year)

        // add the number of students
        const attendants = await countDocuments(User_faculty_college_year, {
            faculty_college_year: faculty_college_years[i]._id
        })
        faculty_college_years[i].attendants = attendants
    }
    return faculty_college_years
}

// export the router
module.exports = router