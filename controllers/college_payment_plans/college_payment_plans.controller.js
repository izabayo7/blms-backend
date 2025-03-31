// import dependencies
const {College_payment_plans} = require("../../models/college_payment_plans/college_payment_plans.model");
const {
    express,
    College,
    User,
    fs,
    validate_college,
    findDocument,
    findDocuments,
    formatResult,
    createDocument,
    updateDocument,
    deleteDocument,
    validateObjectId,
    sendResizedImage,
    u,
    upload_single_image,
    addStorageDirectoryToPath,
    auth
} = require('../../utils/imports')

// create router
const router = express.Router()

// get all
// get current
// create new plan

/**
 * @swagger
 * /college/checkNameExistance/{college_name}:
 *   get:
 *     tags:
 *       - College_payment_plans
 *     description: returns the college payment plans
 *     parameters:
 *       - name: college
 *         description: College id (not required)
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
router.get('/checkNameExistance/:college_name', getCollegePaymentPlans)

/**
 * @swagger
 * /college/checkNameExistance/{college_name}:
 *   get:
 *     tags:
 *       - College
 *     description: tells if the given name is taken or available
 *     parameters:
 *       - name: college_name
 *         description: College name
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
router.get('/checkNameExistance/:college_name', checkCollegeNameExistance)

/**
 * @swagger
 * /college/checkNameExistance/{college_name}:
 *   get:
 *     tags:
 *       - College
 *     description: tells if the given name is taken or available
 *     parameters:
 *       - name: college_name
 *         description: College name
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
router.get('/checkNameExistance/:college_name', checkCollegeNameExistance)

/**
 * returns colleges payment plans
 * @param req
 * @param res
 */
async function getCollegePaymentPlans(req, res) {
    try {
        const college_id = req.user.college || req.query.college
        const college = await College.findOne({_id: college_id, status: 1});
        if (!college) return res.send(formatResult(404, 'College not found'));
        const result = await College_payment_plans.find({college: college_id})
        return res.send(formatResult(u, u, result));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

/**
 * Check Email Existence
 * @param req
 * @param res
 */
async function checkCollegeNameExistance(req, res) {
    try {
        const college = await College.findOne({name: req.params.college_name, status: 1});
        if (college) return res.send(formatResult(200, 'Name Already Taken', {exists: true}));
        return res.send(formatResult(200, 'Name Available', {exists: false}));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

/**
 * Check Email Existence
 * @param req
 * @param res
 */
async function checkCollegeNameExistance(req, res) {
    try {
        const college = await College.findOne({name: req.params.college_name, status: 1});
        if (college) return res.send(formatResult(200, 'Name Already Taken', {exists: true}));
        return res.send(formatResult(200, 'Name Available', {exists: false}));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

// export the router
module.exports = router