import express from 'express';
import { Submission, Lesson, User } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// 4. Submissions Route
router.get('/submissions', authenticateToken, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'scholar') {
      filter.scholarId = req.user.id;
    }
    const submissions = await Submission.findAll({
      where: filter,
      include: [{ model: Lesson, as: 'lesson' }]
    });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching submissions.' });
  }
});

// 5. Submit Task Route
router.post('/tasks/submit', authenticateToken, upload.single('file'), async (req, res) => {
  const { lessonId, score } = req.body;

  if (!lessonId) {
    return res.status(400).json({ error: 'Lesson ID is required for task submission.' });
  }

  try {
    // Check if submission already exists
    let submission = await Submission.findOne({
      where: { scholarId: req.user.id, lessonId }
    });

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const finalStatus = score !== undefined ? 'graded' : 'completed';
    const finalScore = score !== undefined ? parseInt(score, 10) : null;

    if (submission) {
      // Update existing
      submission.fileUrl = fileUrl || submission.fileUrl;
      submission.status = finalStatus;
      if (finalScore !== null) submission.score = finalScore;
      submission.submittedAt = new Date();
      await submission.save();
    } else {
      // Create new
      submission = await Submission.create({
        scholarId: req.user.id,
        lessonId,
        fileUrl,
        score: finalScore,
        status: finalStatus,
        submittedAt: new Date()
      });
    }

    res.json({ success: true, submission });
  } catch (err) {
    console.error('Task submission error:', err);
    res.status(500).json({ error: 'Error submitting task.' });
  }
});

// 6. Grade Submission Route (Mentors/Teachers)
router.post('/submissions/:id/grade', authenticateToken, async (req, res) => {
  if (!['mentor', 'teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Only mentors or teachers can grade.' });
  }

  const { id } = req.params;
  const { score, feedback } = req.body;

  if (score === undefined) {
    return res.status(400).json({ error: 'Score is required.' });
  }

  try {
    const submission = await Submission.findByPk(id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission record not found.' });
    }

    submission.score = score;
    submission.feedback = feedback || '';
    submission.status = 'graded';
    await submission.save();

    res.json({ success: true, submission });
  } catch (err) {
    res.status(500).json({ error: 'Error saving grading logs.' });
  }
});

// 21. Delete Submission (Admin/Teacher/Mentor Only)
router.delete('/admin/submissions/:id', authenticateToken, async (req, res) => {
  if (!['admin', 'teacher', 'mentor'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { id } = req.params;
  try {
    const submission = await Submission.findByPk(id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }
    await submission.destroy();
    res.json({ success: true, message: 'Submission deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete submission.' });
  }
});

// 22. Get All Submissions (Admin / Teacher / Mentor Only)
router.get('/admin/submissions', authenticateToken, async (req, res) => {
  if (!['admin', 'teacher', 'mentor'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const submissions = await Submission.findAll({
      include: [
        { model: Lesson, as: 'lesson' },
        { model: User, as: 'scholar', attributes: ['name', 'email', 'university'] }
      ],
      order: [['submittedAt', 'DESC']]
    });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all submissions.' });
  }
});

export default router;
