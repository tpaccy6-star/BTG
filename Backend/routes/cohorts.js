import express from 'express';
import { Cohort } from '../models.js';
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

export default router;
