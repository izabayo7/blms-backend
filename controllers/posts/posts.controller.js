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
exports.createPost = async (req, res) => {
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
 * update a post
 * @param req
 * @param res
 */
exports.updatePost = async (req, res) => {
  try {
    if (!(validateObjectId(req.params.id)))
      return res.status(400).send(formatResult(400, 'Invalid id'));

    const { error } = validate_post(req.body);
    if (error) return res.send(formatResult(400, error.details[0].message));

    let result = await Post.findOne({ _id: req.params.id, creator: req.user._id });
    if (!result)
      return res.send(formatResult(404, 'post not found'));

    result.title = req.body.title
    result.content = req.body.content

    result = await result.save()

    return res.send(formatResult(200, 'UPDATED', result));
  } catch
  (e) {
    return res.send(formatResult(500, e))
  }
}

/***
 * update a post
 * @param req
 * @param res
 */
exports.updatePost = async (req, res) => {
  try {

    const { error } = validate_chat_group_profile_udpate(req.body)
    if (error)
      return res.send(formatResult(400, error.details[0].message))

    const path = addStorageDirectoryToPath(req.user.college ? `./uploads/colleges/${req.user.college}/user_profiles` : `./uploads/system/user_profiles`)
    const { filename } = await savedecodedBase64Image(req.body.profile, path)

    if (req.user.profile) {
      fs.unlink(`${path}/${req.user.profile}`, (err) => {
        if (err)
          return res.send(formatResult(500, err))
      })
    }
    let result = await User.findByIdAndUpdate(req.user._id, {
      profile: filename
    })
    let user_category = await findDocument(User_category, {
      _id: req.user.category
    })
    result = simplifyObject(result)
    result.category = _.pick(user_category, 'name')
    result.profile = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/user/${req.user.user_name}/profile/${filename}`
    return res.send(formatResult(200, 'UPDATED', await generateAuthToken(result)))


  } catch (error) {
    return res.send(formatResult(500, error))
  }
}

/***
 *  change post status
 * @param req
 * @param res
 */
exports.updatePostStatus = async (req, res) => {
  try {
    if (!(validateObjectId(req.params.id)))
      return res.status(400).send(formatResult(400, 'Invalid id'));
    const { action } = req.params
    const allowedActions = ['publish', 'unpublish', 'delete']
    if (!allowedActions.includes(action))
      return res.status(400).send(formatResult(400, 'Invalid action'));

    let result = await Post.findOne({ _id: req.params.id, creator: req.user._id });
    if (!result)
      return res.send(formatResult(404, 'post not found'));

    result.status = action == 'publish' ? 'PUBLISHED' : action == 'unpublish' ? 'DRAFT' : 'DELTED';

    result = await result.save()

    return res.send(formatResult(200, 'UPDATED', result));
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