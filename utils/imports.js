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
    Faculty,
    validateFaculty
} = require('../models/faculty/faculty.model')
const {
    facultyCollege,
    validateFacultyCollege
} = require('../models/faculty_college/faculty_college.model')
const {
    facultyCollegeYear,
    validateFacultyCollegeYear
} = require('../models/faculty_college_year/faculty_college_year.model')
const {
    CollegeYear,
    validateCollegeYear
} = require('../models/college_year/college_year.model')
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
} = require('../models/attachment/attachment.model')
const {
    studentFacultyCollegeYear,
    validateStudentFacultyCollegeYear
} = require('../models/user_faculty_college_year/user_faculty_college_year.model')
const {
    instructorFacultyCollegeYear,
    validateInstructorFacultyCollegeYear
} = require('../models/instructor-faculty-college-year/instructor-faculty-college-year.model')
const {
    StudentProgress,
    validateStudentProgress
} = require('../models/user_progress/user_progress.model')
const {
    Quiz,
    validateQuiz
} = require('../models/quiz/quiz.model')
const {
    QuizSubmission,
    validateQuizSubmission
} = require('../models/quiz_submission/quiz_submission.model')
const {
    fileFilter
} = require('./multer/fileFilter')
const {
    chatGroup,
    validatechatGroup
} = require('../models/chat_group/chat_group.model')

const {
    Notification,
    validateNotification
} = require('../models/notification/notification.model')

const {
    UserNotification,
    validateUserNotification
} = require('../models/user_notification/user_notification.model')

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
module.exports.Faculty = Faculty
module.exports.validateFaculty = validateFaculty
module.exports.FacultyCollege = facultyCollege
module.exports.validateFacultyCollege = validateFacultyCollege
module.exports.CollegeYear = CollegeYear
module.exports.validateCollegeYear = validateCollegeYear
module.exports.FacultyCollegeYear = facultyCollegeYear
module.exports.validateFacultyCollegeYear = validateFacultyCollegeYear
module.exports.Course = Course
module.exports.validateCourse = validateCourse
module.exports.Chapter = Chapter
module.exports.validateChapter = validateChapter
module.exports.Message = Message
module.exports.validateMessage = validateMessage
module.exports.Attachment = Attachment
module.exports.validateAttachment = validateAttachment
module.exports.StudentFacultyCollegeYear = studentFacultyCollegeYear
module.exports.validateStudentFacultyCollegeYear = validateStudentFacultyCollegeYear
module.exports.InstructorFacultyCollegeYear = instructorFacultyCollegeYear
module.exports.validateInstructorFacultyCollegeYear = validateInstructorFacultyCollegeYear
module.exports.StudentProgress = StudentProgress
module.exports.validateStudentProgress = validateStudentProgress
module.exports.Quiz = Quiz
module.exports.validateQuiz = validateQuiz
module.exports.QuizSubmission = QuizSubmission
module.exports.validateQuizSubmission = validateQuizSubmission
module.exports.fileFilter = fileFilter
module.exports.ChatGroup = chatGroup
module.exports.validatechatGroup = validatechatGroup
module.exports.Notification = Notification
module.exports.validateNotification = validateNotification
module.exports.UserNotification = UserNotification
module.exports.validateUserNotification = validateUserNotification

// validate mongoIds
module.exports.validateObjectId = (id) => Joi.validate(id, Joi.ObjectId().required())

// hash password
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
    let facultyCollegeYear = await this.FacultyCollegeYear.findOne({
        _id: type === 'chapter' ? course.facultyCollegeYear : id
    })
    if (!facultyCollegeYear)
        return `facultyCollegeYear ${id} Not Found`
    let facultyCollege = await this.FacultyCollege.findOne({
        _id: facultyCollegeYear.facultyCollege
    })
    return facultyCollege.college
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
        let id = ''
        let name = ""
        let image = ''
        let last_message = { time: message.createdAt, content: message.content, sender: message.sender }
        let unreadMessagesLength = 0
        if (message.group) {
            const group = await chatGroup.findOne({ _id: message.group })
            id = message.group
            name = group.name
            image = group.profile ? `http://${process.env.HOST}/kurious/file/groupProfilePicture/${group._id}/${group.profile}` : undefined

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
            id = user._id
            name = `${user.surName} ${user.otherNames}`
            image = user.profile ? `http://${process.env.HOST}/kurious/file/${user.category == 'SuperAdmin' ? 'superAdmin' : user.category.toLowerCase()}Profile/${students[i]._id}/${user.profile}` : undefined

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
            id: id,
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
    let messagesCopy = this.simplifyObject(messages)
    let formatedMessages = []
    for (const message of messages) {
        for (const i in messagesCopy) {
            if (message._id == messagesCopy[i]._id) {
                let from = 'Me'
                let image = undefined
                let matchingMessages = []
                if (message.sender != userId) {
                    const user = await this.returnUser(message.sender == userId ? message.receivers[0].id : message.sender)
                    from = `${user.surName} ${user.otherNames}`
                    if (user.profile) {
                        image = `http://${process.env.HOST}/kurious/file/${user.category == 'SuperAdmin' ? 'superAdmin' : user.category.toLowerCase()}Profile/${students[i]._id}/${user.profile}`
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

// find a specific user (remove personal info)
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

// add mediapaths to quiz attachments
module.exports.addAttachmentMediaPaths = (quizes, removeRightChoice = false) => {
    for (const i in quizes) {
        for (const k in quizes[i].questions) {
            if (quizes[i].questions[k].options) {
                for (const j in quizes[i].questions[k].options.choices) {
                    if (quizes[i].questions[k].options.choices[j].src) {
                        if (!quizes[i].questions[k].options.choices[j].src.includes('http')) {
                            quizes[i].questions[k].options.choices[j].src = `http://${process.env.HOST}/kurious/file/quizAttachedFiles/${quizes[i]._id}/${quizes[i].questions[k].options.choices[j].src}`
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
        const usages = await this.QuizSubmission.find({ quiz: quizes[i]._id }).countDocuments()
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
                const chapter = await this.Chapter.findOne({ _id: quizes[i].target.id })
                courseId = chapter.course
            }
            const course = await this.Course.findOne({ _id: courseId })
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
        if (courses[i].coverPicture && !courses[i].coverPicture.includes('http')) {
            courses[i].coverPicture = `http://${process.env.HOST}/kurious/file/courseCoverPicture/${courses[i]._id}/${courses[i].coverPicture}`
        }
        let chapters = await this.Chapter.find({
            course: courses[i]._id
        }).lean()
        courses[i].chapters = chapters
        for (const k in courses[i].chapters) {
            // remove course and documentVersion
            courses[i].chapters[k].course = undefined
            courses[i].chapters[k].__v = undefined

            // add media path of the content
            courses[i].chapters[k].mainDocument = `http://${process.env.HOST}/kurious/file/chapterDocument/${courses[i].chapters[k]._id}`
            // add media path of the video
            if (courses[i].chapters[k].mainVideo) {
                courses[i].chapters[k].mainVideo = `http://${process.env.HOST}/kurious/file/chapterMainVideo/${courses[i].chapters[k]._id}/${courses[i].chapters[k].mainVideo}`
            }
            // add attachments
            const attachments = await this.Attachment.find({
                chapter: courses[i].chapters[k]._id
            })
            courses[i].chapters[k].attachments = attachments

            // add assignments attached to chapters
            const chapterQuiz = await this.Quiz.find({
                "target.type": "chapter",
                "target.id": courses[i].chapters[k]._id
            })
            courses[i].chapters[k].quiz = chapterQuiz
            courses[i].assignmentsLength += chapterQuiz.length
        }

        // add assignments attached to course
        const courseQuiz = await this.Quiz.find({
            "target.type": 'course',
            "target.id": courses[i]._id
        })
        courses[i].quiz = courseQuiz
        courses[i].assignmentsLength += courseQuiz.length

        // add the students that started the course
        courses[i].attendedStudents = await this.StudentProgress.find({
            course: courses[i]._id
        }).countDocuments()
    }
    return courses
}

// replace user id by the user information
module.exports.injectUser = async (array, property, newProperty) => {
    let name = newProperty ? newProperty : property
    for (const i in array) {
        const user = await this.returnUser(array[i][`${property}`])

        array[i][`${name}`] = this._.pick(user, ['_id', 'surName', 'otherNames', 'gender', 'phone', "profile"])
        if (array[i][`${name}`].profile) {
            array[i][`${name}`].profile = `http://${process.env.HOST}/kurious/file/instructorProfile/${user._id}/${user.profile}`
        }
    }
    return array
}

// remove restrictions in objects
module.exports.simplifyObject = (obj) => {
    return JSON.parse(JSON.stringify(obj))
}

// add doer information to a notification
module.exports.injectDoer = async (notification) => {
    notification = await this.injectUser([notification], 'doer_id')
    notification = notification[0]
    notification.doer = notification.doer_id
    notification.doer_id = undefined
    return notification
}

// inject notification
module.exports.injectNotification = async (array) => {
    for (const i in array) {
        for (const k in array[i].notifications) {
            let notification = await this.Notification.findOne({ _id: array[i].notifications[k].id }).lean()
            notification = await this.injectDoer(notification)
            array[i].notifications[k].id = undefined
            array[i].notifications[k].notification = notification
        }
    }
    return array
}

// add student progress
module.exports.injectStudentProgress = async (courses, studentId) => {
    for (const i in courses) {
        const studentProgress = await StudentProgress.findOne({
            course: courses[i]._id, student: studentId
        })

        courses[i].progress = studentProgress ? { id: studentProgress._id, progress: studentProgress.progress, dateStarted: studentProgress.createdAt, lastUpdated: studentProgress.updatedAt } : undefined
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
        return { data: results }
    } catch (e) {
        return { error: e.message }
    }
}

// send resized Image
module.exports.sendResizedImage = async (req, res, path) => {
    this.fs.exists(path, (exists) => {
        if (!exists) {
            return res.status(404).send(`${req.params.file_name} was not found`)
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
            res.sendStatus(404);
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
module.exports.generateAuthToken = async ({ user }) => {
    const ONE_DAY = 60 * 60 * 24
    return this.jwt.sign({
        _id: user._id,
        sur_name: user.sur_name,
        other_names: user.other_names,
        national_id: user.national_id,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        phone: user.phone,
        email: user.email,
        password: user.password,
        category: user.category,
        roles: user.roles,
        college: user.college,
        profile: user.profile,
    }, this.config.get('auth_key'), {
        expiresIn: ONE_DAY
    })
}

// decodeAuthToken
module.exports.decodeAuthToken = async ({ token }) => {
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
module.exports.defaulPassword = `Kurious@${new Date().getFullYear()}`

// proper way to define user roles
// proper way to use jwt
// proper way to use config