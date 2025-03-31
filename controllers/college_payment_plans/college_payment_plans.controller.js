// import dependencies
const {validate_college_payment_plans} = require("../../models/college_payment_plans/college_payment_plans.model");
const {filterUsers} = require("../../middlewares/auth.middleware");
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
 * /college_payment_plans:
 *   get:
 *     tags:
 *       - College_payment_plans
 *     security:
 *       - bearerAuth: -[]
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
router.get('/', filterUsers(["ADMIN", "SUPERADMIN"]), getCollegePaymentPlans)

/**
 * @swagger
 * /college_payment_plans/current:
 *   get:
 *     tags:
 *       - College_payment_plans
 *     security:
 *       - bearerAuth: -[]
 *     description: returns college current payment plan
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
router.get('/current', getCollegeCurrentPaymentPlan)

/**
 * @swagger
 * /college_payment_plans:
 *   post:
 *     tags:
 *       - College_payment_plans
 *     security:
 *       - bearerAuth: -[]
 *     description: creates a college payment plan
 *     parameters:
 *       - name: college
 *         description: College id (not required)
 *         in: query
 *         type: string
 *       - name: body
 *         description: Fields for a college_payment_plan
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             plan:
 *               type: string
 *               enum: ['TRIAL', 'HUGUKA', 'JIJUKA', 'MINUZA_STARTER','MINUZA_GROWTH','MINUZA_ACCELERATE']
 *               required: true
 *             discount:
 *               type: number
 *               default: 20
 *             pricePerUser:
 *               type: number
 *               default: 3532.45
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.post('/', filterUsers(["ADMIN", "SUPERADMIN"]), createCollegePaymentPlan)

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
 * returns colleges current payment plan
 * @param req
 * @param res
 */
async function getCollegeCurrentPaymentPlan(req, res) {
    try {
        const college_id = req.user.college || req.query.college
        const college = await College.findOne({_id: college_id, status: 1});
        if (!college) return res.send(formatResult(404, 'College not found'));
        const result = await College_payment_plans.findOne({college: college_id, status: 'ACTIVE'}).populate('college')
        return res.send(formatResult(u, u, result));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

/**
 * Creates college payment plan
 * @param req
 * @param res
 */
async function createCollegePaymentPlan(req, res) {
    try {

        const college_id = req.user.college || req.query.college
        const college = await College.findOne({_id: college_id, status: 1});
        if (!college) return res.send(formatResult(404, 'College not found'));

        const {error} = validate_college_payment_plans(req.body)
        if (error)
            return res.send(formatResult(400, error.details[0].message))

        if (req.body.plan === 'TRIAL') {
            const planFound = await College_payment_plans.findOne({college: college_id})
            if (planFound)
                return res.send(formatResult(404, 'Trial not allowed'));
        }

        await College_payment_plans.updateOne({college: college_id, status: 'ACTIVE'}, {status: 'INACTIVE'})

        req.body.college = college_id
        const result = await createDocument(College_payment_plans, req.body)

        return res.send(result);
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

// export the router
module.exports = router