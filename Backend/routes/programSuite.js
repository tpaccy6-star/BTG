import express from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import sequelize from '../database.js';
import {
  User,
  Cohort,
  Notification,
  ProgramReport,
  ProgramAcademicResult,
  ProgramFriendlyWeek,
  ProgramMentorship,
  ProgramAssistance,
  ProgramAttachment
} from '../models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const staffRoles = new Set(['mentor', 'teacher', 'admin']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 }
});
const attachmentDirectory = path.resolve(
  process.env.PROGRAM_UPLOAD_DIR || path.join(process.cwd(), 'private_uploads')
);
const attachmentTypes = new Map([
  ['.pdf', 'application/pdf'],
  ['.doc', 'application/msword'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.ppt', 'application/vnd.ms-powerpoint'],
  ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ['.xls', 'application/vnd.ms-excel'],
  ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
]);

router.use(authenticateToken);

function isStaff(user) {
  return staffRoles.has(user.role);
}

function fail(res, status, detail) {
  return res.status(status).json({ detail });
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function validText(value, min, max) {
  return typeof value === 'string' && value.trim().length >= min && value.length <= max;
}

function optionalText(value, max) {
  return value == null || (typeof value === 'string' && value.length <= max);
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validDateTime(value) {
  return value == null || (
    typeof value === 'string' &&
    value.length <= 40 &&
    !Number.isNaN(new Date(value).valueOf())
  );
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validUuid(value) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function plain(model) {
  return model?.get ? model.get({ plain: true }) : model;
}

function publicPerson(user) {
  const person = plain(user);
  return {
    id: person.id,
    full_name: person.name,
    email: person.email,
    role: person.role,
    is_active: true,
    cohort_id: person.cohortId
  };
}

function publicAttachment(file) {
  const attachment = plain(file);
  return {
    id: attachment.id,
    file_name: attachment.fileName,
    content_type: attachment.contentType,
    file_size: attachment.fileSize,
    created_at: attachment.createdAt
  };
}

function publicReport(record) {
  const report = plain(record);
  return {
    id: report.id,
    beneficiary_id: report.beneficiaryId,
    beneficiary_name: report.beneficiary?.name,
    title: report.title,
    content: report.content,
    status: report.status,
    staff_feedback: report.staffFeedback,
    created_at: report.createdAt,
    attachments: (report.attachments || []).map(publicAttachment)
  };
}

function publicAcademicResult(record) {
  const result = plain(record);
  return {
    id: result.id,
    beneficiary_id: result.beneficiaryId,
    beneficiary_name: result.beneficiary?.name,
    school: result.school,
    academic_year: result.academicYear,
    term: result.term,
    subject: result.subject,
    score: result.score,
    max_score: result.maxScore,
    status: result.status,
    staff_feedback: result.staffFeedback,
    created_at: result.createdAt,
    attachments: (result.attachments || []).map(publicAttachment)
  };
}

function publicFriendlyWeek(record) {
  const week = plain(record);
  return {
    id: week.id,
    beneficiary_one_id: week.beneficiaryOneId,
    beneficiary_two_id: week.beneficiaryTwoId,
    beneficiary_one_name: week.beneficiaryOne?.name || 'Unknown participant',
    beneficiary_two_name: week.beneficiaryTwo?.name || 'Unknown participant',
    week_start: week.weekStart,
    status: week.status,
    notes: week.notes,
    created_at: week.createdAt
  };
}

function publicMentorship(record) {
  const mentorship = plain(record);
  return {
    id: mentorship.id,
    beneficiary_id: mentorship.beneficiaryId,
    beneficiary_name: mentorship.beneficiary?.name,
    cohort_id: mentorship.cohortId,
    cohort_name: mentorship.cohort?.name || null,
    mentor_name: mentorship.mentorName,
    goal: mentorship.goal,
    next_session: mentorship.nextSession,
    status: mentorship.status,
    notes: mentorship.notes,
    created_at: mentorship.createdAt
  };
}

function publicAssistance(record) {
  const assistance = plain(record);
  return {
    id: assistance.id,
    beneficiary_id: assistance.beneficiaryId,
    beneficiary_name: assistance.beneficiary?.name,
    support_type: assistance.supportType,
    amount: assistance.amount,
    currency: assistance.currency,
    support_date: assistance.supportDate,
    details: assistance.details,
    status: assistance.status,
    created_at: assistance.createdAt
  };
}

async function notifyUser(userId, title, message, link, type) {
  await Notification.create({
    userId,
    title,
    message,
    link: `#/${link}`,
    type
  });
}

async function notifyStaff(title, message, link, type) {
  // ONLY Admin receives beneficiary / support requests
  const staff = await User.findAll({
    attributes: ['id'],
    where: { role: 'admin' }
  });
  await Promise.all(staff.map((person) => notifyUser(person.id, title, message, link, type)));
}

async function findScholar(id) {
  if (!validUuid(id)) return null;
  return User.findOne({ where: { id, role: 'scholar' } });
}

function includeAttachments() {
  return { model: ProgramAttachment, as: 'attachments', required: false };
}

function attachmentSignatureIsValid(buffer, extension) {
  if (extension === '.pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (['.doc', '.ppt', '.xls'].includes(extension)) {
    return buffer.subarray(0, 8).equals(Buffer.from('D0CF11E0A1B11AE1', 'hex'));
  }
  const requiredArchiveEntry = {
    '.docx': 'word/document.xml',
    '.pptx': 'ppt/presentation.xml',
    '.xlsx': 'xl/workbook.xml'
  }[extension];
  if (!requiredArchiveEntry) return false;
  try {
    const entries = new Set(new AdmZip(buffer).getEntries().map((entry) => entry.entryName));
    return entries.has('[Content_Types].xml') && entries.has(requiredArchiveEntry);
  } catch {
    return false;
  }
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  let text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function sendCsv(res, filename, columns, rows) {
  const lines = [
    columns.map((column) => escapeCsv(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => escapeCsv(column.value(row))).join(','))
  ];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(lines.join('\r\n'));
}

async function generateText(prompt, fallback) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  if (!geminiKey && !groqKey) return fallback;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = geminiKey
      ? await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 260, temperature: 0.7 }
          })
        }
      )
      : await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 260,
          temperature: 0.7
        })
      });
    if (!response.ok) {
      throw new Error(`Text generation provider returned HTTP ${response.status}.`);
    }
    const data = await response.json();
    const text = (geminiKey
      ? data?.candidates?.[0]?.content?.parts?.[0]?.text
      : data?.choices?.[0]?.message?.content)?.trim();
    if (!text) throw new Error('Text generation provider returned no text.');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

function requireStaff(req, res) {
  if (isStaff(req.user)) return true;
  fail(res, 403, 'Staff access is required.');
  return false;
}

function requireScholar(req, res) {
  if (req.user.role === 'scholar') return true;
  fail(res, 403, 'Only scholars can submit this information.');
  return false;
}

// Dashboard summary
router.get('/dashboard', asyncRoute(async (req, res) => {
  const staff = isStaff(req.user);
  if (!staff && req.user.role !== 'scholar') return fail(res, 403, 'Access denied.');
  const userFilter = staff ? {} : { beneficiaryId: req.user.id };
  const weekFilter = staff ? {} : {
    [Op.or]: [{ beneficiaryOneId: req.user.id }, { beneficiaryTwoId: req.user.id }],
    status: 'Confirmed'
  };
  const [reports, academics, friendlyWeeks, mentorships, assistance] = await Promise.all([
    ProgramReport.count({ where: userFilter }),
    ProgramAcademicResult.count({ where: userFilter }),
    ProgramFriendlyWeek.count({ where: weekFilter }),
    ProgramMentorship.count({ where: userFilter }),
    ProgramAssistance.count({ where: userFilter })
  ]);
  const reviewedResults = staff ? [] : await ProgramAcademicResult.findAll({
    where: { beneficiaryId: req.user.id, status: 'Reviewed' },
    attributes: ['score', 'maxScore']
  });
  const average = reviewedResults.length
    ? Number((reviewedResults.reduce((sum, item) => sum + item.score / item.maxScore, 0) /
      reviewedResults.length * 100).toFixed(1))
    : null;
  const activities = [];
  const [recentReports, recentResults, recentMentorships] = await Promise.all([
    ProgramReport.findAll({ where: userFilter, order: [['createdAt', 'DESC']], limit: 4 }),
    ProgramAcademicResult.findAll({ where: userFilter, order: [['createdAt', 'DESC']], limit: 4 }),
    ProgramMentorship.findAll({ where: userFilter, order: [['createdAt', 'DESC']], limit: 4 })
  ]);
  recentReports.forEach((item) => activities.push({
    detail: 'Reports', title: item.title, status: item.status,
    created_at: item.createdAt, type: 'orange'
  }));
  recentResults.forEach((item) => activities.push({
    detail: 'Academic Results', title: item.subject, status: item.status,
    created_at: item.createdAt, type: 'purple'
  }));
  recentMentorships.forEach((item) => activities.push({
    detail: 'Mentorship', title: item.mentorName, status: item.status,
    created_at: item.createdAt, type: 'blue'
  }));
  activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({
    stats: staff
      ? { beneficiaries_count: await User.count({ where: { role: 'scholar' } }),
          friendly_weeks_count: friendlyWeeks, academic_results_count: academics,
          financial_assistance_count: assistance }
      : { academic_results_count: academics, friendly_weeks_count: friendlyWeeks,
          reviewed_average: average, financial_assistance_count: assistance },
    counts: { reports, academic_results: academics, friendly_weeks: friendlyWeeks,
      mentorships, assistance },
    activities: activities.slice(0, 8)
  });
}));

// Cohorts reuse BTG cohorts and scholar accounts.
router.get('/cohorts', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const cohorts = await Cohort.findAll({
    include: [{
      model: User, as: 'scholarsList', required: false,
      where: { role: 'scholar' }, attributes: ['id', 'name', 'email', 'role', 'cohortId']
    }],
    order: [['name', 'ASC']]
  });
  res.json(cohorts.map((item) => {
    const cohort = plain(item);
    const members = cohort.scholarsList || [];
    return {
      id: cohort.id, name: cohort.name, description: cohort.description || null,
      created_at: cohort.createdAt, beneficiary_count: members.length,
      beneficiaries: members.map(publicPerson)
    };
  }));
}));

router.post('/cohorts', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { name, description, beneficiary_ids: ids = [] } = req.body || {};
  if (!validText(name, 2, 120) || !optionalText(description, 5000) ||
      !Array.isArray(ids) || !ids.every(validUuid) || new Set(ids).size !== ids.length) {
    return fail(res, 422, 'Enter a valid cohort name, description, and member list.');
  }
  const created = await sequelize.transaction(async (transaction) => {
    const members = ids.length ? await User.findAll({
      where: { id: { [Op.in]: ids }, role: 'scholar' }, transaction
    }) : [];
    if (members.length !== ids.length) {
      throw httpError(404, 'One or more scholar accounts were not found.');
    }
    if (members.some((member) => member.cohortId != null)) {
      throw httpError(409, 'Remove scholars from their current cohorts before reassigning them.');
    }
    const cohorts = await Cohort.findAll({ attributes: ['name'], transaction });
    if (cohorts.some((cohort) => cohort.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      throw httpError(409, 'A cohort with this name already exists.');
    }
    const cohort = await Cohort.create({ name: name.trim(), description: description?.trim() || null }, { transaction });
    await User.update({ cohortId: cohort.id }, {
      where: { id: { [Op.in]: ids } }, transaction
    });
    return cohort;
  });
  res.status(201).json({ id: created.id, name: created.name, description: created.description });
}));

router.put('/cohorts/:cohortId/members', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const cohortId = Number(req.params.cohortId);
  const ids = req.body?.beneficiary_ids;
  if (!Number.isInteger(cohortId) || cohortId < 1 || !Array.isArray(ids) ||
      !ids.every(validUuid) || new Set(ids).size !== ids.length) {
    return fail(res, 422, 'Enter a valid list of cohort members.');
  }
  await sequelize.transaction(async (transaction) => {
    const cohort = await Cohort.findByPk(cohortId, { transaction });
    if (!cohort) {
      throw httpError(404, 'Cohort not found.');
    }
    const members = ids.length ? await User.findAll({
      where: { id: { [Op.in]: ids }, role: 'scholar' }, transaction
    }) : [];
    if (members.length !== ids.length) {
      throw httpError(404, 'One or more scholar accounts were not found.');
    }
    if (members.some((member) => member.cohortId != null && member.cohortId !== cohortId)) {
      throw httpError(409, 'Remove scholars from their current cohorts before reassigning them.');
    }
    await User.update({ cohortId: null }, { where: { cohortId }, transaction });
    if (ids.length) await User.update({ cohortId }, {
      where: { id: { [Op.in]: ids } }, transaction
    });
  });
  res.json({ success: true });
}));

router.post('/cohorts/:cohortId/mentorship', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const cohortId = Number(req.params.cohortId);
  const { mentor_name: mentorName, goal, next_session: nextSession, notes, status = 'Pending' } = req.body || {};
  if (!Number.isInteger(cohortId) || cohortId < 1 || !validText(mentorName, 2, 150) ||
      !validText(goal, 3, 5000) || !optionalText(notes, 5000) ||
      !validDateTime(nextSession) ||
      !['Pending', 'Completed', 'Cancelled'].includes(status)) {
    return fail(res, 422, 'Enter valid mentorship details.');
  }
  const cohort = await Cohort.findByPk(cohortId, {
    include: [{ model: User, as: 'scholarsList', where: { role: 'scholar' }, required: false }]
  });
  if (!cohort) return fail(res, 404, 'Cohort not found.');
  const members = cohort.scholarsList || [];
  if (!members.length) return fail(res, 409, 'Add scholars to this cohort before assigning a mentor.');
  const rows = await ProgramMentorship.bulkCreate(members.map((member) => ({
    beneficiaryId: member.id, cohortId, mentorName: mentorName.trim(),
    goal: goal.trim(), nextSession: nextSession || null, notes: notes?.trim() || null, status
  })));
  res.status(201).json(rows.map(publicMentorship));
}));

// Reports
router.get('/reports', asyncRoute(async (req, res) => {
  if (!isStaff(req.user) && req.user.role !== 'scholar') return fail(res, 403, 'Access denied.');
  const reports = await ProgramReport.findAll({
    where: isStaff(req.user) ? {} : { beneficiaryId: req.user.id },
    include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name'] }, includeAttachments()],
    order: [['createdAt', 'DESC']]
  });
  res.json(reports.map(publicReport));
}));

router.post('/reports', asyncRoute(async (req, res) => {
  if (!requireScholar(req, res)) return;
  const { title, content } = req.body || {};
  if (!validText(title, 3, 160) || !validText(content, 5, 10000)) {
    return fail(res, 422, 'Enter a report title and content.');
  }
  const report = await ProgramReport.create({
    beneficiaryId: req.user.id, title: title.trim(), content: content.trim()
  });
  res.status(201).json(publicReport(report));
}));

router.patch('/reports/:reportId', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { status, staff_feedback: feedback = null } = req.body || {};
  if (!['Pending', 'Reviewed', 'Follow-up'].includes(status) || !optionalText(feedback, 10000)) {
    return fail(res, 422, 'Enter a valid report status and feedback.');
  }
  const report = await ProgramReport.findByPk(req.params.reportId);
  if (!report) return fail(res, 404, 'Report not found.');
  await report.update({ status, staffFeedback: feedback });
  const feedbackSnippet = feedback ? ` Feedback: "${feedback.slice(0, 100)}${feedback.length > 100 ? '...' : ''}"` : '';
  await notifyUser(report.beneficiaryId, 'Report reviewed',
    `Your report "${report.title}" has been reviewed (${status}).${feedbackSnippet}`, 'reports', 'report');
  res.json(publicReport(report));
}));

// Academic results
router.get('/academic-results', asyncRoute(async (req, res) => {
  if (!isStaff(req.user) && req.user.role !== 'scholar') return fail(res, 403, 'Access denied.');
  const records = await ProgramAcademicResult.findAll({
    where: isStaff(req.user) ? {} : { beneficiaryId: req.user.id },
    include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name'] }, includeAttachments()],
    order: [['createdAt', 'DESC']]
  });
  res.json(records.map(publicAcademicResult));
}));

router.post('/academic-results', asyncRoute(async (req, res) => {
  if (!isStaff(req.user) && !requireScholar(req, res)) return;
  const { school, academic_year: academicYear, term, subject, score, max_score: maxScore } = req.body || {};
  const beneficiaryId = req.user.role === 'scholar' ? req.user.id : req.body?.beneficiary_id;
  if (!validText(school, 2, 160) || !validText(academicYear, 4, 20) ||
      !validText(term, 1, 80) || !validText(subject, 1, 120) ||
      typeof score !== 'number' || typeof maxScore !== 'number' ||
      !Number.isFinite(score) || !Number.isFinite(maxScore) ||
      score < 0 || maxScore <= 0 || score > maxScore) {
    return fail(res, 422, 'Enter valid academic result details and scores.');
  }
  if (!validUuid(beneficiaryId) || !(await findScholar(beneficiaryId))) {
    return fail(res, 404, 'Scholar account not found.');
  }
  const result = await ProgramAcademicResult.create({
    beneficiaryId, school: school.trim(), academicYear: academicYear.trim(),
    term: term.trim(), subject: subject.trim(), score, maxScore
  });
  res.status(201).json(publicAcademicResult(result));
}));

router.patch('/academic-results/:resultId', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { status, staff_feedback: feedback = null } = req.body || {};
  if (!['Pending', 'Reviewed', 'Follow-up'].includes(status) || !optionalText(feedback, 10000)) {
    return fail(res, 422, 'Enter a valid academic result status and feedback.');
  }
  const result = await ProgramAcademicResult.findByPk(req.params.resultId);
  if (!result) return fail(res, 404, 'Academic result not found.');
  await result.update({ status, staffFeedback: feedback });
  await notifyUser(result.beneficiaryId, 'Academic results reviewed',
    `Your ${result.subject} result for ${result.term} has been reviewed (${status}).`,
    'academic-results', 'academic');
  res.json(publicAcademicResult(result));
}));

// Private document attachments for reports and academic results.
async function addAttachment(req, res, recordType) {
  const recordId = recordType === 'report' ? req.params.reportId : req.params.resultId;
  const Model = recordType === 'report' ? ProgramReport : ProgramAcademicResult;
  const record = await Model.findByPk(recordId);
  if (!record || (!isStaff(req.user) && record.beneficiaryId !== req.user.id)) {
    return fail(res, 404, 'Record not found.');
  }
  const file = req.file;
  if (!file) return fail(res, 400, 'Choose an attachment to upload.');
  const fileName = path.basename(file.originalname || '').replace(/[^A-Za-z0-9._ -]/g, '_').slice(0, 255);
  const extension = path.extname(fileName).toLowerCase();
  const contentType = attachmentTypes.get(extension);
  if (!fileName || !contentType) return fail(res, 415, 'Choose a Word, PDF, PowerPoint, or Excel document.');
  if (!file.size || !attachmentSignatureIsValid(file.buffer, extension)) {
    return fail(res, 400, 'The file contents do not match the selected document type.');
  }
  await fs.mkdir(attachmentDirectory, { recursive: true });
  const storageKey = `${randomUUID().replaceAll('-', '')}${extension}`;
  const location = path.join(attachmentDirectory, storageKey);
  await fs.writeFile(location, file.buffer, { flag: 'wx' });
  try {
    const attachment = await ProgramAttachment.create({
      ...(recordType === 'report' ? { reportId: record.id } : { academicResultId: record.id }),
      uploadedById: req.user.id, fileName, storageKey, contentType, fileSize: file.size
    });
    return res.status(201).json(publicAttachment(attachment));
  } catch (error) {
    await fs.unlink(location).catch((cleanupError) => console.error('Attachment cleanup failed:', cleanupError));
    throw error;
  }
}

router.post('/reports/:reportId/attachments', upload.single('file'), asyncRoute((req, res) => addAttachment(req, res, 'report')));
router.post('/academic-results/:resultId/attachments', upload.single('file'), asyncRoute((req, res) => addAttachment(req, res, 'academic')));

router.get('/attachments/:attachmentId/download', asyncRoute(async (req, res) => {
  const attachment = await ProgramAttachment.findByPk(req.params.attachmentId);
  if (!attachment) return fail(res, 404, 'Attachment not found.');
  let record;
  if (attachment.reportId) record = await ProgramReport.findByPk(attachment.reportId);
  if (attachment.academicResultId) record = await ProgramAcademicResult.findByPk(attachment.academicResultId);
  if (!record || (!isStaff(req.user) && record.beneficiaryId !== req.user.id)) {
    return fail(res, 404, 'Attachment not found.');
  }
  const location = path.join(attachmentDirectory, path.basename(attachment.storageKey));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.download(location, attachment.fileName, (error) => {
    if (error && !res.headersSent) res.status(error.code === 'ENOENT' ? 404 : 500).json({ detail: 'Attachment could not be downloaded.' });
  });
}));

// Friendly Weeks pairings
router.get('/friendly-weeks', asyncRoute(async (req, res) => {
  if (!isStaff(req.user) && req.user.role !== 'scholar') return fail(res, 403, 'Access denied.');
  const where = isStaff(req.user) ? {} : {
    [Op.or]: [{ beneficiaryOneId: req.user.id }, { beneficiaryTwoId: req.user.id }],
    status: 'Confirmed'
  };
  const weeks = await ProgramFriendlyWeek.findAll({
    where,
    include: [
      { model: User, as: 'beneficiaryOne', attributes: ['id', 'name'] },
      { model: User, as: 'beneficiaryTwo', attributes: ['id', 'name'] }
    ],
    order: [['weekStart', 'DESC']]
  });
  res.json(weeks.map(publicFriendlyWeek));
}));

router.post('/friendly-weeks', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { beneficiary_one_id: oneId, beneficiary_two_id: twoId, week_start: weekStart, notes, status = 'Pending' } = req.body || {};
  if (!validUuid(oneId) || !validUuid(twoId) || oneId === twoId || !validDate(weekStart) ||
      !optionalText(notes, 5000) || !['Pending', 'Confirmed', 'Cancelled'].includes(status)) {
    return fail(res, 422, 'Enter valid Friendly Week pairing details.');
  }
  const [one, two] = await Promise.all([findScholar(oneId), findScholar(twoId)]);
  if (!one || !two) return fail(res, 404, 'Scholar account not found.');
  const week = await ProgramFriendlyWeek.create({
    beneficiaryOneId: oneId, beneficiaryTwoId: twoId, weekStart,
    notes: notes?.trim() || null, status
  });
  await Promise.all([
    notifyUser(oneId, 'Friendly Week pairing', `${two.name} is your peer partner for the week of ${weekStart}.`, 'friendly-weeks', 'program'),
    notifyUser(twoId, 'Friendly Week pairing', `${one.name} is your peer partner for the week of ${weekStart}.`, 'friendly-weeks', 'program')
  ]);
  await week.reload({ include: [
    { model: User, as: 'beneficiaryOne', attributes: ['id', 'name'] },
    { model: User, as: 'beneficiaryTwo', attributes: ['id', 'name'] }
  ] });
  res.status(201).json(publicFriendlyWeek(week));
}));

router.patch('/friendly-weeks/:pairingId', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { status } = req.body || {};
  if (!['Pending', 'Confirmed', 'Cancelled'].includes(status)) {
    return fail(res, 422, 'Enter a valid Friendly Week status.');
  }
  const week = await ProgramFriendlyWeek.findByPk(req.params.pairingId);
  if (!week) return fail(res, 404, 'Friendly Week pairing not found.');
  await week.update({ status });
  await week.reload({ include: [
    { model: User, as: 'beneficiaryOne', attributes: ['id', 'name'] },
    { model: User, as: 'beneficiaryTwo', attributes: ['id', 'name'] }
  ] });
  res.json(publicFriendlyWeek(week));
}));

router.post('/friendly-weeks/ai-generate', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { week_start: weekStart, cohort_id: cohortId, focus = 'all', auto_save: autoSave = false } = req.body || {};
  if (weekStart && !validDate(weekStart)) return fail(res, 422, 'Enter a valid week start date.');
  if (cohortId !== undefined && cohortId !== null && cohortId !== '' &&
      (!Number.isInteger(Number(cohortId)) || Number(cohortId) < 1)) {
    return fail(res, 422, 'Enter a valid cohort.');
  }
  const start = weekStart || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const where = { role: 'scholar' };
  if (cohortId !== undefined && cohortId !== null && cohortId !== '') where.cohortId = Number(cohortId);
  const scholars = await User.findAll({ where, attributes: ['id', 'name', 'cohortId'], order: [['name', 'ASC']] });
  if (scholars.length < 2) return fail(res, 400, 'At least two scholars are required to generate pairings.');
  const history = await ProgramFriendlyWeek.findAll({ attributes: ['beneficiaryOneId', 'beneficiaryTwoId', 'weekStart'] });
  const counts = new Map();
  history.forEach(({ beneficiaryOneId, beneficiaryTwoId }) => {
    const key = [beneficiaryOneId, beneficiaryTwoId].sort().join(':');
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const pool = [...scholars].sort(() => Math.random() - 0.5);
  const pairings = [];
  while (pool.length > 1) {
    const first = pool.shift();
    let bestIndex = 0;
    let bestCount = Infinity;
    pool.forEach((candidate, index) => {
      const key = [first.id, candidate.id].sort().join(':');
      const count = counts.get(key) || 0;
      if (count < bestCount) { bestCount = count; bestIndex = index; }
    });
    const [second] = pool.splice(bestIndex, 1);
    pairings.push({
      beneficiary_one_id: first.id, beneficiary_two_id: second.id,
      beneficiary_one_name: first.name, beneficiary_two_name: second.name,
      week_start: start, status: 'Pending',
      notes: `${first.name} and ${second.name} will connect for a ${focus === 'academic' ? 'peer study and revision' : 'supportive weekly'} check-in.`
    });
  }
  if (!autoSave) return res.json({ week_start: start, pairings, saved: false });
  const records = await sequelize.transaction(async (transaction) => Promise.all(pairings.map((pair) =>
    ProgramFriendlyWeek.create({
      beneficiaryOneId: pair.beneficiary_one_id, beneficiaryTwoId: pair.beneficiary_two_id,
      weekStart: pair.week_start, status: pair.status, notes: pair.notes
    }, { transaction })
  )));
  await Promise.all(pairings.flatMap((pair) => [
    notifyUser(pair.beneficiary_one_id, 'Friendly Week pairing',
      `${pair.beneficiary_two_name} is your peer partner for the week of ${start}.`, 'friendly-weeks', 'program'),
    notifyUser(pair.beneficiary_two_id, 'Friendly Week pairing',
      `${pair.beneficiary_one_name} is your peer partner for the week of ${start}.`, 'friendly-weeks', 'program')
  ]));
  res.status(201).json({ week_start: start, pairings, saved: true, saved_count: records.length });
}));

router.post('/friendly-weeks/bulk-create', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { pairings, status = 'Pending' } = req.body || {};
  if (!Array.isArray(pairings) || !pairings.length || pairings.length > 100 ||
      !['Pending', 'Confirmed', 'Cancelled'].includes(status) ||
      pairings.some((pair) => !validUuid(pair.beneficiary_one_id) ||
        !validUuid(pair.beneficiary_two_id) || pair.beneficiary_one_id === pair.beneficiary_two_id ||
        !validDate(pair.week_start) || !optionalText(pair.notes, 5000))) {
    return fail(res, 422, 'Provide a valid list of pairings to save.');
  }
  const scholarIds = [...new Set(pairings.flatMap((pair) => [
    pair.beneficiary_one_id, pair.beneficiary_two_id
  ]))];
  const scholarsFound = await User.count({
    where: { id: { [Op.in]: scholarIds }, role: 'scholar' }
  });
  if (scholarsFound !== scholarIds.length) return fail(res, 404, 'One or more scholar accounts were not found.');
  const saved = await sequelize.transaction(async (transaction) => Promise.all(pairings.map((pair) =>
    ProgramFriendlyWeek.create({
      beneficiaryOneId: pair.beneficiary_one_id, beneficiaryTwoId: pair.beneficiary_two_id,
      weekStart: pair.week_start, status, notes: pair.notes?.trim() || null
    }, { transaction })
  )));
  await Promise.all(pairings.flatMap((pair) => [
    notifyUser(pair.beneficiary_one_id, 'Friendly Week pairing',
      `${pair.beneficiary_two_name || 'Your peer partner'} is your peer partner for the week of ${pair.week_start}.`, 'friendly-weeks', 'program'),
    notifyUser(pair.beneficiary_two_id, 'Friendly Week pairing',
      `${pair.beneficiary_one_name || 'Your peer partner'} is your peer partner for the week of ${pair.week_start}.`, 'friendly-weeks', 'program')
  ]));
  res.status(201).json({ count: saved.length, records: saved.map(publicFriendlyWeek) });
}));

router.post('/friendly-weeks/ai-suggest-activity', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { beneficiary_one_id: oneId, beneficiary_two_id: twoId, week_start: weekStart, focus = 'all' } = req.body || {};
  if (!validUuid(oneId) || !validUuid(twoId) || oneId === twoId) {
    return fail(res, 422, 'Select two different scholars.');
  }
  const [one, two] = await Promise.all([findScholar(oneId), findScholar(twoId)]);
  if (!one || !two) return fail(res, 404, 'Scholar account not found.');
  const activity = await generateText(
    `Suggest a short positive peer activity for ${one.name} and ${two.name}. Theme: ${focus}. Week starting ${weekStart || 'next week'}.`,
    `${one.name} and ${two.name} will share a 45-minute study or wellbeing check-in, exchange one useful idea, and agree on a small goal for the week.`
  );
  res.json({ activity });
}));

router.get('/friendly-weeks/ai-suggest-partner/:beneficiaryId', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const person = await findScholar(req.params.beneficiaryId);
  if (!person) return fail(res, 404, 'Scholar account not found.');
  const recent = await ProgramFriendlyWeek.findAll({
    where: { [Op.or]: [
      { beneficiaryOneId: person.id }, { beneficiaryTwoId: person.id }
    ] },
    order: [['weekStart', 'DESC']]
  });
  const excluded = new Set([person.id]);
  recent.forEach((pair) => {
    excluded.add(pair.beneficiaryOneId === person.id ? pair.beneficiaryTwoId : pair.beneficiaryOneId);
  });
  const candidate = await User.findOne({
    where: { role: 'scholar', cohortId: person.cohortId, id: { [Op.notIn]: [...excluded] } },
    order: [['name', 'ASC']]
  });
  if (!candidate) return fail(res, 404, 'No new peer partner is available in this cohort.');
  res.json({ beneficiary_id: candidate.id, beneficiary_name: candidate.name });
}));

// Mentorship
router.get('/mentorship', asyncRoute(async (req, res) => {
  if (!isStaff(req.user) && req.user.role !== 'scholar') return fail(res, 403, 'Access denied.');
  const records = await ProgramMentorship.findAll({
    where: isStaff(req.user) ? {} : {
      beneficiaryId: req.user.id, status: { [Op.in]: ['Pending', 'Completed'] }
    },
    include: [
      { model: User, as: 'beneficiary', attributes: ['id', 'name'] },
      { model: Cohort, as: 'cohort', attributes: ['id', 'name'], required: false }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json(records.map(publicMentorship));
}));

router.post('/mentorship', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { beneficiary_id: beneficiaryId, mentor_name: mentorName, goal, next_session: nextSession, notes, status = 'Pending' } = req.body || {};
  if (!validUuid(beneficiaryId) || !validText(mentorName, 2, 150) || !validText(goal, 3, 5000) ||
      !optionalText(notes, 5000) || !['Pending', 'Completed', 'Cancelled'].includes(status)) {
    return fail(res, 422, 'Enter valid mentorship details.');
  }
  const scholar = await findScholar(beneficiaryId);
  if (!scholar) return fail(res, 404, 'Scholar account not found.');
  const row = await ProgramMentorship.create({
    beneficiaryId, cohortId: scholar.cohortId, mentorName: mentorName.trim(),
    goal: goal.trim(), nextSession: nextSession || null, notes: notes?.trim() || null, status
  });
  res.status(201).json(publicMentorship(await ProgramMentorship.findByPk(row.id, {
    include: [
      { model: User, as: 'beneficiary', attributes: ['id', 'name'] },
      { model: Cohort, as: 'cohort', attributes: ['id', 'name'], required: false }
    ]
  })));
}));

router.patch('/mentorship/:mentorshipId', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { status } = req.body || {};
  if (!['Pending', 'Completed', 'Cancelled'].includes(status)) return fail(res, 422, 'Enter a valid mentorship status.');
  const row = await ProgramMentorship.findByPk(req.params.mentorshipId);
  if (!row) return fail(res, 404, 'Mentorship plan not found.');
  await row.update({ status });
  const updated = await ProgramMentorship.findByPk(row.id, {
    include: [
      { model: User, as: 'beneficiary', attributes: ['id', 'name'] },
      { model: Cohort, as: 'cohort', attributes: ['id', 'name'], required: false }
    ]
  });
  res.json(publicMentorship(updated));
}));

// Support and financial assistance (Admin only coordinates and views)
router.get('/financial-assistance', asyncRoute(async (req, res) => {
  if (req.user.role !== 'admin') return fail(res, 403, 'Access denied. Only administrators can view beneficiary support requests.');
  const records = await ProgramAssistance.findAll({
    include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name'] }],
    order: [['supportDate', 'DESC'], ['createdAt', 'DESC']]
  });
  res.json(records.map(publicAssistance));
}));

router.get('/financial-assistance/summary', asyncRoute(async (req, res) => {
  if (req.user.role !== 'admin') return fail(res, 403, 'Access denied. Only administrators can view assistance summaries.');
  const records = await ProgramAssistance.findAll({
    attributes: ['currency', 'amount']
  });
  const totals = {};
  let inKindCount = 0;
  records.forEach((record) => {
    const amount = Number(record.amount) || 0;
    if (amount > 0) totals[record.currency] = (totals[record.currency] || 0) + amount;
    else inKindCount += 1;
  });
  res.json({ record_count: records.length, totals_by_currency: totals, in_kind_count: inKindCount });
}));

router.post('/financial-assistance', asyncRoute(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'scholar') {
    return fail(res, 403, 'Access denied. Only administrators can manage support and assistance.');
  }
  const { beneficiary_id: suppliedId, support_type: supportType, amount, currency = 'RWF',
    support_date: suppliedDate, details } = req.body || {};
  const beneficiaryId = req.user.role === 'scholar' ? req.user.id : suppliedId;
  const numericAmount = amount === '' || amount == null ? 0 : Number(amount);
  const finalCurrency = String(currency).trim().toUpperCase();
  const supportDate = req.user.role === 'scholar'
    ? (suppliedDate || new Date().toISOString().slice(0, 10)) : suppliedDate;
  if (!validUuid(beneficiaryId) || !validText(supportType, 2, 100) ||
      !Number.isFinite(numericAmount) || numericAmount < 0 ||
      !/^[A-Z]{3}$/.test(finalCurrency) || !validDate(supportDate) || !optionalText(details, 5000)) {
    return fail(res, 422, 'Enter valid support and assistance details.');
  }
  const scholar = await findScholar(beneficiaryId);
  if (!scholar) return fail(res, 404, 'Scholar account not found.');
  const isRequest = req.user.role === 'scholar';
  const record = await ProgramAssistance.create({
    beneficiaryId, supportType: supportType.trim(), amount: numericAmount, currency: finalCurrency,
    supportDate, details: details?.trim() || null, status: isRequest ? 'Requested' : 'Delivered'
  });
  if (isRequest) {
    // Only Admin receives notification for support requests
    await notifyStaff('New support request', `${scholar.name} requested ${supportType.trim()}.`, 'assistance', 'support');
  }
  res.status(201).json(publicAssistance(await ProgramAssistance.findByPk(record.id, {
    include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name'] }]
  })));
}));

router.patch('/financial-assistance/:id', asyncRoute(async (req, res) => {
  if (req.user.role !== 'admin') {
    return fail(res, 403, 'Access denied. Only administrators can update support requests.');
  }
  const record = await ProgramAssistance.findByPk(req.params.id);
  if (!record) return fail(res, 404, 'Support record not found.');
  const { status, details } = req.body || {};
  if (!validText(status, 2, 50) || !optionalText(details, 5000)) return fail(res, 422, 'Enter valid support status and details.');
  await record.update({ status: status.trim(), ...(details !== undefined ? { details: details?.trim() || null } : {}) });
  // Per specification, responses are strictly managed by Admin and not broadcast to other users
  const updated = await ProgramAssistance.findByPk(record.id, {
    include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name'] }]
  });
  res.json(publicAssistance(updated));
}));

// CSV exports
router.get('/academic-results/export', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const records = await ProgramAcademicResult.findAll({
    include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']]
  });
  sendCsv(res, `academic-results-${new Date().toISOString().slice(0, 10)}.csv`, [
    { label: 'Result ID', value: (row) => row.id },
    { label: 'Scholar', value: (row) => row.beneficiary?.name },
    { label: 'Email', value: (row) => row.beneficiary?.email },
    { label: 'School', value: (row) => row.school },
    { label: 'Academic Year', value: (row) => row.academicYear },
    { label: 'Term', value: (row) => row.term },
    { label: 'Subject', value: (row) => row.subject },
    { label: 'Score', value: (row) => row.score },
    { label: 'Maximum', value: (row) => row.maxScore },
    { label: 'Status', value: (row) => row.status },
    { label: 'Feedback', value: (row) => row.staffFeedback },
    { label: 'Recorded', value: (row) => row.createdAt }
  ], records);
}));

router.get('/financial-assistance/export', asyncRoute(async (req, res) => {
  if (req.user.role !== 'admin') return fail(res, 403, 'Access denied. Only administrators can export support records.');
  const records = await ProgramAssistance.findAll({
    include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name', 'email'] }],
    order: [['supportDate', 'DESC']]
  });
  sendCsv(res, `support-records-${new Date().toISOString().slice(0, 10)}.csv`, [
    { label: 'Record ID', value: (row) => row.id },
    { label: 'Scholar', value: (row) => row.beneficiary?.name },
    { label: 'Email', value: (row) => row.beneficiary?.email },
    { label: 'Support Type', value: (row) => row.supportType },
    { label: 'Amount', value: (row) => row.amount },
    { label: 'Currency', value: (row) => row.currency },
    { label: 'Status', value: (row) => row.status },
    { label: 'Support Date', value: (row) => row.supportDate },
    { label: 'Details', value: (row) => row.details }
  ], records);
}));

router.get('/beneficiaries/export', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const people = await User.findAll({
    where: { role: 'scholar' },
    include: [{ model: Cohort, as: 'cohort', attributes: ['id', 'name'], required: false }],
    order: [['name', 'ASC']]
  });
  sendCsv(res, `participants-${new Date().toISOString().slice(0, 10)}.csv`, [
    { label: 'Participant ID', value: (row) => row.id },
    { label: 'Full Name', value: (row) => row.name },
    { label: 'Email', value: (row) => row.email },
    { label: 'Cohort', value: (row) => row.cohort?.name || 'Unassigned' },
    { label: 'University', value: (row) => row.university || '' },
    { label: 'Year level', value: (row) => row.yearLevel || '' }
  ], people);
}));

// AI assistance tools
router.post('/ai/report-assist', asyncRoute(async (req, res) => {
  if (!['scholar', ...staffRoles].includes(req.user.role)) return fail(res, 403, 'Access denied.');
  const { raw_title: title, raw_content: content } = req.body || {};
  if (!optionalText(title, 160) || !optionalText(content, 10000)) return fail(res, 422, 'Enter valid report notes.');
  const result = await generateText(
    `Polish this participant progress report. Title: ${title || 'Progress report'}. Notes: ${content || ''}. Include concise highlights, challenges, and next-step goals. Return only the report body.`,
    `Highlights & milestones:\n${content || 'I attended sessions and worked on my assignments.'}\n\nChallenges & needs:\nAdd any support or clarification you need.\n\nGoals for next week:\nSet one practical study or personal development goal.`
  );
  res.json({ content: result });
}));

router.post('/ai/report-feedback', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const report = req.body?.report_id ? await ProgramReport.findByPk(req.body.report_id, {
    include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name'] }]
  }) : null;
  if (req.body?.report_id && !report) return fail(res, 404, 'Report not found.');
  const title = report?.title || req.body?.report_title;
  const content = report?.content || req.body?.report_content;
  if (!validText(title, 1, 160) || !validText(content, 1, 10000)) return fail(res, 422, 'Report details are required.');
  const name = report?.beneficiary?.name || req.body?.beneficiary_name || 'the scholar';
  const status = req.body?.status || 'Reviewed';
  const feedback = await generateText(
    `Write encouraging, constructive, actionable 2-3 sentence staff feedback for ${name}. Report title: ${title}. Content: ${content}. Review status: ${status}.`,
    `Thank you for sharing your progress, ${name.split(' ')[0]}. Your effort is appreciated; keep building on what is working and reach out if you need help with the challenges you described.`
  );
  res.json({ feedback });
}));

router.post('/ai/academic-feedback', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const result = req.body?.result_id ? await ProgramAcademicResult.findByPk(req.body.result_id, {
    include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name'] }]
  }) : null;
  if (req.body?.result_id && !result) return fail(res, 404, 'Academic result not found.');
  const subject = result?.subject || req.body?.subject;
  const score = result?.score ?? req.body?.score;
  const maxScore = result?.maxScore ?? req.body?.max_score;
  if (!validText(subject, 1, 120) || !Number.isFinite(Number(score)) || !Number.isFinite(Number(maxScore)) || Number(maxScore) <= 0) {
    return fail(res, 422, 'Valid academic result details are required.');
  }
  const percentage = Math.round(Number(score) / Number(maxScore) * 100);
  const name = result?.beneficiary?.name || req.body?.beneficiary_name || 'Scholar';
  const feedback = await generateText(
    `Write encouraging, constructive, two-sentence academic feedback for ${name}, scoring ${score}/${maxScore} (${percentage}%) in ${subject}.`,
    percentage >= 80
      ? `Excellent work in ${subject}, ${name.split(' ')[0]}. Your result reflects strong preparation; consider sharing your study strategies with your peers.`
      : `Thank you for sharing your ${subject} result, ${name.split(' ')[0]}. Review the topics you found difficult and set a focused practice goal for the next assessment.`
  );
  res.json({ feedback });
}));

router.post('/ai/mentorship-goal', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { cohort_id: cohortId, cohort_name: cohortName, mentor_name: mentorName, notes } = req.body || {};
  if (!optionalText(cohortName, 120) || !optionalText(mentorName, 150) || !optionalText(notes, 5000)) {
    return fail(res, 422, 'Enter valid mentorship context.');
  }
  const cohort = cohortId ? await Cohort.findByPk(cohortId) : null;
  const name = cohortName || cohort?.name || 'Cohort';
  const goal = await generateText(
    `Create a practical 2-3 sentence mentorship goal and session roadmap for ${name}, mentor ${mentorName || 'cohort mentor'}. Context: ${notes || 'academic and personal development'}.`,
    `Support ${name} members in building consistent study habits, confidence, and career goals. Review progress in each session and agree on one achievable action before the next check-in.`
  );
  res.json({ goal });
}));

router.post('/ai/cohort-mission', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { name } = req.body || {};
  if (!validText(name, 2, 120)) return fail(res, 422, 'Cohort name is required.');
  const description = await generateText(
    `Write a short, inspiring mission statement for a Generation Rise cohort named ${name}.`,
    `${name} is a community of learners growing through academic progress, mentorship, and mutual support.`
  );
  res.json({ description });
}));

// Expose the BTG user directory as the participant list for staff workflows.
router.get('/beneficiaries', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const people = await User.findAll({
    where: { role: 'scholar' },
    attributes: ['id', 'name', 'email', 'role', 'cohortId'],
    order: [['name', 'ASC']]
  });
  res.json(people.map(publicPerson));
}));

export default router;
