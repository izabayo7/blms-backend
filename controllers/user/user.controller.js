// import dependencies
const {DeleteSourceFile} = require("../user_invitations/user_invitations.controller");
const {createMultipleUsers} = require("../user_invitations/user_invitations.controller");
const {getEmailConfirmation} = require("../account_confirmations/account_confirmations.controller");
const {sendEmailConfirmation} = require("../email/email.controller");
const {Account_confirmation} = require("../../models/account_confirmations/account_confirmations.model");
const {AcceptCollege} = require("../account_confirmations/account_confirmations.controller");
const {confirmAccount} = require("../account_confirmations/account_confirmations.controller");
const {createAccountConfirmation} = require("../account_confirmations/account_confirmations.controller");
const {sendSubmissionEmail} = require("../email/email.controller");
const {calculateAmount} = require("../../utils/imports");
const {Account_payments} = require("../../models/account_payments/account_payments.model");
const {College_payment_plans} = require("../../models/college_payment_plans/college_payment_plans.model");
const {User_attendance} = require("../../models/user_attendance/user_attendance.model");
const {Live_session} = require("../../utils/imports");
const {Chapter} = require("../../utils/imports");
const {filterUsers} = require("../../middlewares/auth.middleware");
const {User_invitation} = require("../../models/user_invitations/user_invitations.model");
const {compare, hash} = require('bcryptjs')
const {validateUserPasswordUpdate, validate_admin} = require('../../models/user/user.model')
const {User_group} = require('../../models/user_group/user_group.model')
const {User_user_group} = require('../../models/user_user_group/user_user_group.model')
const {
    express,
    User,
    User_category,
    College,
    u,
    User_faculty_college_year,
    fs,
    bcrypt,
    default_password,
    random_user_name,
    validate_user,
    formatResult,
    findDocument,
    findDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    hashPassword,
    validateObjectId,
    validateUserLogin,
    generateAuthToken,
    add_user_details,
    Search,
    Course,
    User_progress,
    Quiz_submission,
    sendResizedImage,
    simplifyObject,
    _,
    College_year,
    Faculty_college,
    Faculty,
    Faculty_college_year,
    upload_single_image,
    Chat_group,
    Quiz,
    date,
    auth,
    validate_chat_group_profile_udpate,
    savedecodedBase64Image,
    addStorageDirectoryToPath,
    countDocuments,
    MyEmitter,
    update_password
} = require('../../utils/imports')
const {sendConfirmEmail} = require('../email/email.controller')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   User:
 *     properties:
 *       sur_name:
 *         type: string
 *       other_names:
 *         type: string
 *       user_name:
 *         type: string
 *       date_of_birth:
 *         type: string
 *         format: date
 *       gender:
 *         type: string
 *         enum: ['male', 'female']
 *       phone:
 *         type: string
 *       email:
 *         type: string
 *       college:
 *         type: string
 *       category:
 *         type: string
 *       password:
 *         type: string
 *       status:
 *         type: object
 *         properties:
 *           stillMember:
 *             type: boolean
 *           active:
 *             type: boolean
 *       profile:
 *         type: string
 *     required:
 *       - sur_name
 *       - other_names
 *       - gender
 *       - phone
 *       - email
 *       - category
 */

/**
 * @swagger
 * definitions:
 *   UserLogin:
 *     properties:
 *       email_or_user_name:
 *         type: string
 *       password:
 *         type: string
 */

router.get('/reg_number/:regnumber', async (req, res) => {
    try {
        console.log(req.params.regnumber)
        // check from db if the given reg_number exists
        let exists = true, paid = false
        if (!exists)
            return res.status(404).send("Reg number is invalid")

        return res.send({
            paid
        })
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/statistics:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get User statistics
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
router.get('/statistics', [auth, filterUsers(["SUPERADMIN", "ADMIN"])], async (req, res) => {
    try {
        let total_users, total_students, total_instructors, total_staff, total_admins;
        const admin_category = await findDocument(User_category, {name: "ADMIN"})
        const student_category = await findDocument(User_category, {name: "STUDENT"})
        const instructor_category = await findDocument(User_category, {name: "INSTRUCTOR"})

        if (req.user.category.name == "SUPERADMIN") {
            total_users = await countDocuments(User)
            total_students = await countDocuments(User, {category: student_category._id})
            total_admins = await countDocuments(User, {category: admin_category._id})
            total_instructors = await countDocuments(User, {category: instructor_category._id})
            total_staff = await countDocuments(User, {
                $and: [
                    {
                        category: {
                            $ne: student_category._id
                        },
                    },
                    {
                        category: {
                            $ne: instructor_category._id
                        },
                    }
                ]
            })
        } else {
            total_users = await countDocuments(User, {college: req.user.college, "status.deleted": {$ne: 1}})
            total_students = await countDocuments(User, {
                college: req.user.college,
                category: student_category._id,
                "status.deleted": {$ne: 1}
            })
            total_admins = await countDocuments(User, {
                college: req.user.college,
                category: admin_category._id,
                "status.deleted": {$ne: 1}
            })
            total_instructors = await countDocuments(User, {
                college: req.user.college,
                category: instructor_category._id,
                "status.deleted": {$ne: 1}
            })
            total_staff = await countDocuments(User, {
                college: req.user.college,
                "status.deleted": {$ne: 1},
                $and: [
                    {
                        category: {
                            $ne: student_category._id
                        },
                    },
                    {
                        category: {
                            $ne: instructor_category._id
                        },
                    }
                ]
            })
        }
        return res.send(formatResult(u, u, {total_users, total_students, total_instructors, total_staff, total_admins}))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/statistics/user_joins:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get User statistics of how user joined
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: start_date
 *         description: The starting date
 *         in: query
 *         required: true
 *         type: string
 *       - name: end_date
 *         description: The ending date
 *         in: query
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
router.get('/statistics/user_joins', [auth, filterUsers(["ADMIN"])], async (req, res) => {
    try {
        const {start_date, end_date} = req.query
        const result = await User.aggregate([
            {"$match": {createdAt: {$gt: date(start_date), $lte: date(end_date)}}},
            {"$match": {college: req.user.college}},
            {
                "$group": {
                    "_id": {
                        "$subtract": [
                            "$createdAt",
                            {
                                "$mod": [
                                    {"$subtract": ["$createdAt", date("1970-01-01T00:00:00.000Z")]},
                                    1000 * 60 * 60 * 24
                                ]
                            }
                        ]
                    },
                    "total_users": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ])
        return res.send(formatResult(u, u, result))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/college/{category}:
 *   get:
 *     tags:
 *       - User
 *     description: Returns users in a specified college
 *     parameters:
 *       - name: id
 *         description: College's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: category
 *         description: User category
 *         in: path
 *         required: true
 *         type: string
 *         enum: ['STUDENT','INSTRUCTOR', 'ALL']
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
router.get('/college/:category', [auth, filterUsers(["ADMIN"])], async (req, res) => {
    try {

        if (!['STUDENT', 'INSTRUCTOR', 'ALL'].includes(req.params.category))
            return res.send(formatResult(400, "Invalid category"))

        let user_category = await findDocument(User_category, {
            name: req.params.category
        })

        let users = await findDocuments(User, req.params.category === 'ALL' ? {
            college: req.user.college,
            _id: {$ne: req.user._id},
            "status.deleted": {$ne: 1}
        } : {
            college: req.user.college,
            category: user_category._id,
            _id: {$ne: req.user._id}
        })

        users = await add_user_details(users)

        return res.send(formatResult(u, u, users))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/faculty/{id}/{category}:
 *   get:
 *     tags:
 *       - User
 *     description: Returns users in a specified faculty in your college depending on who you are
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Faculty's id
 *         in: path
 *         required: true
 *         type: string
 *       - name: category
 *         description: User category
 *         in: path
 *         required: true
 *         type: string
 *         enum: ['STUDENT','INSTRUCTOR','ALL']
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/faculty/:id/:category', [auth, filterUsers(["ADMIN"])], async (req, res) => {
    try {
        const {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        if (!['STUDENT', 'INSTRUCTOR', 'ALL'].includes(req.params.category))
            return res.send(formatResult(400, "Invalid category"))

        let faculty = await findDocument(Faculty, {
            _id: req.params.id
        })
        if (!faculty)
            return res.send(formatResult(404, 'Faculty Not Found'))

        let user_category = await findDocument(User_category, {
            name: req.params.category
        })

        const result = []

        let user_groups = await findDocuments(User_group, {
            faculty: faculty._id,
            status: "ACTIVE"
        })
        for (const k in user_groups) {
            let user_user_groups = await User_user_group.find({
                user_group: user_groups[k]._id,
                status: "ACTIVE"
            }).populate('user')
            for (const j in user_user_groups) {
                if (!user_category || user_user_groups[j].user.category === user_category._id.toString())
                    result.push(user_user_groups[j].user)
            }
        }


        users = await add_user_details(result)

        return res.send(formatResult(u, u, users))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/search:
 *   get:
 *     tags:
 *       - User
 *     description: Search users
 *     parameters:
 *       - name: data
 *         description: search value
 *         in: query
 *         type: string
 *         required: true
 *       - name: page
 *         description: page number
 *         in: query
 *         required: true
 *         type: string
 *       - name: limit
 *         description: limit number
 *         in: query
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
router.get('/search', auth, async (req, res) => {
    try {

        let {
            data,
            error
        } = await Search(User, {
            email: {
                $ne: req.user.email
            },
            college: req.user.college,
            $or: [{
                sur_name: {
                    $regex: req.query.data,
                    $options: '$i'
                }
            }, {
                other_names: {
                    $regex: req.query.data,
                    $options: '$i'
                }
            }, {
                user_name: {
                    $regex: req.query.data,
                    $options: '$i'
                }
            }, {
                email: {
                    $regex: req.query.data,
                    $options: '$i'
                }
            }]
        }, {
            phone: 0,
            _id: 0,
            password: 0,
            createdAt: 0,
            updatedAt: 0,
            status: 0
        }, req.query.page, req.query.limit)

        if (error)
            return res.send(formatResult(400, error))

        data = simplifyObject(data)

        data.results = await add_user_details(data.results)

        res.send(formatResult(u, u, data))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /user/current:
 *   get:
 *     tags:
 *       - User
 *     description: Returns a the logged in user info
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
router.get('/current', auth, async (req, res) => {
    try {
        let user = req.user;

        if (!user)
            return res.send(formatResult(404, 'user not found'))

        user = await add_user_details([user])
        user = user[0]

        return res.send(formatResult(u, u, user))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/checkUserNameExistance/{user_name}:
 *   get:
 *     tags:
 *       - User
 *     description: tells whether the username is available or taken
 *     parameters:
 *       - name: user_name
 *         description: User name
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
router.get('/checkUserNameExistance/:user_name', checkUsernameExistence)

/**
 * @swagger
 * /user/checkEmailUpdateRequest:
 *   get:
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: -[]
 *     description: returns the latest pending email update request
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/checkEmailUpdateRequest', auth, getEmailConfirmation)

/**
 * @swagger
 * /user/checkEmailExistance/{email}:
 *   get:
 *     tags:
 *       - User
 *     description: tells whether the email is available or taken
 *     parameters:
 *       - name: email
 *         description: User email
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
router.get('/checkEmailExistance/:email', checkEmailExistance)

/**
 * @swagger
 * /user/checkPhoneExistance/{phone}:
 *   get:
 *     tags:
 *       - User
 *     description: tells whether the phone is available or taken
 *     parameters:
 *       - name: phone
 *         description: User phone
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
router.get('/checkPhoneExistance/:phone', checkPhoneExistance)

/**
 * @swagger
 * /user/{user_name}:
 *   get:
 *     tags:
 *       - User
 *     description: Returns a specified user
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: user_name
 *         description: User name
 *         in: path
 *         required: true
 *         type: string
 *       - name: measure
 *         description: Tells if you need few info or extended
 *         in: query
 *         type: string
 *         enum: ['few','extended']
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/:user_name', auth, async (req, res) => {
    try {
        let user = await findDocument(User, {
            user_name: req.params.user_name,
            college: req.user.college
        })

        if (!user)
            return res.send(formatResult(404, 'user not found'))

        user = await add_user_details([user])
        user = user[0]

        if (!req.query.measure || req.query.measure.toLowerCase() !== 'extended')
            return res.send(formatResult(u, u, user))

        const user_user_groups = await User_user_group.find({
            user: user._id,
            status: "ACTIVE"
        }, {user_group: 1}).populate('user_group')

        const user_group_names = []

        user_user_groups.map(x => {
            user_group_names.push(x.user_group.name)
        })

        let courses

        if (user.category === "INSTRUCTOR") {

            courses = await Course.find({
                user: user._id.toString()
            }).populate('user_group').lean()

            for (const coursesKey in courses) {
                const chapters = await Chapter.distinct('_id', {course: courses[coursesKey]._id.toString()})

                courses[coursesKey].total_students = await User_progress.distinct('user', {course: courses[coursesKey]._id.toString()}).count()

                const quiz = await Quiz.find({
                    "target.type": "chapter",
                    "target.id": {$in: chapters.map(x => x.toString())},
                    status: 2
                }, {total_marks: 1, status: 1, updatedAt: 1}).sort({_id: -1})

                const submissions = await Quiz_submission.find({
                    quiz: {$in: quiz.map(x => x._id.toString())}
                }, {total_marks: 1, quiz: 1})

                let total_required = 0
                let total_got = 0

                quiz.map(x => {
                    total_required += (x.total_marks * submissions.filter(y => y.quiz === x._id.toString()).length)

                    if (x.status === 2)
                        if (!courses[coursesKey].latest_marks_release)
                            courses[coursesKey].latest_marks_release = x.updatedAt
                })

                submissions.map(x => {
                    total_got += x.total_marks
                })

                if (submissions.length)
                    courses[coursesKey].successRate = (total_got / total_required) * 100

                courses[coursesKey].total_chapters = chapters.length

            }

        } else if (user.category === "STUDENT") {

            courses = await Course.find({
                user_group: {
                    $in: user_user_groups.map(x =>
                        x.user_group._id.toString()
                    )
                }
            }).populate('user_group').lean()

            for (const coursesKey in courses) {
                const chapters = await Chapter.distinct('_id', {course: courses[coursesKey]._id.toString()})

                const quiz = await Quiz.find({
                    "target.type": "chapter",
                    "target.id": {$in: chapters.map(x => x.toString())},
                    status: 2
                }, {total_marks: 1, status: 1, updatedAt: 1}).sort({_id: -1})

                const submissions = await Quiz_submission.find({
                    user: user._id.toString(),
                    quiz: {$in: quiz.map(x => x._id.toString())}
                }, {total_marks: 1, quiz: 1}).sort({_id: -1})

                let total_required = 0
                let total_got = 0

                quiz.map(x => {
                    total_required += x.total_marks
                })

                submissions.map(x => {
                    total_got += x.total_marks
                })

                if (submissions.length) {
                    courses[coursesKey].successRate = ((total_got / total_required) * 100) || 0
                    courses[coursesKey].last_quiz = Math.round(submissions[0].total_marks) + '/' + Math.round(quiz.filter(x => x._id.toString() === submissions[0].quiz)[0].total_marks)
                }

                courses[coursesKey].progress = await User_progress.findOne({
                    course: courses[coursesKey]._id.toString(),
                    user: user._id.toString()
                })

                if (courses[coursesKey].progress) {
                    const length = courses[coursesKey].progress.finished_chapters.length
                    if (length)
                        courses[coursesKey].last_accessed_chapter = await Chapter.findOne({
                            _id: courses[coursesKey].progress.finished_chapters[length - 1].id
                        })
                }
                if (req.user.category.name === 'INSTRUCTOR') {
                    let live_sessions = await Live_session.find({
                        "target.type": "chapter",
                        "target.id": {$in: chapters.map(x => x.toString())}
                    }, {_id: 1}).sort({_id: -1})

                    const attendances = await User_attendance.find({
                        user: user._id.toString(),
                        live_session: {$in: live_sessions.map(x => x._id.toString())}
                    }).populate('live_session',
                        {attendance_check: 1}
                    )

                    let student_total_attendance = 0
                    attendances.map(x => {
                        student_total_attendance += (x.attendance / x.live_session.attendance_check)
                    })
                    if (attendances.length) {
                        courses[coursesKey].attendanceRate = student_total_attendance / attendances.length
                        const found = attendances.filter(x => x.live_session._id.toString() === live_sessions[0]._id.toString())
                        if (found.length)
                            courses[coursesKey].attendanceLastSession = true
                    }
                }
            }

        }


        return res.send(formatResult(u, u, {
            user,
            courses,
            user_groups: user_group_names.join(',')
        }))

    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/byId/{id}:
 *   get:
 *     tags:
 *       - User
 *     description: Returns a specified user
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
router.get('/byId/:id', auth, async (req, res) => {
    try {

        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, "invalid id"))

        let user = await findDocument(User, {
            _id: req.params.id
        })

        if (!user)
            return res.send(formatResult(404, 'user not found'))

        user = await add_user_details([user])
        user = user[0]

        return res.send(formatResult(u, u, user))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/{user_name}/profile/{file_name}:
 *   get:
 *     tags:
 *       - User
 *     description: Returns the profile of a specified user
 *     parameters:
 *       - name: user_name
 *         description: User name
 *         in: path
 *         required: true
 *         type: string
 *       - name: file_name
 *         description: File name
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
router.get('/:user_name/profile/:file_name', async (req, res) => {
    try {

        // check if college exist
        const user = await findDocument(User, {
            user_name: req.params.user_name
        })
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        if (!user.profile || (user.profile != req.params.file_name))
            return res.send(formatResult(404, 'file not found'))

        let path = addStorageDirectoryToPath(user.college ? `./uploads/colleges/${user.college}/user_profiles/${user.profile}` : `./uploads/system/user_profiles/${user.profile}`)

        sendResizedImage(req, res, path)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user:
 *   post:
 *     tags:
 *       - User
 *     description: Create User
 *     parameters:
 *       - name: body
 *         description: Fields for an User
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/User'
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
        } = validate_user(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if the name or email were not used
        let user = await findDocument(User, {
            $or: [{
                email: req.body.email,
                "status.deleted": {$ne: 1}
            }, {
                user_name: req.body.user_name
            }],
        })

        if (user) {
            const emailFound = req.body.email == user.email
            const user_nameFound = req.body.user_name == user.user_name
            return res.send(formatResult(403, `User with ${emailFound ? 'same email ' : user_nameFound ? 'same user_name ' : ''} arleady exist`))
        }
        // avoid user_name === group name
        let chat_group = await findDocument(Chat_group, {
            name: req.body.user_name
        })
        if (chat_group)
            return res.send(formatResult(403, 'user_name was taken'))

        let user_category = await findDocument(User_category, {
            name: req.body.category
        })
        if (!user_category)
            return res.send(formatResult(404, 'category not found'))

        let college

        if (user_category.name !== 'SUPER_ADMIN') {
            if (!req.body.college) {
                return res.send(formatResult(400, `${user_category.name.toLowerCase()} must have a college`))
            }

            college = await findDocument(College, {
                name: req.body.college
            })
            if (!college)
                return res.send(formatResult(404, `College ${req.body.college} Not Found`))

            if (user_category.name === 'ADMIN') {
                const find_admin = await findDocuments(User, {
                    category: user_category._id,
                    college: college._id
                })

                if (find_admin.length > 2)
                    return res.send(formatResult(404, `College ${college.name} can't have more than three admin`))
            } else {
                let user_count = await countDocuments(User, {college: college._id})
                if (user_count >= college.maximum_users) {
                    return res.send(formatResult(404, `College ${req.body.college} users limit reached`))
                } else if (user_count === college.maximum_users - 1) {
                    // notify the admin that user limit is over
                    MyEmitter.emit('socket_event', {
                        name: `user_limit_reached_${college._id}`
                    });
                }
            }
        } else {
            const find_super_admin = await findDocument(User, {
                category: req.body.category
            })

            if (find_super_admin)
                return res.send(formatResult(404, `System can't have more than one super_admin`))
        }


        let result = await createDocument(User, {
            user_name: req.body.user_name,
            sur_name: req.body.sur_name,
            other_names: req.body.other_names,
            registration_number: req.body.registration_number,
            phone: req.body.phone,
            gender: req.body.gender,
            email: req.body.email,
            password: await hashPassword(req.body.password),
            college: college._id,
            category: user_category._id,
            date_of_birth: req.body.date_of_birth
        })

        // notify the admin that a new user joined
        MyEmitter.emit('socket_event', {
            name: `new_user_in_${college._id}`, data: result.data
        });

        await User_invitation.findOneAndUpdate({
            email: req.body.email,
            college: college._id,
        }, {status: "ACCEPTED"})

        if (user_category !== "ADMIN")
            await addUserBill(college._id, user_category)

        const new_user = result.data
        result.data = {
            user: new_user,
            token: await generateAuthToken(new_user)
        }
        return res.status(201).send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/multiple:
 *   post:
 *     tags:
 *       - User
 *     description: Creates Users from uploaded file
 *     security:
 *       - bearerAuth: -[]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: xlsx file with user information
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/multiple', [auth, filterUsers(["ADMIN"]), createMultipleUsers, DeleteSourceFile])


/**
 * @swagger
 * /user/admin:
 *   post:
 *     tags:
 *       - User
 *     description: Create Admin
 *     parameters:
 *       - name: body
 *         description: Fields for an User
 *         in: body
 *         required: true
 *         schema:
 *           properties:
 *             sur_name:
 *               type: string
 *             other_names:
 *               type: string
 *             user_name:
 *               type: string
 *             phone:
 *               type: string
 *             gender:
 *               type: string
 *               enum: ['male', 'female']
 *             email:
 *               type: string
 *             password:
 *               type: string
 *             college:
 *               type: string
 *             college_phone:
 *               type: string
 *             college_email:
 *               type: string
 *             position:
 *               type: string
 *             maximum_users:
 *               type: number
 *     required:
 *       - sur_name
 *       - other_names
 *       - user_name
 *       - gender
 *       - password
 *       - email
 *       - college
 *       - position
 *       - maximum_users
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
router.post('/admin', async (req, res) => {
    try {
        const {
            error
        } = validate_admin(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if the name or email were not used
        let user = await findDocument(User, {
            $or: [
                {
                    email: req.body.email,
                },
                {
                    email: req.body.college_email,
                },
                {
                    phone: req.body.phone,
                },
                {
                    phone: req.body.college_phone,
                },
                {
                    user_name: req.body.user_name
                }],
            "status.deleted": {$ne: 1}
        })

        if (user) {
            const emailFound = [req.body.email, req.body.college_email].includes(user.email)
            const phoneFound = [req.body.phone, req.body.college_phone].includes(user.phone)
            const user_nameFound = req.body.user_name === user.user_name
            return res.send(formatResult(403,
                `User ${emailFound ? 'email' : user_nameFound ? 'user_name ' : phoneFound ? 'phone' : ''} was arleady used`))
        }


        // avoid user_name === group name
        let chat_group = await findDocument(Chat_group, {
            name: req.body.user_name
        })
        if (chat_group)
            return res.send(formatResult(403, 'user_name was taken'))

        let user_category = await findDocument(User_category, {
            name: "ADMIN"
        })
        if (!user_category)
            return res.send(formatResult(404, 'ADMIN category not found'))

        // check if the name or email were not used
        let college = await findDocument(College, {
            $or: [
                {name: req.body.college},
                {
                    email: req.body.email,
                },
                {
                    email: req.body.college_email,
                },
                {
                    phone: req.body.phone,
                },
                {
                    phone: req.body.college_phone,
                },
            ]
        })
        if (college) {
            const emailFound = [req.body.email, req.body.college_email].includes(college.email)
            const phoneFound = [req.body.phone, req.body.college_phone].includes(college.phone)
            return res.send(formatResult(403,
                `Institution ${emailFound ? 'email' : phoneFound ? 'phone' : ''} was arleady used`))
        }

        const {sent, err} = await sendConfirmEmail({
            email: req.body.email,
            institution_email: req.body.college_email,
            user_name: req.body.sur_name + ' ' + req.body.other_names,
            institution_name: req.body.college,
            subscription: "TRIAL"
        })
        if (err)
            return res.send(formatResult(500, err));

        let saved_college = await createDocument(College, {
            name: req.body.college,
            email: req.body.college_email,
            phone: req.body.college_phone,
            maximum_users: req.body.maximum_users
        })

        let result = await createDocument(User, {
            user_name: req.body.user_name,
            sur_name: req.body.sur_name,
            other_names: req.body.other_names,
            gender: req.body.gender,
            email: req.body.email,
            position: req.body.position,
            password: await hashPassword(req.body.password),
            college: saved_college.data._id,
            category: user_category._id
        })

        // create college plan
        await createDocument(College_payment_plans, {
            college: saved_college.data._id,
            plan: 'TRIAL'
        })

        // create user account confirmation
        const confirmation = await createAccountConfirmation({user_id: result.data._id})

        await sendSubmissionEmail({
            user_email: req.body.email,
            user_phone: req.body.phone,
            max_users: req.body.maximum_users,
            user_name: req.body.sur_name + ' ' + req.body.other_names,
            institution_name: req.body.college,
            institution_email: req.body.college_email,
            subscription: "TRIAL",
            token: confirmation._id.toString(),
        });

        return res.send(formatResult(201, 'Account was successfully created, check your email.'));
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/confirm/{token}:
 *   get:
 *     tags:
 *       - User
 *     description: confirm user account
 *     parameters:
 *       - name: token
 *         description: confirmation token
 *         in: path
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal Server Error
 */
router.get('/confirm/:token', confirmAccount)

/**
 * @swagger
 * /user/confirm/{token}:
 *   get:
 *     tags:
 *       - User
 *     description: confirm user account
 *     parameters:
 *       - name: token
 *         description: confirmation token
 *         in: path
 *         type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 *       500:
 *         description: Internal Server Error
 */
router.get('/confirm/:token', confirmAccount)

router.get('/accept/:token', AcceptCollege)

/**
 * @swagger
 * /user/login:
 *   post:
 *     tags:
 *       - Auth
 *     description: User login
 *     parameters:
 *       - name: body
 *         description: Fields for an User
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/UserLogin'
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
router.post('/login', async (req, res) => {
    try {
        const {
            error
        } = validateUserLogin(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // find user
        let user = await findDocument(User, {
            $or: [{
                email: req.body.email_or_user_name
            }, {
                user_name: req.body.email_or_user_name
            }],
            "status.deleted": {$ne: 1}
        })

        const erroMessage = 'invalid credentials'

        if (!user)
            return res.send(formatResult(400, erroMessage))

        // check if passed password is valid
        const validPassword = await bcrypt.compare(req.body.password, user.password)

        if (!validPassword)
            return res.send(formatResult(400, erroMessage))

        const confirmation = await Account_confirmation.findOne({user: user._id.toString(), hasEmail: {$ne: true}})
        if (confirmation) {
            if (confirmation.status === "PENDING")
                return res.send(formatResult(403, "Your request has not yet been approved."))
            else if (confirmation.status === "ACCEPTED")
                return res.send(formatResult(403, "Your have not yet confirmed your account."))
        }

        if (user.status.disabled)
            return res.send(formatResult(403, "Your account was blocked, please contact your administration."))

        let user_category = await findDocument(User_category, {
            _id: user.category
        })
        user = simplifyObject(user)
        user.category = _.pick(user_category, 'name')
        if (user.profile) {
            user.profile = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/user/${user.user_name}/profile/${user.profile}`
        }

        // return token
        return res.send(formatResult(u, u, await generateAuthToken(user)))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user:
 *   put:
 *     tags:
 *       - User
 *     description: Update User
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *        - name: body
 *          description: Fields for a User
 *          in: body
 *          required: true
 *          schema:
 *            properties:
 *              sur_name:
 *                type: string
 *              other_names:
 *               type: string
 *              user_name:
 *                type: string
 *              date_of_birth:
 *                type: string
 *                format: date
 *              gender:
 *                type: string
 *                enum: ['male', 'female']
 *              phone:
 *                type: string
 *              email:
 *                type: string
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
router.put('/', auth, async (req, res) => {
    try {
        const {
            error
        } = validate_user(req.body, 'update')
        if (error)
            return res.send(formatResult(400, error.details[0].message))
        const arr = []

        if (req.body.email)
            arr.push({
                email: req.body.email
            })

        if (req.body.user_name)
            arr.push({
                user_name: req.body.user_name
            })

        if (req.body.phone)
            arr.push({
                phone: req.body.phone
            })

        if (arr.length) {
            // check if the name or email were not used
            const user = await findDocument(User, {
                _id: {
                    $ne: req.user._id
                },
                $or: arr,
            })

            if (user) {
                const phoneFound = req.body.phone ? req.body.phone == user.phone : false
                const emailFound = req.body.email ? req.body.email == user.email : false
                const user_nameFound = req.body.user_name ? req.body.user_name == user.user_name : false
                return res.send(formatResult(403, `User with ${phoneFound ? 'same phone ' : emailFound ? 'same email ' : user_nameFound ? 'same user_name ' : ''} arleady exist`))
            }
        }
        if (req.body.user_name) {
            // avoid user_name === group name
            let chat_group = await findDocument(Chat_group, {
                name: req.body.user_name
            })
            if (chat_group)
                return res.send(formatResult(403, 'user_name was taken'))
        }

        if (req.body.email) {
            // create user account confirmation
            const confirmation = await createAccountConfirmation({user_id: req.user._id, email: req.body.email})
            req.body.email = req.user.email
            const {sent, err} = await sendEmailConfirmation({
                email: confirmation.email,
                user_name: req.user.sur_name + ' ' + req.user.other_names,
                token: confirmation.token,
            });
            if (err)
                return res.send(formatResult(500, err));
        }

        let result = await updateDocument(User, req.user._id, req.body)

        let user_category = await findDocument(User_category, {
            _id: result.data.category
        })
        result = simplifyObject(result)
        result.data.category = _.pick(user_category, 'name')
        if (result.data.profile) {
            result.data.profile = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/user/${result.data.user_name}/profile/${result.data.profile}`
        }
        return res.send(formatResult(200, 'UPDATED', await generateAuthToken(result.data)))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/password:
 *   put:
 *     tags:
 *       - User
 *     description: Update User password
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *        - name: body
 *          description: Fields for a User
 *          in: body
 *          required: true
 *          schema:
 *            properties:
 *              current_password:
 *                type: string
 *              new_password:
 *                type: string
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
router.put('/password', auth, async (req, res) => {
    try {

        const {
            error
        } = validateUserPasswordUpdate(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const validPassword = await compare(req.body.current_password, req.user.password);
        if (!validPassword) return res.send(formatResult(400, 'Invalid password'));

        update_password({password: req.body.new_password, user_id: req.user._id})

        return res.send(formatResult(201, "PASSWORD WAS UPDATED SUCESSFULLY"))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/profile:
 *   put:
 *     tags:
 *       - User
 *     description: Upload user profile
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for user profile upload (profile takes base64 encoded string)
 *         in: body
 *         required: true
 *         schema:
 *           properties:
 *             profile:
 *               type: string
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
router.put('/profile', auth, async (req, res) => {
    try {

        const {error} = validate_chat_group_profile_udpate(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const path = addStorageDirectoryToPath(req.user.college ? `./uploads/colleges/${req.user.college}/user_profiles` : `./uploads/system/user_profiles`)
        const {filename} = await savedecodedBase64Image(req.body.profile, path)

        if (req.user.profile) {
            fs.unlink(`${path}/${req.user.profile}`, (err) => {
                if (err)
                    return res.send(formatResult(500, err))
            })
        }
        let result = await User.findByIdAndUpdate(req.user._id, {
            profile: filename
        })
        let user_category = await findDocument(User_category, {
            _id: req.user.category
        })
        result = simplifyObject(result)
        result.category = _.pick(user_category, 'name')
        result.profile = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/user/${req.user.user_name}/profile/${filename}`
        return res.send(formatResult(200, 'UPDATED', await generateAuthToken(result)))


    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/profile/{file_name}:
 *   delete:
 *     tags:
 *       - User
 *     description: remove User profile
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: file_name
 *         description: File name
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
router.delete('/profile/:file_name', auth, async (req, res) => {
    try {

        // check if user exist
        let user = await findDocument(User, {
            user_name: req.user.user_name
        }, u, false)
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        if (!user.profile || user.profile !== req.params.file_name)
            return res.send(formatResult(404, 'file not found'))

        const path = addStorageDirectoryToPath(user.college ? `./uploads/colleges/${user.college}/user_profiles/${user.profile}` : `./uploads/system/user_profiles/${user.profile}`)

        fs.unlink(path, (err) => {
            if (err)
                return res.send(formatResult(500, err))
        })
        user.profile = u
        user.gender = user.gender.toLowerCase()
        await user.save()
        let user_category = await findDocument(User_category, {
            _id: user.category
        })
        user = simplifyObject(user)
        user.category = _.pick(user_category, 'name')
        return res.send(formatResult(200, 'OK', await generateAuthToken(user)))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /user/status/{username}/{value}:
 *   put:
 *     tags:
 *       - User
 *     description: Change user status
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: username
 *         description: Username
 *         in: path
 *         required: true
 *         type: string
 *       - name: value
 *         description: Status
 *         in: path
 *         required: true
 *         type: string
 *         enum: ['hold','unhold']
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
router.put('/status/:username/:value', [auth, filterUsers(["ADMIN"])], async (req, res) => {
    try {
        if (!['hold', 'unhold'].includes(req.params.value))
            return res.send(formatResult(400, "invalid status"))

        // check if user exist
        let user = await findDocument(User, {
            user_name: req.params.username,
            college: req.user.college
        })
        if (!user)
            return res.send(formatResult(400, `User not found`))

        const update_user = await updateDocument(User, user._id, {
            "status.disabled": req.params.value === 'hold' ? 1 : 0
        })
        return res.send(formatResult(200, 'User account is now ' + req.params.value))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})


/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     tags:
 *       - User
 *     description: Delete as User
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
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.delete('/:id', [auth, filterUsers(["ADMIN"])], async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        // check if user exist
        let user = await User.findOne({
            _id: req.params.id,
            college: req.user.college,
        })
        if (!user)
            return res.send(formatResult(400, `User not found`))

        user.status.deleted = 1
        user.email = u

        user = await user.save()

        //  disable all user_user groups
        await User_user_group.updateMany({
            user: req.params.id,
            status: "ACTIVE"
        }, {status: "INACTIVE"})

        if (user.profile) {
            // delete the profile
            const path = addStorageDirectoryToPath(`./uploads/colleges/${user.college}/users/${user.profile}`)
            fs.exists(path, (exists) => {
                if (exists)
                    fs.unlink(path)
            })
        }

        return res.send(formatResult(200, 'Deleted'))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * Check Email Existence
 * @param req
 * @param res
 */
async function checkEmailExistance(req, res) {
    try {
        const user = await User.findOne({email: req.params.email, "status.deleted": {$ne: 1}});
        if (user) return res.send(formatResult(200, 'Email Already Taken', {exists: true}));

        const college = await User.findOne({email: req.params.email});
        if (college) return res.send(formatResult(200, 'Email Already Taken', {exists: true}));

        return res.send(formatResult(200, 'Email Available', {exists: false}));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

/**
 * Check Phone Existence
 * @param req
 * @param res
 */
async function checkPhoneExistance(req, res) {
    try {
        const user = await User.findOne({phone: req.params.phone, "status.deleted": {$ne: 1}});
        if (user) return res.send(formatResult(200, 'Phone Already Taken', {exists: true}));

        const college = await User.findOne({phone: req.params.phone});
        if (college) return res.send(formatResult(200, 'Phone Already Taken', {exists: true}));

        return res.send(formatResult(200, 'Phone Available', {exists: false}));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

/**
 * Check Username Existence
 * @param req
 * @param res
 */
async function checkUsernameExistence(req, res) {
    try {
        const user = await User.findOne({user_name: req.params.user_name, "status.deleted": {$ne: 1}});
        if (user) return res.send(formatResult(200, 'Username Already Taken', {exists: true}));
        return res.send(formatResult(200, 'Username Available', {exists: false}));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

async function addUserBill(collegeId, userCategory) {

    collegeId = collegeId.toString()

    const college = await College_payment_plans.findOne({college: collegeId, status: 'ACTIVE'});
// akabazo on minuza package
    if (college && !['TRIAL', 'HUGUKA'].includes(college.plan) && (userCategory === 'STUDENT' || college.plan !== 'MINUZA_ACCELERATE')) {

        const admin_category = await findDocument(User_category, {name: "ADMIN"})

        const obj = {
            college: college.college,
            category: {$ne: admin_category._id.toString()},
            "status.deleted": {$ne: 1}
        }
        let currentTotalUsers = await countDocuments(User, obj)

        const payment = await Account_payments.findOne({
            college: collegeId,
            status: 'ACTIVE'
        })

        let amount = 0

        const today = new Date()
        today.setDate(today.getDate() + 1)

        // all payments that this user will be valid to
        const payments = await Account_payments.find({
            college: collegeId,
            endingDate: {$gt: new Date(today).toISOString()}
        }).populate({
            path: 'collegePaymentPlan'
        })

        for (const i in payments) {
            amount += await calculateAmount(payments[i].collegePaymentPlan, payments[i].periodType, payments[i].periodValue, 1, currentTotalUsers)
        }

        if (amount !== 0)
            await Account_payments.updateOne({
                college: collegeId,
                status: 'ACTIVE'
            }, {balance: payment.balance - amount})
    }
}

// export the router
module.exports = router