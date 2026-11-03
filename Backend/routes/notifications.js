import express from 'express';
import { Notification } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. Get user notifications (auto-seeds personalized notifications if empty)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    if (notifications.length === 0) {
      const initialItems = [
        {
          userId: req.user.id,
          title: 'Welcome to Rise Her',
          message: 'Your workspace has been successfully activated under Generation Rise Foundation.',
          type: 'system',
          isRead: false
        },
        {
          userId: req.user.id,
          title: 'Account Security Notice',
          message: 'If you are using the initial temporary password (password123), please change it in My Profile.',
          type: 'system',
          isRead: false
        }
      ];

      if (req.user.role === 'mentor') {
        initialItems.unshift({
          userId: req.user.id,
          title: 'Mentorship Workspace Ready',
          message: 'You can now coordinate with your assigned scholars and staff via Messages.',
          type: 'message',
          isRead: false
        });
      } else if (req.user.role === 'teacher') {
        initialItems.unshift({
          userId: req.user.id,
          title: 'Curriculum & Cohort Desk',
          message: 'Your cohort assignments and lesson plans are live in the Global Hub.',
          type: 'announcement',
          isRead: false
        });
      }

      await Notification.bulkCreate(initialItems);
      notifications = await Notification.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
    }

    if (req.user.role !== 'admin') {
      notifications = notifications.filter(n =>
        n.type !== 'support' &&
        !n.title?.toLowerCase().includes('support') &&
        !n.title?.toLowerCase().includes('assistance') &&
        !n.link?.includes('assistance')
      );
    }

    res.json(notifications);
  } catch (err) {
    console.error('Failed to load notifications:', err);
    res.status(500).json({ error: 'Failed to load notifications.' });
  }
});

// 2. Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
});

// 3. Mark single notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!notification) return res.status(404).json({ error: 'Notification not found.' });
    
    notification.isRead = true;
    await notification.save();
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

// 4. Delete/Dismiss single notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!notification) return res.status(404).json({ error: 'Notification not found.' });

    await notification.destroy();
    res.json({ success: true, message: 'Notification dismissed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to dismiss notification.' });
  }
});

// 5. Create notification
router.post('/', authenticateToken, async (req, res) => {
  const { title, message, type, link, targetUserId } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required.' });
  }
  try {
    const notification = await Notification.create({
      userId: targetUserId || req.user.id,
      title,
      message,
      type: type || 'system',
      link: link || null,
      isRead: false
    });
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create notification.' });
  }
});

export default router;
