const {
  formatResult, u
} = require('../../utils/imports');
const { sendInvitationMail } = require('../email/email.controller');

/***
 *  Sends contactUs email
 * @param req
 * @param res
 */
exports.contactUs = async (req, res) => {
  try {
    const { error } = validate_user_feedback(req.body, 'contact_us');
    if (error) return res.send(formatResult(400, error.details[0].message));

    const { sent, err } = await sendContactUsEmail({ email, names: req.body.user_name, message: req.body.message });
    if (err)
      return res.send(formatResult(500, err));

    return res.send(formatResult(201, 'CREATED', result));
  } catch
  (e) {
    return res.send(formatResult(500, e))
  }
}