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
exports.getInvitationbyToken = async (req, res) => {
    try {
        let {token} = req.params;
        if (!token)
            return res.send(formatResult(400, 'Token is required'))

        if (!(uuidValidate(token)))
            return res.status(400).send(formatResult(400, 'Invalid confirmation token'));

        const confirmation = await Account_confirmation.findOne({
            token: token
        }).populate(['college', 'category', 'user_group']);
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
 */
exports.createAccountConfirmation = async ({user_id}) => {
    return await Account_confirmation.create({
        user: user_id,
        token: uuid(),
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

        const confirmation = await Account_confirmation.findById(token).populate('user');
        if (!confirmation)
            return res.send(formatResult(400, 'Bad request'));

        const {sent, err} = await sendCollegeAccepted({
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

        const confirmation = await Account_confirmation.findOne({token: req.params.token, status: {$ne: 'PENDING'}});
        if (confirmation)
            return res.send(formatResult(403, 'account onfirmation has already been closed'));

        const _confirmation = await Account_confirmation.findOne({
            token: req.params.token,
            status: 'PENDING'
        }).populate({
            path: 'user',
            model: 'user',
            populate: {
                path: 'college', populate: {
                    path: 'college',
                    model: 'college'
                }
            }
        });

        if (!_confirmation)
            return res.send(formatResult(403, 'account confirmation not found'));

        _confirmation.status = "CONFIRMED"

        const result = await _confirmation.save()


        return res.redirect(`https://elearning.rw?institution=${_confirmation.user.college.name}`)

    } catch (err) {
        return res.send(formatResult(500, err));
    }
};