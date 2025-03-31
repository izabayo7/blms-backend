const socket_io = require('socket.io')
// import modules
const {
    Instructor,
    Student,
    Admin,
    getUnreadMesages,
    getUserChatGroups,
    getPreviousMessages,
    getPreviousMessagesInGroup,
    returnUser,
    Message,
    getLatestMessages,
    ChatGroup,
    formatContacts,
    getConversationMessages,
    formatMessages,
    _
} = require('./imports')

module.exports.listen = (app) => {

    const io = socket_io.listen(app)

    io.on('connection', async (socket) => {
        const id = socket.handshake.query.id
        socket.join(id)

        /**
         * Real chat codes
         */

        // send contacts
        socket.on('request_user_contacts', async () => {
            // get the latest conversations
            const latestMessages = await getLatestMessages(id)

            // format the contacts
            const contacts = await formatContacts(latestMessages, id)

            // send the messages
            socket.emit('receive_user_contacts', { contacts: contacts });
        })

        socket.on('request_conversation', async ({ groupId, contactId, lastMessage }) => {
            // get the messages
            const messages = await getConversationMessages({ userId: id, groupId: groupId, contactId: contactId, lastMessage: lastMessage })

            // format the messages
            const formatedMessages = await formatMessages(messages, id)

            // send the messages
            socket.emit('receive_conversation', { conversation: formatedMessages == [] ? { status: 404, message: "No massage found for these users" } : formatedMessages });

        })


        /**
         * Chat demo codes
         */
        // send userInformation and his / her contacts
        socket.on('request-self-groups-and-contacts', async () => {
            // find the connected user
            user = await returnUser(id)

            // Get contacts ie users in the same college
            const instructors = await Instructor.find({
                _id: {
                    $ne: id
                },
                college: user.college
            }).sort({
                _id: 1
            })
            const students = await Student.find({
                _id: {
                    $ne: id
                },
                college: user.college
            }).sort({
                _id: 1
            })
            const admin = await Admin.findOne({
                _id: {
                    $ne: id
                },
                college: user.college
            }).sort({
                _id: 1
            })
            let contacts = []
            let userName = `${user.surName} ${user.otherNames}`

            if (admin) {
                // add admin
                contacts.push({
                    userName: `${admin.surName} ${admin.otherNames}`,
                    id: admin._id
                })
            }

            if (instructors.length > 0) {
                // add instructors
                for (const i in instructors) {
                    contacts.push({
                        userName: `${instructors[i].surName} ${instructors[i].otherNames}`,
                        id: instructors[i].id
                    })
                }
            }
            if (students.length > 0) {
                // add students
                for (const i in students) {
                    contacts.push({
                        userName: `${students[i].surName} ${students[i].otherNames}`,
                        id: students[i].id
                    })
                }
            }

            const groups = await getUserChatGroups(id)

            // send the sound data
            socket.emit('get-self-groups-and-contacts', {
                userName: userName,
                contacts: contacts,
                groups: groups
            });
        })

        // send all un read messages of the connected user to the connected user
        socket.on('request-unread-messages', async () => {
            // get un read messages
            const unreadMessages = await getUnreadMesages(id)
            // send the messages
            socket.emit('unread-messages', unreadMessages);
        })

        // get previous messages
        socket.on('get-messages', async ({
            users,
            groupId,
            lastMessage
        }) => {
            let messages
            if (groupId) {
                messages = await getPreviousMessagesInGroup(groupId, lastMessage)
            } else {
                messages = await getPreviousMessages(users, lastMessage)
            }
            // send the messages
            socket.emit('previous-messages', messages);
        })

        // send all users
        socket.on('getAllUSers', async () => {
            // Get chats from mongo collection
            const instructors = await Instructor.find().sort({
                _id: 1
            })
            const students = await Student.find().sort({
                _id: 1
            })
            const admin = await Admin.findOne().sort({
                _id: 1
            })
            let users = []

            if (admin) {
                // add admin
                users.push({
                    userName: `${admin.surName} ${admin.otherNames}`,
                    id: admin._id
                })
            }

            if (instructors.length > 0) {
                // add instructors
                for (const i in instructors) {
                    users.push({
                        userName: `${instructors[i].surName} ${instructors[i].otherNames}`,
                        id: instructors[i].id
                    })
                }
            }
            if (students.length > 0) {
                // add students
                for (const i in students) {
                    users.push({
                        userName: `${students[i].surName} ${students[i].otherNames}`,
                        id: students[i].id
                    })
                }
            }
            // send the sound users
            socket.emit('get-users', {
                users: users
            });
        })

        // save and deriver new messages
        socket.on('send-message', async ({
            recipients,
            msg,
            group
        }) => {
            // save the message
            let newDocument = new Message({
                sender: id,
                receivers: recipients,
                content: msg,
                group: group
            })

            const saveDocument = await newDocument.save()

            if (saveDocument) {
                newDocument = JSON.parse(JSON.stringify(newDocument))
                // inject sender Info
                const user = await returnUser(newDocument.sender)

                newDocument.sender = _.pick(user, ['_id', 'surName', 'otherNames', 'phone', 'email', 'category', 'profile'])
                if (user.profile) {
                    newDocument.sender.profile = `http://${process.env.HOST}/kurious/file/${user.category == 'SuperAdmin' ? 'superAdmin' : user.category.toLowerCase()}Profile/${students[i]._id}/${user.profile}`
                }
                
                recipients.forEach(recipient => {
                    // send the message
                    socket.broadcast.to(recipient.id).emit('receive-message', newDocument)
                })
                // send success mesage
                socket.emit('message-sent', saveDocument)
            }
        })

        // tell the sender that the message was received / read and update the document
        socket.on('message_received', async ({
            messageId
        }) => {

            // save the message
            let document = await Message.findOne({
                _id: messageId
            })

            let allRecieversRead = 1

            for (const i in document.receivers) {
                if (document.receivers[i].id == id) {
                    document.receivers[i].read = true
                } else if (!document.receivers[i].read) {
                    allRecieversRead = 0
                }
            }

            if (allRecieversRead) {
                document.read = true
            }
            const updateDocument = await document.save()

            if (updateDocument) {
                socket.broadcast.to(document.sender).emit('message-read', {
                    messageId: document._id,
                    reader: id
                })
            }
        })

        // mark all messages in a coversation as read
        socket.on('all_messages_read', async ({
            sender,
            groupId
        }) => {
            let documents
            // fetch unread messages from the sender
            if (sender) {
                // save the message
                documents = await Message.find({
                    sender: sender,
                    group: undefined,
                    receivers: { $elemMatch: { id: id, read: false } }
                })
            }
            // fetch unread messages in a group
            else {
                documents = await Message.find({
                    group: groupId,
                    receivers: { $elemMatch: { id: id, read: false } }
                })
            }
            for (const i in documents) {
                let allRecieversRead = 1

                for (const k in documents[i].receivers) {
                    if (documents[i].receivers[k].id == id) {
                        documents[i].receivers[k].read = true
                    } else if (!documents[i].receivers[k].read) {
                        allRecieversRead = 0
                    }
                }

                if (allRecieversRead) {
                    documents[i].read = true
                }
                const updateDocument = await documents[i].save()
                if (updateDocument) {
                    socket.broadcast.to(documents[i].sender).emit('message-read', {
                        messageId: documents[i]._id,
                        reader: id
                    })
                    socket.emit('all_read', {
                        sender: sender,
                        group: groupId
                    })
                }
            }
        })

        // tell the recipients that someone is typing
        socket.on('typing', async ({
            recipients
        }) => {

            recipients.forEach(recipient => {
                socket.broadcast.to(recipient.id).emit('typing', id)
            })
        })

        // notify when some one stops writing
        socket.on('typing-over', async ({
            recipients
        }) => {

            recipients.forEach(recipient => {
                socket.broadcast.to(recipient.id).emit('typing-over', id)
            })
        })
        // save and deriver new messages
        socket.on('create-group', async ({
            name,
            description,
            private,
            members
        }) => {
            // save the message
            let newDocument = new ChatGroup({
                name: name,
                description: description,
                private: private,
                members: members,
            })

            const saveDocument = await newDocument.save()

            if (saveDocument) {
                members = members.filter(m => m.id !== id)
                members.forEach(member => {
                    // tell members that they were invited
                    socket.broadcast.to(member.id).emit('invited-in-group', newDocument)
                })
                // send success mesage
                socket.emit('group-created', newDocument)
            }
        })

    });
    return io
}