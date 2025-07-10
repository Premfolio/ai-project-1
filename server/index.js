const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Skip rate limiting for successful requests
  skipFailedRequests: false,
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user login
  socket.on('user_login', async (userId) => {
    try {
      // Update user status in database
      const User = require('./models/User');
      await User.findByIdAndUpdate(userId, { 
        status: 'online',
        lastSeen: new Date()
      });
      
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      io.emit('user_status', { userId, status: 'online' });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  });

  // Handle private messages
  socket.on('private_message', (data) => {
    const { recipientId, message, senderId, timestamp } = data;
    const recipientSocketId = connectedUsers.get(recipientId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new_message', {
        senderId,
        message,
        timestamp
      });
    }
    
    // Also emit back to sender for confirmation
    socket.emit('message_sent', { message, timestamp });
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { recipientId, isTyping } = data;
    const recipientSocketId = connectedUsers.get(recipientId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('user_typing', {
        userId: socket.userId,
        isTyping
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    if (socket.userId) {
      try {
        // Update user status in database
        const User = require('./models/User');
        await User.findByIdAndUpdate(socket.userId, { 
          status: 'offline',
          lastSeen: new Date()
        });
        
        connectedUsers.delete(socket.userId);
        io.emit('user_status', { userId: socket.userId, status: 'offline' });
      } catch (error) {
        console.error('Error updating user status on disconnect:', error);
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 