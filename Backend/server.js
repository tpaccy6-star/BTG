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

import sequelize from './database.js';
import { User, Lesson, Submission, Message, Attendance, Announcement, Cohort } from './models.js';
import seedDatabase from './seed.js';

const JWT_SECRET = 'generation_rise_super_secret_key_2026';
const PORT = process.env.PORT || 5000;

// Setup directories
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
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

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Token missing.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// --- REST API Endpoints ---

// 1. Auth Login Route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password.' });
  }

  try {
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, cohortId: user.cohortId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        initials: user.initials,
        university: user.university,
        yearLevel: user.yearLevel,
        streakDays: user.streakDays,
        avatarUrl: user.avatarUrl,
        cohortId: user.cohortId
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// 2. Auth Session Check Route
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: Submission, as: 'submissions', include: [{ model: Lesson, as: 'lesson' }] },
        { model: Attendance, as: 'attendanceRecords' },
        { model: Cohort, as: 'cohort' }
      ]
    });
    if (!user) {
      return res.status(404).json({ error: 'User session not found.' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        initials: user.initials,
        university: user.university,
        yearLevel: user.yearLevel,
        streakDays: user.streakDays,
        avatarUrl: user.avatarUrl,
        cohortId: user.cohortId,
        cohort: user.cohort || null,
        submissions: user.submissions || [],
        attendanceRecords: user.attendanceRecords || []
      }
    });
  } catch (err) {
    console.error('Session check error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// 3. Lessons Catalog Route
app.get('/api/lessons', authenticateToken, async (req, res) => {
  try {
    let lessons;
    if (req.user.role === 'scholar') {
      lessons = await Lesson.findAll({
        where: {
          [Op.or]: [
            { cohortId: null },
            { cohortId: req.user.cohortId || 0 }
          ]
        }
      });
    } else {
      lessons = await Lesson.findAll();
    }
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching lessons.' });
  }
});

// 4. Submissions / Tasks Route
app.get('/api/submissions', authenticateToken, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'scholar') {
      filter.scholarId = req.user.id;
    }
    const submissions = await Submission.findAll({
      where: filter,
      include: [{ model: Lesson, as: 'lesson' }]
    });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching submissions.' });
  }
});

// Multer Upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// 5. Submit Task Route
app.post('/api/tasks/submit', authenticateToken, upload.single('file'), async (req, res) => {
  const { lessonId } = req.body;

  if (!lessonId) {
    return res.status(400).json({ error: 'Lesson ID is required for task submission.' });
  }

  try {
    // Check if submission already exists
    let submission = await Submission.findOne({
      where: { scholarId: req.user.id, lessonId }
    });

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (submission) {
      // Update existing
      submission.fileUrl = fileUrl || submission.fileUrl;
      submission.status = 'completed';
      submission.submittedAt = new Date();
      await submission.save();
    } else {
      // Create new
      submission = await Submission.create({
        scholarId: req.user.id,
        lessonId,
        fileUrl,
        status: 'completed',
        submittedAt: new Date()
      });
    }

    res.json({ success: true, submission });
  } catch (err) {
    console.error('Task submission error:', err);
    res.status(500).json({ error: 'Error submitting task.' });
  }
});

// 6. Grade Submission Route (Mentors/Teachers)
app.post('/api/submissions/:id/grade', authenticateToken, async (req, res) => {
  if (!['mentor', 'teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Only mentors or teachers can grade.' });
  }

  const { id } = req.params;
  const { score, feedback } = req.body;

  if (score === undefined) {
    return res.status(400).json({ error: 'Score is required.' });
  }

  try {
    const submission = await Submission.findByPk(id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission record not found.' });
    }

    submission.score = score;
    submission.feedback = feedback || '';
    submission.status = 'graded';
    await submission.save();

    res.json({ success: true, submission });
  } catch (err) {
    res.status(500).json({ error: 'Error saving grading logs.' });
  }
});

// 7. Scholar Roster Route (For Mentors / Teachers / Admins)
app.get('/api/roster', authenticateToken, async (req, res) => {
  if (req.user.role === 'scholar') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const scholars = await User.findAll({
      where: { role: 'scholar' },
      include: [
        { model: Submission, as: 'submissions' },
        { model: Attendance, as: 'attendanceRecords' }
      ]
    });
    res.json(scholars);
  } catch (err) {
    res.status(500).json({ error: 'Error loading roster.' });
  }
});

// 8. Attendance Checkpoint Route
app.post('/api/attendance/mark', authenticateToken, async (req, res) => {
  if (req.user.role === 'scholar') {
    return res.status(403).json({ error: 'Access denied.' });
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

// 10. User Directory Route (Admin Only)
app.get('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  try {
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash'] },
      include: [{ model: Cohort, as: 'cohort', attributes: ['id', 'name'] }],
      order: [['role', 'ASC'], ['name', 'ASC']]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load user directory.' });
  }
});

// 11. Create or Update Lesson (Teacher / Admin)
app.post('/api/lessons', authenticateToken, async (req, res) => {
  if (!['teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Teacher or Admin privileges required.' });
  }

  const { id, title, pillar, description, videoUrl, resources, duration, notes, videoRestrictions, cohortId, coverUrl } = req.body;

  if (!id || !title || !pillar) {
    return res.status(400).json({ error: 'Lesson ID, title, and pillar are required.' });
  }

  try {
    let lesson = await Lesson.findByPk(id);
    if (lesson) {
      lesson.title = title;
      lesson.pillar = pillar;
      lesson.description = description || '';
      lesson.videoUrl = videoUrl || '';
      lesson.resources = resources ? (typeof resources === 'string' ? resources : JSON.stringify(resources)) : lesson.resources;
      lesson.notes = notes || '';
      lesson.videoRestrictions = videoRestrictions ? (typeof videoRestrictions === 'string' ? videoRestrictions : JSON.stringify(videoRestrictions)) : lesson.videoRestrictions;
      lesson.duration = duration || lesson.duration;
      lesson.cohortId = cohortId !== undefined ? (cohortId === 'all' || cohortId === '' || cohortId === null ? null : parseInt(cohortId, 10)) : lesson.cohortId;
      lesson.coverUrl = coverUrl !== undefined ? coverUrl : lesson.coverUrl;
      await lesson.save();
    } else {
      lesson = await Lesson.create({
        id,
        title,
        pillar,
        description: description || '',
        videoUrl: videoUrl || '',
        resources: resources ? (typeof resources === 'string' ? resources : JSON.stringify(resources)) : '[]',
        notes: notes || '',
        videoRestrictions: videoRestrictions ? (typeof videoRestrictions === 'string' ? videoRestrictions : JSON.stringify(videoRestrictions)) : '{}',
        duration: duration || 30,
        cohortId: cohortId && cohortId !== 'all' ? parseInt(cohortId, 10) : null,
        coverUrl: coverUrl || null
      });
    }
    res.json({ success: true, lesson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving lesson curriculum.' });
  }
});

// 11b. Upload Handout Document (Teacher / Admin Only)
app.post('/api/lessons/upload-resource', authenticateToken, upload.single('file'), async (req, res) => {
  if (!['teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Teacher or Admin privileges required.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided.' });
  }

  try {
    const sizeInMB = (req.file.size / (1024 * 1024)).toFixed(2) + ' MB';
    res.json({
      success: true,
      resource: {
        name: req.file.originalname,
        size: sizeInMB,
        link: `/uploads/${req.file.filename}`
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error uploading resource document.' });
  }
});

// 11c. Upload User Avatar (All Authenticated Users)
app.post('/api/users/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided.' });
  }

  try {
    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    user.avatarUrl = avatarUrl;
    await user.save();

    res.json({
      success: true,
      avatarUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error uploading profile picture.' });
  }
});

// 11d. Update User Profile Info (All Authenticated Users)
app.put('/api/users/update-profile', authenticateToken, async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check email uniqueness if email is changing
    if (email.toLowerCase().trim() !== user.email) {
      const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use.' });
      }
    }

    user.name = name;
    user.email = email.toLowerCase().trim();
    user.initials = name.slice(0, 2).toUpperCase();
    await user.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        initials: user.initials,
        university: user.university,
        yearLevel: user.yearLevel,
        streakDays: user.streakDays,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating profile details.' });
  }
});

// 12. Get Announcements Route (Authenticated Users)
app.get('/api/announcements', authenticateToken, async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load announcements.' });
  }
});

// 13. Create Announcement Route (Teacher / Admin Only)
app.post('/api/announcements', authenticateToken, async (req, res) => {
  if (!['teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  try {
    const announcement = await Announcement.create({
      title,
      content,
      author: req.user.name,
      date: new Date().toISOString().split('T')[0]
    });
    res.json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create announcement.' });
  }
});

// 14. Admin Database Reset Route (Admin Only)
app.post('/api/admin/reset', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Database reset and default seeds restored successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset and re-seed database.' });
  }
});

// 15. Create User (Admin Only)
app.post('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  const { email, password, role, name, initials, university, yearLevel, streakDays, cohortId } = req.body;
  if (!email || !password || !role || !name) {
    return res.status(400).json({ error: 'Email, password, role, and name are required.' });
  }
  try {
    const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      name,
      initials: initials || name.slice(0, 2).toUpperCase(),
      university: university || null,
      yearLevel: yearLevel || null,
      streakDays: streakDays || 0,
      cohortId: cohortId ? parseInt(cohortId, 10) : null
    });
    res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name, cohortId: user.cohortId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// 16. Update User (Admin Only)
app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  const { id } = req.params;
  const { email, password, role, name, initials, university, yearLevel, streakDays, cohortId } = req.body;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (email) user.email = email.toLowerCase().trim();
    if (password) user.passwordHash = bcrypt.hashSync(password, 10);
    if (role) user.role = role;
    if (name) {
      user.name = name;
      user.initials = initials || name.slice(0, 2).toUpperCase();
    }
    if (university !== undefined) user.university = university;
    if (yearLevel !== undefined) user.yearLevel = yearLevel;
    if (streakDays !== undefined) user.streakDays = parseInt(streakDays, 10) || 0;
    if (cohortId !== undefined) user.cohortId = cohortId ? parseInt(cohortId, 10) : null;

    await user.save();
    res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name, cohortId: user.cohortId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// 17. Delete User (Admin Only)
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// 18. Delete Lesson (Admin/Teacher Only)
app.delete('/api/admin/lessons/:id', authenticateToken, async (req, res) => {
  if (!['admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Admin or Teacher role required.' });
  }
  const { id } = req.params;
  try {
    const lesson = await Lesson.findByPk(id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }
    await lesson.destroy();
    res.json({ success: true, message: 'Lesson deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete lesson.' });
  }
});

// 19. Update Announcement (Admin/Teacher Only)
app.put('/api/admin/announcements/:id', authenticateToken, async (req, res) => {
  if (!['admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Admin or Teacher role required.' });
  }
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    await announcement.save();
    res.json({ success: true, announcement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update announcement.' });
  }
});

// 20. Delete Announcement (Admin/Teacher Only)
app.delete('/api/admin/announcements/:id', authenticateToken, async (req, res) => {
  if (!['admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Admin or Teacher role required.' });
  }
  const { id } = req.params;
  try {
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }
    await announcement.destroy();
    res.json({ success: true, message: 'Announcement deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete announcement.' });
  }
});

// 21. Delete Submission (Admin/Teacher/Mentor Only)
app.delete('/api/admin/submissions/:id', authenticateToken, async (req, res) => {
  if (!['admin', 'teacher', 'mentor'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { id } = req.params;
  try {
    const submission = await Submission.findByPk(id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }
    await submission.destroy();
    res.json({ success: true, message: 'Submission deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete submission.' });
  }
});

// 22. Get All Submissions (Admin / Teacher / Mentor Only)
app.get('/api/admin/submissions', authenticateToken, async (req, res) => {
  if (!['admin', 'teacher', 'mentor'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const submissions = await Submission.findAll({
      include: [
        { model: Lesson, as: 'lesson' },
        { model: User, as: 'scholar', attributes: ['name', 'email', 'university'] }
      ],
      order: [['submittedAt', 'DESC']]
    });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all submissions.' });
  }
});

// 23. Get All Cohorts (All Authenticated Users)
app.get('/api/cohorts', authenticateToken, async (req, res) => {
  try {
    const cohorts = await Cohort.findAll({
      order: [['id', 'ASC']]
    });
    res.json(cohorts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cohorts.' });
  }
});

// 24. Create Cohort (Admin Only)
app.post('/api/admin/cohorts', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  const { name, scholars, progress, status, attendance, university } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Cohort name is required.' });
  }
  try {
    const cohort = await Cohort.create({
      name,
      scholars: parseInt(scholars, 10) || 0,
      progress: parseInt(progress, 10) || 0,
      status: status || 'Active',
      attendance: parseInt(attendance, 10) || 90,
      university: university || ''
    });
    res.json({ success: true, cohort });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create cohort.' });
  }
});

// 25. Update Cohort (Admin Only)
app.put('/api/admin/cohorts/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  const { id } = req.params;
  const { name, scholars, progress, status, attendance, university } = req.body;
  try {
    const cohort = await Cohort.findByPk(id);
    if (!cohort) {
      return res.status(404).json({ error: 'Cohort not found.' });
    }
    if (name) cohort.name = name;
    if (scholars !== undefined) cohort.scholars = parseInt(scholars, 10) || 0;
    if (progress !== undefined) cohort.progress = parseInt(progress, 10) || 0;
    if (status) cohort.status = status;
    if (attendance !== undefined) cohort.attendance = parseInt(attendance, 10) || 0;
    if (university !== undefined) cohort.university = university;
    
    await cohort.save();
    res.json({ success: true, cohort });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update cohort.' });
  }
});

// 26. Delete Cohort (Admin Only)
app.delete('/api/admin/cohorts/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  const { id } = req.params;
  try {
    const cohort = await Cohort.findByPk(id);
    if (!cohort) {
      return res.status(404).json({ error: 'Cohort not found.' });
    }
    await cohort.destroy();
    res.json({ success: true, message: 'Cohort deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete cohort.' });
  }
});

// 27. Chatbot Query Route (All Authenticated Users)
app.post('/api/chatbot/query', authenticateToken, (req, res) => {
  const { query } = req.body;
  const { role, name } = req.user;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  const q = query.toLowerCase().trim();
  let response = '';

  if (role === 'scholar') {
    if (q.includes('homework') || q.includes('submit') || q.includes('task') || q.includes('assignment')) {
      response = `Hi ${name}, to submit homework, visit the **Catalog** tab, open a lesson, and use the **Task Submission** box on the right. You can upload PDF, DOCX, or PNG files up to 5MB.`;
    } else if (q.includes('attendance') || q.includes('check') || q.includes('scan') || q.includes('log')) {
      response = `Hi ${name}, you can log attendance under the **Attendance** tab by clicking the **Check In Now** button. This simulates a QR code check-in at your classroom.`;
    } else if (q.includes('streak') || q.includes('points') || q.includes('days')) {
      response = `Your academic streak grows when you log in and check in regularly. Keep up the active streak to earn recognition!`;
    } else if (q.includes('chat') || q.includes('mentor') || q.includes('message')) {
      response = `Need help? Go to the **Mentor Chat** tab to message your mentor, Sarah Miller, directly.`;
    } else {
      response = `Hi ${name}! As a Scholar, I can help you with homework submissions, logging attendance, tracking your streak, or messaging your mentor. What would you like to know?`;
    }
  } else if (role === 'mentor') {
    if (q.includes('grade') || q.includes('score') || q.includes('review') || q.includes('mark')) {
      response = `Hello Mentor ${name}, you can evaluate submissions in the **Grading** tab. Select a pending task, review the attached file preview, specify a score (0-100), write feedback remarks, and submit.`;
    } else if (q.includes('scholar') || q.includes('roster') || q.includes('student')) {
      response = `You can see progress logs and checklist completions for all your assigned scholars under the **My Scholars** tab.`;
    } else if (q.includes('chat') || q.includes('message') || q.includes('dm')) {
      response = `You can chat with scholars under the **Messages** tab. Select any scholar's direct channel to reply to their queries.`;
    } else {
      response = `Hello Mentor ${name}! You have privileges to grade tasks, view scholar metrics, and communicate in the chat rooms. How can I assist you with your mentoring duties today?`;
    }
  } else if (role === 'teacher') {
    if (q.includes('cohort') || q.includes('class')) {
      response = `Hello Teacher ${name}, you can manage simple cohorts (Cohort 1 to Cohort 4) under the **All Cohorts** tab. You can inspect enrollment sizes and attendance ratios there.`;
    } else if (q.includes('curriculum') || q.includes('lesson') || q.includes('edit') || q.includes('create')) {
      response = `You can customize courses, edit lecture notes, or upload handouts under the **Curriculum** tab.`;
    } else if (q.includes('broadcast') || q.includes('announce') || q.includes('news')) {
      response = `Post global notifications or extend deadlines under the **Broadcasts** tab. All scholars will see these bulletins on their dashboards.`;
    } else {
      response = `Hello Teacher ${name}! You can manage cohorts, modify curriculum lessons, or send broadcasts. What operations would you like assistance with?`;
    }
  } else if (role === 'admin') {
    if (q.includes('reset') || q.includes('database') || q.includes('seed')) {
      response = `Hello Admin ${name}, you can reset the SQLite database under **System Config** ➔ **Database Administration** by clicking **Reset Database to Default Seed**. This drops tables and recreates seed profiles.`;
    } else if (q.includes('user') || q.includes('directory') || q.includes('create') || q.includes('role')) {
      response = `You can add, edit, or delete users (Scholars, Mentors, Teachers, Admins) inside the **User Directory** view.`;
    } else if (q.includes('compliance') || q.includes('ssl') || q.includes('security')) {
      response = `Toggle security protocols, Mock SSL Sandboxing, and weekly NGO Compliance logging under the **System Config** parameters tab in System settings.`;
    } else {
      response = `Hello Admin ${name}! You have full super-user authorization. I can assist with database resets, user directory CRUD operations, and security sandbox variables.`;
    }
  } else {
    response = `Hello ${name}! How can I assist you today?`;
  }

  res.json({ response });
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
