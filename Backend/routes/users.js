import express from 'express';
import bcrypt from 'bcryptjs';
import { User, Cohort } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// 10. User Directory Route (Admin Only)
router.get('/', authenticateToken, async (req, res) => {
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

// 11c. Upload User Avatar (All Authenticated Users)
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
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
    res.status(500).json({ error: 'Error uploading avatar.' });
  }
});

// 11d. Update User Profile (All Authenticated Users)
router.put('/update-profile', authenticateToken, async (req, res) => {
  const { name, email, university, yearLevel } = req.body;
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
    if (university !== undefined) user.university = university;
    if (yearLevel !== undefined) user.yearLevel = yearLevel;
    
    await user.save();
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, initials: user.initials, university: user.university, yearLevel: user.yearLevel, role: user.role, avatarUrl: user.avatarUrl, streakDays: user.streakDays } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating profile.' });
  }
});

// 15. Create User (Admin Only)
router.post('/admin', authenticateToken, async (req, res) => {
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
router.put('/admin/:id', authenticateToken, async (req, res) => {
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
router.delete('/admin/:id', authenticateToken, async (req, res) => {
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

export default router;
