// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow cross-origin requests (for dev)

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Your Vite dev server
    methods: ['GET', 'POST']
  }
});

// -------------------------------------------
// 1) MIDDLEWARE EXAMPLE (for the default namespace)
// -------------------------------------------
io.use((socket, next) => {
  // We can do basic handshake token checks here
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log('No token, connection rejected');
    return next(new Error('No token provided'));
  }
  // In a real app, you'd verify the token, decode user info, etc.
  console.log(`Token accepted: ${token}`);
  next();
});

// -------------------------------------------
// 2) DEFAULT NAMESPACE ("/")
// -------------------------------------------
// We'll maintain scoreboard state in memory for demonstration:
let scores = {}; // e.g., { userId: score }

// "connection" event
io.on('connection', (socket) => {
  console.log(`[DEFAULT] Client connected: ${socket.id}`);

  // Query params or handshake data
  const userId = socket.handshake.query?.userId || 'UnknownUser';
  console.log(`[DEFAULT] userId from client: ${userId}`);

  // -------------------------
  // ROOMS EXAMPLE
  // -------------------------
  // Let’s say each user joins a "game room" (e.g., "game1")
  const gameRoom = 'game1';
  socket.join(gameRoom);

  // Send the initial scoreboard to the newly connected client
  socket.emit('scoreboardUpdate', scores);

  // Listen to "incrementScore" from this user
  socket.on('incrementScore', () => {
    // If user doesn't exist yet, set to 0
    if (!scores[userId]) {
      scores[userId] = 0;
    }
    scores[userId]++;
    console.log(`[DEFAULT] ${userId} incremented score to ${scores[userId]}`);

    // Broadcast updated scores to everyone in the room
    //   (including this user). If you wanted to exclude the sender, use `socket.broadcast.to(...)`
    io.to(gameRoom).emit('scoreboardUpdate', scores);

  });

  // On disconnect
  socket.on('disconnect', () => {
    console.log(`[DEFAULT] Client disconnected: ${socket.id}`);
  });
});

// -------------------------------------------
// 3) ADMIN NAMESPACE ("/admin")
// -------------------------------------------
const adminNamespace = io.of('/admin');

// Example "admin" middleware
adminNamespace.use((socket, next) => {
  // Maybe we do a different check for admin
  const adminToken = socket.handshake.auth.adminToken;
  if (adminToken !== 'secretAdminToken') {
    return next(new Error('Unauthorized admin connection'));
  }
  next();
});

adminNamespace.on('connection', (socket) => {
  console.log(`[ADMIN] Admin connected: ${socket.id}`);

  // Send current scores to admin immediately
  socket.emit('scoreboardUpdate', scores);

  // Admin can reset scores
  socket.on('resetScores', () => {
    scores = {}; // clear out scoreboard
    console.log('[ADMIN] Scores have been reset.');

    // Notify all clients in default namespace’s "game1" that scores changed
    io.to('game1').emit('scoreboardUpdate', scores);

  });

  socket.on('disconnect', () => {
    console.log(`[ADMIN] Admin disconnected: ${socket.id}`);
  });
  
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
