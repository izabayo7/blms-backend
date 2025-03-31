const { User_invitation, validate_user_invitation } = require('../../models/user_invitations/user_invitations.model');
const { v4: uuid, validate: uuidValidate } = require('uuid');
const {
  formatResult, u, User_category, College, ONE_DAY, updateDocument, User
} = require('../../utils/imports');
const { sendInvitationMail } = require('../email/email.controller');
const { Post } = require('../../models/posts/posts.model');

const expiration_date = new Date(new Date().getTime() + (ONE_DAY * 7)).toISOString()

/***
 * Get all posts
 * @param req
 * @param res
 */
exports.getAllPosts = async (req, res) => {
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
      populate: 'creator'
    };

    const posts = await Post.paginate({}, options)

    res.send(formatResult(200, u, posts))
  } catch
  (e) {
    return res.send(formatResult(500, e))
  }
}

/***
 * Get user posts
 * @param req
 * @param res
 */
exports.getMyPosts = async (req, res) => {
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
      populate: 'creator'
    };

    const posts = await Post.paginate({ creator: req.user._id }, options)

    res.send(formatResult(200, u, posts))
  } catch
  (e) {
    return res.send(formatResult(500, e))
  }
}

/***
 *  Create's a new post
 * @param req
 * @param res
 */
exports.createUserAPost = async (req, res) => {
  try {
    const { error } = validate_post(req.body);
    if (error) return res.send(formatResult(400, error.details[0].message));

    const newDocument = new User_invitation({
      creator: req.user._id,
      title: req.body.title,
      content: req.body.content
    });

    const result = await newDocument.save();

    return res.send(formatResult(201, 'CREATED', result));
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

    const { sent, err } = await sendInvitationMail({ email: _invitation.email, names: req.user.sur_name + ' ' + req.user.other_names, token: result.token });
    if (err)
      return res.send(formatResult(500, err));

    if (sent) {

      return res.send(formatResult(200, "UPDATED", result));

    }
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

    const result = await User_invitation.findOneAndDelete({ token: req.params.token, user: req.user._id });
    if (!result)
      return res.send(formatResult(404, 'invitation not found'));

    return res.send(formatResult(200, 'DELETED'));
  } catch
  (e) {
    return res.send(formatResult(500, e))
  }
}