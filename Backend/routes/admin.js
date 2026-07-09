import express from 'express';
import fs from 'fs';
import path from 'path';
import { Lesson, Announcement } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const backupsDir = path.join(path.resolve(), 'backups');

// 14. Admin Database Backup Route (Admin Only)
router.post('/backup', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database_backup_${timestamp}.sqlite`;
    const destPath = path.join(backupsDir, filename);
    const sourcePath = './database.sqlite';

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      res.json({
        success: true,
        message: 'Database backup created successfully.',
        backup: {
          filename,
          timestamp: new Date(),
          size: (fs.statSync(destPath).size / 1024).toFixed(1) + ' KB'
        }
      });
    } else {
      res.status(404).json({ error: 'Source database file not found.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create database backup.' });
  }
});

// 14b. Download Database Backup (Admin Only)
router.get('/backup/download/:filename', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  const { filename } = req.params;
  const filePath = path.join(backupsDir, filename);

  // Prevent directory traversal attacks
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid backup file name.' });
  }

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename);
  } else {
    res.status(404).json({ error: 'Backup file not found.' });
  }
});

// 14c. Get Backups List (Admin Only)
router.get('/backups', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  try {
    const files = fs.readdirSync(backupsDir);
    const backups = files
      .filter(file => file.startsWith('database_backup_') && file.endsWith('.sqlite'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          timestamp: stats.mtime,
          size: (stats.size / 1024).toFixed(1) + ' KB'
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(backups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list backups.' });
  }
});

// 18. Delete Lesson (Admin/Teacher Only)
router.delete('/lessons/:id', authenticateToken, async (req, res) => {
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
router.put('/announcements/:id', authenticateToken, async (req, res) => {
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
router.delete('/announcements/:id', authenticateToken, async (req, res) => {
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

export default router;
