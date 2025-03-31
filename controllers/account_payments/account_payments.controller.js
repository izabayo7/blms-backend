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
 *   College:
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
 *       - College
 *     description: Returns the logo of a specified college
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
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal Server error
 */
router.get('/:college_name/logo/:file_name', async (req, res) => {
    try {

        // check if college exist
        const college = await findDocument(College, {
            name: req.params.college_name
        })
        if (!college)
            return res.send(formatResult(404, 'college not found'))

        if (!college.logo || (college.logo !== req.params.file_name))
            return res.send(formatResult(404, 'file not found'))

        const path = addStorageDirectoryToPath(`./uploads/colleges/${college._id}/${college.logo}`)

        sendResizedImage(req, res, path)
    } catch (error) {
        return res.send(formatResult(500, error))
    }
})



/**
 * @swagger
 * /account_payments:
 *   post:
 *     tags:
 *       - College
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
 * Check Email Existence
 * @param req
 * @param res
 */
async function createPayment(req, res) {
    try {
        const college = await College.findOne({_id: req.user.college, status: 1});
        if (college) return res.send(formatResult(404, 'College not found'));

        if (!college.plan) return res.send(formatResult(403, 'College must have a payment plan'));

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
};

async function injectLogoMediaPaths(colleges) {
    for (const i in colleges) {
        if (colleges[i].logo) {
            colleges[i].logo = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/college/${colleges[i].name}/logo/${colleges[i].logo}`
        }
    }
    return colleges
}

// export the router
module.exports = router