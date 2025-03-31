const {Account_payments} = require("../../models/account_payments/account_payments.model");
const {exist} = require('joi')
// import dependencies
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

/**
 * @swagger
 * definitions:
 *   Account_payments:
 *     properties:
 *       _id:
 *         type: string
 *       name:
 *         type: string
 *       email:
 *         type: string
 *       phone:
 *         type: string
 *       location:
 *         type: string
 *       logo:
 *         type: number
 *       disabled:
 *         type: string
 *     required:
 *       - name
 *       - email
 */

/**
 * @swagger
 * /account_payments:
 *   get:
 *     tags:
 *       - Account_payments
 *     description: Returns the user payment history
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
router.get('/', getPaymentHistory)


/**
 * @swagger
 * /account_payments:
 *   post:
 *     tags:
 *       - Account_payments
 *     description: Creates a user payment
 *     security:
 *       - bearerAuth: -[]
 *     parameters:
 *       - name: body
 *         description: Fields for a Payment
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             method_used:
 *               type: string
 *               required: true
 *             amount_paid:
 *               type: string
 *               required: true
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server error
 */
router.post('/', createPayment)


/**
 * Create account payment
 * @param req
 * @param res
 */
async function createPayment(req, res) {
    try {
        const college = await College.findOne({_id: req.user.college, status: 1});
        if (college) return res.send(formatResult(404, 'College not found'));

        if (!college.plan || college.plan === 'TRIAL') return res.send(formatResult(403, 'College must have a payment plan'));

        // const requiredAmount = 5000
        //
        // if(req.body.amount_paid !== requiredAmount)

        const obj = {
            method_used: req.body.method_used,
            user: req.user._id,
            amount_paid: req.body.amount_paid,
            college_plans: [{name: college.plan}],
        }
        if (college.plan !== 'HUGUKA')
            obj.college = req.user.college

        await Account_payments.findOneAndUpdate({user: req.user._id, status: 'ACTIVE'}, {status: 'INACTIVE'})

        let result = await createDocument(College, obj)
        return res.send(result);
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

/**
 * Get account payment history
 * @param req
 * @param res
 */
async function getPaymentHistory(req, res) {
    try {
        const college = await College.findOne({_id: req.user.college, status: 1});
        if (college) return res.send(formatResult(404, 'College not found'));

        if (!college.plan || college.plan === 'TRIAL') return res.send(formatResult(u, u, []));

        const payments = await Account_payments.find({user: req.user._id}).sort({_id: -1}).populate('user', ['sur_name', 'other_names', 'user_name'])

        return res.send(formatResult(200, u, payments));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

// export the router
module.exports = router