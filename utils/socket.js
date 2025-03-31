const socket_io = require('socket.io')
// import modules
const {
    Instructor,
    Student,
    Admin,
    getUnreadMesages,
    getPreviousMessages,
    returnUser,
    Message
} = require('./imports')

module.exports.listen = (app) => {

    const io = socket_io.listen(app)

    io.on('connection', async (socket) => {
        const id = socket.handshake.query.id
        socket.join(id)

        // send userInformation and his / her contacts
        socket.on('request-self-and-contacts', async () => {
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

            // send the sound data
            socket.emit('get-self-and-contacts', {
                userName: userName,
                contacts: contacts
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
            users
        }) => {
            const messages = await getPreviousMessages(users)
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
            msg
        }) => {

            // save the message
            let newDocument = new Message({
                sender: id,
                receivers: recipients,
                content: msg,
            })

            const saveDocument = await newDocument.save()

            if (saveDocument) {
                recipients.forEach(recipient => {
                    const newRecipients = []
                    for (const _recipient of recipients) {
                        if (_recipient !== recipient) {
                            newRecipients.push(_recipient.id)
                        }
                    }
                    newRecipients.push(id)
                    // send the message
                    socket.broadcast.to(recipient.id).emit('receive-message', newDocument)
                })
                // send success mesage
                socket.emit('message-sent', newDocument)
            }
        })

        // tell the sender that the message was recieved / read and update the document
        socket.on('message_received', async ({
            reader,
            messageId
        }) => {

            // save the message
            let document = await Message.findOne({
                _id: messageId
            })

            let allRecieversRead = 1

            for (const i in document.receivers) {
                if (document.receivers[i].id == reader) {
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
                    reader: reader
                })
            }
        })

        // mark all messages in a coversation as read
        socket.on('all_messages_read', async ({
            receiver,
            sender
        }) => {
            // save the message
            let documents = await Message.find({
                sender: sender,
                "receivers.id": receiver,
                read: false
            })
            for (const i in documents) {
                let allRecieversRead = 1

                for (const k in documents[i].receivers) {
                    if (documents[i].receivers[k].id == receiver) {
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
                        reader: receiver
                    })
                    socket.emit('unread_decreased', {
                        sender: sender
                    })
                }
            }
        })

        // tell the recipients that someone is typing
        socket.on('typing', async ({
            recipients,
            typer
        }) => {

            recipients.forEach(recipient => {
                socket.broadcast.to(recipient.id).emit('typing', typer)
            })
        })

        // notify when some one stops writing
        socket.on('typing-over', async ({
            recipients,
            typer
        }) => {

            recipients.forEach(recipient => {
                socket.broadcast.to(recipient.id).emit('typing-over', typer)
            })
        })
    });
    return io
}