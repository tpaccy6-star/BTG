import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

import sequelize from './database.js';
import { User, Lesson, Submission, Message, Attendance, Announcement, Notification, Cohort } from './models.js';
import seedDatabase from './seed.js';

import { authenticateToken } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import lessonRoutes from './routes/lessons.js';
import submissionRoutes from './routes/submissions.js';
import cohortRoutes from './routes/cohorts.js';
import chatbotRoutes from './routes/chatbot.js';
import usersRoutes from './routes/users.js';
import announcementRoutes from './routes/announcements.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import rosterRoutes from './routes/roster.js';

const JWT_SECRET = process.env.JWT_SECRET || 'generation_rise_super_secret_key_2026';
const PORT = process.env.PORT || 5000;

// Setup directories
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
const backupsDir = './backups';
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

// Express app setup
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'Generation Rise REST API Server',
    timestamp: new Date()
  });
});

// HTTP server and WebSocket setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// --- REST API Endpoints ---
app.use('/api/auth', authRoutes);

app.use('/api/lessons', lessonRoutes);
app.use('/api', submissionRoutes);
app.use('/api', cohortRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/roster', rosterRoutes);

// 8. Attendance Checkpoint Route
app.post('/api/attendance/mark', authenticateToken, async (req, res) => {
  if (req.user.role === 'scholar' && req.body.scholarId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied. Scholars can only log their own attendance.' });
  }

  const { scholarId, date, status } = req.body;

  if (!scholarId || !date || !status) {
    return res.status(400).json({ error: 'Scholar ID, date, and status are required.' });
  }

  try {
    let attendance = await Attendance.findOne({ where: { scholarId, date } });
    if (attendance) {
      attendance.status = status;
      attendance.verifiedBy = req.user.name;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        scholarId,
        date,
        status,
        verifiedBy: req.user.name
      });
    }

    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ error: 'Error logging attendance.' });
  }
});

// 9. Chat History Route
app.get('/api/chat/history', authenticateToken, async (req, res) => {
  try {
    let messages = [];
    if (req.user.role === 'scholar') {
      // Fetch public group messages or messages matching scholar's ID
      messages = await Message.findAll({
        where: sequelize.or(
          { recipientId: req.user.id },
          { senderId: req.user.id },
          { recipientId: 'group-all' }
        ),
        order: [['timestamp', 'ASC']]
      });
    } else {
      // Mentors / Admin can fetch all message histories
      messages = await Message.findAll({
        order: [['timestamp', 'ASC']]
      });
    }
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching chat logs.' });
  }
});

// --- WebSockets Event Handlers ---
io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);

  socket.on('joinRoom', ({ userId }) => {
    socket.join(userId);
    console.log(`User ${userId} joined room.`);
  });

  socket.on('sendMessage', async (data) => {
    const { senderId, senderName, recipientId, content } = data;
    try {
      const msg = await Message.create({
        senderId,
        senderName,
        recipientId,
        content
      });

      // Broadcast to specific recipient room and sender room
      io.to(recipientId).emit('newMessage', msg);
      io.to(senderId).emit('newMessage', msg);

      // If it's a global group message
      if (recipientId === 'group-all') {
        socket.broadcast.emit('newMessage', msg);
      }
    } catch (err) {
      console.error('Error saving socket message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

// --- Serve Static Frontend Assets in Production ---
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, '../Frontend/dist')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  // Check if file exists in dist, otherwise send index.html
  const filePath = path.join(__dirname, '../Frontend/dist', req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(__dirname, '../Frontend/dist/index.html'));
});

// --- Server Initialization ---
const initApp = async () => {
  try {
    // Check if database contains data, if not seed it
    const usersCount = await User.count().catch(() => 0);
    if (usersCount === 0) {
      console.log('Database empty. Seeding initial data...');
      await seedDatabase();
    } else {
      try {
        await sequelize.query('ALTER TABLE Users ADD COLUMN assignedMentorId CHAR(36);');
      } catch (e) {
        // Ignore if column already exists
      }
      await sequelize.sync();
      console.log('Database schemas verified.');
    }

    server.listen(PORT, () => {
      console.log(`Generation Rise Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Unable to start application server:', err);
  }
};

initApp();
