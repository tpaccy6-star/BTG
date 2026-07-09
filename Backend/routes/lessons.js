import express from 'express';
import { Op } from 'sequelize';
import { Lesson } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// 3. Lessons Catalog Route
router.get('/', authenticateToken, async (req, res) => {
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

// 11. Create or Update Lesson (Teacher / Admin)
router.post('/', authenticateToken, async (req, res) => {
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
router.post('/upload-resource', authenticateToken, upload.single('file'), async (req, res) => {
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

export default router;
