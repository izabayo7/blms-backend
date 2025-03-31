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

    const { sent, err } = await sendContactUsEmail(req.body);
    if (err)
      return res.send(formatResult(500, err));

    return res.send(formatResult(201, 'CREATED', result));
  } catch
  (e) {
    return res.send(formatResult(500, e))
  }
}

/***
 *  Sends a requestCallback email
 * @param req
 * @param res
 */
exports.requestCallback = async (req, res) => {
  try {
    const { error } = validate_user_feedback(req.body, 'request_callback');
    if (error) return res.send(formatResult(400, error.details[0].message));

    const { sent, err } = await sendRequestCallback(req.body);
    if (err)
      return res.send(formatResult(500, err));

    return res.send(formatResult(201, 'CREATED', result));
  } catch
  (e) {
    return res.send(formatResult(500, e))
  }
}