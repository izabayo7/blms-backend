const {upload_xlsx} = require("../../utils/imports");
const {fs} = require("../../utils/imports");
const {addStorageDirectoryToPath} = require("../../utils/imports");
const {upload_single} = require("../../utils/imports");
const {Faculty} = require("../../models/faculty/faculty.model");
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

function checkIfArrayIsUnique(myArray) {
    for (let i = 0; i < myArray.length; i++) {
        for (let j = 0; j < myArray.length; j++) {
            if (i !== j) {
                if (myArray[i] === myArray[j]) {
                    return {error: `all rows must be unique (row ${i + 1} and row ${j + 1} are dupplicates)`};
                } else if (myArray[i].email === myArray[j].email) {
                    return {error: `email must be unique (row ${i + 1} and row ${j + 1} have same emails)`};
                } else if (myArray[i].user_name === myArray[j].user_name) {
                    return {error: `registration number must be unique (row ${i + 1} and row ${j + 1} have same registration numbers)`};
                }
            }
        }
    }
    return {error: undefined}; // means there are no duplicate values.(change 2)
}

/***
 *  Deletes uploaded file after inviting or creating users from file
 * @param req
 * @param res
 */
exports.DeleteSourceFile = async (req, res) => {
    if (req.kuriousStorageData.path) {
        const exists = fs.existsSync(req.kuriousStorageData.path)
        if (exists) {
            fs.unlink(`${req.kuriousStorageData.path}`, (err) => {
                if (err) {
                    return res.send(formatResult(500, err))
                }
            })
        }
    }
    return res.send(req.res)
}

/***
 *  Create's a multiple user_invitations from a file
 * @param req
 * @param res
 * @param next
 */
exports.createMultipleUserInvitations = async (req, res, next) => {
    try {

        let faculties = await Faculty.find({college: req.user.college}).populate('college')
        let college
        if (!faculties.length)
            college = await College.findOne({
                _id: req.user.college
            })
        let user_groups = await User_group.find({
            faculty: {$in: faculties.map(x => x._id.toString())}
        })
        let user_group_names = user_groups.map(x => x.name)
        let user_categories = await User_category.find();
        let user_categories_names = ["ADMIN", "STUDENT", "INSTRUCTOR"]


        const schema = {
            'EMAIL': {
                prop: 'email',
                type: (value) => {
                    const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    if (!regex.test(value)) {
                        throw new Error('invalid')
                    }
                    return value
                },
                required: true
            },
            'USER GROUP': {
                prop: 'user_group',
                type: (value) => {
                    if (!user_group_names.includes(value)) {
                        throw new Error(`invalid use (${user_group_names})`)
                    }
                    return value
                },
                required: true
            },
            'USER CATEGORY': {
                prop: 'category',
                type: (value) => {
                    if (!user_categories_names.includes(value)) {
                        throw new Error(`invalid use (${user_categories_names})`)
                    }
                    return value
                },
                required: true
            },
            'REGISTRATION NUMBER': {
                prop: 'user_name',
                type: String
            },
        }

        const readXlsxFile = require('read-excel-file/node')

        req.kuriousStorageData = {
            dir: addStorageDirectoryToPath(`./uploads/colleges/${req.user.college}`),
        }

        upload_xlsx(req, res, async (err) => {
            if (err) {
                req.res = formatResult(500, err.message)
                return next()
            }
            if (!req.file) {
                req.res = formatResult(500, "file is required")
                return next()
            }

            req.kuriousStorageData.path = `${req.kuriousStorageData.dir}/${req.file.filename}`


            const {rows, errors} = await readXlsxFile(req.kuriousStorageData.path, {schema})

            // `errors` list items have shape: `{ row, column, error, value }`.
            if (errors.length) {
                req.res = formatResult(400, `(${errors[0].value}) ${errors[0].column} on row ${errors[0].row} is ${errors[0].error}`, errors[0])
                return next()
            }

            const {error} = checkIfArrayIsUnique(rows)

            if (error) {
                req.res = formatResult(400, error)
                return next()
            }

            // `rows` is an array of rows
            // each row being an array of cells.

            let creationErrors = []
            const savedInvitations = []
            for (const i in rows) {
                const user = await User.findOne({
                    email: rows[i].email,
                    "status.deleted": {$ne: 1}
                })
                if (user) {
                    creationErrors.push(`User with email (${rows[i].email}) arleady exist`)
                    break
                }

                if (rows[i].category !== "ADMIN" && !rows[i].user_group) {
                    creationErrors.push(`User with email (${rows[i].email}) must have a student group`)
                    break
                }


                let user_category
                user_categories.map(x => {
                    if (x.name === rows[i].category) {
                        user_category = x._id
                        break
                    }
                })

                let user_group
                user_groups.map(x => {
                    if (x.name === rows[i].user_group) {
                        user_group = x._id
                        break
                    }
                })

                let result = await User_invitation.findOne({
                    user: req.user._id,
                    email: rows[i].email,
                    category: user_category,
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
                    email: rows[i].email,
                    names: req.user.sur_name + ' ' + req.user.other_names,
                    token: token,
                    institution: {name: college ? college.name : faculties[0].college.name},
                    user_group: user_group
                });
                if (err) {
                    creationErrors.push(err)
                    break
                }


                if (!result) {
                    const newDocument = new User_invitation({
                        user: req.user._id,
                        email: rows[i].email,
                        category: user_category,
                        college: req.user.college,
                        token: token,
                        user_group: user_group,
                        expiration_date: expiration_date,
                    });

                    result = await newDocument.save();
                }

                if (sent) {
                    savedInvitations.push(result)
                }
            }


            req.res = formatResult(201, creationErrors.length ? `${savedInvitations.length} invitations ` : '' + 'CREATED', {
                savedInvitations,
                creationErrors
            })
            return next()
        })
    } catch
        (e) {
        req.res = formatResult(500, e)
        next()
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