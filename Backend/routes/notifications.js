import express from 'express';
import { Notification } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notifications.' });
  }
});

router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!notification) return res.status(404).json({ error: 'Not found.' });
    
    notification.isRead = true;
    await notification.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

export default router;
