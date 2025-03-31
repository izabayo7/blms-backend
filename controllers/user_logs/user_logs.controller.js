// import dependencies
const {createDocument} = require("../../utils/imports");
const {validate_user_log} = require("../../models/user_logs/user_logs.model");
const {User} = require("../../utils/imports");
const {User_logs} = require("../../models/user_logs/user_logs.model");
const {User_group} = require('../../models/user_group/user_group.model')
const {User_user_group, validate_user_user_group} = require('../../models/user_user_group/user_user_group.model')
const {
    express,
    date,
    findDocument,
    Course,
    Live_session,
    formatResult
} = require('../../utils/imports')

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   User_logs:
 *     properties:
 *       _id:
 *         type: string
 *       user:
 *         type: string
 *       logs:
 *         type: array
 *         items:
 *            type: object
 *            properties:
 *              online:
 *                type: boolean
 *              accessed_course:
 *                type: number
 *              accessed_live_stream:
 *                type: number
 *     required:
 *       - user
 */

/**
 * @swagger
 * /user_logs/statistics/online:
 *   get:
 *     tags:
 *       - Statistics
 *     description: Get User statistics of how users accessed the system
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
router.get('/statistics/online', async (req, res) => {
    try {
        const {start_date, end_date} = req.query
        const users = await User.find({college: req.user.college}, {_id: 1})

        const result = await User_logs.aggregate([
            {"$match": {createdAt: {$gt: date(start_date), $lte: date(end_date)}}},
            {"$match": {user: {$in: users.map(x => x._id.toString())}}},
            {"$match": {"logs.online": true}},
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
                    "total_submissions": {"$sum": 1}
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
 * /user_logs:
 *   post:
 *     tags:
 *       - User_logs
 *     description: Create User_log
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a User_log
 *         in: body
 *         required: true
 *         schema:
 *           properties:
 *             course_id:
 *               type: string
 *             live_session_id:
 *               type: string
 *             online:
 *               type: boolean
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

        if (req.body.online == undefined && req.body.course_id == undefined && req.body.live_session_id == undefined)
            return res.send(formatResult(400, "Invalid request"))

        if ((req.body.online && req.body.course_id) || (req.body.live_session_id && req.body.online) || (req.body.live_session_id && req.body.course_id))
            return res.send(formatResult(400, "Please send one log at a time"))

        const {
            error
        } = validate_user_log(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        if (req.body.course_id) {
            // check if user_group exist
            let course = await findDocument(Course, {
                _id: req.body.course_id
            })
            if (!course)
                return res.send(formatResult(404, 'Course not found'))
        }

        if (req.body.live_session_id) {
            // check if user_group exist
            let session = await findDocument(Live_session, {
                _id: req.body.live_session_id
            })
            if (!session)
                return res.send(formatResult(404, 'Live_session not found'))
        }

        if (req.body.online !== undefined && req.body.online !== true)
            return res.send(formatResult(404, 'Invalid value for online'))

        // check if user log exist
        let userLog = await User_logs.findOne({
            user: req.user._id
        })
        if (!userLog) {
            let result = await createDocument(User_logs, {
                user: req.user._id,
                logs: [req.body.online ? {
                    online: true
                } : req.body.course_id ? {
                    accessed_course: [req.body.course_id]
                } : {
                    accessed_live_stream: [req.body.live_session_id]
                }]
            })
            return res.send(result)
        } else {
            const today = new Date()

            const {index} = recursiveFunction(userLog.logs, today, 0, userLog.logs.length - 1)
            if (index == -1) {
                userLog.logs.unshift(req.body.online ? {
                    online: true
                } : req.body.course_id ? {
                    accessed_course: [req.body.course_id]
                } : {
                    accessed_live_stream: [req.body.live_session_id]
                })
            } else {
                if (req.body.online)
                    if (userLog.logs[index].online)
                        return res.send(formatResult(400, 'User access already recorded'))
                    else
                        userLog.logs[index].online = true
                else if (req.body.course_id) {
                    if (userLog.logs[index].accessed_course)
                        if (userLog.logs[index].accessed_course.indexOf(req.body.course_id) === -1)
                            userLog.logs[index].accessed_course.push(req.body.course_id)
                        else
                            return res.send(formatResult(400, 'Course access already recorded'))
                } else {
                    if (userLog.logs[index].accessed_live_stream)
                        if (userLog.logs[index].accessed_live_stream.indexOf(req.body.live_session_id) === -1)
                            userLog.logs[index].accessed_live_stream.push(req.body.live_session_id)
                        else
                            return res.send(formatResult(400, 'Live_session access already recorded'))
                }
                await userLog.save()
                return res.send(formatResult(400, 'Log recorded sucessfully'))
            }

        }
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

function sameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

// binary search to search if todays logs exist faster
let recursiveFunction = function (logs, x, start, end) {

    // Base Condition
    if (start > end) return {index: -1};

    // Find the middle index
    let mid = Math.floor((start + end) / 2);

    // Compare mid with given key x
    if (sameDay(new Date(logs[mid].createdAt), x)) return {index: mid};

    // If element at mid is greater than x,
    // search in the left half of mid
    if (new Date(logs[mid]) > x)
        return recursiveFunction(logs, x, start, mid - 1);
    else

        // If element at mid is smaller than x,
        // search in the right half of mid
        return recursiveFunction(logs, x, mid + 1, end);
}

// export the router
module.exports = router