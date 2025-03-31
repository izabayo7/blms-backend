const { Reset_password, validatePasswordReset } = require("../../models/reset_password/reset_password.model");
const { formatResult, User, ONE_DAY } = require("../../utils/imports");
const { sendResetPasswordEmail } = require("../email/email.controller");
const { update_pasxxxxxxsword } = require("../user/user.controller");
const { v4: uuid, validate: uuidValidate } = require('uuid');

/**
 * Create (open) a password reset
 * @param req
 * @param res
 */
exports.createPasswordReset = async (req, res) => {
  try {
    const { error } = validatePasswordReset(req.body);
    if (error)
      return res.send(formatResult(400, error.details[0].message));

    const user = await User.findOne({ email: req.body.email }).populate('college');
    if (!user)
      return res.send(formatResult(404, 'User not found'));

    const date = new Date();
    date.setTime((date.getTime() + (ONE_DAY)));
    const token = uuid();

    const existing_password_reset = await Reset_password.findOne({ user: user._id, reset: false });
    if (existing_password_reset) {
      existing_password_reset.token = token;
      await existing_password_reset.save();
    }
    else {
      const resetPassword = new Reset_password({
        user: user._id,
        token: token,
        expiration: date.getTime()
      });

      await resetPassword.save();
    }

    const { sent, err } = await sendResetPasswordEmail({ email: user.email, user_name: user.sur_name + ' ' + user.other_names, token, institution_name: user.college.name });
    if (err)
      return res.send(formatResult(500, err));

    return res.send(formatResult(201, 'Password reset was sucessfully created'));

  }
  catch (err) {
    return res.send(formatResult(500, err))
  }
}



/**
* Update (close) a password reset
* @param req
* @param res
*/
exports.updatePasswordReset = async (req, res) => {
  try {
    const { error } = validatePasswordReset(req.body, 'update');
    if (error) return res.send(formatResult(400, error.details[0].message));

    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.send(formatResult(404, 'User not found'));

    if (!(uuidValidate(req.body.token))) return res.status(400).send(formatResult(400, 'Invalid PasswordReset Token'));

    const reset = await Reset_password.findOne({ token: req.body.token, status: 'CLOSED' });
    if (reset)
      return res.send(formatResult(403, 'PasswordReset Token has already been used'));

    const token = await Reset_password.findOne({ token: req.body.token, status: 'OPEN' });
    if (!token)
      return res.send(formatResult(403, 'PasswordReset Token not found'));

    if (token.expiration < Date.now())
      return res.send(formatResult(400, 'PasswordReset Token has expired'))

    if (JSON.stringify(user._id) != JSON.stringify(token.user))
      return res.send(formatResult(403, 'Invalid Token'));

    await xxxxxx({ password: req.body.password, user_id: user._id })

    token.status = 'CLOSED'

    await token.save()

    return res.status(200).send(formatResult(200, 'Password was reseted'));
  }
  catch (err) {
    return res.send(formatResult(500, err))
  }
}