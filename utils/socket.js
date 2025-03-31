const socket_io = require('socket.io')
// import modules
const {
  Instructor,
  Student,
  Admin,
  returnUser,
  Message,
  getLatestMessages,
  ChatGroup,
  formatContacts,
  getConversationMessages,
  formatMessages,
  injectChapters,
  StudentFacultyCollegeYear,
  simplifyObject,
  _,
  u,
  Notification,
  injectUser,
  Course,
  UserNotification,
  injectDoer,
  injectStudentProgress,
  formatResult,
  findDocument,
  User,
  Create_or_update_message,
  Chat_group,
  findDocuments
} = require('./imports')

module.exports.listen = (app) => {

  const io = socket_io.listen(app)

  io.on('connection', async (socket) => {

    const user_name = socket.handshake.query.user_name

    const user = await findDocument(User, { user_name: user_name })
    if (!user) {
      socket.error('user not found')
      socket.disconnect(true)
    }

    const id = user._id.toString()

    socket.join(id)

    /**
     * messsage events
     */


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


    // save and deriver new messages
    socket.on('message/create', async ({
      receiver,
      content
    }) => {
      // remember limiting the message***********************************************************
      let result = await Create_or_update_message(user_name, receiver, content)

      result = simplifyObject(result)

      // inject sender Info
      let _user = await injectUser([{ id: id }], 'id', 'data')
      result.data.sender = _user[0].data

      if (result.data.group) {
        const group = await findDocument(Chat_group, { _id: result.data.group })
        result.data.group = group.name
      }

      result.data.receivers.forEach(reciever => {
        // send the message
        socket.broadcast.to(reciever.id).emit('message/new', result.data)
      })

      // send success mesage
      socket.emit('message/sent', result.data)

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
    socket.on('message/all_messages_read', async ({
      conversation_id
    }) => {

      if (!conversation_id) return

      let documents
      const chat_group = await findDocument(Chat_group, { name: conversation_id })

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
        let sender = await findDocument(User, { user_name: conversation_id })
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
        let allRecieversRead = 1

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
      let receivers = []
      const chat_group = await findDocument(Chat_group, { name: conversation_id })
      if (chat_group) {
        for (const i in chat_group.members) {
          if (chat_group.members[i].id != id)
            receivers.push({
              id: chat_group.members[i].id
            })
        }
      }
      else {
        let _receiver = await findDocument(User, { user_name: conversation_id })
        if (_receiver) {
          receivers.push({ id: _receiver._id })
        }
      }
      receivers.forEach(receiver => {
        socket.broadcast.to(receiver.id).emit('message/typing', user_name)
      })
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