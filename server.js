import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('user joined', (data) => {
    const { username } = data;
    connectedUsers.set(socket.id, { username, joinedAt: new Date() });
    
    socket.broadcast.emit('user joined', { username });
    
    console.log(`${username} joined the chat`);
  });

  socket.on('chat message', (data) => {
    const user = connectedUsers.get(socket.id);
    
    if (!user) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    const messageData = {
      id: generateMessageId(),
      username: data.username,
      message: data.message,
      timestamp: new Date().toISOString()
    };

    io.emit('message', messageData);
    
    console.log(`Message from ${data.username}: ${data.message}`);
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    
    if (user) {
      socket.broadcast.emit('user left', { username: user.username });
      connectedUsers.delete(socket.id);
      console.log(`${user.username} left the chat`);
    }
    
    console.log(`User disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

function generateMessageId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`Fantasy Messenger server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});