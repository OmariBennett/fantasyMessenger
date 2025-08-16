class ChatApp {
  constructor() {
    this.socket = null;
    this.username = '';
    this.isConnected = false;
    
    this.initializeElements();
    this.attachEventListeners();
  }

  initializeElements() {
    this.usernameInput = document.getElementById('username');
    this.setUsernameButton = document.getElementById('set-username');
    this.messagesContainer = document.getElementById('messages');
    this.chatForm = document.getElementById('chat-form');
    this.messageInput = document.getElementById('message-input');
    this.sendButton = document.getElementById('send-button');
  }

  attachEventListeners() {
    this.setUsernameButton.addEventListener('click', () => this.setUsername());
    this.usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.setUsername();
    });

    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  async setUsername() {
    const username = this.usernameInput.value.trim();
    
    if (!username) {
      this.showSystemMessage('Please enter a character name');
      return;
    }

    if (username.length > 20) {
      this.showSystemMessage('Character name must be 20 characters or less');
      return;
    }

    this.username = username;
    await this.connectToServer();
  }

  async connectToServer() {
    try {
      this.socket = io();
      
      this.socket.on('connect', () => {
        this.isConnected = true;
        this.showSystemMessage(`${this.username} has joined the quest!`);
        this.enableChat();
        
        this.socket.emit('user joined', { username: this.username });
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.showSystemMessage('Connection lost. Attempting to reconnect...');
        this.disableChat();
      });

      this.socket.on('message', (data) => {
        this.displayMessage(data);
      });

      this.socket.on('user joined', (data) => {
        if (data.username !== this.username) {
          this.showSystemMessage(`${data.username} has joined the quest`);
        }
      });

      this.socket.on('user left', (data) => {
        this.showSystemMessage(`${data.username} has left the quest`);
      });

      this.socket.on('connect_error', () => {
        this.showSystemMessage('Failed to connect to server. Please try again.');
      });

    } catch (error) {
      console.error('Connection error:', error);
      this.showSystemMessage('Failed to connect to server');
    }
  }

  sendMessage() {
    const message = this.messageInput.value.trim();
    
    if (!message || !this.isConnected) return;

    const messageData = {
      username: this.username,
      message: message,
      timestamp: new Date().toISOString()
    };

    this.socket.emit('chat message', messageData);
    this.messageInput.value = '';
  }

  displayMessage(data) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${data.username === this.username ? 'user' : 'other'}`;
    
    const senderEl = document.createElement('span');
    senderEl.className = 'message-sender';
    senderEl.textContent = data.username;
    
    const textEl = document.createElement('span');
    textEl.className = 'message-text';
    textEl.textContent = data.message;
    
    messageEl.appendChild(senderEl);
    messageEl.appendChild(textEl);
    
    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }

  showSystemMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message system';
    
    const textEl = document.createElement('span');
    textEl.className = 'message-text';
    textEl.textContent = message;
    
    messageEl.appendChild(textEl);
    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }

  enableChat() {
    this.messageInput.disabled = false;
    this.sendButton.disabled = false;
    this.usernameInput.disabled = true;
    this.setUsernameButton.disabled = true;
    this.messageInput.focus();
  }

  disableChat() {
    this.messageInput.disabled = true;
    this.sendButton.disabled = true;
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ChatApp();
});