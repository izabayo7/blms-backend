const {User_invitation, validate_user_invitation} = require('../../models/user_invitations/user_invitations.model');
const {v4: uuid, validate: uuidValidate} = require('uuid');
const {
    formatResult, u, User_category, College, ONE_DAY, updateDocument, User
} = require('../../utils/imports');
const {sendInvitationMail} = require('../email/email.controller');
const {User_group} = require('../../models/user_group/user_group.model');

const expiration_date = new Date(new Date().getTime() + (ONE_DAY * 7)).toISOString()

/***
 * Get all invitations
 * @param req
 * @param res
 */
exports.getAllInvitations = async (req, res) => {
    try {
        let {limit, page} = req.query;

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
 * Get invitation by token
 * @param req
 * @param res
 */
exports.getInvitationbyToken = async (req, res) => {
    try {
        let {token} = req.params;
        if (!token)
            return res.send(formatResult(400, 'Token is required'))

        if (!(uuidValidate(token)))
            return res.status(400).send(formatResult(400, 'Invalid invitation token'));

        const invitation = await User_invitation.findOne({
            token: token
        }).populate(['college', 'category', 'user_group']);
        if (!invitation)
            return res.send(formatResult(400, 'User invitation was not found'))

        if (invitation.status == "ACCEPTED")
            return res.send(formatResult(400, 'User invitation already accepted'))

        res.send(formatResult(200, u, invitation))
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
        let {limit, page} = req.query;

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
            populate: 'category'
        };

        const invitations = await User_invitation.paginate({user: req.user._id}, options)

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
        const {error} = validate_user_invitation(req.body);
        if (error) return res.send(formatResult(400, error.details[0].message));

        if (req.body.category !== "ADMIN" && !req.body.user_group)
            return res.send(formatResult(404, 'UserGroup is required'))

        const {emails, category} = req.body

        let _college = await College.findOne({
            _id: req.user.college
        })
        if (!_college)
            return res.send(formatResult(404, 'UserCategory not found'))

        let user_category = await User_category.findOne({
            name: category
        })
        if (!user_category)
            return res.send(formatResult(404, 'UserCategory not found'))

        let user_group

        if (req.body.user_group) {
            user_group = await User_group.findOne({
                name: req.body.user_group
            })
            if (!user_group)
                return res.send(formatResult(404, 'User_group not found'))
        }

        const savedInvitations = []

        for (const email of emails) {
            const user = await User.findOne({
                email: email,
                "status.deleted": {$ne: 1}
            })
            if (user) {
                return res.send(formatResult(400, `User with email (${email}) arleady exist`))
            }

            // const user_invitation = await User_invitation.findOne({
            //   email: email,
            //   status: "PENDING"
            // })
            // if (user_invitation) {
            //   return res.send(formatResult(400, `User with email (${email}) have a pending invitation`))
            // }

            let result = await User_invitation.findOne({
                user: req.user._id,
                email: email,
                category: user_category._id,
                college: req.user.college,
            })
            let token

            if (result) {
                result.expiration_date = expiration_date
                result = await result.save()
                token = result.token
            } else {
                token = uuid()
            }


            const {sent, err} = await sendInvitationMail({
                email,
                names: req.user.sur_name + ' ' + req.user.other_names,
                token: token,
                institution: {name: _college.name},
                user_group: req.body.user_group
            });
            if (err)
                return res.send(formatResult(500, err));


            if (!result) {
                const newDocument = new User_invitation({
                    user: req.user._id,
                    email: email,
                    category: user_category._id,
                    college: req.user.college,
                    token: token,
                    user_group: user_group ? user_group._id : undefined,
                    expiration_date: expiration_date,
                });

                result = await newDocument.save();
            }

            if (sent) {
                savedInvitations.push(result)
            }
        }

        return res.send(formatResult(201, 'CREATED', savedInvitations));
    } catch
        (e) {
        return res.send(formatResult(500, e))
    }
}

/***
 *  Create's a multiple user_invitations from a file
 * @param req
 * @param res
 */
exports.createMultipleUserInvitations = async (req, res) => {
    try {

        let result = []

        const schema = {
            'EMAIL': {
                prop: 'email',
                type: (value) => {
                    const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    if (!regex.test(value)) {
                        throw new Error('invalid email')
                    }
                    return value
                },
                required: true
            },
            'USER GROUP': {
                prop: 'user_group',
                type: String,
                required: true
            },
            'USER CATEGORY': {
                prop: 'category',
                type: String,
                enum: ["STUDENT","INSTRUCTOR"],
                required: true
            },
            'REGISTRATION NUMBER': {
                prop: 'user_name',
                type: String
            },
        }

        const readXlsxFile = require('read-excel-file/node')

        const {rows,errors} = await readXlsxFile('./controllers/user/file_example_XLS_50.xlsx', {schema})

        // `errors` list items have shape: `{ row, column, error, value }`.
        if (errors.length)
            return res.send(formatResult(400, "", errors[0]))

        // `rows` is an array of rows
        // each row being an array of cells.
        result = rows
        console.table(rows)
        return res.status(201).send(result)

        const {error} = validate_user_invitation(req.body);
        if (error) return res.send(formatResult(400, error.details[0].message));

        if (req.body.category !== "ADMIN" && !req.body.user_group)
            return res.send(formatResult(404, 'UserGroup is required'))

        const {emails, category} = req.body

        let _college = await College.findOne({
            _id: req.user.college
        })
        if (!_college)
            return res.send(formatResult(404, 'UserCategory not found'))

        let user_category = await User_category.findOne({
            name: category
        })
        if (!user_category)
            return res.send(formatResult(404, 'UserCategory not found'))

        let user_group

        if (req.body.user_group) {
            user_group = await User_group.findOne({
                name: req.body.user_group
            })
            if (!user_group)
                return res.send(formatResult(404, 'User_group not found'))
        }

        const savedInvitations = []

        for (const email of emails) {
            const user = await User.findOne({
                email: email,
                "status.deleted": {$ne: 1}
            })
            if (user) {
                return res.send(formatResult(400, `User with email (${email}) arleady exist`))
            }

            // const user_invitation = await User_invitation.findOne({
            //   email: email,
            //   status: "PENDING"
            // })
            // if (user_invitation) {
            //   return res.send(formatResult(400, `User with email (${email}) have a pending invitation`))
            // }

            let result = await User_invitation.findOne({
                user: req.user._id,
                email: email,
                category: user_category._id,
                college: req.user.college,
            })
            let token

            if (result) {
                result.expiration_date = expiration_date
                result = await result.save()
                token = result.token
            } else {
                token = uuid()
            }


            const {sent, err} = await sendInvitationMail({
                email,
                names: req.user.sur_name + ' ' + req.user.other_names,
                token: token,
                institution: {name: _college.name},
                user_group: req.body.user_group
            });
            if (err)
                return res.send(formatResult(500, err));


            if (!result) {
                const newDocument = new User_invitation({
                    user: req.user._id,
                    email: email,
                    category: user_category._id,
                    college: req.user.college,
                    token: token,
                    user_group: user_group ? user_group._id : undefined,
                    expiration_date: expiration_date,
                });

                result = await newDocument.save();
            }

            if (sent) {
                savedInvitations.push(result)
            }
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

        let {action, token} = req.params

        action = action.toLowerCase()

        if (action !== 'accept' && action !== 'deny')
            return res.send(formatResult(400, 'invalid action'))

        if (!(uuidValidate(req.params.token))) return res.status(400).send(formatResult(400, 'Invalid invitation token'));

        const invitation = await User_invitation.findOne({token: req.params.token, status: {$ne: 'PENDING'}});
        if (invitation)
            return res.send(formatResult(403, 'invitation token has already been closed'));

        const _invitation = await User_invitation.findOne({token: req.params.token, status: 'PENDING'});
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

        const invitation = await User_invitation.findOne({token: req.params.token, status: {$ne: 'PENDING'}});
        if (invitation)
            return res.send(formatResult(403, 'invitation token has already been closed'));

        const _invitation = await User_invitation.findOne({token: req.params.token, status: 'PENDING'});
        if (!_invitation)
            return res.send(formatResult(403, 'invitation not found'));

        if (_invitation.expiration_date > Date.now())
            return res.send(formatResult(400, 'invitation has not yet expired'))

        _invitation.expiration_date = expiration_date

        const result = await _invitation.save()

        const {sent, err} = await sendInvitationMail({
            email: _invitation.email,
            names: req.user.sur_name + ' ' + req.user.other_names,
            token: result.token
        });
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

        const result = await User_invitation.findOneAndDelete({token: req.params.token, user: req.user._id});
        if (!result)
            return res.send(formatResult(404, 'invitation not found'));

        return res.send(formatResult(200, 'DELETED'));
    } catch
        (e) {
        return res.send(formatResult(500, e))
    }
}