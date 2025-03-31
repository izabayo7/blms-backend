const socket_io = require('socket.io')
// import modules
const {
    Message,
    getLatestMessages,
    formatContacts,
    getConversationMessages,
    formatMessages,
    injectChapters,
    simplifyObject,
    _,
    u,
    Notification,
    injectUser,
    Course,
    UserNotification,
    injectDoer,
    injectStudentProgress,
    findDocument,
    User,
    Create_or_update_message,
    Chat_group,
    findDocuments,
    validate_message,
    RTCMultiConnectionServer,
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

        RTCMultiConnectionServer.addSocket(socket);

        const user_name = socket.handshake.query.user_name
        const user = await User.findOne({user_name: user_name}).populate('category')
        if (!user) {
            socket.error('user not found')
            return socket.disconnect(true)
        }

        const id = user._id.toString()
        // const id = 'any'

        socket.join(id)

        /**
         * messsage events
         */

        if (user.category.name == "ADMIN") {
            console.log('ready')
            MyEmitter.on(`new_user_in_${user.college}`, (user) => {
                socket.emit('res/users/new', {
                    user
                });
            });

        }
        socket.on('message/contacts', async () => {
            // get the latest conversations
            const latestMessages = await getLatestMessages(id)
            // console.log(latestMessages)
            // format the contacts
            const contacts = await formatContacts(latestMessages, id)
            // send the contacts
            socket.emit('res/message/contacts', {
                contacts: contacts
            });
        })

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
        socket.on('message/create', async ({
                                               receiver,
                                               content
                                           }) => {
            const receiver_type = typeof receiver

            const {error} = validate_message({
                sender: user_name,
                receiver: receiver_type === 'string' ? receiver : receiver.toString(),
                content: content
            })

            if (error) {
                socket.error(error)
                return
            }

            let result = await Create_or_update_message(user_name, receiver, content)

            result = simplifyObject(result)

            // inject sender Info
            let _user = await injectUser([{id: id}], 'id', 'data')
            result.data.sender = _user[0].data
            console.log(result.data)
            if (result.data.group) {
                const group = await findDocument(Chat_group, {_id: result.data.group})
                result.data.group = group.code
            }
            // remove receivers

            result.data.receivers.forEach(reciever => {
                // send the message
                socket.broadcast.to(reciever.id).emit('res/message/new', result.data)
            })

            // send success mesage
            socket.emit('res/message/sent', result.data)

        })

        // notify members after group creation
        socket.on('message/create', async ({
                                               inviter,
                                               group_code
                                           }) => {
            // handle errors
            const group = await findDocument(Chat_group, {code: group_code})
            const message = await findDocument(Message, {group: group._id}, {receivers: 0, _id: 0})

            group.members.forEach(m => {
                // send the message
                socket.broadcast.to(m.id).emit('res/message/new', message)
            })
        })

        // start a new conversation
        socket.on('message/start_conversation', async ({
                                                           conversation_id
                                                       }) => {

            // avoid dupplicate initialisation
            const conversation_found = await getConversationMessages({
                user_id: id,
                conversation_id: conversation_id,
                limit: 1
            })
            if (!conversation_found.length) {

                const user = await findDocument(User, {user_name: conversation_id})

                const content = `This is the begining of conversation between __user__${id} and __user__${user._id}`

                const {error} = validate_message({sender: 'SYSTEM', receiver: conversation_id, content: content})

                if (error) {
                    socket.error(error)
                    return
                }

                const result = await Create_or_update_message('SYSTEM', conversation_id.toLowerCase(), content, u, id)
                socket.broadcast.to(user._id).emit('res/message/new', result.data)
            }

            // send success mesage
            socket.emit('res/message/conversation_created', conversation_id)
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
                    sender: sender._id,
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
                socket.broadcast.to(receiver.id).emit('res/message/typing', user_name, chat_group ? conversation_id : u)
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


            // let result = await createDocument(Comment, comment)
            let result = new Comment(comment);

            result = await injectUser([result], 'sender')
            result = result[0]

            receivers.forEach(receiver => {
                socket.broadcast.to(receiver.id).emit('comment/new', result)
            })

            // send success mesage
            socket.emit('res/comment/new', result)
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
            course = await injectUser(course, 'instructor')
            course = course[0]

            let newDocument = new Notification({
                doer_type: "User",
                doer_id: id,
                content: `published ${course.name}`,
                link: `/courses/preview/${course.name}`,
            })
            const saveDocument = await newDocument.save()
            if (saveDocument) {

                newDocument = simplifyObject(newDocument)

                newDocument = await injectDoer(newDocument)

                const studentFaucultyCollegeYears = await StudentFacultyCollegeYear.find({
                    facultyCollegeYear: course.facultyCollegeYear
                })

                studentFaucultyCollegeYears.forEach(async _doc => {

                    // create notification for user
                    let userNotification = await UserNotification.findOne({
                        user_id: _doc.student
                    })
                    if (!userNotification) {
                        userNotification = new UserNotification({
                            user_id: _doc.student,
                            notifications: [{
                                id: newDocument._id
                            }]
                        })

                    } else {
                        userNotification.notifications.push({
                            id: newDocument._id
                        })
                    }

                    _newDocument = await userNotification.save()

                    if (_newDocument) {
                        let notification = simplifyObject(_newDocument.notifications[_newDocument.notifications.length - 1])
                        notification.id = undefined
                        notification.notification = newDocument
                        // send the notification
                        socket.broadcast.to(_doc.student).emit('new-notification', {
                            notification: notification
                        })

                        // add student progress
                        const _course = await injectStudentProgress([course], _doc.student)

                        // send the course
                        socket.broadcast.to(_doc.student).emit('new-course', _course[0])
                    }
                })
            }

        })
    });
    return io
}
