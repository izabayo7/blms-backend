// import dependencies
const {Assignment_submission} = require("../../models/assignment_submission/assignment_submission.model");
const {
    express,
    Comment,
    validate_comment,
    validateObjectId,
    formatResult,
    findDocument,
    User,
    findDocuments,
    u,
    Create_or_update_comment,
    deleteDocument,
    Live_session,
    createDocument,
    updateDocument,
    Chapter,
    injectUser,
    injectCommentsReplys,
    simplifyObject,
    Quiz_submission
} = require('../../utils/imports')
const {Exam} = require("../../models/exams/exam.model");
const {Exam_submission} = require("../../models/exam_submission/exam_submission.model");

// create router
const router = express.Router()

/**
 * @swagger
 * definitions:
 *   Comment:
 *     properties:
 *       sender:
 *         type: string
 *       target  :
 *         type: object
 *         properties:
 *           type:
 *             type: string
 *           id:
 *             type: string
 *       content:
 *         type: string
 *       reply:
 *         type: string
 *     required:
 *       - sender
 *       - target
 *       - content
 */

/**
 * @swagger
 * /comment/{target}/{id}:
 *   get:
 *     tags:
 *       - Comment
 *     description: Returns comments in the specified target
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: target
 *         description: target type
 *         in: path
 *         required: true
 *         type: string
 *       - name: id
 *         description: target id
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
router.get('/:target/:id', async (req, res) => {
    try {

        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const allowedTargetTypes = ['chapter', 'live_session', 'quiz_submission', 'quiz_submission_answer', 'assignment_submission']

        if (!allowedTargetTypes.includes(req.params.target)) {
            return res.send(formatResult(400, 'invalid target type'))
        }

        let target

        switch (req.params.target) {
            case 'chapter':
                target = await findDocument(Chapter, {
                    _id: req.params.id
                })
                break;

            case 'live_session':
                target = await findDocument(Live_session, {
                    _id: req.params.id
                })
                break;

            case 'quiz_submission':
                target = await findDocument(Quiz_submission, {
                    _id: req.params.id
                })
                break;

            case 'quiz_submission_answer':
                target = await findDocument(Quiz_submission, {
                    "answers._id": req.params.id
                })
                break;

            case 'assignment_submission':
                target = await findDocument(Assignment_submission, {
                    _id: req.body.target.id
                })
                break;
        
            default:
                break;
        }

        if (!target)
            return res.send(formatResult(404, 'comment target not found'))

        let comments = await findDocuments(Comment, {
            "target.type": req.params.target,
            "target.id": req.params.id,
            reply: undefined
        }, u, u, u, u, u, {_id: -1})
        comments = await injectUser(comments, 'sender')
        comments = await injectCommentsReplys(comments)
        return res.send(formatResult(u, u, comments))
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /comment:
 *   post:
 *     tags:
 *       - Comment
 *     description: Send a comment
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a comment
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Comment'
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
        } = validate_comment(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const user = await findDocument(User, {user_name: req.body.sender})
        if (!user)
            return res.send(formatResult(404, 'user not found'))

        req.body.sender = user._id

        req.body.target.type = req.body.target.type.toLowerCase()

        const allowedTargets = ['chapter', 'live_session', 'quiz_submission', 'quiz_submission_answer', 'assignment_submission','exam_submission_answer']

        if (!allowedTargets.includes(req.body.target.type))
            return res.send(formatResult(400, 'invalid comment target_type'))

        let target

        switch (req.body.target.type) {
            case 'chapter':
                target = await findDocument(Chapter, {
                    _id: req.body.target.id
                })
                break;

            case 'live_session':
                target = await findDocument(Live_session, {
                    _id: req.body.target.id
                })
                break;

            case 'quiz_submission':
                target = await findDocument(Quiz_submission, {
                    _id: req.body.target.id
                })
                break;

            case 'quiz_submission_answer':
                target = await findDocument(Quiz_submission, {
                    "answers._id": req.body.target.id
                })
                break;

            case 'assignment_submission':
                target = await findDocument(Assignment_submission, {
                    _id: req.body.target.id
                })
                break;
            case 'exam_submission_answer':
                target = await findDocument(Exam_submission, {
                    "answers._id": req.body.target.id
                })
                break;
            default:
                break;
        }

        if (!target)
            return res.send(formatResult(404, 'comment target not found'))


        let result = await createDocument(Comment, req.body)
        result = simplifyObject(result)
        result.data = await injectUser([result.data], 'sender')
        result.data = result.data[0]

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /comment/{id}:
 *   put:
 *     tags:
 *       - Comment
 *     description: Update a comment
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         in: path
 *         type: string
 *         description: Comment's Id
 *       - name: body
 *         description: Fields for a Comment
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
router.put('/:id', async (req, res) => {
    try {
        let {
            error
        } = validateObjectId(req.params.id)
        if (error)
            return res.send(formatResult(400, error.details[0].message))
        error = validate_comment(req.body, 'update')
        error = error.error
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        const comment = await findDocument(Comment, {_id: req.params.id})
        if (!comment)
            return res.send(formatResult(404, 'comment not found'))

        const result = await updateDocument(Comment, req.params.id, req.body)
        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

/**
 * @swagger
 * /comment/{id}:
 *   delete:
 *     tags:
 *       - Comment
 *     description: Delete a comment
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: id
 *         description: Comment's id
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

        const comment = await findDocument(Comment, {
            _id: req.params.id
        })
        if (!comment)
            return res.send(formatResult(404, 'comment not found'))

        // need to delete all attachments

        const result = await deleteDocument(Comment, req.params.id)

        return res.send(result)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})

// export the router
module.exports = router