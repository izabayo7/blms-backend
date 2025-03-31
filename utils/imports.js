// modules
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

// models & functions
const {
    SuperAdmin,
    validateSuperAdmin
} = require('../models/superAdmin/superAdmin.model')
const {
    Admin,
    validateAdmin
} = require('../models/admin/admin.model')
const {
    College,
    validateCollege
} = require('../models/college/college.model')
const {
    Instructor,
    validateInstructor
} = require('../models/instructor/instructor.model')
const {
    Student,
    validateStudent
} = require('../models/student/student.model')
const {
    Facility,
    validateFacility
} = require('../models/facility/facility.model')
const {
    facilityCollege,
    validateFacilityCollege
} = require('../models/facility-college/facility-college.model')
const {
    facilityCollegeYear,
    validateFacilityCollegeYear
} = require('../models/facility-college-year/facility-college-year.model')
const {
    CollegeYear,
    validateCollegeYear
} = require('../models/collegeYear/collegeYear.model')
const {
    Course,
    validateCourse
} = require('../models/course/course.model')
const {
    Chapter,
    validateChapter
} = require('../models/chapter/chapter.model')
const {
    Message,
    validateMessage
} = require('../models/message/message.model')
const {
    Attachment,
    validateAttachment
} = require('../models/attachments/attachments.model')
const {
    studentFacilityCollegeYear,
    validateStudentFacilityCollegeYear
} = require('../models/student-facility-college-year/student-facility-college-year.model')
const {
    StudentProgress,
    validateStudentProgress
} = require('../models/studentProgress/studentProgress.model')
const {
    Quiz,
    validateQuiz
} = require('../models/quiz/quiz.model')
const {
    QuizSubmission,
    validateQuizSubmission
} = require('../models/quizSubmission/quizSubmission.model')
const {
    fileFilter
} = require('./multer/fileFilter')
const {
    chatGroup,
    validatechatGroup
} = require('../models/chat-group/chat-group.model')

module.exports.Admin = Admin
module.exports.validateAdmin = validateAdmin
module.exports.SuperAdmin = SuperAdmin
module.exports.validateSuperAdmin = validateSuperAdmin
module.exports.College = College
module.exports.validateCollege = validateCollege
module.exports.Instructor = Instructor
module.exports.validateInstructor = validateInstructor
module.exports.Student = Student
module.exports.validateStudent = validateStudent
module.exports.Facility = Facility
module.exports.validateFacility = validateFacility
module.exports.FacilityCollege = facilityCollege
module.exports.validateFacilityCollege = validateFacilityCollege
module.exports.CollegeYear = CollegeYear
module.exports.validateCollegeYear = validateCollegeYear
module.exports.FacilityCollegeYear = facilityCollegeYear
module.exports.validateFacilityCollegeYear = validateFacilityCollegeYear
module.exports.Course = Course
module.exports.validateCourse = validateCourse
module.exports.Chapter = Chapter
module.exports.validateChapter = validateChapter
module.exports.Message = Message
module.exports.validateMessage = validateMessage
module.exports.Attachment = Attachment
module.exports.validateAttachment = validateAttachment
module.exports.StudentFacilityCollegeYear = studentFacilityCollegeYear
module.exports.validateStudentFacilityCollegeYear = validateStudentFacilityCollegeYear
module.exports.StudentProgress = StudentProgress
module.exports.validateStudentProgress = validateStudentProgress
module.exports.Quiz = Quiz
module.exports.validateQuiz = validateQuiz
module.exports.QuizSubmission = QuizSubmission
module.exports.validateQuizSubmission = validateQuizSubmission
module.exports.fileFilter = fileFilter
module.exports.ChatGroup = chatGroup
module.exports.validatechatGroup = validatechatGroup

module.exports.validateObjectId = (id) => Joi.validate(id, Joi.ObjectId().required())

module.exports.hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(password, salt)
    return hashed
}

module.exports.normaliseDate = (date) => {
    let result = ''
    for (const i in date) {
        if (date[i] !== ':' && date[i] !== '.' && date[i] !== '-') {
            result += date[i]
        }
    }
    return result
}

module.exports.validateUserLogin = (credentials) => {
    const schema = {
        email: Joi.string().email().required(),
        password: Joi.string().min(3).max(255).required()
    }
    return Joi.validate(credentials, schema)
}

module.exports.checkRequirements = async (category, body) => {
    let Users = category === 'SuperAdmin' ? SuperAdmin : category === 'Admin' ? Admin : category === 'Instructor' ? Instructor : Student

    let college = await College.findOne({
        _id: body.college
    })
    if (!college)
        return `College ${body.college} Not Found`
    let user = await Users.findOne({
        email: body.email
    })
    if (user)
        return `${category} with email ${body.email} arleady exist`

    user = await Users.findOne({
        nationalId: body.nationalId
    })
    if (user)
        return `${category} with nationalId ${body.nationalId} arleady exist`

    user = await Users.findOne({
        phone: body.phone
    })
    if (user)
        return `${category} with phone ${body.phone} arleady exist`

    if (category === 'Admin') {
        user = await Users.findOne({
            college: body.college
        })
        if (user)
            return `${category} with college ${body.college} arleady exist`
    }
    return 'alright'
}

module.exports.findDocument = async (model, id) => {
    const document = await model.findOne({
        _id: id
    })
    return document
}

module.exports.getCollege = async (id, type) => {
    let course = type === 'chapter' ? await Course.findOne({
        _id: id
    }) : undefined
    let facilityCollegeYear = await module.exports.FacilityCollegeYear.findOne({
        _id: type === 'chapter' ? course.facilityCollegeYear : id
    })
    if (!facilityCollegeYear)
        return `facilityCollegeYear ${id} Not Found`
    let facilityCollege = await FacilityCollege.findOne({
        _id: facilityCollegeYear.facilityCollege
    })
    return facilityCollege.college
}

module.exports.getCourse = async (id) => {
    let chapter = await Chapter.findOne({
        _id: id
    })
    return chapter.course
}
module.exports.removeDocumentVersion = (obj) => {
    return module.exports._.omit(obj, '__v')
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
module.exports.getConversationMessages = async ({ userId, groupId, contactId, lastMessage }) => {
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

    return { sent: sentMessages, received: receivedMessages }
}

// format contacts
module.exports.formatContacts = async (messages, userId) => {
    let formatedContacts = []
    for (const message of messages) {
        let name = ""
        let image = ''
        let last_message = { time: message.createdAt, content: message.content }
        let unreadMessagesLength = 0
        if (message.group) {
            const group = await chatGroup.findOne({ _id: message.group })
            name = group.name
            image = group.profile ? group.profile : ''
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
            const user = await this.returnUser(message.sender == userId ? message.receivers[0].id : message.sender)
            name = `${user.surName} ${user.otherNames}`
            image = user.profile ? user.profile : ''
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
        formatedContacts.push({
            name: name,
            image: image,
            last_message: last_message,
            unreadMessagesLength: unreadMessagesLength
        })
    }
    return formatedContacts
}

// format messages
module.exports.formatMessages = async (messages, userId) => {
    let messagesCopy = JSON.parse(JSON.stringify(messages))
    let formatedMessages = []
    for (const message of messages) {
        for (const i in messagesCopy) {
            if (message._id == messagesCopy[i]._id) {
                let from = 'Me'
                let matchingMessages = []
                if (message.sender != userId) {
                    const user = await this.returnUser(message.sender == userId ? message.receivers[0].id : message.sender)
                    from = `${user.surName} ${user.otherNames}`
                }
                let relatedMessages = messagesCopy.filter(m => m.sender == message.sender)
                for (const i in relatedMessages) {
                    let diff = (new Date(message.createdAt).getTime() - new Date(relatedMessages[i].createdAt).getTime()) / 1000;
                    diff /= 60;
                    diff = Math.abs(Math.round(diff))
                    if (diff < 1) {
                        matchingMessages.push({ timestamp: relatedMessages[i].createdAt, message: relatedMessages[i].content })
                        messagesCopy.splice(i, 1)
                    }
                }
                formatedMessages.push({
                    from: from,
                    messages: matchingMessages
                })
                break
            }
        }
    }
    return formatedMessages
}

// get latest conversations
module.exports.getLatestMessages = async (userId) => {
    let latestMessages = []
    /** 1 get all latest messages in groups */
    const groups = await module.exports.getUserChatGroups(userId)
    for (const i in groups) {
        const message = await Message.findOne({
            group: groups[i]._id
        }).sort({
            _id: -1
        }).limit(1)
        latestMessages.push(message)
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
    let soltedMessages
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
        if (a.createdAt < a.createdAt) return 1;
        return 0;
    })
}

// find a specific user
module.exports.returnUser = async (id) => {
    let user = await Admin.findOne({
        _id: id
    })
    if (user)
        return user
    user = await Instructor.findOne({
        _id: id
    })
    if (user)
        return user
    user = await Student.findOne({
        _id: id
    })
    if (user)
        return user
    return null
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
const {
    method,
    result
} = require('lodash')

module.exports.auth = auth
module.exports._admin = admin
module.exports._superAdmin = superAdmin
module.exports._student = student
module.exports._instructor = instructor

// constant lobal variables
module.exports.defaulPassword = `Kurious@${new Date().getFullYear()}`