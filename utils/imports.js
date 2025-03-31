/**
 * dependencies
 */
const Joi = require('joi')
const bcrypt = require('bcryptjs')
const schedule = require('node-schedule');
Joi.ObjectId = require('joi-objectid')(Joi)
exports.express = require('express')
exports.cors = require('cors')
exports.bodyparser = require('body-parser')
exports.mongoose = require('mongoose')
exports.Joi = Joi
exports.jwt = require('jsonwebtoken')
exports.config = require('config')
exports.bcrypt = bcrypt
exports.multer = require('multer')
exports.fs = require('fs-extra')
exports.timestamps = require('mongoose-timestamp');
exports._ = require('lodash')
exports.path = require('path')
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {
}

const myEmitter = new MyEmitter();

// add maximum listeners the emitter can handle
myEmitter.setMaxListeners(1000)

exports.MyEmitter = myEmitter


/**
 * models & their functions
 */

const {
    user,
    validate_user
} = require('../models/user/user.model')

exports.User = user
exports.validate_user = validate_user

const {
    user_category,
    validate_user_category
} = require('../models/user_category/user_category.model')

exports.User_category = user_category
exports.validate_user_category = validate_user_category

const {
    user_role,
    validate_user_role
} = require('../models/user_role/user_role.model')

exports.User_role = user_role
exports.validate_user_role = validate_user_role

const {
    college,
    validate_college
} = require('../models/college/college.model')

exports.College = college
exports.validate_college = validate_college

const {
    user_faculty_college_year,
    validate_user_faculty_college_year,
    User_user_group
} = require('../models/user_user_group/user_user_group.model')

exports.User_faculty_college_year = user_faculty_college_year
exports.validate_user_faculty_college_year = validate_user_faculty_college_year

const {
    user_progress,
    validate_user_progress
} = require('../models/user_progress/user_progress.model')

exports.User_progress = user_progress
exports.validate_user_progress = validate_user_progress

const {
    Faculty,
    validate_faculty
} = require('../models/faculty/faculty.model')

exports.Faculty = Faculty
exports.validate_faculty = validate_faculty

const {
    faculty_college,
    validate_faculty_college
} = require('../models/faculty/faculty.model')

exports.Faculty_college = faculty_college
exports.validate_faculty_college = validate_faculty_college

const {
    faculty_college_year,
    validate_faculty_college_year,
    User_group
} = require('../models/user_group/user_group.model')

exports.Faculty_college_year = faculty_college_year
exports.validate_faculty_college_year = validate_faculty_college_year

const {
    college_year,
    validate_college_year
} = require('../models/college_year/college_year.model')

exports.College_year = college_year
exports.validate_college_year = validate_college_year

const {
    course,
    validate_course
} = require('../models/course/course.model')

exports.Course = course
exports.validate_course = validate_course

const {
    chapter,
    validate_chapter
} = require('../models/chapter/chapter.model')

exports.Chapter = chapter
exports.validate_chapter = validate_chapter

const {
    message,
    validate_message
} = require('../models/message/message.model')

exports.Message = message
exports.validate_message = validate_message

const {
    comment,
    validate_comment
} = require('../models/comments/comments.model')

exports.Comment = comment
exports.validate_comment = validate_comment

const {
    quiz,
    validate_quiz
} = require('../models/quiz/quiz.model')

exports.Quiz = quiz
exports.validate_quiz = validate_quiz

const {
    quiz_submision,
    validate_quiz_submission
} = require('../models/quiz_submission/quiz_submission.model')

exports.Quiz_submission = quiz_submision
exports.validate_quiz_submission = validate_quiz_submission


// const {
//     fileFilter
// } = require('./multer/fileFilter')

// exports.fileFilter = fileFilter

const {
    chat_group,
    validate_chat_group,
    validate_group_members,
    validate_chat_group_profile_udpate
} = require('../models/chat_group/chat_group.model')

exports.Chat_group = chat_group
exports.validate_chat_group = validate_chat_group
exports.validate_chat_group_profile_udpate = validate_chat_group_profile_udpate

const {
    notification,
    validate_notification
} = require('../models/notification/notification.model')

exports.Notification = notification
exports.validate_notification = validate_notification

const {
    user_notification,
    validate_user_notification
} = require('../models/user_notification/user_notification.model')

exports.User_notification = user_notification
exports.validate_user_notification = validate_user_notification

const {
    live_session,
    validate_live_session
} = require('../models/live_session/live_session.model')

exports.Live_session = live_session
exports.validate_live_session = validate_live_session


exports.u = undefined

/**
 * other functions
 */


exports.date = (date) => {
    return new Date(date)
}

exports.scheduleEvent = async (date, callback) => {
    schedule.scheduleJob(date, callback);
}

exports.update_password = async ({password, user_id}) => {
    const hashedPassword = await this.hashPassword(password);
    await this.updateDocument(this.User, user_id, {
        password: hashedPassword
    });
}

exports.calculateAmount = async (collegePlan, periodType, periodValue, total_users, currentTotalUsers = undefined) => {

    if (currentTotalUsers && !['HUGUKA', 'JIJUKA', 'MINUZA_ACCELERATE'].includes(collegePlan.plan)) {

        currentTotalUsers--;
        const maxValue = collegePlan.plan === 'MINUZA_STARTER' ? 10 : 600
        if (currentTotalUsers > maxValue) {
            collegePlan = this.simplifyObject(collegePlan)
            collegePlan.plan = 'JIJUKA'
        }
    }

    switch (collegePlan.plan) {
        case 'HUGUKA': {
            if (periodType === 'MONTH')
                return 4000 * periodValue
            else if (periodType === 'YEAR')
                return ((4000 * 12) * ((100 - collegePlan.discount) / 100)) * periodValue
        }
            break;
        case 'JIJUKA': {
            if (periodType === 'MONTH')
                return 2500 * periodValue * total_users
            else if (periodType === 'YEAR')
                return ((2500 * 12) * ((100 - collegePlan.discount) / 100)) * periodValue * total_users
        }
            break;
        case 'MINUZA_STARTER': {
            if (periodType === 'MONTH')
                return 2299 * periodValue * 200
            else if (periodType === 'YEAR')
                return ((2299 * 12) * ((100 - collegePlan.discount) / 100)) * periodValue * 200
        }
            break;
        case 'MINUZA_GROWTH': {
            if (periodType === 'MONTH')
                return 1899 * periodValue * 600
            else if (periodType === 'YEAR')
                return ((1899 * 12) * ((100 - collegePlan.discount) / 100)) * periodValue * 600
        }
            break;
        case 'MINUZA_ACCELERATE': {
            if (periodType === 'MONTH')
                return 1599 * periodValue * total_users
            else if (periodType === 'YEAR')
                return ((1599 * 12) * ((100 - collegePlan.discount) / 100)) * periodValue * total_users
        }
            break;
    }

}

/**
 *  returns a formatted result (made to avoid console errors caused by statuses and to utilise the results we give)
 * @param {Number} status  Status code
 * @param {String} message Message
 * @param {Object} data Data
 */
exports.formatResult = (status = 200, message = 'OK', data = undefined) => {
    return {
        status: status,
        message: message.toString().split('\"').join(''),
        data: data
    }
}

/**
 *  checks if the given id is a mongoose objectId
 * @param {String} id  DocumentId
 */
exports.validateObjectId = (id) => Joi.validate(id, Joi.ObjectId().required())

/**
 *  checks if the given id is a mongoose objectId
 * @param {Number} code  groupCOde
 */
exports.validateChat_group_code = (code) => Joi.validate(code, Joi.number().required())

/**
 *  encrypts the given password
 * @param {String} password  password string
 * @returns {String} hashed_password
 */
exports.hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(password, salt)
    return hashed
}

/**
 *  validates the login credentials
 * @param {{email: String, password: String}} credentials  password string
 */
exports.validateUserLogin = (credentials) => {
    const schema = {
        email_user_name_or_phone: Joi.string().required(),
        password: Joi.string().min(3).max(255).required()
    }
    return Joi.validate(credentials, schema)
}

/**
 *  creates a new document with the data
 * @param {Object} model Model
 * @param {Object} properties Model
 * @returns formattedResult
 */
exports.createDocument = async (model, properties) => {
    try {
        let newDocument = new model(properties)
        const savedDocument = await newDocument.save()
        return this.formatResult(201, 'CREATED', savedDocument)
    } catch (error) {
        return this.formatResult(500, error)
    }
}

/**
 *  updates the document with the given id
 * @param {Object} model Model
 * @param {Object} id MongoId of the document
 * @param {Object} properties Model
 * @returns formattedResult
 */
exports.updateDocument = async (model, id, properties, simplified = true) => {
    try {
        const updatedDocument = await model.findOneAndUpdate({
            _id: id
        }, properties, {
            new: true
        }).exec()
        return this.formatResult(200, 'UPDATED', simplified ? this.simplifyObject(updatedDocument) : updatedDocument)
    } catch (error) {
        return this.formatResult(500, error)
    }
}

/**
 *  deletes a document with the given id
 * @param {Object} model Model
 * @param {Object} id MongoId of the document
 * @returns formattedResult
 */
exports.deleteDocument = async (model, id) => {
    try {
        const deletedDocument = await model.findOneAndDelete({
            _id: id
        }).exec()
        return this.formatResult(200, 'DELETED')
    } catch (error) {
        return this.formatResult(500, error)
    }
}

/**
 *  finds the requested data from the given model
 * @param {Object} model Model
 * @param {Object} query Query object
 * @param {Object} fields Specifies the needed fields
 * @param {Number} limit Specifies the limit
 * @param {Number} startIndex Specifies the startingIndex
 * @returns formattedResult
 */
exports.findDocuments = async (model, query, fields, limit, startIndex, lean = true, formatted = false, sort) => {
    try {
        const documents = await model.find(query, fields).sort(sort).lean(lean).limit(limit).skip(startIndex).exec()
        return formatted ? this.formatResult(200, 'OK', documents) : documents
    } catch (error) {
        return this.formatResult(500, error)
    }
}


/**
 *  finds the requested document from the given model
 * @param {Object} model Model
 * @param {Object} query Query object
 * @param {Object} fields Specifies the needed fields
 * @returns formattedResult
 */
exports.findDocument = async (model, query, fields, lean = true, formatted = false) => {
    try {
        const document = await model.findOne(query, fields).lean(lean).exec()
        return formatted ? this.formatResult(200, 'OK', document) : document
    } catch (error) {
        return this.formatResult(500, error)
    }
}

/**
 *  counts documents from the given model using the given query
 * @param {Object} model Model
 * @param {Object} query Query object
 * @returns Number
 */
exports.countDocuments = async (model, query) => {
    return await model.find(query).countDocuments().exec()
}

/**
 *  check's if the passed file is a picture, video, or other file
 * @param {String} model File_name
 * @returns File_type
 */
exports.findFileType = async (file_name) => {
    const file_types = [{
        name: 'image',
        extensions: ['jpeg', 'jpg', 'png', 'webp']
    }, {
        name: 'video',
        extensions: ['mp4']
    }]

    const extension = file_name.split('.')[file_name.split('.').length - 1]

    let file_type = file_types.filter(type => type.extensions.includes(extension.toLowerCase()))
    return file_type.length ? file_type[0].name : null
}

exports.getCourse = async (id) => {
    let chapter = await Chapter.findOne({
        _id: id
    })
    return chapter.course
}
exports.removeDocumentVersion = (obj) => {
    return this._.omit(obj, '__v')
}

// get histroy conversations between a user and his contact
exports.getConversationMessages = async ({
                                             user_id,
                                             user,
                                             conversation_id,
                                             lastMessage,
                                             limit
                                         }) => {
    let messages

    if (conversation_id !== 'announcements') {

        if (parseInt(conversation_id)) {
            const group = await this.findDocument(this.Chat_group, {
                code: conversation_id
            })
            conversation_id = group._id
            messages = lastMessage ? await this.findDocuments(this.Message, {
                _id: {
                    $lt: lastMessage
                },
                group: group._id
            }, {
                receivers: 0
            }, limit) : await this.findDocuments(this.Message, {
                group: group._id
            }, {
                receivers: 0
            }, limit)

        } else {
            const user = await this.findDocument(this.User, {
                user_name: conversation_id
            })
            conversation_id = user._id
            messages = await this.findDocuments(this.Message, {
                $or: [{
                    $and: [
                        {sender: user_id},
                        {
                            receivers: {
                                $elemMatch: {
                                    id: conversation_id
                                }
                            }
                        }
                    ]
                }, {
                    $and: [
                        {sender: conversation_id},
                        {
                            receivers: {
                                $elemMatch: {
                                    id: user_id
                                }
                            }
                        }
                    ]
                }, {
                    $and: [
                        {sender: 'SYSTEM'},
                        {
                            receivers: {
                                $elemMatch: {
                                    id: user_id
                                }
                            }
                        },
                        {
                            receivers: {
                                $elemMatch: {
                                    id: conversation_id
                                }
                            }
                        }
                    ]
                }],
                group: undefined
            }, {
                receivers: 0
            }, limit)
        }

        return await this.replaceUserIds(messages, user_id)
    } else {
        const announcements = await this.getUserAnnouncements(user, false, true)
        return announcements
    }
}

// check if the receivers are the same
function receiversMatch(receiver_g1, receiver_g2) {
    for (const i in receiver_g1) {
        let receiver_found = receiver_g2
            .filter(r => r.id == receiver_g1[i].id)
        if (!receiver_found.length) return false
    }
    return true
}

exports.injectTarget = async (announcements) => {
    for (const announcementsKey in announcements) {
        if (!announcements[announcementsKey].target)
            continue;
        let target
        switch (announcements[announcementsKey].target.type) {
            case 'course':
                target = await this.findDocument(this.Course, {
                    _id: announcements[announcementsKey].target.id
                }, {name: 1})
                break;

            case 'student_group':
                target = await this.findDocument(User_group, {
                    _id: announcements[announcementsKey].target.id
                }, {name: 1})
                break;

            case 'faculty':
                target = await this.findDocument(Faculty, {
                    _id: announcements[announcementsKey].target.id
                }, {name: 1})
                break;

            case 'college':
                target = await this.findDocument(this.College, {
                    _id: announcements[announcementsKey].target.id
                }, {name: 1})
                break;

            default:
                break;
        }
        announcements[announcementsKey].target.name = target.name
    }
    return announcements
}

exports.addUserViewToAnnouncement = async (user) => {
    const ids = await this.findTargetIds(user)
    const announcements = await Announcement.find({
        $or: [
            {"target.id": {$in: ids}},
            {specific_receivers: user._id.toString()},
        ],
        viewers: {$nin: user._id.toString()}
    })

    for (const i in announcements) {
        announcements[i].viewers.push(user._id)
        await announcements[i].save()
    }
}

exports.findTargetIds = async (user) => {
    const ids = [user.college]

    const user_user_group = await User_user_group.find({
        user: user._id.toString(),
        status: "ACTIVE"
    }, {user_group: 1}).populate('user_group',
        {faculty: 1}
    )

    user_user_group.map(async (x) => {
        ids.push(x.user_group._id.toString())
        ids.push(x.user_group.faculty.toString())
    })

    if (user.category.name === 'STUDENT') {

        const courses = await this.Course.find({
            user_group: {$in: user_user_group.map(x => x.user_group._id.toString())},
            published: true
        }, {_id: 1})

        courses.map(async (x) => {
            ids.push(x._id.toString())
        })

    }
    return ids
}

exports.getUserAnnouncements = async (user, getOne = false, receivedOnly = false) => {

    const ids = await this.findTargetIds(user)

    let announcements
    let unreads
    if (getOne) {
        announcements = await Announcement.findOne(receivedOnly ? {
            $or: [
                {"target.id": {$in: ids}},
                {specific_receivers: user._id.toString()},
            ],
            sender: {$ne: user._id}
        } : {
            $or: [
                {"target.id": {$in: ids}},
                {sender: user._id},
                {specific_receivers: user._id.toString()},
            ]
        }).populate('viewers', ['sur_name', 'other_names', 'user_name']).populate('specific_receivers', ['sur_name', 'other_names', 'user_name']).sort({_id: -1}).lean()
        if (!announcements)
            return {announcement: undefined}
        announcements = await this.injectUser([announcements], 'sender')
        unreads = await Announcement.find({
            $or: [
                {"target.id": {$in: ids}},
                {specific_receivers: user._id.toString()},
            ],
            viewers: {$nin: user._id.toString()}
        }).count()
    } else {
        announcements = await Announcement.find(receivedOnly ? {
            $or: [
                {"target.id": {$in: ids}},
                {specific_receivers: user._id.toString()},
            ],
            sender: {$ne: user._id}
        } : {
            sender: user._id
        }).populate('viewers', ['sur_name', 'other_names', 'user_name']).populate('specific_receivers', ['sur_name', 'other_names', 'user_name']).sort({_id: receivedOnly ? 1 : -1}).lean()
        announcements = await this.injectUser(announcements, 'sender')
    }

    announcements = await this.injectTarget(announcements)

    return getOne ? {announcement: announcements[0], unreads} : announcements

}

exports.injectAnnouncementContact = async (contacts, user) => {
    const {announcement, unreads} = await this.getUserAnnouncements(user, true, true)

    if (!announcement)
        return contacts

    contacts.unshift({
        id: 'announcements',
        name: "Announcements",
        last_message: announcement,
        unreadMessagesLength: unreads
    })
    return contacts
}

// format contacts
exports.formatContacts = async (messages, user_id, user) => {

    let formatedContacts = []
    for (const message of messages) {
        let id = '',
            name = "",
            image = '',
            is_group = undefined,
            unreadMessagesLength = 0,
            members = undefined,
            last_message = {
                time: message.createdAt,
                content: message.content,
                sender: message.sender
            }

        if (message.sender == 'SYSTEM') {
            const contact = message.receivers.filter(c => c.id != user_id)
            last_message.sender = undefined
            message.sender = contact.length > 1 ? undefined : contact[0].id
        }

        if (message.sender == user_id) {
            last_message.sender = {
                sur_name: 'You'
            }
        } else if (last_message.sender) {
            let sender = await this.injectUser([{
                id: message.sender
            }], 'id', 'data')
            sender = sender[0].data
            last_message.sender = {
                sur_name: sender.sur_name
            }
        }

        if (message.group) {
            const group = await this.findDocument(this.Chat_group, {
                _id: message.group
            })
            id = group.code
            is_group = true
            name = group.name
            members = await this.injectUser(group.members.filter(member => member.status == true), 'id', 'data')
            image = group.profile ? `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/chat_group/${group.code}/profile/${group.profile}` : undefined
            unreadMessagesLength = await this.countDocuments(this.Message, {
                group: message.group,
                receivers: {
                    $elemMatch: {
                        id: user_id,
                        read: false
                    }
                }
            })
        } else {
            let user = await this.injectUser([{
                id: message.sender == user_id ? message.receivers[0].id : message.sender
            }], 'id', 'data')
            user = user[0].data
            id = user.user_name
            name = `${user.sur_name} ${user.other_names}`
            image = user.profile
            unreadMessagesLength = await this.countDocuments(this.Message, {
                sender: user._id,
                group: undefined,
                receivers: {
                    $elemMatch: {
                        id: user_id,
                        read: false
                    }
                }
            })
        }
        formatedContacts.push({
            id: id,
            name: name,
            image: image,
            last_message: last_message,
            unreadMessagesLength: unreadMessagesLength,
            is_group: is_group,
            members: members
        })
    }

    await this.injectAnnouncementContact(formatedContacts, user)

    return formatedContacts
}

// format messages
exports.formatMessages = async (messages, user_id) => {
    let messagesCopy = this.simplifyObject(messages)
    let formatedMessages = []
    for (const message of messages) {
        for (const i in messagesCopy) {
            if (message._id == messagesCopy[i]._id) {
                let from = 'Me'
                let image = undefined
                let matchingMessages = []
                if (message.sender != user_id) {
                    if (message.sender == 'SYSTEM') {
                        from = 'SYSTEM'
                    } else {
                        let user = await this.injectUser([{
                            id: message.sender == user_id ? message.receivers[0].id : message.sender
                        }], 'id', 'data')
                        user = user[0].data
                        from = `${user.sur_name} ${user.other_names}`
                        image = user.profile
                    }
                }
                let relatedMessages = messagesCopy.filter(m => m.sender == message.sender)
                for (const i in relatedMessages) {
                    let diff = (new Date(message.createdAt).getTime() - new Date(relatedMessages[i].createdAt).getTime()) / 1000;
                    diff /= 60;
                    diff = Math.abs(Math.round(diff))
                    if (diff < 5) {
                        matchingMessages.push(relatedMessages[i])
                        for (const k in messagesCopy) {
                            if (relatedMessages[i]._id == messagesCopy[k]._id) {
                                messagesCopy.splice(k, 1)
                            }
                        }

                    }
                }
                formatedMessages.push({
                    from: from,
                    image: image,
                    messages: matchingMessages
                })
                break
            }
        }
    }
    return formatedMessages
}
exports.injectAttachementsMediaPath = (message) => {
    for (const j in message.attachments) {
        message.attachments[j].src = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/message/${message._id}/attachment/${message.attachments[j].src}`
    }
    return message
}
exports.replaceUserIds = async (messages, userId) => {
    for (const messagesKey in messages) {
        if (messages[messagesKey].sender === 'SYSTEM') {
            const messageSegments = messages[messagesKey].content.split(" ")
            for (const messageSegmentsKey in messageSegments) {
                if (/^__user__(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i.test(messageSegments[messageSegmentsKey])) {
                    const user_id = messageSegments[messageSegmentsKey].split('__user__')[1]
                    if (user_id === userId)
                        messageSegments[messageSegmentsKey] = "You"
                    else {
                        const __user = await user.findById(user_id, {sur_name: 1, other_names: 1})
                        messageSegments[messageSegmentsKey] = __user.sur_name + ' ' + __user.other_names
                    }
                }
            }
            messages[messagesKey].content = messageSegments.join(" ")
        }
        if (messages[messagesKey].attachments)
            if (messages[messagesKey].attachments.length)
                messages[messagesKey] = this.injectAttachementsMediaPath(messages[messagesKey])
    }
    return messages
}

exports.replaceWithLatestMessages = async (messages, user_id) => {
    for (const messagesKey in messages) {
        const message = await this.Message.findOne(
            messages[messagesKey].group ?
                {
                    group: messages[messagesKey].group,
                    _id: {$ne: messages[messagesKey].realId}
                }
                :
                {
                    _id: {$ne: messages[messagesKey].realId},
                    group: undefined,
                    $or: [
                        {sender: user_id, "receivers.id": messages[messagesKey].receivers[0].id,},
                        {sender: messages[messagesKey].receivers[0].id, "receivers.id": user_id},
                        {sender: user_id, "receivers.id": messages[messagesKey].receivers[1].id,},
                        {sender: messages[messagesKey].receivers[1].id, "receivers.id": user_id},
                    ]
                }
        ).sort({_id: -1})

        if (message !== null) {
            messages[messagesKey] = message
        }
    }
    return messages
}

// get latest conversations
exports.getLatestMessages = async (user_id) => {
    const u = this.u

    let latestMessages = await this.Message.aggregate([{
        $sort: {
            _id: -1
        }
    },
        {
            $match: {
                receivers: {
                    $elemMatch: {
                        id: user_id
                    }
                },
                sender: "SYSTEM"
            }
        }, {
            $group: {
                _id: {
                    sender: "$sender",
                    receivers: "$receivers"
                },
                realId: {
                    $first: "$_id"
                },
                receivers: {
                    $first: "$receivers"
                },
                sender: {
                    $first: "$sender"
                },
                group: {
                    $first: "$group"
                },
                content: {
                    $first: "$content"
                },
                createdAt: {
                    $first: "$createdAt"
                }
            }
        }
    ])

    latestMessages = await this.replaceWithLatestMessages(latestMessages, user_id)


    latestMessages = await this.replaceUserIds(latestMessages, user_id)

    return latestMessages.sort((a, b) => {
        if (a.createdAt > b.createdAt) return -1;
        if (a.createdAt < b.createdAt) return 1;
        return 0;
    })
}

/**
 *  creates or update a message (done for code reusability between socket and rest)
 * @param {String} sender  Sender user_name
 * @param {String} receiver Sender user_name or name if it's a group
 * @param {Object} content the message content
 * @param {Object} action creat of update
 * @returns FormatedResult
 */
exports.Create_or_update_message = async (sender, receiver, content, _id, user_id, attachments) => {
    if (_id) {
        const message = await this.findDocument(this.Message, {
            _id: _id
        })
        if (!message) return this.formatResult(404, 'message not found')
    }

    let receiver_found = false,
        receivers = []

    let _sender = sender == 'SYSTEM' ? {
        _id: sender
    } : await this.findDocument(this.User, {
        user_name: sender
    })

    if (!_sender)
        return this.formatResult(404, 'sender not found')

    let chat_group

    if (typeof receiver !== 'string') {
        chat_group = await this.findDocument(this.Chat_group, {
            code: parseInt(receiver)
        })

        receiver_found = true
        for (const i in chat_group.members) {
            receivers.push({
                id: chat_group.members[i].id
            })
        }
    } else {
        if (sender == 'SYSTEM' && user_id) {
            receivers.push({
                id: user_id
            })
        }
        let _receiver = await this.findDocument(this.User, {
            user_name: receiver
        })
        if (_receiver) {
            receiver_found = true
            receivers.push({
                id: _receiver._id
            })
        }
    }

    if (!receiver_found || !receivers.length)
        return this.formatResult(404, 'receiver not found')

    return _id ? await this.updateDocument(this.Message, _id, {
        sender: _sender._id,
        receivers: receivers,
        content: content,
        group: chat_group ? chat_group._id : this.u
    }) : await this.createDocument(this.Message, {
        sender: _sender._id,
        receivers: receivers,
        content: content,
        group: chat_group ? chat_group._id : this.u,
        attachments
    })

}

const fs = require('fs')
const sharp = require('sharp')

exports.resizeImage = function resize(path, format, width, height) {
    const readStream = fs.createReadStream(path)
    let transform = sharp()

    if (format) {
        transform = transform.toFormat(format)
    }

    if (width || height) {
        transform = transform.resize(width, height)
    }

    return readStream.pipe(transform)
}

// add mediapaths to quiz attachments
exports.addAttachmentMediaPaths = (quizes, removeRightChoice = false) => {
    for (const i in quizes) {
        for (const k in quizes[i].questions) {
            if (quizes[i].questions[k].options) {
                for (const j in quizes[i].questions[k].options.choices) {
                    if (quizes[i].questions[k].options.choices[j].src) {
                        if (!quizes[i].questions[k].options.choices[j].src.includes('http')) {
                            quizes[i].questions[k].options.choices[j].src = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/quiz/${quizes[i]._id}/attachment/${quizes[i].questions[k].options.choices[j].src}`
                        }
                    }
                    if (removeRightChoice) {
                        quizes[i].questions[k].options.choices[j].right = undefined
                    }
                }
            }
        }
    }
    return quizes
}

// add the number of students who did the quiz
exports.addQuizUsages = async (quizes) => {
    for (const i in quizes) {
        const usages = await this.countDocuments(this.Quiz_submission, {
            quiz: quizes[i]._id
        })
        quizes[i].usage = usages
    }
    return quizes
}

// add the course to which the quiz is attached
exports.addAttachedCourse = async (quizes) => {
    for (const i in quizes) {
        if (quizes[i].target) {
            if (quizes[i].target.type == 'facultyCollegeYear') {
                quizes[i].course = undefined
            }
            let courseId = quizes[i].target.id
            if (quizes[i].target.type == 'chapter') {
                const chapter = await this.Chapter.findOne({
                    _id: quizes[i].target.id
                })
                courseId = chapter.course
            }
            const course = await this.Course.findOne({
                _id: courseId
            })
            quizes[i].course = course
        } else {
            quizes[i].course = undefined
        }
    }
    return quizes
}
// add chapters in their parent courses
exports.injectChapters = async (courses, user_id) => {
    for (const i in courses) {
        courses[i].assignmentsLength = 0
        // add course cover picture media path
        if (courses[i].cover_picture && !courses[i].cover_picture.includes('http')) {
            courses[i].cover_picture = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/course/${courses[i].name}/cover_picture/${courses[i].cover_picture}`
        }
        let chapters = await this.findDocuments(this.Chapter, {
            course: courses[i]._id
        })
        let total_required_marks = 0;
        let total_got_marks = 0;
        // simplify
        courses[i].chapters = this.simplifyObject(chapters)
        for (const k in courses[i].chapters) {
            // remove course and documentVersion
            courses[i].chapters[k].course = undefined
            courses[i].chapters[k].__v = undefined

            // add media path of the content
            courses[i].chapters[k].document = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/chapter/${courses[i].chapters[k]._id}/document`
            // add media path of the video
            if (courses[i].chapters[k].uploaded_video) {
                courses[i].chapters[k].uploaded_video = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/chapter/${courses[i].chapters[k]._id}/video/${courses[i].chapters[k].uploaded_video}`
            }
            if (!courses[i].chapters[k].attachments)
                courses[i].chapters[k].attachments = []

            for (const l in courses[i].chapters[k].attachments) {
                courses[i].chapters[k].attachments[l].download_link = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/chapter/${courses[i].chapters[k]._id}/attachment/${courses[i].chapters[k].attachments[l].src}/download`
                courses[i].chapters[k].attachments[l].name = courses[i].chapters[k].attachments[l].src
            }

            // add assignments attached to chapters
            const chapterQuiz = await this.findDocuments(this.Quiz, {
                "target.type": "chapter",
                "target.id": courses[i].chapters[k]._id
            })
            courses[i].chapters[k].quiz = chapterQuiz
            courses[i].assignmentsLength += chapterQuiz.length
            courses[i].chapters[k].commentsLength = await this.countDocuments(this.Comment, {
                "target.type": 'chapter',
                "target.id": courses[i].chapters[k]._id,
                reply: undefined
            })

            //    add live sessions
            const live_sessions = await this.Live_session.find({
                "target.type": "chapter",
                "target.id": courses[i].chapters[k]._id
            })
            courses[i].chapters[k].live_sessions = live_sessions;

            if (user_id) {
                // get submissions to add marks
                for (const i in chapterQuiz) {
                    const submission = await this.Quiz_submission.findOne({
                        "user": user_id,
                        quiz: chapterQuiz[i]._id
                    }, {
                        total_marks: 1
                    })
                    if (submission) {
                        total_got_marks += submission.total_marks
                        total_required_marks += chapterQuiz[i].total_marks
                    }
                }
            }
        }

        if (total_got_marks || total_required_marks)
            courses[i].score = (total_got_marks / total_required_marks) * 100

        // add assignments attached to course
        const courseQuiz = await this.findDocuments(this.Quiz, {
            "target.type": 'course',
            "target.id": courses[i]._id
        })
        courses[i].quiz = courseQuiz
        courses[i].assignmentsLength += courseQuiz.length

        // add the students that started the course
        courses[i].attendedStudents = await this.countDocuments(this.User_progress, {
            course: courses[i]._id
        })
    }
    return courses
}

// replace user id by the user information
exports.injectUser = async (array, property, newProperty) => {
    let name = newProperty ? newProperty : property
    for (const i in array) {
        if (array[i]) {
            if (array[i][`${property}`]['email'])
                continue;
            const user = await this.findDocument(this.User, {
                _id: array[i][`${property}`]
            })
            const category = await this.findDocument(this.User_category, {_id: user.category})
            user.category = category.name
            // array[i][`${name}`] = this._.pick(user, ['_id', 'sur_name', 'other_names', 'user_name', 'gender', 'phone', "profile", "category"])
            array[i][`${name}`] = this._.pick(user, ['email', 'sur_name', 'other_names', 'user_name', 'gender', 'phone', "profile", "category"])
            if (array[i][`${name}`].profile) {
                array[i][`${name}`].profile = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/user/${user.user_name}/profile/${user.profile}`
            }
        }
    }
    return array
}

// remove restrictions in objects
exports.simplifyObject = (obj) => {
    return JSON.parse(JSON.stringify(obj))
}

// auto mark selection questions
exports.autoMarkSelectionQuestions = (questions, answers) => {
    let is_selection_only = true, total_marks = 0;
    for (const i in questions) {
        if (questions[i].type.includes("select")) {
            answers[i].marks = 0
            if (answers[i].choosed_options.length) {
                const rightChoices = questions[i].options.choices.filter((choice) => choice.right);
                if (questions[i].type.includes("single")) {
                    if (questions[i].type.includes("file")) {
                        answers[i].marks = (answers[i].choosed_options[0].src == rightChoices[0].src) ? questions[i].marks : 0;
                    } else {
                        answers[i].marks = (answers[i].choosed_options[0].text == rightChoices[0].text) ? questions[i].marks : 0;
                    }
                } else {
                    for (const k in answers[i].choosed_options) {
                        if (questions[i].type.includes("file")) {
                            let checkStatus = rightChoices.filter((choice) => choice.src == answers[i].choosed_options[k].src);
                            if (checkStatus.length > 0) {
                                answers[i].marks += questions[i].marks / rightChoices.length;
                            }
                        } else {
                            let checkStatus = rightChoices.filter((choice) => choice.text == answers[i].choosed_options[k].text);
                            if (checkStatus.length > 0) {
                                answers[i].marks += questions[i].marks / rightChoices.length;
                            }
                        }
                    }
                }
                total_marks += answers[i].marks
            }
        } else {
            is_selection_only = false
        }
    }
    return {
        answers: answers,
        total_marks: total_marks,
        is_selection_only: is_selection_only
    }
}

// inject notification
exports.injectNotification = async (array) => {
    for (const i in array) {
        array[i].notifications = array[i].notifications.filter(x => x.status > 1)
        for (const k in array[i].notifications) {
            let notification = await this.findDocument(this.Notification, {
                _id: array[i].notifications[k].id
            })
            if (notification.user) {
                notification = await this.injectUser([notification], 'user')
                notification = notification[0]
            }
            array[i].notifications[k].id = undefined
            array[i].notifications[k].notification = notification
            if (notification.mes) {

            }
        }
    }
    return array
}

// add student progress
exports.injectUserProgress = async (courses, user_id) => {
    for (const i in courses) {
        const result = await this.findDocument(this.User_progress, {
            course: courses[i]._id,
            user: user_id
        })

        courses[i].progress = result ? {
            id: result._id,
            progress: result.progress,
            dateStarted: result.createdAt,
            lastUpdated: result.updatedAt
        } : undefined
    }
    return courses
}

exports.Search = async (model, search_query, projected_fields, _page, _limit) => {
    const page = parseInt(_page)
    const limit = parseInt(_limit)

    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    const results = {}

    if (endIndex < await model.countDocuments().exec()) {
        results.next = {
            page: page + 1,
            limit: limit
        }
    }

    if (startIndex > 0) {
        results.previous = {
            page: page - 1,
            limit: limit
        }
    }
    try {
        results.results = await model.find(search_query, projected_fields).limit(limit).skip(startIndex).exec()
        return {
            data: results
        }
    } catch (e) {
        return {
            error: e.message
        }
    }
}

exports.addStorageDirectoryToPath = (path) => {
    return this.path.resolve(this.path.join(process.env.DIR ? process.env.DIR : '', path))
}

// configure multer dynamic storage
exports.dynamic_storage = this.multer.diskStorage({
    destination: (req, file, cb) => {
        const {
            dir
        } = req.kuriousStorageData

        fs.exists(dir, exist => {
            if (!exist) {
                return fs.mkdir(dir, {
                    recursive: true
                }, error => cb(error, dir))
            }
            return cb(null, dir)
        })
    },
    filename: (req, file, cb) => {
        const {
            name
        } = req.kuriousStorageData

        cb(null, `${name || file.originalname}`)
    }
})

// file size limits needed
// type checking also needed

const imageFilter = function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'file type not allowed';
        return cb(new Error(req.fileValidationError), false);
    }
    cb(null, true);
};

const audioFilter = function (req, file, cb) {
    // Accept auddios only
    if (!file.originalname.match(/\.(MP3|mp3|wav|WAV)$/)) {
        req.fileValidationError = 'file type not allowed';
        return cb(new Error(req.fileValidationError), false);
    }
    cb(null, true);
};

// upload sing file
exports.upload_single = this.multer({
    storage: this.dynamic_storage,
    // limits: {
    //     fileSize: 1024 * 1024 * 5
    // },
    // fileFilter: fileFilter
}).single('file')

exports.upload_audio = this.multer({
    storage: this.dynamic_storage,
    fileFilter: audioFilter
}).single('file')

// upload single image
exports.upload_single_image = this.multer({
    storage: this.dynamic_storage,
    // limits: {
    //     fileSize: 1024 * 1024 * 5
    // },
    fileFilter: imageFilter
}).single('file')

// upload multiple filies
exports.upload_multiple = this.multer({
    storage: this.dynamic_storage
}).any()

// upload multiple filies
exports.upload_multiple_images = this.multer({
    storage: this.dynamic_storage,
    fileFilter: imageFilter
}).any()

// send resized Image
exports.sendResizedImage = async (req, res, path) => {
    this.fs.exists(path, (exists) => {
        if (!exists) {
            return res.send(this.formatResult(404, 'file not found'))
        } else {
            const widthString = req.query.width
            const heightString = req.query.height
            const format = req.query.format

            // Parse to integer if possible
            let width, height
            if (widthString) {
                width = parseInt(widthString)
            }
            if (heightString) {
                height = parseInt(heightString)
            }
            // Set the content-type of the response
            res.type(`image/${format || 'png'}`)

            // Get the resized image and send it
            this.resizeImage(path, format, width, height).pipe(res)
        }
    })
}

// npm uninstall gifsicle pngquant-bin compress-images --save

// send video
exports.streamVideo = async (req, res, path) => {
    this.fs.stat(path, (err, stat) => {

        // Handle file not found
        if (err !== null && err.code === 'ENOENT') {
            res.send(this.formatResult(404, 'file not found'));
        }

        const fileSize = stat.size
        const range = req.headers.range
        if (range) {

            const parts = range.replace(/bytes=/, "").split("-");

            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            const chunksize = (end - start) + 1;
            const file = this.fs.createReadStream(path, {
                start,
                end
            });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            }

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            }

            res.writeHead(200, head);
            this.fs.createReadStream(path).pipe(res);
        }
    });
}

exports.ONE_DAY = 60 * 60 * 24 * 1000

// generateAuthToken on user login
exports.generateAuthToken = async (user) => {
    return this.jwt.sign({
        // _id: user._id,
        sur_name: user.sur_name,
        other_names: user.other_names,
        user_name: user.user_name,
        // national_id: user.national_id,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        phone: user.phone,
        email: user.email,
        // password: user.password,
        category: user.category,
        roles: user.roles,
        college: user.college,
        profile: user.profile,
    }, this.config.get('auth_key'), {
        expiresIn: this.ONE_DAY * 7 / 1000
    })
}

// decodeAuthToken
exports.decodeAuthToken = async ({
                                     token
                                 }) => {
    return this.jwt.verify(token, this.config.get('auth_key'))
}

// all regex expressions
exports.base64EncodedImage = /^data:([A-Za-z-+\/]+);base64,(.+)$/;

exports.add_user_details = async (users) => {
    for (const i in users) {
        const category = await this.findDocument(this.User_category, {_id: users[i].category})
        users[i].category = category.name
        users[i] = this._.pick(users[i], ['_id', 'sur_name', 'other_names', 'user_name', 'gender', 'phone', "profile", "category", "status", "email"])
        if (users[i].profile) {
            users[i].profile = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}${process.env.BASE_PATH}/user/${users[i].user_name}/profile/${users[i].profile}`
        }
    }
    return users
}

// authentication middlewares
const {
    auth
} = require('../middlewares/auth.middleware');
const {Announcement} = require('../models/announcements/announcements.model');

exports.auth = auth

// constant lobal variables
exports.default_password = `Kurious@${new Date().getFullYear()}`
exports.random_user_name = async () => {
    let user_name_available = false, user_name
    while (!user_name_available) {
        user_name = `user_${Math.round(Math.random() * 1000000)}`
        const user = await this.findDocument(this.User, {user_name: user_name})
        if (!user) user_name_available = true
    }
    return user_name
}
exports.addMessageDetails = async (msg, id) => {
    // inject sender Info
    let _user = await this.injectUser([{id: id}], 'id', 'data')
    msg.sender = _user[0].data

    if (msg.group) {
        const group = await this.findDocument(this.Chat_group, {_id: msg.group})
        msg.group = group.code
    }
    // remove receivers
    if (msg.attachments)
        msg = this.injectAttachementsMediaPath(msg)
    return msg
}
// make a new group identifier so that names can be re used in colleges
exports.generateGroupCode = async () => {
    let groupCodeAvailable = false, code
    while (!groupCodeAvailable) {
        code = Math.round(Math.random() * 1000000000)
        const group = await this.findDocument(this.Chat_group, {code: code})
        if (!group) groupCodeAvailable = true
    }
    return code
}

exports.injectCommentsReplys = async (comments) => {
    for (const i in comments) {
        let replies = await this.findDocuments(this.Comment, {
            reply: comments[i]._id
        })
        replies = await this.injectUser(replies, 'sender')
        // simplify
        comments[i].replies = replies
    }
    return comments;
}

exports.injectFaculty_college_year = async (courses) => {
    for (const i in courses) {
        const user_group = await this.findDocument(User_group, {
            _id: courses[i].user_group
        }, {faculty: 1, name: 1}, true, false)

        courses[i].user_group = user_group

        const faculty = await this.findDocument(this.Faculty, {
            _id: user_group.faculty
        }, {_id: 0}, true, false)
        courses[i].user_group.faculty = faculty

        const college = await this.findDocument(this.College, {
            _id: faculty.college
        }, {name: 1, logo: 1}, true, false)

        courses[i].user_group.faculty.college = college
        if (courses[i].user_group.faculty.college.logo) {
            courses[i].user_group.faculty.college.logo = `http${process.env.NODE_ENV == 'production' ? 's' : ''}://${process.env.HOST}/kurious/file/collegeLogo/${college._id}/${college.logo}`
        }
    }
    return courses
}

exports.savedecodedBase64Image = (dataString, dir) => {

    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }


    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    let extension = '';

    if ("jpeg" == dataString.split(";")[0].split("/")[1]) {
        extension = '.jpg';
    }
    if ("gif" == dataString.split(";")[0].split("/")[1]) {
        extension = '.gif';
    }
    if ("x-icon" == dataString.split(";")[0].split("/")[1]) {
        extension = '.ico';
    }
    if ("png" == dataString.split(";")[0].split("/")[1]) {
        extension = '.png';
    }

    const filename = `profile_${new Date().getTime()}${extension}`

    fs.exists(dir, exist => {
        if (!exist) {
            fs.mkdirSync(dir, {
                recursive: true
            })
        }
        fs.writeFile(`${dir}/${filename}`, response.data, function (err) {
            if (err) {
                return err
            }
        });
    })

    return {
        filename: filename
    }
}

exports.addQuizTarget = async (quizes) => {
    for (const i in quizes) {
        if (quizes[i].target)
            if (quizes[i].target.type !== 'faculty_college_year') {

                let chapter, course, live_session

                if (quizes[i].target.type === 'chapter') {
                    chapter = await this.findDocument(this.Chapter, {
                        _id: quizes[i].target.id
                    }, this.u, true)
                    course = await this.findDocument(this.Course, {
                        _id: chapter.course
                    })
                }
                if (quizes[i].target.type === 'live_session') {
                    live_session = await this.findDocument(this.Live_session, {
                        _id: quizes[i].target.id
                    })
                    chapter = await this.findDocument(this.Chapter, {
                        _id: live_session.target.id
                    }, this.u, true)
                }

                course = await this.Course.findOne({
                    _id: chapter ? chapter.course : quizes[i].target.id
                }).populate('user_group')
                quizes[i].target.course = this._.pick(course, ['name', 'cover_picture', 'createdAt', 'user_group'])
                quizes[i].target.chapter = chapter ? this._.pick(chapter, ['name', 'createdAt']) : '-'

            }
    }
    return quizes
}

exports.handleChunk = async (chunk, id) => {
    console.log("id: " + id + "\n\nchunk: " + chunk)
}

exports.makeCode = (length) => {
    var result = '';
    var characters = 'AiB0CD1EfF2GpH3IaJ4KhL5MmN6OeP7QR8ScT9UVWXnYbZdgjkloqrstuvwxyz';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

// proper way to define user roles
// proper way to use jwt
// proper way to use config
