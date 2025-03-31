/**
 * dependencies
 */
const Joi = require('joi')
const bcrypt = require('bcryptjs')
Joi.ObjectId = require('joi-objectid')(Joi)
module.exports.express = require('express')
module.exports.cors = require('cors')
module.exports.bodyparser = require('body-parser')
module.exports.mongoose = require('mongoose')
module.exports.Joi = Joi
module.exports.jwt = require('jsonwebtoken')
module.exports.config = require('config')
module.exports.bcrypt = bcrypt
module.exports.multer = require('multer')
module.exports.fs = require('fs-extra')
module.exports.timestamps = require('mongoose-timestamp');
module.exports._ = require('lodash')
module.exports.path = require('path')


/**
 * models & their functions
 */

const {
    user,
    validate_user
} = require('../models/user/user.model')

module.exports.User = user
module.exports.validate_user = validate_user

const {
    user_category,
    validate_user_category
} = require('../models/user_category/user_category.model')

module.exports.User_category = user_category
module.exports.validate_user_category = validate_user_category

const {
    user_role,
    validate_user_role
} = require('../models/user_role/user_role.model')

module.exports.User_role = user_role
module.exports.validate_user_role = validate_user_role

const {
    college,
    validate_college
} = require('../models/college/college.model')

module.exports.College = college
module.exports.validate_college = validate_college

const {
    user_faculty_college_year,
    validate_user_faculty_college_year
} = require('../models/user_faculty_college_year/user_faculty_college_year.model')

module.exports.User_faculty_college_year = user_faculty_college_year
module.exports.validate_user_faculty_college_year = validate_user_faculty_college_year

const {
    user_progress,
    validate_user_progress
} = require('../models/user_progress/user_progress.model')

module.exports.User_progress = user_progress
module.exports.validate_user_progress = validate_user_progress

const {
    faculty,
    validate_faculty
} = require('../models/faculty/faculty.model')

module.exports.Faculty = faculty
module.exports.validate_faculty = validate_faculty

const {
    faculty_college,
    validate_faculty_college
} = require('../models/faculty_college/faculty_college.model')

module.exports.Faculty_college = faculty_college
module.exports.validate_faculty_college = validate_faculty_college

const {
    faculty_college_year,
    validate_faculty_college_year
} = require('../models/faculty_college_year/faculty_college_year.model')

module.exports.Faculty_college_year = faculty_college_year
module.exports.validate_faculty_college_year = validate_faculty_college_year

const {
    college_year,
    validate_college_year
} = require('../models/college_year/college_year.model')

module.exports.College_year = college_year
module.exports.validate_college_year = validate_college_year

const {
    course,
    validate_course
} = require('../models/course/course.model')

module.exports.Course = course
module.exports.validate_course = validate_course

const {
    chapter,
    validate_chapter
} = require('../models/chapter/chapter.model')

module.exports.Chapter = chapter
module.exports.validate_chapter = validate_chapter

const {
    message,
    validate_message
} = require('../models/message/message.model')

module.exports.Message = message
module.exports.validate_message = validate_message

const {
    quiz,
    validate_quiz
} = require('../models/quiz/quiz.model')

module.exports.Quiz = quiz
module.exports.validate_quiz = validate_quiz

const {
    quiz_submision,
    validate_quiz_submission
} = require('../models/quiz_submission/quiz_submission.model')

module.exports.Quiz_submission = quiz_submision
module.exports.validate_quiz_submission = validate_quiz_submission


const {
    fileFilter
} = require('./multer/fileFilter')

module.exports.fileFilter = fileFilter

const {
    chat_group,
    validate_chat_group
} = require('../models/chat_group/chat_group.model')

module.exports.Chat_group = chat_group
module.exports.validate_chat_group = validate_chat_group

const {
    notification,
    validate_notification
} = require('../models/notification/notification.model')

module.exports.Notification = notification
module.exports.validate_notification = validate_notification

const {
    user_notification,
    validate_user_notification
} = require('../models/user_notification/user_notification.model')

module.exports.User_notification = user_notification
module.exports.validate_user_notification = validate_user_notification


module.exports.u = undefined

/**
 * other functions
 */

/**
 *  returns a formatted result (made to avoid console errors caused by statuses and to utilise the results we give)
 * @param {Number} status  Status code
 * @param {String} message Message
 * @param {Object} data Data
 */
module.exports.formatResult = (status = 200, message = 'OK', data = undefined) => {
    return {
        status: status,
        message: message.toString(),
        data: data
    }
}

/**
 *  checks if the given id is a mongoose objectId
 * @param {String} id  DocumentId
 */
module.exports.validateObjectId = (id) => Joi.validate(id, Joi.ObjectId().required())

/**
 *  encrypts the given password
 * @param {String} password  password string
 * @returns {String} hashed_password
 */
module.exports.hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(password, salt)
    return hashed
}

/**
 *  validates the login credentials
 * @param {{email: String, password: String}} credentials  password string
 */
module.exports.validateUserLogin = (credentials) => {
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
module.exports.createDocument = async (model, properties) => {
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
module.exports.updateDocument = async (model, id, properties) => {
    try {
        const updatedDocument = await model.findOneAndUpdate({
            _id: id
        }, properties, {
            new: true
        }).exec()
        return this.formatResult(200, 'UPDATED', updatedDocument)
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
module.exports.deleteDocument = async (model, id) => {
    try {
        const deletedDocument = await model.findOneAndDelete({
            _id: id
        }).exec()
        return this.formatResult(200, 'DELETED', deletedDocument)
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
module.exports.findDocuments = async (model, query, fields, limit, startIndex, formatted = true) => {
    try {
        const documents = await model.find(query, fields).limit(limit).skip(startIndex).exec()
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
module.exports.findDocument = async (model, query, fields, lean = false, formatted = true) => {
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
module.exports.countDocuments = async (model, query) => {
    return await model.find(query).countDocuments().exec()
}

/**
 *  check's if the passed file is a picture, video, or other file
 * @param {String} model File_name
 * @returns File_type
 */
module.exports.findFileType = async (file_name) => {
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

module.exports.getCourse = async (id) => {
    let chapter = await Chapter.findOne({
        _id: id
    })
    return chapter.course
}
module.exports.removeDocumentVersion = (obj) => {
    return this._.omit(obj, '__v')
}
// get un read messages for a user
module.exports.getUnreadMesages = async (userId) => {
    const messages = await Message.find({
        receivers: {
            $elemMatch: {
                id: userId,
                read: false
            }
        }
    }).lean()
    return messages
}
// get groups in which a user belong
module.exports.getUserChatGroups = async (userId) => {
    const groups = await this.ChatGroup.find({
        members: {
            $elemMatch: {
                id: userId,
                status: true
            }
        },
        status: true
    }).lean()
    return groups
}
// get history conversations btn two users
module.exports.getPreviousMessages = async (users, lastMessage) => {
    const messages = lastMessage ? await Message.find({
        _id: {
            $lt: lastMessage
        },
        $or: [{
            sender: users[0],
            "receivers.id": users[1]
        }, {
            sender: users[1],
            "receivers.id": users[0]
        }],
        group: undefined
    }).lean() : await Message.find({
        $or: [{
            sender: users[0],
            "receivers.id": users[1]
        }, {
            sender: users[1],
            "receivers.id": users[0]
        }],
        group: undefined
    }).lean()
    return messages
}
// get histroy conversations in a group
module.exports.getPreviousMessagesInGroup = async (groupId, lastMessage) => {
    const messages = lastMessage ? await Message.find({
        _id: {
            $lt: lastMessage
        },
        group: groupId
    }).lean() : await Message.find({
        group: groupId
    }).lean()
    return messages
}

// get histroy conversations between a user and his contact
module.exports.getConversationMessages = async ({
    userId,
    groupId,
    contactId,
    lastMessage
}) => {
    let messages
    if (groupId) {
        messages = lastMessage ? await Message.find({
            _id: {
                $lt: lastMessage
            },
            group: groupId
        }).lean() : await Message.find({
            group: groupId
        }).lean()

    } else {
        messages = lastMessage ? await Message.find({
            _id: {
                $lt: lastMessage
            },
            $or: [{
                sender: userId,
                receivers: {
                    $elemMatch: {
                        id: contactId
                    }
                }
            }, {
                sender: contactId,
                receivers: {
                    $elemMatch: {
                        id: userId
                    }
                }
            }],
            group: undefined
        }).lean() : await Message.find({
            $or: [{
                sender: userId,
                receivers: {
                    $elemMatch: {
                        id: contactId
                    }
                }
            }, {
                sender: contactId,
                receivers: {
                    $elemMatch: {
                        id: userId
                    }
                }
            }],
            group: undefined
        }).lean()
    }
    return messages
}

// remove messages in the same discussion
function removeDuplicateDiscussions(sentMessages, receivedMessages) {
    let messagesToDelete = [
        // indices to remove in sentMessages
        [],
        // indices to remove in receivedMessages
        []
    ]
    for (const i in sentMessages) {
        for (const k in receivedMessages) {
            if (sentMessages[i].sender == receivedMessages[k].receivers[0].id && receivedMessages[k].sender == sentMessages[i].receivers[0].id) {
                if (sentMessages[i].realId > receivedMessages[k].realId) {
                    messagesToDelete[1].push(k)
                } else {
                    messagesToDelete[0].push(i)
                }
            }
        }
    }
    if (messagesToDelete[0].length > 0) {
        for (const index of messagesToDelete[0]) {
            sentMessages.splice(index, 1)
        }
    }
    if (messagesToDelete[1].length > 0) {
        for (const index of messagesToDelete[1]) {
            receivedMessages.splice(index, 1)
        }
    }

    return {
        sent: sentMessages,
        received: receivedMessages
    }
}

// format contacts
module.exports.formatContacts = async (messages, userId) => {
    let formattedContacts = []
    for (const message of messages) {
        let id = ''
        let name = ""
        let image = ''
        let last_message = {
            time: message.createdAt,
            content: message.content,
            sender: message.sender
        }
        let unreadMessagesLength = 0
        if (message.group) {
            const group = await chatGroup.findOne({
                _id: message.group
            })
            id = message.group
            name = group.name
            image = group.profile ? `http://${process.env.HOST}${process.env.BASE_PATH}/file/groupProfilePicture/${group._id}/${group.profile}` : undefined

            unreadMessagesLength = await Message.find({
                group: message.group,
                receivers: {
                    $elemMatch: {
                        id: userId,
                        read: false
                    }
                }
            }).countDocuments()
        } else {
            const user = await this.findDocument(this.User, message.sender == userId ? message.receivers[0].id : message.sender)
            id = user._id
            name = `${user.surName} ${user.otherNames}`
            image = user.profile ? `http://${process.env.HOST}${process.env.BASE_PATH}/file/${user.category == 'SuperAdmin' ? 'superAdmin' : user.category.toLowerCase()}Profile/${students[i]._id}/${user.profile}` : undefined

            unreadMessagesLength = await Message.find({
                sender: user._id,
                receivers: {
                    $elemMatch: {
                        id: userId,
                        read: false
                    }
                }
            }).countDocuments()
        }
        formattedContacts.push({
            id: id,
            name: name,
            image: image,
            last_message: last_message,
            unreadMessagesLength: unreadMessagesLength
        })
    }
    return formattedContacts
}

// format messages
module.exports.formatMessages = async (messages, userId) => {
    let messagesCopy = this.simplifyObject(messages)
    let formattedMessages = []
    for (const message of messages) {
        for (const i in messagesCopy) {
            if (message._id == messagesCopy[i]._id) {
                let from = 'Me'
                let image = undefined
                let matchingMessages = []
                if (message.sender != userId) {
                    const user = await this.findDocument(this.User, {
                        _id: message.sender == userId ? message.receivers[0].id : message.sender
                    })
                    from = `${user.surName} ${user.otherNames}`
                    if (user.profile) {
                        image = `http://${process.env.HOST}${process.env.BASE_PATH}/file/${user.category == 'SuperAdmin' ? 'superAdmin' : user.category.toLowerCase()}Profile/${students[i]._id}/${user.profile}`
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
                formattedMessages.push({
                    from: from,
                    image: image,
                    messages: matchingMessages
                })
                break
            }
        }
    }
    return formattedMessages
}

// get latest conversations
module.exports.getLatestMessages = async (userId) => {
    try {


        let latestMessages = []
        /** 1 get all latest messages in groups */
        const groups = await module.exports.getUserChatGroups(userId)
        for (const i in groups) {
            const message = await Message.findOne({
                group: groups[i]._id
            }).sort({
                _id: -1
            }).limit(1)
            if (message) {
                latestMessages.push(message)
            }

        }
        /** 2 get all latest messages sent to us */
        // const receivedMessages = await Message.find({group: undefined, receivers: { $elemMatch: { id: userId } }}).sort({_id: -1}).limit(1)
        let receivedMessages = await Message.aggregate([{
            $sort: {
                _id: -1
            }
        },
        {
            $match: {
                receivers: {
                    $elemMatch: {
                        id: userId
                    }
                },
                group: undefined
            }
        }, {
            $group: {
                _id: "$sender",
                realId: {
                    $first: "$_id"
                },
                receivers: {
                    $first: "$receivers"
                },
                sender: {
                    $first: "$sender"
                },
                content: {
                    $first: "$content"
                },
                createdAt: {
                    $first: "$createdAt"
                },
                read: {
                    $first: "$read"
                }
            }
        }
        ])
        /** 3 get all latest messages we sent */
        // const receivedMessages = await Message.find({group: undefined, receivers: { $elemMatch: { id: userId } }}).sort({_id: -1}).limit(1)
        let sentMessages = await Message.aggregate([{
            $sort: {
                _id: -1
            }
        },
        {
            $match: {
                sender: userId,
                group: undefined
            }
        }, {
            $group: {
                _id: "$receivers.id",
                receivers: {
                    $first: "$receivers"
                },
                realId: {
                    $first: "$_id"
                },
                sender: {
                    $first: "$sender"
                },
                content: {
                    $first: "$content"
                },
                createdAt: {
                    $first: "$createdAt"
                },
                read: {
                    $first: "$read"
                }
            }
        }
        ])
        if (sentMessages.length > 0 && receivedMessages.length > 0) {
            soltedMessages = removeDuplicateDiscussions(sentMessages, receivedMessages)
        }

        for (const message of receivedMessages) {
            latestMessages.push(message)
        }

        for (const message of sentMessages) {
            latestMessages.push(message)
        }

        return latestMessages.sort((a, b) => {
            if (a.createdAt > b.createdAt) return -1;
            if (a.createdAt < b.createdAt) return 1;
            return 0;
        })
    } catch (error) {
        // handle this
        return error
    }
}

const fs = require('fs')
const sharp = require('sharp')

module.exports.resizeImage = function resize(path, format, width, height) {
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
module.exports.addAttachmentMediaPaths = (quizes, removeRightChoice = false) => {
    for (const i in quizes) {
        for (const k in quizes[i].questions) {
            if (quizes[i].questions[k].options) {
                for (const j in quizes[i].questions[k].options.choices) {
                    if (quizes[i].questions[k].options.choices[j].src) {
                        if (!quizes[i].questions[k].options.choices[j].src.includes('http')) {
                            quizes[i].questions[k].options.choices[j].src = `http://${process.env.HOST}${process.env.BASE_PATH}/quiz/${quizes[i]._id}/attachment/${quizes[i].questions[k].options.choices[j].src}`
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
module.exports.addQuizUsages = async (quizes) => {
    for (const i in quizes) {
        const usages = await this.countDocuments(this.Quiz_submission, {
            quiz: quizes[i]._id
        })
        quizes[i].usage = usages
    }
    return quizes
}

// add the course to which the quiz is attached
module.exports.addAttachedCourse = async (quizes) => {
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
module.exports.injectChapters = async (courses) => {
    for (const i in courses) {
        courses[i].assignmentsLength = 0
        // add course cover picture media path
        if (courses[i].cover_picture && !courses[i].cover_picture.includes('http')) {
            courses[i].cover_picture = `http://${process.env.HOST}${process.env.BASE_PATH}/course/${courses[i].name}/cover_picture/${courses[i].cover_picture}`
        }
        let chapters = await this.findDocuments(this.Chapter, {
            course: courses[i]._id
        })
        // simplify 
        courses[i].chapters = this.simplifyObject(chapters.data)
        for (const k in courses[i].chapters) {
            // remove course and documentVersion
            courses[i].chapters[k].course = undefined
            courses[i].chapters[k].__v = undefined

            // add media path of the content
            courses[i].chapters[k].document = `http://${process.env.HOST}${process.env.BASE_PATH}/chapter/${courses[i].chapters[k]._id}/document`
            // add media path of the video
            if (courses[i].chapters[k].uploaded_video) {
                courses[i].chapters[k].uploaded_video = `http://${process.env.HOST}${process.env.BASE_PATH}/chapter/${courses[i].chapters[k]._id}/video/${courses[i].chapters[k].uploaded_video}`
            }

            for (const l in courses[i].chapters[k].attachments) {
                courses[i].chapters[k].attachments[l].download_link = `http://${process.env.HOST}${process.env.BASE_PATH}/chapter/${courses[i].chapters[k]._id}/attachment/${courses[i].chapters[k].attachments[l].src}/download`
            }

            // add assignments attached to chapters
            const chapterQuiz = await this.findDocuments(this.Quiz, {
                "target.type": "chapter",
                "target.id": courses[i].chapters[k]._id
            })
            courses[i].chapters[k].quiz = chapterQuiz.data
            courses[i].assignmentsLength += chapterQuiz.data.length
        }

        // add assignments attached to course
        const courseQuiz = await this.findDocuments(this.Quiz, {
            "target.type": 'course',
            "target.id": courses[i]._id
        })
        courses[i].quiz = courseQuiz.data
        courses[i].assignmentsLength += courseQuiz.data.length

        // add the students that started the course
        courses[i].attendedStudents = await this.countDocuments(this.User_progress, {
            course: courses[i]._id
        })
    }
    return courses
}

// replace user id by the user information
module.exports.injectUser = async (array, property, newProperty) => {

    let name = newProperty ? newProperty : property
    for (const i in array) {
        const user = await this.findDocument(this.User, {
            _id: array[i][`${property}`]
        })
        array[i][`${name}`] = this._.pick(user.data, ['_id', 'sur_name', 'other_names', 'user_name', 'gender', 'phone', "profile", "category"])
        if (array[i][`${name}`].profile) {
            array[i][`${name}`].profile = `http://${process.env.HOST}${process.env.BASE_PATH}/user/${user.data.user_name}/profile/${user.data.profile}`
        }
    }
    return array
}

// remove restrictions in objects
module.exports.simplifyObject = (obj) => {
    return JSON.parse(JSON.stringify(obj))
}

// inject notification
module.exports.injectNotification = async (array) => {
    for (const i in array) {
        for (const k in array[i].notifications) {
            let notification = await this.findDocument(this.Notification, {
                _id: array[i].notifications[k].id
            })
            notification = await this.injectUser(notification, 'user')
            array[i].notifications[k].id = undefined
            array[i].notifications[k].notification = notification
        }
    }
    return array
}

// add student progress
module.exports.injecUserProgress = async (courses, userId) => {
    for (const i in courses) {
        const result = await this.findDocument(this.User_progress, {
            course: courses[i]._id,
            user: userId
        })

        courses[i].progress = result.data ? {
            id: result.data._id,
            progress: result.data.progress,
            dateStarted: result.data.createdAt,
            lastUpdated: result.data.updatedAt
        } : undefined
    }
    return courses
}

module.exports.Search = async (model, search_query, projected_fields, _page, _limit) => {
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

// send resized Image
module.exports.sendResizedImage = async (req, res, path) => {
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

// send video
module.exports.streamVideo = async (req, res, path) => {
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

// generateAuthToken on user login
module.exports.generateAuthToken = async (user) => {
    const ONE_DAY = 60 * 60 * 24
    return this.jwt.sign({
        _id: user._id,
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
        expiresIn: ONE_DAY
    })
}

// decodeAuthToken
module.exports.decodeAuthToken = async ({
    token
}) => {
    return this.jwt.verify(token, this.config.get('auth_key'))
}

// all regex expressions
module.exports.Patterns = {
    promotionPattern: /\b[y][e][a][r][_][0-9]\b/ // work on these regex staff
}

// authentication middlewares
const {
    auth
} = require('../middlewares/auth.middleware')

const {
    admin
} = require('../middlewares/admin.middleware')
const {
    instructor
} = require('../middlewares/instructor.middleware')
const {
    student
} = require('../middlewares/student.middleware')
const {
    superAdmin
} = require('../middlewares/superAdmin.middleware')


module.exports.auth = auth
module.exports._admin = admin
module.exports._superAdmin = superAdmin
module.exports._student = student
module.exports._instructor = instructor

// constant lobal variables
module.exports.default_password = `Kurious@${new Date().getFullYear()}`
module.exports.random_user_name = `user_${Math.round(Math.random() * 1000000)}`

// proper way to define user roles
// proper way to use jwt
// proper way to use config