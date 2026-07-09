import express from 'express';
import { Op } from 'sequelize';
import { Announcement, User, Notification } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 12. Announcements Route
router.get('/', authenticateToken, async (req, res) => {
  try {
    const whereClause = {};
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      whereClause[Op.or] = [
        { targetRole: 'all' },
        { targetRole: req.user.role }
      ];
      if (req.user.cohortId) {
        whereClause[Op.or].push({ targetCohortId: req.user.cohortId });
      }
    }

    const announcements = await Announcement.findAll({
      where: whereClause,
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load announcements.' });
  }
});

// 13. Create Announcement Route (Teacher / Admin Only)
router.post('/', authenticateToken, async (req, res) => {
  if (!['teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { title, content, targetRole, targetCohortId } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  try {
    const announcement = await Announcement.create({
      title,
      content,
      author: req.user.name,
      date: new Date().toISOString().split('T')[0],
      targetRole: targetRole || 'all',
      targetCohortId: targetCohortId ? parseInt(targetCohortId, 10) : null
    });
    
    // Create notifications for targeted users
    const userWhereClause = {};
    if (targetRole && targetRole !== 'all') {
      userWhereClause.role = targetRole;
    }
    if (targetCohortId) {
      userWhereClause.cohortId = targetCohortId;
    }
    
    const targetUsers = await User.findAll({ where: userWhereClause });
    const notifications = targetUsers.map(u => ({
      userId: u.id,
      title: `New Announcement: ${title}`,
      message: content,
      type: 'announcement',
      link: '#/announcements'
    }));
    await Notification.bulkCreate(notifications);

    res.json({ success: true, announcement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create announcement.' });
  }
});

// 13a. Update/Delete Announcements (Teacher / Admin Only)
router.put('/:id', authenticateToken, async (req, res) => {
  if (!['teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { title, content, targetRole, targetCohortId } = req.body;
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) return res.status(404).json({ error: 'Announcement not found.' });
    
    await announcement.update({
      title,
      content,
      targetRole: targetRole || 'all',
      targetCohortId: targetCohortId ? parseInt(targetCohortId, 10) : null
    });
    res.json({ success: true, announcement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update announcement.' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  if (!['teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) return res.status(404).json({ error: 'Announcement not found.' });
    
    // Remove associated notifications so the unread badge updates
    await Notification.destroy({
      where: {
        title: `New Announcement: ${announcement.title}`,
        type: 'announcement'
      }
    });

    await announcement.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete announcement.' });
  }
});

export default router;
