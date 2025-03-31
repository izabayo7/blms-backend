const { User_invitation, validate_user_invitation } = require('../../models/user_invitations/user_invitations.model');
const { v4: uuid, validate: uuidValidate } = require('uuid');
const {
  formatResult, u, User_category, College, ONE_DAY, updateDocument, User, validateObjectId
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

    const newDocument = new Post({
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

/***
 *  delete post
 * @param req
 * @param res
 */
exports.deletePost = async (req, res) => {
  try {
    if (!(validateObjectId(req.params.id)))
      return res.status(400).send(formatResult(400, 'Invalid id'));

    const result = await Post.findOneAndDelete({ _id: req.params.id, creator: req.user._id });
    if (!result)
      return res.send(formatResult(404, 'post not found'));

    return res.send(formatResult(200, 'DELETED'));
  } catch
  (e) {
    return res.send(formatResult(500, e))
  }
}