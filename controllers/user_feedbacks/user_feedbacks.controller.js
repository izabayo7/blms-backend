const {
  formatResult, u, Joi
} = require('../../utils/imports');
const { sendContactUsEmail, sendRequestCallback } = require('../email/email.controller');

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

    return res.send(formatResult(200, 'Email was successfully send'));
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

    return res.send(formatResult(200, 'Email was successfully sent'));
  } catch
  (e) {
    return res.send(formatResult(500, e))
  }
}

function validate_user_feedback(body, type) {
  const schema = type == 'contact_us' ? {
    user_name: Joi.string().min(3).max(300).required(),
    user_email: Joi.string().email().required(),
    message: Joi.string().min(15).max(500).required()
  } : {
      user_name: Joi.string().min(3).max(300).required(),
      role_at_institution: Joi.string().required(),
      institution_name: Joi.string().min(5).max(50).required(),
      phone_number: Joi.string().min(10).max(15).required()
    }
  return Joi.validate(body, schema)
}