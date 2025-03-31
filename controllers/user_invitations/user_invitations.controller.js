const { User_invitation } = require('../../models/user_invitations/user_invitations.model');
const {
  formatResult, u
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

