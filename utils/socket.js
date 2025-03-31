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
  Notification,
  injectUser,
  Course,
  UserNotification,
  injectDoer,
  injectStudentProgress,
  formatResult
} = require('./imports')

module.exports.listen = (app) => {

  const io = socket_io.listen(app)

  io.on('connection', async (socket) => {

    try {
      const id = socket.handshake.query.id
      socket.join(id)

      /**
       * chat events
       */

      // send contacts
      socket.on('/chat/contacts', async () => {
        // get the latest conversations
        const latestMessages = await getLatestMessages(id)

        console.log(latestMessages)
        // format the contacts
        const contacts = await formatContacts(latestMessages, id)

        // send the contacts
        socket.emit('/response/chat/contacts', {
          contacts: contacts
        });
      })

      socket.on('request_conversation', async ({
        conversation_id,
        lastMessage
      }) => {
        // get the messages
        const messages = await getConversationMessages({
          userId: id,
          conversation_id: conversation_id,
          lastMessage: lastMessage
        })

        // format the messages
        const formatedMessages = await formatMessages(messages, id)

        // send the messages
        socket.emit('receive_conversation', {
          conversation: formatedMessages == [] ? {
            status: 404,
            message: "No massage found for these users"
          } : formatedMessages
        });

      })


      // save and deriver new messages
      socket.on('send-message', async ({
        recipient,
        msg
      }) => {

        let group, recievers = []

        const chat_group = await ChatGroup.findOne({
          _id: recipient
        })
        if (chat_group) {
          group = recipient
          for (const i in chat_group.members) {
            recievers.push({
              id: chat_group.members[i].id
            })
          }
        } else {
          recievers.push({
            id: recipient
          })
        }

        // save the message
        let newDocument = new Message({
          sender: id,
          receivers: recievers,
          content: msg,
          group: group
        })

        const saveDocument = await newDocument.save()

        if (saveDocument) {
          newDocument = simplifyObject(newDocument)
          // inject sender Info
          const user = await returnUser(newDocument.sender)

          newDocument.sender = _.pick(user, ['_id', 'surName', 'otherNames', 'phone', 'email', 'category', 'profile'])
          if (user.profile) {
            newDocument.sender.profile = `http://${process.env.HOST}/kurious/file/${user.category == 'SuperAdmin' ? 'superAdmin' : user.category.toLowerCase()}Profile/${students[i]._id}/${user.profile}`
          }

          recievers.forEach(reciever => {
            // send the message
            socket.broadcast.to(reciever.id).emit('receive-message', newDocument)
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
            receivers: {
              $elemMatch: {
                id: id,
                read: false
              }
            }
          })
        }
        // fetch unread messages in a group
        else {
          documents = await Message.find({
            group: groupId,
            receivers: {
              $elemMatch: {
                id: id,
                read: false
              }
            }
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
        console.log('typing')
        recipients.forEach(recipient => {
          socket.broadcast.to(recipient.id).emit('typing', id)
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
    }
    catch (error) {
      socket.emit('error', formatResult(500, error));
    }
  });
  return io
}