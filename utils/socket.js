const socket_io = require('socket.io')
const {countDocuments} = require("./imports");
const {User_attendance} = require("../models/user_attendance/user_attendance.model");
const {autoMarkSelectionQuestions} = require("./imports");
const {Quiz_submission} = require("./imports");
const {User_notification} = require("./imports");
const {User_user_group} = require("../models/user_user_group/user_user_group.model");
// import modules
const {
    Message,
    getLatestMessages,
    formatContacts,
    getConversationMessages,
    formatMessages,
    injectChapters,
    replaceUserIds,
    simplifyObject,
    makeCode,
    jwt,
    config,
    _,
    u,
    Comment,
    Notification,
    injectUser,
    Course,
    UserNotification,
    injectDoer,
    injectUserProgress,
    findDocument,
    User,
    Create_or_update_message,
    Chat_group,
    findDocuments,
    validate_message,
    validate_comment,
    Chapter,
    formatResult,
    createDocument,
    Live_session,
    MyEmitter
} = require('./imports')

module.exports.listen = (app) => {

    const io = socket_io.listen(app)

    io.on('connection', async (socket) => {

        let user

        const token = socket.handshake.query.token
        try {
            const decoded = jwt.verify(token, config.get('auth_key'))
            user = await User.findOne({user_name: decoded.user_name}).populate('category')
        } catch (e) {
            socket.error('invalid token')
            return socket.disconnect(true)
        }

        const id = user._id.toString()
        // const id = 'any'

        socket.join(id)

        /**
         * messsage events
         */

        MyEmitter.on('socket_event', async ({name, data}) => {
            if (user.category.name === "ADMIN") {
                if (name === `new_user_in_${user.college}`)
                    socket.emit('res/users/new', {
                        data
                    });
                else if (name === `user_limit_reached_${user.college}`)
                    socket.emit('user_limit_reached');
            } else if (user.category.name === "INSTRUCTOR")
                if (name === `upcoming_livesession_${user._id}`) {
                    const {user_group, isLive, liveId} = data
                    let newDocument = new Notification(isLive ? {
                            link: `/live/${liveId}`,
                            content: "Live session just started"
                        } : {
                            content: "you have a live class in 5 minutes",
                        }
                    )
                    const saveDocument = await newDocument.save()
                    if (saveDocument) {

                        const user_user_groups = await User_user_group.find({
                            user_group: user_group
                        })

                        user_user_groups.forEach(async _doc => {
                            if (_doc.user !== id) {
                                // create notification for user
                                let userNotification = await User_notification.findOne({
                                    user: _doc.user
                                })
                                if (!userNotification) {
                                    userNotification = new User_notification({
                                        user: _doc.user,
                                        notifications: [{
                                            id: newDocument._id
                                        }]
                                    })

                                } else {
                                    userNotification.notifications.push({
                                        id: newDocument._id
                                    })
                                }

                                let _newDocument = await userNotification.save()

                                if (_newDocument) {
                                    let notification = simplifyObject(_newDocument.notifications[_newDocument.notifications.length - 1])
                                    notification.id = undefined
                                    notification.notification = newDocument
                                    // send the notification
                                    socket.broadcast.to(_doc.user).emit('new-notification', {
                                        notification: notification
                                    })
                                }
                            }
                        })

                    }

                }

            if (name === `join_group_${id}`) {
                const contacts = await formatContacts([data])
                socket.emit('res/message/contacts/new', {contact: contacts[0], redirect: data.content.includes(id)})
            }

        })

        if (user.category.name === "ADMIN") {
            socket.on("users/recentlyJoined", async () => {
                const res = await User.find({
                    college: user.college,
                    "status.deleted": {$ne: 1}
                }, {
                    sur_name: 1,
                    other_names: 1,
                    category: 1,
                    createdAt: 1
                }).populate('category').limit(3).sort({_id: -1});

                socket.emit('res/users/recentlyJoined', res);
            })
        }

        socket.on('message/contacts', async () => {
            // get the latest conversations
            const latestMessages = await getLatestMessages(id)
            // format the contacts
            const contacts = await formatContacts(latestMessages, id)
            // send the contacts
            socket.emit('res/message/contacts', {
                contacts: contacts
            });
        })

        // socket.on('notifications/updateStatus', async ({
        //     notification_ids,
        //     status
        //                                                }) => {
        //     // get the latest conversations
        //     const latestMessages = await getLatestMessages(id)
        //     // format the contacts
        //     const contacts = await formatContacts(latestMessages, id)
        //     // send the contacts
        //     socket.emit('res/message/contacts', {
        //         contacts: contacts
        //     });
        // })

        socket.on('message/conversation', async ({
                                                     conversation_id,
                                                     lastMessage
                                                 }) => {
            // get the messages
            const messages = await getConversationMessages({
                user_id: id,
                conversation_id: conversation_id,
                lastMessage: lastMessage
            })
            // format the messages
            const formatedMessages = await formatMessages(messages, id)

            // send the messages
            socket.emit('res/message/conversation', {
                conversation: formatedMessages
            });

        })

        // check if conversation_id is valid
        socket.on('message/conversation_id', async ({
                                                        conversation_id
                                                    }) => {

            let conversation_found = false

            if (parseInt(conversation_id)) {
                const group = await findDocument(Chat_group, {
                    code: conversation_id
                })
                if (group && group.code == conversation_id) {
                    conversation_found = true
                }
            } else {
                const user = await findDocument(User, {
                    user_name: conversation_id
                })
                if (user) {
                    conversation_found = true
                }
            }
            socket.emit('res/message/conversation_id', conversation_found);
        })

        // save and deriver new messages
        socket.on('message/notify-users', async ({
                                                     message
                                                 }) => {
            message.receivers.forEach(reciever => {
                // send the message
                socket.broadcast.to(reciever.id).emit('res/message/new', message)
            })
        })

        // save and deriver new messages
        socket.on('message/create', async ({
                                               receiver,
                                               content,
                                               attachments
                                           }) => {
            const receiver_type = typeof receiver

            const {error} = validate_message({
                sender: user.user_name,
                receiver: receiver_type === 'string' ? receiver : receiver.toString(),
                content: content,
                attachments
            })

            if (error) {
                socket.error(error)
                return
            }

            let result = await Create_or_update_message(user.user_name, receiver, content,undefined,undefined,attachments)

            result = simplifyObject(result)

            // inject sender Info
            let _user = await injectUser([{id: id}], 'id', 'data')
            result.data.sender = _user[0].data

            if (result.data.group) {
                const group = await findDocument(Chat_group, {_id: result.data.group})
                result.data.group = group.code
            }
            // remove receivers

            if (!result.data.attachments.length)
                result.data.receivers.forEach(reciever => {
                    // send the message
                    socket.broadcast.to(reciever.id).emit('res/message/new', result.data)
                })

            // send success mesage
            socket.emit('res/message/sent', result.data)

        })

        socket.on("messages/unread", async () => {
            const number = await countDocuments(Message, {
                receivers: {
                    $elemMatch: {
                        id: id,
                        read: false
                    }
                }
            })
            socket.emit('res/messages/unread', number);
        })

        // start a new conversation
        socket.on('message/start_conversation', async ({
                                                           conversation_id
                                                       }) => {
            const Receiver = await findDocument(User, {user_name: conversation_id})
            if (Receiver) {
                const content = `This is the begining of conversation between __user__${id} and __user__${Receiver._id}`
                // avoid dupplicate initialisation
                const conversation_found = await Message.findOne({content: content})
                if (!conversation_found) {
                    const {error} = validate_message({sender: 'SYSTEM', receiver: conversation_id, content: content})

                    if (error) {
                        socket.error(error)
                        return
                    }

                    const result = await Create_or_update_message('SYSTEM', conversation_id.toLowerCase(), content, u, id)
                    result.data = await replaceUserIds([result.data], Receiver._id.toString())
                    result.data = await formatContacts(result.data, Receiver._id.toString())
                    socket.broadcast.to(Receiver._id).emit('res/message/contacts/new', {contact: result.data[0]})
                }

                // send success mesage
                socket.emit('res/message/conversation_created', conversation_id)
            }
        })


        // mark all messages in a coversation as read
        socket.on('message/all_messages_read', async ({
                                                          conversation_id
                                                      }) => {

            if (!conversation_id) return

            let documents
            const chat_group = await findDocument(Chat_group, {code: conversation_id})

            // fetch unread messages in a group
            if (chat_group) {
                documents = await findDocuments(Message, {
                    group: chat_group._id,
                    receivers: {
                        $elemMatch: {
                            id: id,
                            read: false
                        }
                    }
                }, u, u, u, false)
            }
            // fetch unread messages from the sender
            else {
                let sender = await findDocument(User, {user_name: conversation_id})
                // save the message
                documents = await findDocuments(Message, {
                    $or: [
                        {sender: "SYSTEM"},
                        {sender: sender._id,}
                    ],
                    group: undefined,
                    receivers: {
                        $elemMatch: {
                            id: id,
                            read: false
                        }
                    }
                }, u, u, u, false)
            }

            for (const i in documents) {
                for (const k in documents[i].receivers) {
                    if (documents[i].receivers[k].id == id) {
                        documents[i].receivers[k].read = true
                    }
                }

                await documents[i].save()

                socket.broadcast.to(documents[i].sender).emit('message-read', {
                    messageId: documents[i]._id,
                    reader: id
                })
            }

            socket.emit('all_read', {
                conversation_id: conversation_id
            })
        })

        // tell that someone is typing
        socket.on('message/typing', async ({
                                               conversation_id
                                           }) => {
            let receivers = [], chat_group
            if (typeof conversation_id !== 'string') {
                chat_group = await findDocument(Chat_group, {code: conversation_id})
                for (const i in chat_group.members) {
                    if (chat_group.members[i].id != id)
                        receivers.push({
                            id: chat_group.members[i].id
                        })
                }
            } else {
                let _receiver = await findDocument(User, {user_name: conversation_id})
                if (_receiver) {
                    receivers.push({id: _receiver._id})
                }
            }
            receivers.forEach(receiver => {
                socket.broadcast.to(receiver.id).emit('res/message/typing', user.user_name, chat_group ? conversation_id : u)
            })
        })


        /**
         * comments
         */

        // add a comment in live_session
        socket.on('comment/new', async ({
                                            comment,
                                            receivers
                                        }) => {
            // set sender as current user
            comment.sender = id

            const {
                error
            } = validate_comment(comment)
            if (error)
                return socket.error(formatResult(400, error.details[0].message))

            comment.target.type = comment.target.type.toLowerCase()

            const allowedTargets = ['live_session']

            if (!allowedTargets.includes(comment.target.type))
                return socket.error(formatResult(400, 'invalid comment target_type'))

            let target

            switch (comment.target.type) {
                case 'live_session':
                    target = await findDocument(Live_session, {
                        _id: comment.target.id
                    })
                    break;

                default:
                    break;
            }

            if (!target)
                return socket.error(formatResult(404, 'comment target not found'))

            let result = await createDocument(Comment, comment)
            result = simplifyObject(result.data);

            result = await injectUser([result], 'sender')
            result = result[0]

            receivers.forEach(receiver => {
                socket.broadcast.to(receiver.id).emit('comment/new', result)
            })

            // send success mesage
            socket.emit('res/comment/new', result)
        })

        // check student attendance
        socket.on('live/checkAttendance', async ({receivers, session_id}) => {

            const live_session = await Live_session.findById(session_id)
            live_session.attendance_check += 1
            await live_session.save()

            // make code
            const code = makeCode(6);

            receivers.forEach(receiver => {
                socket.broadcast.to(receiver.id).emit('res/live/checkAttendance', {code})
            })

        })

        // notify instructor that you are still following
        socket.on('res/live/checkAttendance', async ({receivers, attendance, session_id}) => {

            let user_attendance = await User_attendance.findOne({
                user: id,
                live_session: session_id
            })
            if (user_attendance) {
                user_attendance.attendance += attendance
                await user_attendance.save()
            } else {
                await createDocument(User_attendance, {
                    user: id,
                    live_session: session_id,
                    attendance
                })
            }

            receivers.forEach(receiver => {
                socket.broadcast.to(receiver.id).emit('res/live/studentAnswered', {id, attendance})
            })
        })

        // notify members that quiz is released
        socket.on('live/releaseQuiz', async ({quiz, receivers}) => {

            receivers.forEach(receiver => {
                socket.broadcast.to(receiver.id).emit('live/quizReleased', quiz)
            })

            // send success mesage
            socket.emit('live/quizReleased')
        })

        /**
         * notifications
         */

        // tell students that a new couse was published
        socket.on('course-published', async ({
                                                 courseId
                                             }) => {
            // get the course
            let course = await Course.findOne({
                _id: courseId,
                published: true
            }).lean()

            // add chapters and instructor
            course = await injectChapters([course])
            course = await injectUser(course, 'user')
            course = course[0]

            let newDocument = new Notification({
                user: id,
                content: `published ${course.name}`,
                link: `/courses/preview/${course.name}`,
            })
            const saveDocument = await newDocument.save()
            if (saveDocument) {

                newDocument = simplifyObject(newDocument)

                newDocument = await injectUser([newDocument], 'user')
                newDocument = newDocument[0]

                const user_user_groups = await User_user_group.find({
                    user_group: course.user_group
                })

                user_user_groups.forEach(async _doc => {
                    if (_doc.user != id) {
                        // create notification for user
                        let userNotification = await User_notification.findOne({
                            user: _doc.user
                        })
                        if (!userNotification) {
                            userNotification = new User_notification({
                                user: _doc.user,
                                notifications: [{
                                    id: newDocument._id
                                }]
                            })

                        } else {
                            userNotification.notifications.push({
                                id: newDocument._id
                            })
                        }

                        let _newDocument = await userNotification.save()

                        if (_newDocument) {
                            let notification = simplifyObject(_newDocument.notifications[_newDocument.notifications.length - 1])
                            notification.id = undefined
                            notification.notification = newDocument
                            // send the notification
                            socket.broadcast.to(_doc.user).emit('new-notification', {
                                notification: notification
                            })

                            // add student progress
                            const _course = await injectUserProgress([course], _doc.user)

                            // send the course
                            socket.broadcast.to(_doc.user).emit('new-course', _course[0])
                        }
                    }
                })
            }

        })


        // tell user that someone replied his or her comment
        socket.on('chapter-comment', async ({
                                                userName,
                                                route,
                                                content
                                            }) => {

            let newDocument = new Notification({
                user: id,
                content: content,
                link: route,
            })
            const saveDocument = await newDocument.save()
            if (saveDocument) {

                newDocument = simplifyObject(newDocument)

                newDocument = await injectUser([newDocument], 'user')
                newDocument = newDocument[0]

                const user = await User.findOne({user_name: userName})

                // create notification for user
                let userNotification = await User_notification.findOne({
                    user: user._id
                })
                if (!userNotification) {
                    userNotification = new User_notification({
                        user: user._id,
                        notifications: [{
                            id: newDocument._id
                        }]
                    })

                } else {
                    userNotification.notifications.push({
                        id: newDocument._id
                    })
                }

                let _newDocument = await userNotification.save()

                if (_newDocument) {
                    let notification = simplifyObject(_newDocument.notifications[_newDocument.notifications.length - 1])
                    notification.id = undefined
                    notification.notification = newDocument
                    // send the notification
                    socket.broadcast.to(user._id).emit('new-notification', {
                        notification: notification
                    })
                }
            }

        });

        // tell user that marks were released
        socket.on('marksReleased', async ({
                                              route,
                                              user_group,
                                              content
                                          }) => {

            let newDocument = new Notification({
                user: id,
                content: content,
                link: route,
            })
            const saveDocument = await newDocument.save()
            if (saveDocument) {

                newDocument = simplifyObject(newDocument)

                newDocument = await injectUser([newDocument], 'user')
                newDocument = newDocument[0]

                const user_user_groups = await User_user_group.find({
                    user_group: user_group
                })

                user_user_groups.forEach(async _doc => {
                    if (_doc.user != id) {
                        // create notification for user
                        let userNotification = await User_notification.findOne({
                            user: _doc.user
                        })
                        if (!userNotification) {
                            userNotification = new User_notification({
                                user: _doc.user,
                                notifications: [{
                                    id: newDocument._id
                                }]
                            })

                        } else {
                            userNotification.notifications.push({
                                id: newDocument._id
                            })
                        }

                        let _newDocument = await userNotification.save()

                        if (_newDocument) {
                            let notification = simplifyObject(_newDocument.notifications[_newDocument.notifications.length - 1])
                            notification.id = undefined
                            notification.notification = newDocument
                            // send the notification
                            socket.broadcast.to(_doc.user).emit('new-notification', {
                                notification: notification
                            })
                        }
                    }
                })

            }

        });

        // tell instructor that student submitted
        socket.on('student-submitted', async ({
                                                  userId,
                                                  route,
                                                  content
                                              }) => {

            let newDocument = new Notification({
                user: id,
                content: content,
                link: route,
            })
            const saveDocument = await newDocument.save()
            if (saveDocument) {

                newDocument = simplifyObject(newDocument)

                newDocument = await injectUser([newDocument], 'user')
                newDocument = newDocument[0]

                // create notification for user
                let userNotification = await User_notification.findOne({
                    user: userId
                })
                if (!userNotification) {
                    userNotification = new User_notification({
                        user: userId,
                        notifications: [{
                            id: newDocument._id
                        }]
                    })

                } else {
                    userNotification.notifications.push({
                        id: newDocument._id
                    })
                }

                let _newDocument = await userNotification.save()

                if (_newDocument) {
                    let notification = simplifyObject(_newDocument.notifications[_newDocument.notifications.length - 1])
                    notification.id = undefined
                    notification.notification = newDocument
                    // send the notification
                    socket.broadcast.to(userId).emit('new-notification', {
                        notification: notification
                    })
                }
            }

        });

        // tell users that there is a scheduled live session
        socket.on('live-session', async ({
                                             user_group,
                                             content
                                         }) => {

            let newDocument = new Notification({
                user: id,
                content: content,
            })
            const saveDocument = await newDocument.save()
            if (saveDocument) {

                newDocument = simplifyObject(newDocument)

                newDocument = await injectUser([newDocument], 'user')
                newDocument = newDocument[0]

                const user_user_groups = await User_user_group.find({
                    user_group: user_group
                })

                user_user_groups.forEach(async _doc => {
                    if (_doc.user != id) {
                        // create notification for user
                        let userNotification = await User_notification.findOne({
                            user: _doc.user
                        })
                        if (!userNotification) {
                            userNotification = new User_notification({
                                user: _doc.user,
                                notifications: [{
                                    id: newDocument._id
                                }]
                            })

                        } else {
                            userNotification.notifications.push({
                                id: newDocument._id
                            })
                        }

                        let _newDocument = await userNotification.save()

                        if (_newDocument) {
                            let notification = simplifyObject(_newDocument.notifications[_newDocument.notifications.length - 1])
                            notification.id = undefined
                            notification.notification = newDocument
                            // send the notification
                            socket.broadcast.to(_doc.user).emit('new-notification', {
                                notification: notification
                            })
                        }
                    }
                })

            }

        });

        /**
         * auto save quiz-submission while student is working
         */
        socket.on('start-quiz', async ({
                                           quiz
                                       }) => {

            let newDocument = new Quiz_submission({
                user: id,
                quiz,
                used_time: 0,
                time_started: new Date()
            })
            const saveDocument = await newDocument.save()
            if (saveDocument) {
                socket.emit('start-quiz', saveDocument._id);
            }

        });

        socket.on('save-progress', async ({
                                              index,
                                              submission_id,
                                              attempt,
                                              end,
                                              questions
                                          }) => {

            attempt.user = id

            const {answers, total_marks, is_selection_only} = autoMarkSelectionQuestions(questions, attempt.answers)

            let updateDocument = await Quiz_submission.findByIdAndUpdate(submission_id, end ? {
                answers: answers,
                used_time: attempt.used_time,
                auto_submitted: attempt.auto_submitted,
                total_marks: total_marks,
                marked: is_selection_only,
                time_submitted: new Date()
            } : attempt)
            if (updateDocument) {
                socket.emit('progress-saved', {index, end, is_selection_only});
            }

        });

    });

    return io
}
