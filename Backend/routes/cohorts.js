import express from 'express';
import { Cohort, User } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 23. Get All Cohorts (All Authenticated Users)
router.get('/cohorts', authenticateToken, async (req, res) => {
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
router.post('/admin/cohorts', authenticateToken, async (req, res) => {
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
router.put('/admin/cohorts/:id', authenticateToken, async (req, res) => {
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
router.delete('/admin/cohorts/:id', authenticateToken, async (req, res) => {
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


// 27. Get Members of a Specific Cohort (Admin Only)
router.get('/admin/cohorts/:id/members', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  const { id } = req.params;
  try {
    const members = await User.findAll({
      where: { cohortId: id },
      attributes: ['id', 'name', 'email', 'role', 'university', 'yearLevel', 'avatarUrl', 'initials', 'createdAt'],
      order: [['name', 'ASC']]
    });
    res.json(members);
  } catch (err) {
    console.error('Failed to fetch cohort members:', err);
    res.status(500).json({ error: 'Failed to fetch cohort members.' });
  }
});

// 28. Get Available Scholars To Add To Cohort (Admin Only)
router.get('/admin/cohorts-available-scholars', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  try {
    const scholars = await User.findAll({
      where: { role: 'scholar' },
      attributes: ['id', 'name', 'email', 'cohortId', 'university', 'avatarUrl', 'initials'],
      include: [{ model: Cohort, as: 'cohort', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']]
    });
    res.json(scholars);
  } catch (err) {
    console.error('Failed to fetch available scholars:', err);
    res.status(500).json({ error: 'Failed to fetch available scholars.' });
  }
});

// 29. Add Member To Cohort (Admin Only)
router.post('/admin/cohorts/:id/members', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  const { id } = req.params;
  const { userId, name, email, university } = req.body;

  try {
    const cohort = await Cohort.findByPk(id);
    if (!cohort) {
      return res.status(404).json({ error: 'Cohort not found.' });
    }

    let member;
    if (userId) {
      member = await User.findByPk(userId);
      if (!member) {
        return res.status(404).json({ error: 'User not found.' });
      }
      member.cohortId = cohort.id;
      if (university && !member.university) member.university = university;
      await member.save();
    } else if (name && email) {
      const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }
      const bcrypt = (await import('bcryptjs')).default;
      member = await User.create({
        email: email.toLowerCase().trim(),
        passwordHash: bcrypt.hashSync('password123', 10),
        role: 'scholar',
        name: name.trim(),
        initials: name.trim().slice(0, 2).toUpperCase(),
        university: university || cohort.university || 'Scholar University',
        yearLevel: 'Active Scholar',
        cohortId: cohort.id
      });
    } else {
      return res.status(400).json({ error: 'Please select an existing scholar or provide a name and email.' });
    }

    // Auto update scholars count
    const count = await User.count({ where: { cohortId: cohort.id, role: 'scholar' } });
    cohort.scholars = count;
    await cohort.save();

    res.json({ success: true, member, cohort });
  } catch (err) {
    console.error('Failed to add member to cohort:', err);
    res.status(500).json({ error: 'Failed to add member to cohort.' });
  }
});

// 30. Remove Member From Cohort (Admin Only)
router.delete('/admin/cohorts/:id/members/:userId', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  const { id, userId } = req.params;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.cohortId = null;
    await user.save();

    const cohort = await Cohort.findByPk(id);
    if (cohort) {
      const count = await User.count({ where: { cohortId: cohort.id, role: 'scholar' } });
      cohort.scholars = count;
      await cohort.save();
    }

    res.json({ success: true, message: 'Member removed from cohort successfully.' });
  } catch (err) {
    console.error('Failed to remove member from cohort:', err);
    res.status(500).json({ error: 'Failed to remove member from cohort.' });
  }
});

export default router;
