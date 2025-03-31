const chatForm = document.getElementById('chat-form');
const chatFormContainer = document.querySelector('.chat-form-container')
const createGroupForm = document.getElementById('new-group-form')
const chatMessages = document.querySelector('.chat-messages');
const userName = document.getElementById('user-name');
const members = document.getElementById('members');
const createGroupButton = document.getElementById('new-group');
const contactsList = document.getElementById('contacts');
const groupsList = document.getElementById('groups');

let recipient = {}
let userContacts = []
let allMessages = []
let allGroups = []
// Get username and room from URL
const {
  user  
} = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

// Connect to socket.io
var socket = io.connect('/', {
  query: {
    id: user
  }
});


// get essential description
socket.emit('request-self-groups-and-contacts');
socket.emit('request-unread-messages');

/************************************************************* */

// get contacts new style
socket.emit('request_user_contacts');

// Get contacts new style
socket.on('receive_user_contacts', ({
  contacts,
}) => {
  console.log(contacts)
});

// get messages new style
socket.emit('request_conversation',{ contactId: '5f53da54d143be03eb33291e'});

// Get messages new style
socket.on('receive_conversation', ({
  conversation,
}) => {
  console.log(conversation)
});

/************************************************************* */

// Get userName and contacts
socket.on('get-self-groups-and-contacts', ({
  userName,
  contacts,
  groups
}) => {
  for (const i in contacts) {
    contacts[i].unreadMessages = 0
  }

  for (const i in groups) {
    groups[i].unreadMessages = 0
  }

  allGroups = groups
  userContacts = contacts
  outputUser(userName);
});

function findMessage(id) {
  for (const i in allMessages) {
    if (allMessages[i]._id == id) {
      return true
    }
  }
  return false
}

// receive previous messages
socket.on('previous-messages', (messages) => {
  // add the messages
  for (const i in messages) {
    allMessages.push(messages[i])
  }
  showMessages()
});

// Message from server
socket.on('receive-message', (message) => {

  allMessages.push(message)

  // display the message if we are discussing with the sender
  if (recipient.id == message.sender || recipient.id == message.group) {
    outputMessage(message)
    socket.emit("message_received", {
      messageId: message._id
    });
  } else {
    if (message.group) {
      for (const i in allGroups) {
        if (message.group == allGroups[i]._id) {
          allGroups[i].unreadMessages += 1
          groupsList.childNodes[i].innerHTML = `${allGroups[i].name} ${allGroups[i].unreadMessages}`
        }
      }
    }
    // for groups
    else {
      for (const i in userContacts) {
        if (message.sender == userContacts[i].id) {
          userContacts[i].unreadMessages += 1
          contactsList.childNodes[i].innerHTML = `${userContacts[i].userName} ${userContacts[i].unreadMessages}`
        }

      }
    }
  }

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// show a user that he was invited
socket.on('invited-in-group', (group) => {
  group.name += ' new'
  allGroups.push(group)

  outputGroups(allGroups)
});

// tell the group creator that it succeeded
socket.on('group-created', (group) => {
  group.name += ' new'
  allGroups.push(group)

  outputGroups(allGroups)
});

// show that message was read (currently just console handle it in ui)
socket.on('message-read', ({
  messageId,
  reader
}) => {
  for (const i in userContacts) {
    if (reader == userContacts[i].id) {
      console.log(`message ${messageId} was read by ${userContacts[i].userName}`)
    }
  }
});

// Message from server
socket.on('message-sent', (message) => {

  allMessages.push(message)
  outputMessage(message)

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Someone typing to me
socket.on('typing', (typer) => {
  for (const i in userContacts) {
    if (userContacts[i].id == typer) {
      contactsList.childNodes[i].innerHTML = userContacts[i].userName + ' is typing'
      break
    }
  }
});

// Someone typing to me
socket.on('typing-over', (typer) => {
  for (const i in userContacts) {
    if (userContacts[i].id == typer) {
      contactsList.childNodes[i].innerHTML = `${userContacts[i].userName} ${userContacts[i].unreadMessages ? userContacts[i].unreadMessages + '_unread' : ''}`
      break
    }
  }
});

// get the unread messages and then display the contacts (so that we know the number of un read messages for each contact)
socket.on('unread-messages', (messages) => {
  for (const message of messages) {
    // for one to one disscussion
    if (message.receivers.length < 2) {
      for (const i in userContacts) {
        if (message.sender == userContacts[i].id) {
          userContacts[i].unreadMessages += 1
        }
      }
    }
    // for groups
    else {
      for (const i in allGroups) {
        if (message.group == allGroups[i]._id) {
          allGroups[i].unreadMessages += 1
        }

      }
    }
  }
  outputContacts(userContacts);
  outputGroups(allGroups);
  allMessages = messages
});

// decrease unread messages
socket.on('all_read', ({
  sender,
  group
}) => {
  // for one to one disscussion
  if (sender) {
    for (const i in userContacts) {
      if (sender == userContacts[i].id) {
        userContacts[i].unreadMessages = 0
        contactsList.childNodes[i].innerHTML = userContacts[i].userName
      }

    }
  }
  // for groups
  else {
    for (const i in allGroups) {
      if (group == allGroups[i]._id) {
        allGroups[i].unreadMessages = 0
        groupsList.childNodes[i].innerHTML = allGroups[i].name
      }
    }
  }
});

// Message submit
chatForm.addEventListener('submit', e => {
  e.preventDefault();

  // Get message text
  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg) {
    return false;
  }

  // Emit message to server
  socket.emit('send-message', {
    recipients: recipient.userName ? [{
      id: recipient.id
    }] : returnRecipients(recipient.id),
    msg: msg,
    group: findGroup(recipient.id) ? recipient.id : undefined
  });

  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

function findContactName(id) {
  for (const contact of userContacts) {
    if (contact.id == id) {
      return contact.userName
    }
  }
}

function showMessages() {
  const Id = recipient.id
  const messages = computeActiveMessages(Id)
  // clear the messages container
  chatMessages.innerHTML = ''
  // tell that there are no conversations
  if (messages.length < 1) {
    // for group
    if (recipient.name) {
      chatMessages.innerHTML = `There are no messages in ${recipient.name}`
    }
    // for one to one chat
    else {
      chatMessages.innerHTML = `You havent started a conversation between you and ${recipient.userName}`
    }

  }
  // display the messages
  else {
    for (const i in messages) {
      if (!findMessage(messages[i]._id)) {
        allMessages.push(messages[i])
      }
      outputMessage(messages[i])
    }
  }
  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = user == message.sender ? 'Me' : findContactName(message.sender);
  let time = message.createdAt
  time = time.split('T')[1].split(':')
  time.splice(2, 1)
  time = time.join(':')
  p.innerHTML += ` <span>${time}</span>`;
  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.content;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}

// Add user name to DOM
function outputUser(room) {
  userName.innerText = room;
}

// Add contacts to DOM
function outputContacts(contacts) {
  contactsList.innerHTML = '';
  contacts.forEach(user => {
    const li = document.createElement('li');
    li.addEventListener('click', () => {
      recipient = user

      const lastActive = document.querySelector('.active-recipient')
      if (lastActive) {
        lastActive.className = lastActive.className.replace('active-recipient', '')
      }
      li.className = 'active-recipient'
      changeActiveConversation(user.id)
    })
    li.innerText = `${user.userName} ${user.unreadMessages ? user.unreadMessages + '_unread' : ''}`;
    contactsList.appendChild(li);
  });
  contactsList.childNodes[0].click()
}

// Add groups to DOM
function outputGroups(groups) {
  groupsList.innerHTML = '';
  groups.forEach(group => {
    const li = document.createElement('li');
    li.addEventListener('click', () => {
      recipient = { id: group._id, name: group.name }

      const lastActive = document.querySelector('.active-recipient')
      if (lastActive) {
        lastActive.className = lastActive.className.replace('active-recipient', '')
      }
      li.className = 'active-recipient'
      changeActiveConversation(group._id)
    })
    li.innerText = `${group.name} ${group.unreadMessages ? group.unreadMessages + '_unread' : ''}`;
    groupsList.appendChild(li);
  });
}

function findRelevantMessages(Id) {
  let foundMessages = []
  for (const message of allMessages) {
    if (message.sender == user || message.sender == Id) {
      for (const receiver of message.receivers) {
        if (receiver.id == Id || receiver.id == user) {
          foundMessages.push(message)
        }
      }
    }
  }
  return foundMessages
}

function computeActiveMessages(Id) {
  let messages = []
  if (findGroup(Id)) {
    messages = allMessages.filter(el => el.group == Id)
  } else {
    for (const i in allMessages) {
      if (!allMessages[i].group) {
        for (const receiver of allMessages[i].receivers) {
          if (receiver.id == Id && allMessages[i].sender == user) {
            messages.push(allMessages[i])
          } else if (allMessages[i].sender == Id && receiver.id == user) {
            messages.push(allMessages[i])
          }
        }
      }
    }
  }
  if (messages.length < 1)
    return messages

  return messages.sort((a, b) => {
    if (a._id < b._id) return -1;
    if (a._id > a._id) return 1;
    return 0;
  })
}

// get the oldest message we have in the conversation we want to open
function getLastMessage(Id) {
  const oldestMessage = computeActiveMessages(Id)[0]
  return oldestMessage ? oldestMessage._id : undefined
}

function changeActiveConversation(Id) {
  // send the latest message you have for less data requests
  if (findGroup(Id)) {
    // fetch previousMessages
    socket.emit("all_messages_read", {
      groupId: Id
    });
    socket.emit('get-messages', {
      groupId: Id,
      lastMessage: getLastMessage(Id)
    });
  } else {
    // fetch previousMessages
    socket.emit("all_messages_read", {
      sender: recipient.id
    });
    socket.emit('get-messages', {
      users: [user, recipient.id],
      lastMessage: getLastMessage(Id)
    });
  }
}

var typing = false;
var timeout = undefined;

function timeoutFunction() {
  typing = false;
  socket.emit('typing-over', {
    recipients: [{
      id: recipient.id
    }]
  });
}

document.getElementById('msg').addEventListener('keydown', () => {
  if (typing == false) {
    typing = true
    socket.emit('typing', {
      recipients: [{
        id: recipient.id
      }]
    });
    timeout = setTimeout(timeoutFunction, 5000);
  } else {
    clearTimeout(timeout);
    timeout = setTimeout(timeoutFunction, 5000);
  }
})

createGroupButton.addEventListener('click', () => {
  userContacts.forEach(contact => {
    const option = document.createElement('option');
    option.value = contact.id
    option.innerText = `${contact.userName}`;
    members.appendChild(option);
  });
  createGroupButton.hidden = true
  document.querySelector('.new-group').hidden = false
  document.querySelector('.chat-messages').hidden = true
  chatFormContainer.hidden = true
})

// Message submit
createGroupForm.addEventListener('submit', e => {
  e.preventDefault();

  // Get group name
  let name = e.target.elements.group_name.value;

  // Get group description
  let description = e.target.elements.group_description.value;

  // Get group privacy
  let private = e.target.elements.private.checked;

  // Get group privacy
  let members = e.target.elements.members;

  let selectedMembers = []

  selectedMembers.push({
    id: user
  })

  for (i = 0; i < members.options.length; i++) {
    if (members.options[i].selected == true) {
      selectedMembers.push({
        id: members.options[i].value
      })
    }
  }

  // Emit message to server
  socket.emit('create-group', {
    name: name,
    description: description,
    private: private,
    members: selectedMembers
  });

  cancelGroupCreation()
});

function cancelGroupCreation() {
  // Clear input
  createGroupForm.elements.group_name.value = '';

  createGroupForm.elements.group_description.value = '';

  createGroupForm.elements.private.checked = false;

  createGroupForm.elements.members.innerHTML = '';

  document.querySelector('.new-group').hidden = true
  document.querySelector('.chat-messages').hidden = false
  createGroupButton.hidden = false
  chatFormContainer.hidden = false
}

document.getElementById('cancelGroupCreation').addEventListener('click', cancelGroupCreation)

// Message from server
socket.on('group-created', (group) => {


  allGroups.push(group)


});

function returnRecipients(groupId) {
  let foundRecipients = []
  for (const group of allGroups) {
    if (group._id == groupId) {
      for (const member of group.members) {
        if (member.id != user) {
          foundRecipients.push({ id: member.id })
        }
      }
    }
  }
  return foundRecipients
}

function findGroupMember(memberId) {
  for (const group of allGroups) {
    for (const member of group.members) {
      if (member.id == memberId) {
        return true
      }
    }
  }
  return false
}

function findGroup(groupId) {
  for (const group of allGroups) {
    if (group._id == groupId) {
      return true
    }
  }
  return false
}