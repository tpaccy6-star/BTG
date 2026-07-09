import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Submission, Lesson, Attendance, Cohort } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'generation_rise_super_secret_key_2026';

// 1. Auth Login Route
router.post('/login', async (req, res) => {
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

    // Update streak logic based on last login
    const todayStr = new Date().toISOString().split('T')[0];
    if (user.lastLoginDate) {
      const lastLogin = new Date(user.lastLoginDate);
      const today = new Date(todayStr);
      const diffTime = today - lastLogin;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        user.streakDays += 1;
      } else if (diffDays > 1) {
        user.streakDays = 1;
      }
    } else {
      user.streakDays = 1;
    }
    user.lastLoginDate = todayStr;
    await user.save();

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
router.get('/me', authenticateToken, async (req, res) => {
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

export default router;
