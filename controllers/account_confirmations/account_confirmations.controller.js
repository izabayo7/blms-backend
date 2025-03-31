const {
    Account_confirmation,
    validate_user_invitation
} = require('../../models/account_confirmations/account_confirmations.model');
const {v4: uuid, validate: uuidValidate} = require('uuid');
const {
    formatResult, u, User_category, College, ONE_DAY, updateDocument, User
} = require('../../utils/imports');
const {sendInvitationMail} = require('../email/email.controller');
const {User_group} = require('../../models/user_group/user_group.model');

const expiration_date = new Date(new Date().getTime() + (ONE_DAY * 7)).toISOString()

/***
 * Get all invitations
 * @param req
 * @param res
 */
exports.getAllInvitations = async (req, res) => {
    try {
        let {limit, page} = req.query;

        if (!page)
            page = 1

        if (!limit)
            limit = 20

        if (page < 1)
            return res.send(formatResult(400, 'Page query must be greater than 0'))

        if (limit < 1)
            return res.send(formatResult(400, 'Limit query must be greater than 0'))

        const options = {
            page: page,
            limit: limit,
            populate: 'category'
        };

        const invitations = await Account_confirmation.paginate({}, options)

        res.send(formatResult(200, u, invitations))
    } catch
        (e) {
        return res.send(formatResult(500, e))
    }
}

/***
 * Get invitation by token
 * @param req
 * @param res
 */
exports.getInvitationbyToken = async (req, res) => {
    try {
        let {token} = req.params;
        if (!token)
            return res.send(formatResult(400, 'Token is required'))

        if (!(uuidValidate(token)))
            return res.status(400).send(formatResult(400, 'Invalid invitation token'));

        const invitation = await Account_confirmation.findOne({
            token: token
        }).populate(['college', 'category', 'user_group']);
        if (!invitation)
            return res.send(formatResult(400, 'User invitation was not found'))

        if (invitation.status == "ACCEPTED")
            return res.send(formatResult(400, 'User invitation already accepted'))

        res.send(formatResult(200, u, invitation))
    } catch
        (e) {
        return res.send(formatResult(500, e))
    }
}

/***
 * Get current invitations invitations
 * @param req
 * @param res
 */
exports.getMyInvitations = async (req, res) => {
    try {
        let {limit, page} = req.query;

        if (!page)
            page = 1

        if (!limit)
            limit = 20

        if (page < 1)
            return res.send(formatResult(400, 'Page query must be greater than 0'))

        if (limit < 1)
            return res.send(formatResult(400, 'Limit query must be greater than 0'))

        const options = {
            page: page,
            limit: limit,
            populate: 'category'
        };

        const invitations = await Account_confirmation.paginate({user: req.user._id}, options)

        res.send(formatResult(200, u, invitations))
    } catch
        (e) {
        return res.send(formatResult(500, e))
    }
}

/***
 *  Create's a new user_invitation
 * @param req
 * @param res
 */
exports.createAccountConfirmation = async ({user_id}) => {
    return await Account_confirmation.create({
        user: user_id,
        token: uuid()
    });
}

/**
 * Accept or Deny invitation
 * @param req
 * @param res
 */
exports.acceptOrDenyInvitation = async (req, res) => {
    try {

        let {action, token} = req.params

        action = action.toLowerCase()

        if (action !== 'accept' && action !== 'deny')
            return res.send(formatResult(400, 'invalid action'))

        if (!(uuidValidate(req.params.token))) return res.status(400).send(formatResult(400, 'Invalid invitation token'));

        const invitation = await Account_confirmation.findOne({token: req.params.token, status: {$ne: 'PENDING'}});
        if (invitation)
            return res.send(formatResult(403, 'invitation token has already been closed'));

        const _invitation = await Account_confirmation.findOne({token: req.params.token, status: 'PENDING'});
        if (!_invitation)
            return res.send(formatResult(403, 'invitation not found'));

        if (_invitation.expiration_date < Date.now())
            return res.send(formatResult(400, 'invitation has expired'))

        if (action == 'accept') {
            const user = await User.findOne({
                email: _invitation.email
            })
            if (!user) {
                return res.send(formatResult(400, `This invitation can only be marked as accepted when user finish signing up.`))
            }
        }

        _invitation.status = req.params.action == 'accept' ? "ACCEPTED" : "DENIED"

        const result = await _invitation.save()

        return res.send(formatResult(200, "UPDATED", result));

    } catch (err) {
        return res.send(formatResult(500, err));
    }
};