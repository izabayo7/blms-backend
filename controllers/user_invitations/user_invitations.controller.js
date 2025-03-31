const { User_invitation, validate_user_invitation } = require('../../models/user_invitations/user_invitations.model');
const { v4: uuid, validate: uuidValidate } = require('uuid');
const {
  formatResult, u, User_category, College, ONE_DAY, updateDocument, User
} = require('../../utils/imports');
const { sendInvitationMail } = require('../email/email.controller');

const expiration_date = new Date(new Date().getTime() + (ONE_DAY * 7)).toISOString()

/***
 * Get all invitations
 * @param req
 * @param res
 */
exports.getAllInvitations = async (req, res) => {
  try {
    let { limit, page } = req.query;

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

    const invitations = await User_invitation.paginate({}, options)

    res.send(formatResult(200, u, invitations))
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
    let { limit, page } = req.query;

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

    const invitations = await User_invitation.paginate({ user: req.user._id }, options)

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
exports.createUserInvitation = async (req, res) => {
  try {
    const { error } = validate_user_invitation(req.body);
    if (error) return res.send(formatResult(400, error.details[0].message));

    const { emails, category, college } = req.body

    let _college = await College.findOne({
      _id: college
    })
    if (!_college)
      return res.send(formatResult(404, 'UserCategory not found'))

    let user_category = await User_category.findOne({
      _id: category
    })
    if (!user_category)
      return res.send(formatResult(404, 'UserCategory not found'))

    const savedInvitations = []

    for (const email of emails) {
      const user = await User.findOne({
        email: email
      })
      if (user) {
        return res.send(formatResult(400, `User with email (${email}) arleady exist`))
      }

      const newDocument = new User_invitation({
        user: req.user._id,
        email: email,
        category: category,
        college: college,
        token: uuid(),
        expiration_date: expiration_date,
      });

      const result = await newDocument.save();

      await sendInvitationMail(req, res);

      savedInvitations.push(result)
    }

    return res.send(formatResult(201, 'CREATED', savedInvitations));
  } catch
  (e) {
    return res.send(formatResult(500, e))
  }
}

/**
 * Accept or Deny invitation
 * @param req
 * @param res
 */
exports.acceptOrDenyInvitation = async (req, res) => {
  try {

    let { action, token } = req.params

    action = action.toLowerCase()

    if (action !== 'accept' && action !== 'deny')
      return res.send(formatResult(400, 'invalid action'))

    if (!(uuidValidate(req.params.token))) return res.status(400).send(formatResult(400, 'Invalid invitation token'));

    const invitation = await User_invitation.findOne({ token: req.params.token, status: { $ne: 'PENDING' } });
    if (invitation)
      return res.send(formatResult(403, 'invitation token has already been closed'));

    const _invitation = await User_invitation.findOne({ token: req.params.token, status: 'PENDING' });
    if (!_invitation)
      return res.send(formatResult(403, 'invitation not found'));

    if (_invitation.expiration_date < Date.now())
      return res.send(formatResult(400, 'invitation has expired'))

    _invitation.status = req.params.action == 'accept' ? "ACCEPTED" : "DENIED"

    const result = await _invitation.save()

    return res.send(formatResult(200, "UPDATED", result));

  } catch (err) {
    return res.send(formatResult(500, err));
  }
};

/**
 * Renew invitation
 * @param req
 * @param res
 */
exports.renewInvitation = async (req, res) => {
  try {

    if (!(uuidValidate(req.params.token))) return res.status(400).send(formatResult(400, 'Invalid invitation token'));

    const invitation = await User_invitation.findOne({ token: req.params.token, status: { $ne: 'PENDING' } });
    if (invitation)
      return res.send(formatResult(403, 'invitation token has already been closed'));

    const _invitation = await User_invitation.findOne({ token: req.params.token, status: 'PENDING' });
    if (!_invitation)
      return res.send(formatResult(403, 'invitation not found'));

    if (_invitation.expiration_date > Date.now())
      return res.send(formatResult(400, 'invitation has not yet expired'))

    _invitation.expiration_date = expiration_date

    const result = await _invitation.save()

    return res.send(formatResult(200, "UPDATED", result));

  } catch (err) {
    return res.send(formatResult(500, err));
  }
};

/***
 *  delete invitation
 * @param req
 * @param res
 */
exports.deleteInvitation = async (req, res) => {
  try {
    if (!(uuidValidate(req.params.token)))
      return res.status(400).send(formatResult(400, 'Invalid invitation token'));

    const result = await User_invitation.findOneAdDelete({ token: req.params.token, user: req.user._id });
    if (!result)
      return res.send(formatResult(404, 'invitation not found'));

    return res.send(formatResult(200, 'DELETED'));
  } catch
  (e) {
    return res.send(formatResult(500, e))
  }
}