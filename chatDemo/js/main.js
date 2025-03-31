const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const userName = document.getElementById('user-name');
const contactsList = document.getElementById('contacts');
let recipient = {}
let userContacts = []
let allMessages = []
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

// get essential details
socket.emit('request-self-and-contacts');
socket.emit('request-unread-messages');

// Get userName and contacts
socket.on('get-self-and-contacts', ({
  userName,
  contacts
}) => {
  for (const i in contacts) {
    contacts[i].unreadMessages = 0
  }
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

// recieve previous messages
socket.on('previous-messages', (messages) => {
  for (const i in messages) {
    if (!findMessage(messages[i]._id)) {
      allMessages.push(messages[i])
      outputMessage(messages[i])
    }
  }
  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message from server
socket.on('receive-message', (message) => {
  let index = 0
    for (const i in userContacts) {
      if (message.sender == userContacts[i].id && message.sender != recipient.id) {
        userContacts[i].unreadMessages += 1
        index = i
      }
    }

  allMessages.push(message)

  // display the message if we are discussing with the sender
  if (recipient.id == message.sender) {
    outputMessage(message)
    socket.emit("message_received", {
      reader: user,
      messageId: message._id
    });
  }

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
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
  let index = 0

  for (const i in userContacts) {
    if (userContacts[i].id == typer) {
      index = i
    }
  }

  contactsList.childNodes[index].innerHTML = userContacts[index].userName + ' is typing'
});

// Someone typing to me
socket.on('typing-over', (typer) => {
  let index = 0

  for (const i in userContacts) {
    if (userContacts[i].id == typer) {
      index = i
    }
  }

  contactsList.childNodes[index].innerHTML = `${userContacts[index].userName} ${userContacts[index].unreadMessages ? userContacts[index].unreadMessages + '_unread' : ''}`
});

// get the unread messages and then display the contacts (so that we know the number of un read messages for each contact)
socket.on('unread-messages', (messages) => {
  for (const message of messages) {
    for (const i in userContacts) {
      if (message.sender == userContacts[i].id) {
        userContacts[i].unreadMessages += 1
      }

    }
  }
  outputContacts(userContacts);
});

// decrease unread messages
socket.on('unread_decreased', ({
  sender
}) => {

  let index = 0
  for (const i in userContacts) {
    if (sender == userContacts[i].id) {
      userContacts[i].unreadMessages -= 1
      index = i
    }

  }
  contactsList.childNodes[index].innerHTML = `${userContacts[index].userName} ${userContacts[index].unreadMessages ? userContacts[index].unreadMessages + '_unread' : ''}`
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
    recipients: [{
      id: recipient.id
    }],
    msg: msg
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

function findRelevantMessages(userId) {
  let foundMessages = []
  for (const message of allMessages) {
    if (message.sender == user || message.sender == userId) {
      for (const receiver of message.receivers) {
        if (receiver.id == userId || receiver.id == user) {
          foundMessages.push(message)
        }
      }
    }
  }
  return foundMessages
}

function changeActiveConversation(userId) {
  // fetch previousMessages
  socket.emit("all_messages_read", {
    receiver: user,
    sender: recipient.id
  });
  socket.emit('get-messages', {
    users: [user, recipient.id]
  });
  const messages = findRelevantMessages(userId)
  if (messages.length < 1) {
    chatMessages.innerHTML = `You havent started a conversation between you and ${findContactName(userId)}`
  } else {
    chatMessages.innerHTML = ''
    for (const message of messages) {
      outputMessage(message)
    }
  }
}

var typing = false;
var timeout = undefined;

function timeoutFunction() {
  typing = false;
  socket.emit('typing-over', {
    recipients: [{
      id: recipient.id
    }],
    typer: user
  });
}

document.getElementById('msg').addEventListener('keydown', () => {
  if (typing == false) {
    typing = true
    socket.emit('typing', {
      recipients: [{
        id: recipient.id
      }],
      typer: user
    });
    timeout = setTimeout(timeoutFunction, 5000);
  } else {
    clearTimeout(timeout);
    timeout = setTimeout(timeoutFunction, 5000);
  }
})