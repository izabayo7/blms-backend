// import dependencies
const {simplifyObject} = require("../../utils/imports");
const {calculateAmount} = require("../../utils/imports");
const {User_category} = require("../../utils/imports");
const {findDocument} = require("../../utils/imports");
const {User} = require("../../utils/imports");
const {countDocuments} = require("../../utils/imports");
const {College_payment_plans} = require("../../models/college_payment_plans/college_payment_plans.model");
const {validate_account_payments} = require("../../models/account_payments/account_payments.model");
const {Account_payments} = require("../../models/account_payments/account_payments.model");
const Paymentwall = require('paymentwall');
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

        let balance = await calculateAmount(college, req.body.periodType, req.body.periodValue, total_users)

        if (college.plan === 'MINUZA_STARTER' || college.plan === 'MINUZA_GROWTH') {
            const college_copy = simplifyObject(college)
            college_copy.plan = 'JIJUKA'
            if (college.plan === 'MINUZA_STARTER' && total_users > 200) {
                balance += await calculateAmount(college_copy, req.body.periodType, req.body.periodValue, total_users - 200)
            }
            if (college.plan === 'MINUZA_GROWTH' && total_users > 600) {
                balance += await calculateAmount(college_copy, req.body.periodType, req.body.periodValue, total_users - 600)
            }
        }

        if (req.body.amount_paid < balance)
            return res.send(formatResult(403, `The amount you gave is invalid (you should pay ${balance})`));

        // const payment = await Account_payments.findOneAndUpdate({
        //     user: req.user._id,
        //     status: 'ACTIVE'
        // }, {status: 'INACTIVE'})
        //
        // if (payment)
        //     balance -= payment.balance
        //
        // balance = req.body.amount_paid - balance
        //
        //
        // const startingDate = payment ? payment.endingDate : new Date().toISOString()
        // const endingDate = findPaymentEndingTime(startingDate, req.body.periodType, req.body.periodValue)
        //
        // // subtract the current months user value directly
        //
        // const obj = {
        //     method_used: req.body.method_used,
        //     user: req.user._id,
        //     amount_paid: req.body.amount_paid,
        //     balance,
        //     total_users: req.body.total_users,
        //     startingDate,
        //     endingDate,
        //     collegePaymentPlan: college._id.toString(),
        //     periodType: req.body.periodType,
        //     periodValue: req.body.periodValue,
        // }
        // if (college.plan !== 'HUGUKA')
        //     obj.college = req.user.college
        //
        // let result = await createDocument(Account_payments, obj)
        // return res.send(result);

        // going to test paymentwall apis
        Paymentwall.Configure(
            Paymentwall.Base.API_GOODS,
            'cf0cc980e0164b3bd5697ef5c2aadc4d',
            'a2dcc2583618cbec643144c485106f0e'
        );

        let widget = new Paymentwall.Widget(
            'user40012',                                // id of the end-user who's making the payment
            'pw',                                       // widget code, e.g. pw; can be picked in the Widgets section of your merchant account
            [                                           // product details for Flexible Widget Call.
                // Leave empty if product selection happens on Paymentwall's side
                new Paymentwall.Product(
                    'product301',                           // id of the product in your system
                    9.99,                                   // price
                    'USD',                                  // currency code
                    'Kurious Learn Subscription',                      // product name
                    // if it is a onetime charge product, you don't need to configure time-based part
                    Paymentwall.Product.TYPE_SUBSCRIPTION,  // this is a time-based product
                    req.body.periodValue,                                      // length of product period
                    req.body.periodType === 'MONTH' ? Paymentwall.Product.PERIOD_TYPE_MONTH : Paymentwall.Product.PERIOD_TYPE_YEAR,  // type of product period
                    true                                    // this is a recurring product
                )
            ],
            {'email': 'cedric@kurious.rw'}              // additional parameters. for full list check API docs
        );
        const html = widget.getHtmlCode()
        return res.send(widget.getHtmlCode())


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

        let total_users

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
        }

        let amount = await calculateAmount(college, req.body.periodType, req.body.periodValue, req.body.total_users)

        if (college.plan === 'MINUZA_STARTER' || college.plan === 'MINUZA_GROWTH') {
            const college_copy = simplifyObject(college)
            college_copy.plan = 'JIJUKA'
            if (college.plan === 'MINUZA_STARTER' && total_users > 200) {
                amount += await calculateAmount(college_copy, req.body.periodType, req.body.periodValue, total_users - 200)
            }
            if (college.plan === 'MINUZA_GROWTH' && total_users > 600) {
                amount += await calculateAmount(college_copy, req.body.periodType, req.body.periodValue, total_users - 600)
            }
        }

        const payment = await Account_payments.findOne({user: req.user._id, status: 'ACTIVE'})

        let startingDate = new Date().toISOString()

        if (payment) {
            amount -= payment.balance
            startingDate = new Date(payment.endingDate).toISOString()
        }

        return res.send(formatResult(u, u, {amount: amount > 0 ? amount : 0, startingDate}));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

function findPaymentEndingTime(startingDate, periodType, periodValue) {

    const endDate = new Date(startingDate)
    switch (periodType) {
        case 'MONTH': {
            return new Date(endDate.setMonth(endDate.getMonth() + periodValue)).toISOString()
        }
        case 'YEAR': {
            return new Date(endDate.setFullYear(endDate.getFullYear() + periodValue)).toISOString()
        }
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

        const payments = await Account_payments.find(["ADMIN", "SUPERADMIN"].includes(req.user.category.name) ? {college: req.user.college} : {user: req.user._id}).sort({_id: -1}).populate('user', ['sur_name', 'other_names', 'user_name'])

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

        // if (!college || college.plan === 'TRIAL') return res.send(formatResult(u, 'Your college must have a payment plan', {disabled: !college}));
        if (!college || college.plan === 'TRIAL') return res.send(formatResult(u, 'Your college must have a payment plan', {disabled: false}));

        const payment = await Account_payments.findOne({
            $or: [{user: req.user._id}, {college: req.user.college}],
            status: 'ACTIVE'
        }).sort({_id: -1}).populate('user', ['sur_name', 'other_names', 'user_name'])

        if (!payment) return res.send(formatResult(u, 'You don\'t have a payment', {
            disabled:
                (college.plan === 'HUGUKA' && req.user.category.name === 'STUDENT') ||
                (req.user.category.name !== 'ADMIN')
        }));

        // {
        //     startDate,
        //         endDate,
        //         currentBalance
        // }

        return res.send(formatResult(200, u, {
            startDate: payment.startingDate,
            endDate: payment.endingDate,
            balance: payment.balance,
            disabled: new Date() > new Date(payment.endingDate)
        }));
    } catch (err) {
        return res.send(formatResult(500, err));
    }
}

// export the router
module.exports = router