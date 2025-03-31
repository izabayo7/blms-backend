const { User_invitation, validate_user_invitation } = require('../../models/user_invitations/user_invitations.model');
const { v4: uuid, validate: uuidValidate } = require('uuid');
const {
  formatResult, u, User_category, College, ONE_DAY, updateDocument
} = require('../../utils/imports')

const expiration_date = new Date(new Date().getTime() + (ONE_DAY * 7)).toISOString()

/***
 * Get all invitations
 * @param req
 * @param res
 */
exports.getAllInvitations = async (req, res) => {
  try {
    const { limit, page } = req.query;

    if (!page)
      return res.send(formatResult(400, 'Page query is required'))

    if (!limit)
      return res.send(formatResult(400, 'Limit query is required'))

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
    const { limit, page } = req.query;

    if (!page)
      return res.send(formatResult(400, 'Page query is required'))

    if (!limit)
      return res.send(formatResult(400, 'Limit query is required'))

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

    let college = await College.findOne({
      _id: college
    })
    if (!college)
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

      const newDocument = new User({
        user: req.user._id,
        email: email,
        category: category,
        college: college,
        token: uuid(),
        expiration_date: expiration_date,
      });

      const result = await newDocument.save();
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

    if (!(uuidValidate(req.body.token))) return res.status(400).send(formatResult(400, 'Invalid invitation token'));

    const invitation = await User_invitation.findOne({ token: req.body.token, status: { $ne: 'PENDING' } });
    if (invitation)
      return res.send(formatResult(403, 'invitation token has already been closed'));

    const _invitation = await User_invitation.findOne({ token: req.body.token, status: 'PENDING' });
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

    if (!(uuidValidate(req.body.token))) return res.status(400).send(formatResult(400, 'Invalid invitation token'));

    const invitation = await User_invitation.findOne({ token: req.body.token, status: { $ne: 'PENDING' } });
    if (invitation)
      return res.send(formatResult(403, 'invitation token has already been closed'));

    const _invitation = await User_invitation.findOne({ token: req.body.token, status: 'PENDING' });
    if (!_invitation)
      return res.send(formatResult(403, 'invitation not found'));

    if (_invitation.expiration_date > Date.now())
      return res.send(formatResult(400, 'invitation has not yet expired'))

    _invitation.status = req.params.action == 'accept' ? "ACCEPTED" : "DENIED"

    const result = await _invitation.save()

    return res.send(formatResult(200, "UPDATED", result));

  } catch (err) {
    return res.send(formatResult(500, err));
  }
};