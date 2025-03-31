const { User_invitation, validate_user_invitation } = require('../../models/user_invitations/user_invitations.model');
const { v4: uuid, validate: uuidValidate } = require('uuid');
const {
  formatResult, u, User_category, College, ONE_DAY
} = require('../../utils/imports')

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

    const user = await User.findOne({
      user_name: req.user.user_name
    })
    if (!user)
      return res.send(formatResult(400, `user not found`))

    const invitations = await User_invitation.paginate({ user: user._id }, options)

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

    const _user = await User.findOne({
      user_name: req.user.user_name
    })
    if (!_user)
      return res.send(formatResult(400, `user not found`))

    const savedInvitations = []

    const expiration_date = new Date(new Date().getTime() + (ONE_DAY * 7)).toISOString()

    for (const email of emails) {
      const user = await User.findOne({
        email: email
      })
      if (user) {
        return res.send(formatResult(400, `User with email (${email}) arleady exist`))
      }

      const newDocument = new User({
        user: _user._id,
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