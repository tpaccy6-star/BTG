import express from 'express';
import { User, Submission, Attendance } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get Scholar Roster (used by Mentors, Teachers, Admin, and Chat)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const filter = { role: 'scholar' };
    if (req.user.role === 'mentor') {
      filter.assignedMentorId = req.user.id;
    }

    const scholars = await User.findAll({
      where: filter,
      include: [
        { model: Submission, as: 'submissions' },
        { model: Attendance, as: 'attendanceRecords' }
      ],
      attributes: ['id', 'name', 'email', 'initials', 'university', 'yearLevel', 'streakDays', 'avatarUrl', 'cohortId', 'assignedMentorId'],
      order: [['name', 'ASC']]
    });
    res.json(scholars);
  } catch (err) {
    console.error('Error fetching roster:', err);
    res.status(500).json({ error: 'Failed to fetch scholar roster.' });
  }
});

export default router;
