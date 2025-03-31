const {sendCollegeAccepted} = require("../email/email.controller");
const {sendConfirmEmail} = require("../email/email.controller");
const {
    Account_confirmation,
} = require('../../models/account_confirmations/account_confirmations.model');
const {v4: uuid, validate: uuidValidate} = require('uuid');
const {
    formatResult, u, User
} = require('../../utils/imports');

/***
 * Get confirmation by token
 * @param req
 * @param res
 */
exports.getEmailConfirmation = async (req, res) => {
    try {

        const confirmation = await Account_confirmation.findOne({
            user: req.user._id.toString(),
            hasEmail: true,
            status: "PENDING",
        });
        if (!confirmation)
            return res.send(formatResult(400, 'User confirmation was not found'))

        if (confirmation.status == "ACCEPTED")
            return res.send(formatResult(400, 'User confirmation already accepted'))

        res.send(formatResult(200, u, confirmation))
    } catch
        (e) {
        return res.send(formatResult(500, e))
    }
}

/***
 *  Create's a new user_confirmation
 * @param user_id
 * @param hasEmail
 */
exports.createAccountConfirmation = async ({user_id, email}) => {
    return await Account_confirmation.create({
        user: user_id,
        token: uuid(),
        email,
        hasEmail: email !== undefined
    });
}

/**
 * Accept college registration
 * @param req
 * @param res
 */
exports.AcceptCollege = async (req, res) => {
    try {

        let {token} = req.params

        const confirmation = await Account_confirmation.findOne({_id: token, status: "PENDING"}).populate('user');
        if (!confirmation)
            return res.send(formatResult(400, 'Bad request'));

        const {sent, err} = await sendCollegeAccepted({
            email: confirmation.user.email,
            user_name: confirmation.user.sur_name + ' ' + confirmation.user.other_names,
            token: confirmation.token,
        });
        if (err)
            return res.send(formatResult(500, err));

        await Account_confirmation.updateOne({_id: token}, {status: 'ACCEPTED'})

        return res.send(formatResult(200, "College was accepted"));

    } catch (err) {
        return res.send(formatResult(500, err));
    }
};

/**
 * Confirm account
 * @param req
 * @param res
 */
exports.confirmAccount = async (req, res) => {
    try {

        if (!(uuidValidate(req.params.token))) return res.status(400).send(formatResult(400, 'Invalid confirmation token'));

        const confirmation = await Account_confirmation.findOne({token: req.params.token}).populate({
            path: 'user',
            model: 'user',
            populate: {
                path: 'college', populate: {
                    path: 'college',
                    model: 'college'
                }
            }
        });
        if (!confirmation)
            return res.send(formatResult(403, 'account confirmation not found'));
        if (confirmation.status === "CONFIRMED")
            return res.send(formatResult(403, 'account confirmation has already been closed'));


        confirmation.status = "CONFIRMED"

        await confirmation.save()
        if (confirmation.email)
            await User.findOneAndUpdate({_id: confirmation.user._id.toString()}, {email: confirmation.email})

        return res.redirect(`https://elearning.rw/login?institution=${confirmation.user.college.name}`)

    } catch (err) {
        return res.send(formatResult(500, err));
    }
};