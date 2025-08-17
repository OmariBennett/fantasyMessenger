import 'dotenv/config';
import { Temporal } from '@js-temporal/polyfill';
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


app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

const connectedUsers = new Map();
const activePvPBattles = new Map(); // battleId -> battleData
const pendingChallenges = new Map(); // challengeId -> challengeData

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send initial time sync to connected client
  socket.emit('time-sync', {
    serverTime: Date.now(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    instant: Temporal.Now.instant().toString()
  });

  socket.on('user joined', (data) => {
    const { username } = data;
    connectedUsers.set(socket.id, { 
      username, 
      joinedAt: Temporal.Now.instant(),
      character: null // Will be set when character is created
    });
    
    socket.broadcast.emit('user joined', { username });
    
    console.log(`${username} joined the chat`);
  });

  // PvP System handlers
  socket.on('pvp-character-created', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      user.character = {
        name: data.name,
        class: data.class,
        level: data.level
      };
      console.log(`${user.username} created character: ${data.name} (${data.class})`);
    }
  });

  // PvP Broadcasting through chat system
  socket.on('pvp-broadcast', (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    switch (data.type) {
      case 'character-created':
        // Update user's character info
        if (user) {
          user.character = {
            name: data.character.name,
            class: data.character.class,
            level: data.character.level
          };
        }
        
        // Broadcast to all clients including sender
        io.emit('pvp-broadcast', {
          ...data,
          socketId: socket.id
        });
        break;

      case 'challenge-request':
        // Forward challenge to specific target
        const targetSocket = io.sockets.sockets.get(data.targetSocketId);
        if (targetSocket) {
          targetSocket.emit('pvp-broadcast', {
            ...data,
            socketId: socket.id
          });
        }
        break;

      case 'battle-action':
        // Broadcast battle action to all participants
        const battle = activePvPBattles.get(data.battleId);
        if (battle) {
          [battle.player1.id, battle.player2.id].forEach(playerId => {
            const playerSocket = io.sockets.sockets.get(playerId);
            if (playerSocket) {
              playerSocket.emit('pvp-broadcast', {
                ...data,
                socketId: socket.id
              });
            }
          });
        }
        break;

      case 'player-status-update':
        // Broadcast status update to all clients
        socket.broadcast.emit('pvp-broadcast', {
          ...data,
          socketId: socket.id
        });
        break;

      default:
        console.log(`Unknown PvP broadcast type: ${data.type}`);
    }
  });

  // Handle PvP challenge events through broadcasting
  socket.on('pvp-challenge-sent', (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    // Store challenge
    const challengeId = data.challengeId || generateBattleId();
    pendingChallenges.set(challengeId, {
      ...data,
      challengeId,
      createdAt: Date.now()
    });

    // Forward to target player
    const targetSocket = io.sockets.sockets.get(data.targetSocketId);
    if (targetSocket) {
      targetSocket.emit('pvp-challenge-sent', {
        ...data,
        challengeId,
        challengerSocketId: socket.id
      });
    }

    console.log(`PvP challenge sent via broadcast: ${data.challengerName} -> ${data.targetSocketId}`);
  });

  socket.on('pvp-challenge-response', (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const challenge = pendingChallenges.get(data.challengeId);
    if (!challenge) {
      socket.emit('error', { message: 'Challenge not found or expired' });
      return;
    }

    // Forward response to challenger
    const challengerSocket = io.sockets.sockets.get(data.challengerSocketId);
    if (challengerSocket) {
      challengerSocket.emit('pvp-challenge-response', {
        ...data,
        responderSocketId: socket.id
      });
    }

    if (data.accepted) {
      // Start battle (reuse existing battle creation logic)
      startPvPBattleFromChallenge(challenge, socket.id);
    }

    // Clean up challenge
    pendingChallenges.delete(data.challengeId);
    console.log(`PvP challenge ${data.accepted ? 'accepted' : 'declined'} via broadcast`);
  });

  socket.on('pvp-battle-update', (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const battle = activePvPBattles.get(data.battleId);
    if (!battle) {
      socket.emit('error', { message: 'Battle not found' });
      return;
    }

    // Update battle state (this would include turn processing, damage calculation, etc.)
    // For now, just forward the action to the other player
    const otherPlayerId = battle.player1.id === socket.id ? battle.player2.id : battle.player1.id;
    const otherPlayerSocket = io.sockets.sockets.get(otherPlayerId);
    
    if (otherPlayerSocket) {
      otherPlayerSocket.emit('pvp-battle-update', {
        ...data,
        actionBy: socket.id
      });
    }

    console.log(`PvP battle action: ${data.action} in battle ${data.battleId}`);
  });

  socket.on('pvp-get-players', (data) => {
    const onlinePlayers = [];
    
    connectedUsers.forEach((user, socketId) => {
      if (socketId !== socket.id && user.character) {
        onlinePlayers.push({
          id: socketId,
          name: user.character.name,
          class: user.character.class,
          level: user.character.level,
          username: user.username
        });
      }
    });
    
    socket.emit('pvp-players-list', { players: onlinePlayers });
  });

  socket.on('pvp-challenge-player', (challengeData) => {
    const { targetPlayerId, challengeId } = challengeData;
    
    // Store challenge
    pendingChallenges.set(challengeId, {
      ...challengeData,
      createdAt: Date.now()
    });
    
    // Send challenge to target player
    const targetSocket = io.sockets.sockets.get(targetPlayerId);
    if (targetSocket) {
      targetSocket.emit('pvp-challenge-received', challengeData);
      console.log(`PvP challenge sent from ${challengeData.challengerName} to ${targetPlayerId}`);
    }
  });

  socket.on('pvp-accept-challenge', (data) => {
    const { challengeId } = data;
    const challenge = pendingChallenges.get(challengeId);
    
    if (!challenge) {
      socket.emit('error', { message: 'Challenge not found or expired' });
      return;
    }
    
    const challenger = connectedUsers.get(challenge.challengerId);
    const responder = connectedUsers.get(socket.id);
    
    if (!challenger || !responder) {
      socket.emit('error', { message: 'One of the players is no longer online' });
      return;
    }
    
    // Create battle
    const battleId = generateBattleId();
    const battleData = {
      battleId,
      player1: {
        id: challenge.challengerId,
        name: challenger.character.name,
        class: challenger.character.class,
        level: challenger.character.level,
        health: getClassHealth(challenger.character.class),
        maxHealth: getClassHealth(challenger.character.class),
        mana: getClassMana(challenger.character.class),
        maxMana: getClassMana(challenger.character.class)
      },
      player2: {
        id: socket.id,
        name: responder.character.name,
        class: responder.character.class,
        level: responder.character.level,
        health: getClassHealth(responder.character.class),
        maxHealth: getClassHealth(responder.character.class),
        mana: getClassMana(responder.character.class),
        maxMana: getClassMana(responder.character.class)
      },
      currentTurn: Math.random() < 0.5 ? 1 : 2,
      createdAt: Date.now(),
      status: 'active'
    };
    
    activePvPBattles.set(battleId, battleData);
    
    // Notify both players
    const challengerSocket = io.sockets.sockets.get(challenge.challengerId);
    if (challengerSocket) {
      challengerSocket.emit('pvp-challenge-response', { 
        accepted: true, 
        responderName: responder.character.name 
      });
      challengerSocket.emit('pvp-battle-start', battleData);
    }
    
    socket.emit('pvp-battle-start', battleData);
    
    // Clean up challenge
    pendingChallenges.delete(challengeId);
    
    console.log(`PvP battle started: ${battleData.player1.name} vs ${battleData.player2.name}`);
  });

  socket.on('pvp-decline-challenge', (data) => {
    const { challengeId } = data;
    const challenge = pendingChallenges.get(challengeId);
    
    if (challenge) {
      const responder = connectedUsers.get(socket.id);
      const challengerSocket = io.sockets.sockets.get(challenge.challengerId);
      
      if (challengerSocket && responder) {
        challengerSocket.emit('pvp-challenge-response', { 
          accepted: false, 
          responderName: responder.character.name 
        });
      }
      
      pendingChallenges.delete(challengeId);
      console.log(`PvP challenge declined by ${responder?.character?.name || 'unknown'}`);
    }
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
      timestamp: Temporal.Now.instant().toString()
    };

    io.emit('message', messageData);
    
    console.log(`Message from ${data.username}: ${data.message}`);
  });

  // Clock synchronization handlers
  socket.on('request-time-sync', () => {
    socket.emit('time-sync', {
      serverTime: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      instant: Temporal.Now.instant().toString()
    });
  });

  socket.on('time-update', (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    // Broadcast time update to all other users
    socket.broadcast.emit('time-broadcast', {
      username: user.username,
      timestamp: data.timestamp,
      timezone: data.timezone,
      action: 'time-updated',
      serverTime: Date.now()
    });
  });

  socket.on('share-time', (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    // Broadcast time share to all users including sender
    io.emit('time-broadcast', {
      username: user.username,
      timestamp: data.timestamp,
      formattedTime: data.formattedTime,
      formattedDate: data.formattedDate,
      action: 'time-shared',
      serverTime: Date.now()
    });

    console.log(`${user.username} shared time: ${JSON.stringify(data.formattedTime)}`);
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
  const now = Temporal.Now.instant();
  const epochNanos = now.epochNanoseconds;
  const timeComponent = epochNanos.toString(36);
  
  const randomComponent = Math.random().toString(36).substring(2, 11);
  
  return `${timeComponent}-${randomComponent}`;
}

function generateBattleId() {
  return `battle_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function startPvPBattleFromChallenge(challenge, responderSocketId) {
  const challenger = connectedUsers.get(challenge.challengerSocketId);
  const responder = connectedUsers.get(responderSocketId);
  
  if (!challenger || !responder) {
    console.error('Cannot start battle: missing player data');
    return;
  }
  
  // Create battle
  const battleId = generateBattleId();
  const battleData = {
    battleId,
    player1: {
      id: challenge.challengerSocketId,
      name: challenger.character.name,
      class: challenger.character.class,
      level: challenger.character.level,
      health: getClassHealth(challenger.character.class),
      maxHealth: getClassHealth(challenger.character.class),
      mana: getClassMana(challenger.character.class),
      maxMana: getClassMana(challenger.character.class)
    },
    player2: {
      id: responderSocketId,
      name: responder.character.name,
      class: responder.character.class,
      level: responder.character.level,
      health: getClassHealth(responder.character.class),
      maxHealth: getClassHealth(responder.character.class),
      mana: getClassMana(responder.character.class),
      maxMana: getClassMana(responder.character.class)
    },
    currentTurn: Math.random() < 0.5 ? 1 : 2,
    createdAt: Date.now(),
    status: 'active'
  };
  
  activePvPBattles.set(battleId, battleData);
  
  // Notify both players through broadcasting system
  const challengerSocket = io.sockets.sockets.get(challenge.challengerSocketId);
  const responderSocket = io.sockets.sockets.get(responderSocketId);
  
  if (challengerSocket) {
    challengerSocket.emit('pvp-battle-start', battleData);
  }
  if (responderSocket) {
    responderSocket.emit('pvp-battle-start', battleData);
  }
  
  console.log(`PvP battle started via broadcast: ${battleData.player1.name} vs ${battleData.player2.name}`);
}

function getClassHealth(characterClass) {
  const classStats = {
    'Fighter': 120,
    'Mage': 80,
    'Rogue': 90,
    'Cleric': 100
  };
  return classStats[characterClass] || 100;
}

function getClassMana(characterClass) {
  const classStats = {
    'Fighter': 30,
    'Mage': 100,
    'Rogue': 60,
    'Cleric': 80
  };
  return classStats[characterClass] || 50;
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Fantasy Messenger server running on http://localhost:${process.env.PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});