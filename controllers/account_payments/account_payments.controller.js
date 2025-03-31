// import dependencies
const {User_category} = require("../../utils/imports");
const {findDocument} = require("../../utils/imports");
const {User} = require("../../utils/imports");
const {countDocuments} = require("../../utils/imports");
const {College_payment_plans} = require("../../models/college_payment_plans/college_payment_plans.model");
const {validate_account_payments} = require("../../models/account_payments/account_payments.model");
const {Account_payments} = require("../../models/account_payments/account_payments.model");
const {
    express,
    College,
    formatResult,
    createDocument,
    u,
} = require('../../utils/imports')

// create router
const router = express.Router()

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
 * /account_payments/status:
 *   get:
 *     tags:
 *       - Account_payments
 *     description: Returns the user current payment status
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
router.get('/status', getPaymentStatus)

/**
 * @swagger
 * /account_payments/bill:
 *   post:
 *     tags:
 *       - Account_payments
 *     description: Return the amount you have to pay according to the parameters you give and the plan your college have
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
 *             periodType:
 *               type: string
 *               enum: ['MONTH', 'YEAR']
 *               required: true
 *             periodValue:
 *               type: number
 *               required: true
 *             total_users:
 *               type: number
 *               required: true
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal Server error
 */
router.post('/bill', getTotalBills)

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
 *             periodType:
 *               type: string
 *               enum: ['MONTH', 'YEAR']
 *               required: true
 *             periodValue:
 *               type: number
 *               required: true
 *             total_users:
 *               type: number
 *               required: true
 *             method_used:
 *               type: string
 *               required: true
 *             amount_paid:
 *               type: number
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

        const {
            error
        } = validate_account_payments(req.body)

        if (error)
            return res.send(formatResult(400, error.details[0].message))


        const college = await College_payment_plans.findOne({college: req.user.college, status: 'ACTIVE'});
        if (!college || college.plan === 'TRIAL') return res.send(formatResult(403, 'College must have a payment plan'));

        let total_users = 0

        if (college.plan !== 'HUGUKA') {
            if (req.user.category.name !== 'ADMIN')
                return res.send(formatResult(403, `Your administration is in charge of the payment process`));

            const admin_category = await findDocument(User_category, {name: "ADMIN"})
            const student_category = await findDocument(User_category, {name: "STUDENT"})
            const instructor_category = await findDocument(User_category, {name: "INSTRUCTOR"})

            const obj = college.plan === 'MINUZA_ACCELERATE' ?
                {
                    college: college.college,
                    $or: [{category: student_category._id.toString()}, {category: instructor_category._id.toString()}],
                    "status.deleted": {$ne: 1}
                } :
                {college: college.college, category: {$ne: admin_category._id.toString()}, "status.deleted": {$ne: 1}}

            total_users = await countDocuments(User, obj)

            if (req.body.total_users < total_users)
                return res.send(formatResult(403, `The users to pay for must be greater or equal to ${total_users} (total ${college.plan === 'MINUZA_ACCELERATE' ? 'non admin users' : 'students'} in your college)`));
        } else {
            if (req.user.category.name !== 'STUDENT')
                return res.send(formatResult(403, `In this payment plan students are the only one who are responsible for their payments`));

            total_users = 1
        }

        let balance = req.body.amount_paid

        let amount = await calculateAmount(college, req.body.periodType, req.body.periodValue, total_users)

        balance -= amount

        const payment = await Account_payments.findOneAndUpdate({
            user: req.user._id,
            status: 'ACTIVE'
        }, {status: 'INACTIVE'})

        if (payment)
            balance -= payment.balance

        const startingDate = findPaymentStartingTime(payment)

        // subtract the current months user value directly

        const obj = {
            method_used: req.body.method_used,
            user: req.user._id,
            amount_paid: req.body.amount_paid,
            balance,
            total_users: req.body.total_users,
            startingDate,
            periodType: req.body.periodType,
            periodValue: req.body.periodValue,
        }
        if (college.plan !== 'HUGUKA')
            obj.college = req.user.college

        let result = await createDocument(Account_payments, obj)
        return res.send(result);
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

/**
 * Create account payment
 * @param req
 * @param res
 */
async function getTotalBills(req, res) {
    try {

        const {
            error
        } = validate_account_payments(req.body, 'bills')

        if (error)
            return res.send(formatResult(400, error.details[0].message))


        const college = await College_payment_plans.findOne({college: req.user.college, status: 'ACTIVE'});
        if (!college || college.plan === 'TRIAL') return res.send(formatResult(403, 'College must have a payment plan'));

        if (college.plan !== 'HUGUKA') {
            if (req.user.category.name !== 'ADMIN')
                return res.send(formatResult(403, `Your administration is in charge of the payment process`));

            const admin_category = await findDocument(User_category, {name: "ADMIN"})
            const student_category = await findDocument(User_category, {name: "STUDENT"})
            const instructor_category = await findDocument(User_category, {name: "INSTRUCTOR"})

            const obj = college.plan === 'MINUZA_ACCELERATE' ?
                {
                    college: college.college,
                    $or: [{category: student_category._id.toString()}, {category: instructor_category._id.toString()}],
                    "status.deleted": {$ne: 1}
                } :
                {college: college.college, category: {$ne: admin_category._id.toString()}, "status.deleted": {$ne: 1}}

            const total_users = await countDocuments(User, obj)

            if (req.body.total_users < total_users)
                return res.send(formatResult(403, `The users to pay for must be greater or equal to ${total_users} (total ${college.plan === 'MINUZA_ACCELERATE' ? 'non admin users' : 'students'} in your college)`));
        }

        let amount = await calculateAmount(college, req.body.periodType, req.body.periodValue, req.body.total_users)

        const payment = await Account_payments.findOne({user: req.user._id, status: 'ACTIVE'})

        const startingDate = findPaymentStartingTime(payment)

        if (payment) {
            amount -= payment.balance
        }

        return res.send(formatResult(u, u, {amount, startingDate}));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

function findPaymentStartingTime(previousPayment) {
    const today = new Date()

    if (!previousPayment)
        return today.toISOString()

    const endDate = new Date(previousPayment.startingDate)
    switch (previousPayment.periodType) {
        case 'MONTH': {
            return new Date(endDate.setMonth(endDate.getMonth() + previousPayment.periodValue)).toISOString()
        }
        case 'YEAR': {
            return new Date(endDate.setFullYear(endDate.getFullYear() + previousPayment.periodValue)).toISOString()
        }
    }
}

async function calculateAmount(collegePlan, periodType, periodValue, total_users) {

    switch (collegePlan.plan) {
        case 'HUGUKA': {
            if (periodType === 'MONTH')
                return 4000 * periodValue
            else if (periodType === 'YEAR')
                return ((4000 * 12) * ((100 - collegePlan.discount) / 100)) * periodValue
        }
            break;
        case 'JIJUKA': {
            if (periodType === 'MONTH')
                return 2500 * periodValue * total_users
            else if (periodType === 'YEAR')
                return ((2500 * 12) * ((100 - collegePlan.discount) / 100)) * periodValue * total_users
        }
            break;
        case 'MINUZA_STARTER': {
            if (periodType === 'MONTH')
                return 2299 * periodValue * 200
            else if (periodType === 'YEAR')
                return ((2299 * 12) * ((100 - collegePlan.discount) / 100)) * periodValue * 200
        }
            break;
        case 'MINUZA_GROWTH': {
            if (periodType === 'MONTH')
                return 1899 * periodValue * 600
            else if (periodType === 'YEAR')
                return ((1899 * 12) * ((100 - collegePlan.discount) / 100)) * periodValue * 600
        }
            break;
        case 'MINUZA_ACCELERATE': {
            if (periodType === 'MONTH')
                return 1599 * periodValue * total_users
            else if (periodType === 'YEAR')
                return ((1599 * 12) * ((100 - collegePlan.discount) / 100)) * periodValue * total_users
        }
            break;
    }

}

/**
 * Get account payment history
 * @param req
 * @param res
 */
async function getPaymentHistory(req, res) {
    try {
        const college = await College_payment_plans.findOne({college: req.user.college, status: 'ACTIVE'});

        if (!college || college.plan === 'TRIAL') return res.send(formatResult(u, u, []));

        const payments = await Account_payments.find({user: req.user._id}).sort({_id: -1}).populate('user', ['sur_name', 'other_names', 'user_name'])

        return res.send(formatResult(200, u, payments));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

/**
 * Get account payment status
 * @param req
 * @param res
 */
async function getPaymentStatus(req, res) {
    try {
        const college = await College_payment_plans.findOne({college: req.user.college, status: 'ACTIVE'});

        if (!college || college.plan === 'TRIAL') return res.send(formatResult(u, 'Your college must have a payment plan'));

        const payment = await Account_payments.findOne({
            $or: [{user: req.user._id}, {college: req.user.college}],
            status: 'ACTIVE'
        }).sort({_id: -1}).populate('user', ['sur_name', 'other_names', 'user_name'])

        if (!payment) return res.send(formatResult(u, 'You don\'t have a payment'));

        const endDate = findPaymentStartingTime(payment)

        // {
        //     startDate,
        //         endDate,
        //         currentBalance
        // }

        return res.send(formatResult(200, u, {
            startDate: payment.startingDate,
            endDate,
            balance: payment.balance
        }));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

// export the router
module.exports = router