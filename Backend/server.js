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
import usersRoutes from './routes/users.js';
import announcementRoutes from './routes/announcements.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import rosterRoutes from './routes/roster.js';
import programSuiteRoutes from './routes/programSuite.js';

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
const communicationStaffRoles = ['staff', 'admin', 'teacher'];
const onlineSocketCounts = new Map();

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required.'));

  let verified;
  try {
    verified = jwt.verify(token, JWT_SECRET);
  } catch {
    return next(new Error('Authentication failed.'));
  }

  try {
    const user = await User.findByPk(verified.id);
    if (!user) return next(new Error('Authentication failed.'));
    socket.data.user = user;
    return next();
  } catch (error) {
    console.error('Socket authentication failed:', error);
    return next(new Error('Authentication failed.'));
  }
});

// --- REST API Endpoints ---
app.use('/api/auth', authRoutes);

app.use('/api/lessons', lessonRoutes);
app.use('/api', submissionRoutes);
app.use('/api', cohortRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/roster', rosterRoutes);
app.use('/api/program', programSuiteRoutes);

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

const findChatContacts = async (user) => {
  const account = await User.findByPk(user.id);
  if (!account) throw new Error('Authenticated user no longer exists.');

  const where = account.role === 'mentor'
    ? { [Op.and]: [
        { id: { [Op.ne]: account.id } },
        {
        [Op.or]: [
          { role: { [Op.in]: ['scholar', 'beneficiary'] }, assignedMentorId: account.id },
          { role: { [Op.in]: communicationStaffRoles } }
        ]
        }
      ] }
    : ['scholar', 'beneficiary'].includes(account.role)
      ? {
          [Op.or]: [
            { id: account.assignedMentorId, role: 'mentor' },
            { role: { [Op.in]: communicationStaffRoles } }
          ]
        }
      : { id: { [Op.ne]: account.id } };

  return User.findAll({
    where,
    attributes: ['id', 'name', 'role', 'initials', 'avatarUrl', 'university'],
    order: [['name', 'ASC']]
  });
};

const canDirectMessage = (sender, recipient) => (
  sender.id !== recipient.id && (
    (sender.role === 'mentor' && (
      (['scholar', 'beneficiary'].includes(recipient.role) && recipient.assignedMentorId === sender.id) ||
      communicationStaffRoles.includes(recipient.role)
    )) ||
    (['scholar', 'beneficiary'].includes(sender.role) && (
      (recipient.role === 'mentor' && sender.assignedMentorId === recipient.id) ||
      communicationStaffRoles.includes(recipient.role)
    )) ||
    communicationStaffRoles.includes(sender.role)
  )
);

app.get('/api/chat/contacts', authenticateToken, async (req, res) => {
  try {
    res.json(await findChatContacts(req.user));
  } catch (err) {
    console.error('Error fetching chat contacts:', err);
    res.status(500).json({ error: 'Failed to fetch chat contacts.' });
  }
});

// 9. Chat History Route
app.get('/api/chat/history', authenticateToken, async (req, res) => {
  try {
    const contacts = await findChatContacts(req.user);
    const contactIds = contacts.map(contact => contact.id);
    const historyConditions = [
      { senderId: req.user.id, recipientId: { [Op.in]: contactIds } },
      { senderId: { [Op.in]: contactIds }, recipientId: req.user.id }
    ];
    if (req.user.role !== 'mentor') {
      historyConditions.push({ recipientId: 'group-all' });
    }

    const messages = await Message.findAll({
      where: { [Op.or]: historyConditions },
      order: [['timestamp', 'ASC']]
    });
    res.json(messages);
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ error: 'Error fetching chat logs.' });
  }
});

// --- WebSockets Event Handlers ---
io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);
  const user = socket.data.user;

  socket.on('joinRoom', () => {
    if (socket.data.joinedChat) return;
    socket.data.joinedChat = true;
    socket.join(user.id);
    console.log(`User ${user.id} joined room.`);
    const connectionCount = (onlineSocketCounts.get(user.id) || 0) + 1;
    onlineSocketCounts.set(user.id, connectionCount);

    findChatContacts(user).then(contacts => {
      if (!socket.connected) return;
      socket.data.chatContactIds = contacts.map(contact => contact.id);
      socket.emit('presenceSnapshot', socket.data.chatContactIds.filter(
        contactId => onlineSocketCounts.has(contactId)
      ));
      for (const contactId of socket.data.chatContactIds) {
        io.to(contactId).emit('presenceUpdate', { userId: user.id, online: true });
      }
    }).catch(error => {
      console.error('Failed to initialize chat presence:', error);
      socket.emit('communicationError', 'Unable to load online contact status.');
    });
  });

  socket.on('typing', async (data = {}) => {
    const { recipientId, isTyping } = data || {};
    if (typeof recipientId !== 'string' || typeof isTyping !== 'boolean') return;
    try {
      const [sender, recipient] = await Promise.all([
        User.findByPk(user.id),
        User.findByPk(recipientId)
      ]);
      if (!sender || !recipient || !canDirectMessage(sender, recipient)) return;
      io.to(recipientId).emit('userTyping', {
        userId: sender.id,
        userName: sender.name,
        isTyping
      });
    } catch (error) {
      console.error('Failed to update typing status:', error);
    }
  });

  socket.on('sendMessage', async (data, acknowledge) => {
    const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
    const recipientId = data?.recipientId;
    const content = typeof data?.content === 'string' ? data.content.trim() : '';

    try {
      if (!content || content.length > 5000) {
        return respond({ error: 'Messages must be between 1 and 5000 characters.' });
      }
      if (typeof recipientId !== 'string' || !recipientId.trim()) {
        return respond({ error: 'Choose a valid contact.' });
      }

      if (recipientId === 'group-all') {
        if (user.role === 'mentor') {
          return respond({ error: 'Mentors can message staff and their assigned scholars only.' });
        }
      } else {
        const recipient = await User.findByPk(recipientId);
        const sender = await User.findByPk(user.id);
        const canMessage = sender && recipient && canDirectMessage(sender, recipient);
        if (!canMessage) {
          return respond({ error: 'You cannot message this contact.' });
        }
      }

      const msg = await Message.create({
        senderId: user.id,
        senderName: user.name,
        recipientId,
        content
      });

      // Broadcast to specific recipient room and sender room
      io.to(recipientId).emit('newMessage', msg);
      io.to(user.id).emit('newMessage', msg);

      // If it's a global group message
      if (recipientId === 'group-all') {
        for (const connectedSocket of io.sockets.sockets.values()) {
          if (connectedSocket.id !== socket.id && connectedSocket.data.user.role !== 'mentor') {
            connectedSocket.emit('newMessage', msg);
          }
        }
      }
      return respond({ success: true });
    } catch (err) {
      console.error('Error saving socket message:', err);
      return respond({ error: 'Failed to send message.' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
    if (!socket.data.joinedChat) return;

    const connectionCount = (onlineSocketCounts.get(user.id) || 1) - 1;
    if (connectionCount > 0) {
      onlineSocketCounts.set(user.id, connectionCount);
      return;
    }

    onlineSocketCounts.delete(user.id);
    for (const contactId of socket.data.chatContactIds || []) {
      io.to(contactId).emit('presenceUpdate', { userId: user.id, online: false });
    }
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ detail: 'Each attachment must be 20 MB or smaller.' });
  }
  if (err?.status) {
    return res.status(err.status).json({ detail: err.message });
  }
  console.error('API request failed:', err);
  return res.status(500).json({ detail: 'The server could not complete the request.' });
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

    const cohortTable = await sequelize.getQueryInterface().describeTable(Cohort.getTableName());
    if (!cohortTable.description) {
      await sequelize.getQueryInterface().addColumn(Cohort.getTableName(), 'description', {
        type: Cohort.rawAttributes.description.type,
        allowNull: true
      });
    }

    server.listen(PORT, () => {
      console.log(`Generation Rise Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Unable to start application server:', err);
  }
};

initApp();
