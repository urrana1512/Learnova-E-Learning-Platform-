const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;
const users = new Map(); // userId -> socketId

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust in production
      methods: ["GET", "POST"]
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.userId}`);
    users.set(socket.userId, socket.id);

    // Update DB: Online
    try {
      const User = require('../models/User');
      await User.findByIdAndUpdate(socket.userId, { isOnline: true });
      io.emit('user_status_change', { userId: socket.userId, isOnline: true });
    } catch (err) {
      console.error('Socket connect DB error:', err);
    }

    socket.on('join_chat', (room) => {
      socket.join(room);
      console.log(`User ${socket.userId} joined room: ${room}`);
    });

    socket.on('typing', ({ room, isTyping }) => {
      socket.to(room).emit('player_typing', { userId: socket.userId, isTyping });
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      users.delete(socket.userId);

      // Update DB: Offline
      try {
        const User = require('../models/User');
        const now = new Date();
        await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: now });
        io.emit('user_status_change', { userId: socket.userId, isOnline: false, lastSeen: now });
      } catch (err) {
        console.error('Socket disconnect DB error:', err);
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const sendToUser = (userId, event, data) => {
  const socketId = users.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

const broadcastToRoom = (room, event, data) => {
  io.to(room).emit(event, data);
};

module.exports = { initSocket, getIO, sendToUser, broadcastToRoom };
