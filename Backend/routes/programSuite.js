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
  ProgramAcademicModule,
  ProgramModuleTemplate,
  ProgramFriendlyWeek,
  ProgramMentorship,
  ProgramAssistance,
  ProgramAttachment
} from '../models.js';
import {
  buildSubjectSummary,
  computeAggregate,
  computeTranscriptSummary,
  normalizeAcademicYear,
  normalizeAggregateInput,
  parseRawModules,
  parseTemplateModules,
  roundTwo
} from '../utils/academicUtils.js';
import { buildTablePdfBuffer } from '../utils/pdfExport.js';
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
    university: person.university || null,
    year_level: person.yearLevel || null,
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

function publicAcademicModule(mod) {
  const item = plain(mod);
  const marks = Number(item.marks ?? 0);
  const maxMarks = Number(item.maxMarks ?? 100) || 100;
  const percentage = roundTwo(maxMarks > 0 ? (marks / maxMarks) * 100 : 0);
  return {
    id: item.id,
    academic_result_id: item.academicResultId,
    module_code: item.moduleCode,
    module_name: item.moduleName || '',
    credits: Number(item.credits ?? 0),
    marks,
    max_marks: maxMarks,
    percentage,
    aggregate: item.aggregate || computeAggregate(percentage),
    sort_order: item.sortOrder ?? 0
  };
}

function publicAcademicResult(record) {
  const result = plain(record);
  const rawModules = [...(result.modules || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const modules = rawModules.length
    ? rawModules.map(publicAcademicModule)
    : (result.subject
      ? [{
          id: result.id,
          academic_result_id: result.id,
          module_code: result.subject,
          module_name: '',
          credits: Number(result.totalCredits ?? 0),
          marks: Number(result.score ?? 0),
          max_marks: Number(result.maxScore ?? 100) || 100,
          percentage: roundTwo(
            (Number(result.maxScore ?? 100) || 100) > 0
              ? (Number(result.score ?? 0) / (Number(result.maxScore ?? 100) || 100)) * 100
              : 0
          ),
          aggregate: result.overallAggregate || computeAggregate(
            (Number(result.maxScore ?? 100) || 100) > 0
              ? (Number(result.score ?? 0) / (Number(result.maxScore ?? 100) || 100)) * 100
              : 0
          ),
          sort_order: 0
        }]
      : []);

  const computed = computeTranscriptSummary(modules);
  const totalCredits = result.totalCredits != null ? Number(result.totalCredits) : computed.totalCredits;
  const averageScore = result.averageScore != null ? Number(result.averageScore) : computed.averageScore;
  const overallAggregate = result.overallAggregate || computeAggregate(averageScore);
  const verdict = result.verdict || computed.suggestedVerdict;

  return {
    id: result.id,
    beneficiary_id: result.beneficiaryId,
    beneficiary_name: result.beneficiary?.name,
    beneficiary_email: result.beneficiary?.email,
    beneficiary_university: result.beneficiary?.university || null,
    beneficiary_year_level: result.beneficiary?.yearLevel || null,
    school: result.school,
    campus: result.campus || '',
    combination: result.combination || '',
    year_level: result.yearLevel || '',
    academic_year: result.academicYear,
    term: result.term,
    subject: result.subject,
    score: result.score,
    max_score: result.maxScore,
    total_credits: totalCredits,
    average_score: averageScore,
    overall_aggregate: overallAggregate,
    verdict,
    status: result.status,
    staff_feedback: result.staffFeedback,
    modules,
    created_at: result.createdAt,
    updated_at: result.updatedAt,
    attachments: (result.attachments || []).map(publicAttachment)
  };
}

function publicAcademicTemplate(record) {
  const tpl = plain(record);
  let modules = [];
  try {
    const parsed = JSON.parse(tpl.modulesJson || '[]');
    if (Array.isArray(parsed)) modules = parsed;
  } catch {
    modules = [];
  }
  return {
    id: tpl.id,
    name: tpl.name,
    school: tpl.school,
    campus: tpl.campus || '',
    combination: tpl.combination || '',
    year_level: tpl.yearLevel || '',
    term: tpl.term || '',
    modules,
    created_at: tpl.createdAt,
    updated_at: tpl.updatedAt
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
    beneficiary_name: assistance.beneficiary?.name || 'Scholar',
    beneficiary_email: assistance.beneficiary?.email,
    beneficiary_university: assistance.beneficiary?.university || 'University of Rwanda',
    support_type: assistance.supportType,
    amount: assistance.amount,
    currency: assistance.currency || 'RWF',
    support_date: assistance.supportDate,
    disbursement_method: assistance.disbursementMethod || 'MTN Mobile Money',
    recipient_account: assistance.recipientAccount || '',
    reference_number: assistance.referenceNumber || '',
    disbursed_by: assistance.disbursedBy || 'Generation Rise Foundation',
    details: assistance.details,
    status: assistance.status || 'Disbursed',
    received_confirmed: Boolean(assistance.receivedConfirmed),
    confirmed_at: assistance.confirmedAt || null,
    confirmation_notes: assistance.confirmationNotes || '',
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

function sendPdf(res, filename, pdfOptions) {
  const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const pdfBuffer = buildTablePdfBuffer(pdfOptions);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(pdfBuffer);
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
  const { status, staff_feedback: feedback } = req.body || {};
  if (!['Pending', 'Viewed', 'Reviewed', 'Follow-up'].includes(status) || !optionalText(feedback, 10000)) {
    return fail(res, 422, 'Enter a valid report status.');
  }
  const report = await ProgramReport.findByPk(req.params.reportId);
  if (!report) return fail(res, 404, 'Report not found.');
  const nextFeedback = feedback !== undefined ? feedback : report.staffFeedback;
  await report.update({ status, staffFeedback: nextFeedback });
  const feedbackSnippet = nextFeedback ? ` Feedback: "${nextFeedback.slice(0, 100)}${nextFeedback.length > 100 ? '...' : ''}"` : '';
  await notifyUser(
    report.beneficiaryId,
    status === 'Viewed' ? 'Report viewed' : 'Report reviewed',
    status === 'Viewed'
      ? `Your report "${report.title}" has been viewed by the administration.`
      : `Your report "${report.title}" has been reviewed (${status}).${feedbackSnippet}`,
    'reports',
    'report'
  );
  res.json(publicReport(report));
}));

function academicInclude() {
  return [
    { model: User, as: 'beneficiary', attributes: ['id', 'name', 'email', 'university', 'yearLevel'] },
    { model: ProgramAcademicModule, as: 'modules', required: false },
    includeAttachments()
  ];
}

function validateAndBuildAcademicPayload(body = {}) {
  const rawSchool = body.school;
  const campus = typeof body.campus === 'string' ? body.campus.trim() : '';
  const combination = typeof body.combination === 'string' ? body.combination.trim() : '';
  const yearLevel = typeof body.year_level === 'string' ? body.year_level.trim() : '';
  const school = validText(rawSchool, 2, 160)
    ? rawSchool.trim()
    : (campus ? 'University of Rwanda' : '');
  const academicYear = normalizeAcademicYear(String(body.academic_year || ''));
  const term = typeof body.term === 'string' ? body.term.trim() : '';
  const explicitVerdict = typeof body.verdict === 'string' ? body.verdict.trim() : '';

  if (!validText(school, 2, 160) || !validText(academicYear, 4, 30) || !validText(term, 1, 80)) {
    return { error: 'Enter a valid institution, academic year, and semester/term.' };
  }
  if (campus.length > 120 || combination.length > 120 || yearLevel.length > 60 || explicitVerdict.length > 80) {
    return { error: 'Campus, combination, year level, or verdict exceeds maximum length.' };
  }

  let rawModules = body.modules;
  if (!Array.isArray(rawModules) && body.subject !== undefined) {
    rawModules = [{
      module_code: body.subject,
      credits: body.credits ?? 0,
      marks: body.score,
      max_marks: body.max_score ?? 100,
      aggregate: body.aggregate
    }];
  }

  const parsed = parseRawModules(rawModules);
  if (parsed.error) return { error: parsed.error };

  const summary = computeTranscriptSummary(parsed.modules);
  const verdict = explicitVerdict || summary.suggestedVerdict;

  return {
    header: {
      school,
      campus: campus || null,
      combination: combination || null,
      yearLevel: yearLevel || null,
      academicYear,
      term,
      subject: buildSubjectSummary(parsed.modules, combination),
      score: summary.averageScore,
      maxScore: 100,
      totalCredits: summary.totalCredits,
      averageScore: summary.averageScore,
      overallAggregate: summary.overallAggregate,
      verdict
    },
    modules: parsed.modules,
    summary
  };
}

function filterAcademicRecords(records, query = {}) {
  const {
    beneficiary_id: beneficiaryId,
    campus,
    combination,
    year_level: yearLevel,
    academic_year: academicYear,
    term,
    verdict,
    status,
    aggregate,
    search
  } = query;

  const q = typeof search === 'string' ? search.trim().toLowerCase() : '';
  const norm = (v) => String(v || '').trim().toLowerCase();

  return records.filter((item) => {
    if (beneficiaryId && beneficiaryId !== 'all' && item.beneficiary_id !== beneficiaryId) return false;
    if (campus && campus !== 'all' && norm(item.campus) !== norm(campus)) return false;
    if (combination && combination !== 'all' && norm(item.combination) !== norm(combination)) return false;
    if (yearLevel && yearLevel !== 'all' && norm(item.year_level) !== norm(yearLevel)) return false;
    if (academicYear && academicYear !== 'all' && norm(item.academic_year) !== norm(normalizeAcademicYear(academicYear))) return false;
    if (term && term !== 'all' && norm(item.term) !== norm(term)) return false;
    if (verdict && verdict !== 'all' && norm(item.verdict) !== norm(verdict)) return false;
    if (status && status !== 'all' && norm(item.status) !== norm(status)) return false;
    if (aggregate && aggregate !== 'all') {
      const targetAgg = norm(aggregate);
      const matchesOverall = norm(item.overall_aggregate) === targetAgg;
      const matchesModule = (item.modules || []).some((m) => norm(m.aggregate) === targetAgg);
      if (!matchesOverall && !matchesModule) return false;
    }
    if (q) {
      const haystack = [
        item.beneficiary_name,
        item.beneficiary_email,
        item.beneficiary_university,
        item.school,
        item.campus,
        item.combination,
        item.year_level,
        item.academic_year,
        item.term,
        item.subject,
        item.verdict,
        item.status,
        item.overall_aggregate,
        item.staff_feedback,
        ...(item.modules || []).flatMap((m) => [m.module_code, m.module_name, m.aggregate])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// Academic results
router.get('/academic-results', asyncRoute(async (req, res) => {
  if (!isStaff(req.user) && req.user.role !== 'scholar') return fail(res, 403, 'Access denied.');
  const records = await ProgramAcademicResult.findAll({
    where: isStaff(req.user) ? {} : { beneficiaryId: req.user.id },
    include: academicInclude(),
    order: [['createdAt', 'DESC']]
  });
  const serialized = records.map(publicAcademicResult);
  res.json(filterAcademicRecords(serialized, req.query));
}));

router.post('/academic-results', asyncRoute(async (req, res) => {
  if (!requireScholar(req, res)) return;
  const beneficiaryId = req.user.id;
  if (!(await findScholar(beneficiaryId))) {
    return fail(res, 404, 'Scholar account not found.');
  }
  const built = validateAndBuildAcademicPayload(req.body);
  if (built.error) return fail(res, 422, built.error);

  const created = await sequelize.transaction(async (transaction) => {
    const result = await ProgramAcademicResult.create({
      beneficiaryId,
      ...built.header
    }, { transaction });
    await ProgramAcademicModule.bulkCreate(
      built.modules.map((mod) => ({
        academicResultId: result.id,
        moduleCode: mod.moduleCode,
        moduleName: mod.moduleName,
        credits: mod.credits,
        marks: mod.marks,
        maxMarks: mod.maxMarks,
        aggregate: mod.aggregate,
        sortOrder: mod.sortOrder
      })),
      { transaction }
    );
    return result;
  });

  const reloaded = await ProgramAcademicResult.findByPk(created.id, { include: academicInclude() });
  await notifyStaff(
    'Academic results submitted',
    `${reloaded.beneficiary?.name || 'A scholar'} submitted ${reloaded.term} marks (${reloaded.yearLevel || reloaded.school} · ${reloaded.academicYear}).`,
    'academic-results',
    'academic'
  );
  res.status(201).json(publicAcademicResult(reloaded));
}));

router.put('/academic-results/:resultId', asyncRoute(async (req, res) => {
  if (!requireScholar(req, res)) return;

  const result = await ProgramAcademicResult.findByPk(req.params.resultId);
  if (!result || result.beneficiaryId !== req.user.id) {
    return fail(res, 404, 'Academic result not found.');
  }

  const beneficiaryId = result.beneficiaryId;
  const built = validateAndBuildAcademicPayload(req.body);
  if (built.error) return fail(res, 422, built.error);

  const updates = {
    beneficiaryId,
    ...built.header,
    status: 'Pending'
  };

  await sequelize.transaction(async (transaction) => {
    await result.update(updates, { transaction });
    await ProgramAcademicModule.destroy({
      where: { academicResultId: result.id },
      transaction
    });
    await ProgramAcademicModule.bulkCreate(
      built.modules.map((mod) => ({
        academicResultId: result.id,
        moduleCode: mod.moduleCode,
        moduleName: mod.moduleName,
        credits: mod.credits,
        marks: mod.marks,
        maxMarks: mod.maxMarks,
        aggregate: mod.aggregate,
        sortOrder: mod.sortOrder
      })),
      { transaction }
    );
  });

  const reloaded = await ProgramAcademicResult.findByPk(result.id, { include: academicInclude() });
  res.json(publicAcademicResult(reloaded));
}));

router.patch('/academic-results/:resultId', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { status, staff_feedback: feedback, verdict } = req.body || {};
  if (!['Pending', 'Viewed', 'Reviewed', 'Follow-up'].includes(status) || !optionalText(feedback, 10000) || !optionalText(verdict, 80)) {
    return fail(res, 422, 'Enter a valid academic result status.');
  }
  const result = await ProgramAcademicResult.findByPk(req.params.resultId);
  if (!result) return fail(res, 404, 'Academic result not found.');
  const updates = {
    status,
    staffFeedback: feedback !== undefined ? feedback : result.staffFeedback
  };
  if (typeof verdict === 'string' && verdict.trim()) {
    updates.verdict = verdict.trim();
  }
  await result.update(updates);
  await notifyUser(
    result.beneficiaryId,
    status === 'Viewed' ? 'Academic results viewed' : 'Academic results reviewed',
    status === 'Viewed'
      ? `Your ${result.subject} transcript for ${result.term} has been viewed by the administration.`
      : `Your ${result.subject} result for ${result.term} has been reviewed (${status}).`,
    'academic-results',
    'academic'
  );
  const reloaded = await ProgramAcademicResult.findByPk(result.id, { include: academicInclude() });
  res.json(publicAcademicResult(reloaded));
}));

router.patch('/academic-results/:resultId/modules/:moduleId', asyncRoute(async (req, res) => {
  if (!requireScholar(req, res)) return;

  const result = await ProgramAcademicResult.findByPk(req.params.resultId, {
    include: [{ model: ProgramAcademicModule, as: 'modules', required: false }]
  });
  if (!result || result.beneficiaryId !== req.user.id) {
    return fail(res, 404, 'Academic result not found.');
  }

  const mod = (result.modules || []).find((m) => m.id === req.params.moduleId);
  if (!mod) return fail(res, 404, 'Module not found on this academic result.');

  const body = req.body || {};
  const nextModuleCode = body.module_code !== undefined ? String(body.module_code || '').trim() : mod.moduleCode;
  const nextModuleName = body.module_name !== undefined ? String(body.module_name || '').trim() : (mod.moduleName || '');
  const nextCredits = body.credits !== undefined
    ? (body.credits === '' || body.credits == null ? 0 : Number(body.credits))
    : mod.credits;
  const nextMarks = body.marks !== undefined ? Number(body.marks) : mod.marks;
  const nextMaxMarks = body.max_marks !== undefined ? Number(body.max_marks) : mod.maxMarks;

  if (!nextModuleCode || nextModuleCode.length > 60 || nextModuleName.length > 160) {
    return fail(res, 422, 'Enter a valid module code and name.');
  }
  if (!Number.isFinite(nextCredits) || nextCredits < 0 || !Number.isFinite(nextMarks) || nextMarks < 0 ||
      !Number.isFinite(nextMaxMarks) || nextMaxMarks <= 0 || nextMarks > nextMaxMarks) {
    return fail(res, 422, 'Enter valid non-negative credits and marks.');
  }

  const pct = roundTwo((nextMarks / nextMaxMarks) * 100);
  const nextAggregate = body.aggregate !== undefined
    ? normalizeAggregateInput(body.aggregate, pct)
    : (body.marks !== undefined || body.max_marks !== undefined ? computeAggregate(pct) : mod.aggregate);

  await sequelize.transaction(async (transaction) => {
    await mod.update({
      moduleCode: nextModuleCode,
      moduleName: nextModuleName || null,
      credits: roundTwo(nextCredits),
      marks: roundTwo(nextMarks),
      maxMarks: roundTwo(nextMaxMarks),
      aggregate: nextAggregate
    }, { transaction });

    const updatedModules = await ProgramAcademicModule.findAll({
      where: { academicResultId: result.id },
      order: [['sortOrder', 'ASC']],
      transaction
    });
    const summary = computeTranscriptSummary(updatedModules);
    const parentUpdates = {
      subject: buildSubjectSummary(updatedModules, result.combination),
      score: summary.averageScore,
      maxScore: 100,
      totalCredits: summary.totalCredits,
      averageScore: summary.averageScore,
      overallAggregate: summary.overallAggregate,
      verdict: result.verdict && !['PASS', 'PROCEED WITH RETAKE', 'FAIL', 'PENDING'].includes(result.verdict)
        ? result.verdict
        : summary.suggestedVerdict
    };
    if (body.marks !== undefined || body.max_marks !== undefined || body.module_code !== undefined) {
      parentUpdates.status = 'Pending';
    }
    await result.update(parentUpdates, { transaction });
  });

  const reloaded = await ProgramAcademicResult.findByPk(result.id, { include: academicInclude() });
  res.json(publicAcademicResult(reloaded));
}));

router.delete('/academic-results/:resultId', asyncRoute(async (req, res) => {
  if (!requireScholar(req, res)) return;

  const result = await ProgramAcademicResult.findByPk(req.params.resultId, {
    include: [includeAttachments()]
  });
  if (!result || result.beneficiaryId !== req.user.id) {
    return fail(res, 404, 'Academic result not found.');
  }
  if (result.status !== 'Pending') {
    return fail(res, 403, 'Only pending academic results can be deleted by a scholar.');
  }

  const attachments = result.attachments || [];
  await sequelize.transaction(async (transaction) => {
    await ProgramAcademicModule.destroy({ where: { academicResultId: result.id }, transaction });
    await ProgramAttachment.destroy({ where: { academicResultId: result.id }, transaction });
    await result.destroy({ transaction });
  });

  await Promise.all(
    attachments.map((file) =>
      fs.unlink(path.join(attachmentDirectory, path.basename(file.storageKey))).catch(() => null)
    )
  );

  res.json({ success: true, message: 'Academic result deleted.' });
}));

// Academic module templates
router.get('/academic-templates', asyncRoute(async (req, res) => {
  if (!isStaff(req.user) && req.user.role !== 'scholar') return fail(res, 403, 'Access denied.');
  const templates = await ProgramModuleTemplate.findAll({
    order: [['name', 'ASC']]
  });
  res.json(templates.map(publicAcademicTemplate));
}));

router.post('/academic-templates', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const { name, school = 'University of Rwanda', campus = '', combination = '', year_level: yearLevel = '', term = '', modules } = req.body || {};
  if (!validText(name, 2, 160) || !validText(school, 2, 160) ||
      !optionalText(campus, 120) || !optionalText(combination, 120) ||
      !optionalText(yearLevel, 60) || !optionalText(term, 80)) {
    return fail(res, 422, 'Enter a valid template name and metadata.');
  }
  const parsed = parseTemplateModules(modules);
  if (parsed.error) return fail(res, 422, parsed.error);

  const created = await ProgramModuleTemplate.create({
    name: name.trim(),
    school: school.trim(),
    campus: campus?.trim() || null,
    combination: combination?.trim() || null,
    yearLevel: yearLevel?.trim() || null,
    term: term?.trim() || null,
    modulesJson: JSON.stringify(parsed.modules),
    createdById: req.user.id
  });
  res.status(201).json(publicAcademicTemplate(created));
}));

router.put('/academic-templates/:templateId', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const template = await ProgramModuleTemplate.findByPk(req.params.templateId);
  if (!template) return fail(res, 404, 'Module template not found.');
  const { name, school = 'University of Rwanda', campus = '', combination = '', year_level: yearLevel = '', term = '', modules } = req.body || {};
  if (!validText(name, 2, 160) || !validText(school, 2, 160) ||
      !optionalText(campus, 120) || !optionalText(combination, 120) ||
      !optionalText(yearLevel, 60) || !optionalText(term, 80)) {
    return fail(res, 422, 'Enter a valid template name and metadata.');
  }
  const parsed = parseTemplateModules(modules);
  if (parsed.error) return fail(res, 422, parsed.error);

  await template.update({
    name: name.trim(),
    school: school.trim(),
    campus: campus?.trim() || null,
    combination: combination?.trim() || null,
    yearLevel: yearLevel?.trim() || null,
    term: term?.trim() || null,
    modulesJson: JSON.stringify(parsed.modules)
  });
  res.json(publicAcademicTemplate(template));
}));

router.delete('/academic-templates/:templateId', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const template = await ProgramModuleTemplate.findByPk(req.params.templateId);
  if (!template) return fail(res, 404, 'Module template not found.');
  await template.destroy();
  res.json({ success: true, message: 'Module template deleted.' });
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
  if (recordType === 'report' && extension !== '.pdf') {
    return fail(res, 415, 'Reports are limited to PDF files only (.pdf).');
  }
  const contentType = attachmentTypes.get(extension);
  if (!fileName || !contentType) return fail(res, 415, 'Choose a valid supported document.');
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
  const isInline = req.query.inline === '1' || req.query.inline === 'true';
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (isInline) {
    const safeFileName = String(attachment.fileName || 'document.pdf').replace(/"/g, '');
    res.setHeader('Content-Type', attachment.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"`);
    return res.sendFile(location, (error) => {
      if (error && !res.headersSent) {
        res.status(error.code === 'ENOENT' ? 404 : 500).json({ detail: 'Attachment could not be opened.' });
      }
    });
  }
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

// Support and financial assistance (Read-only for scholars, full CRUD for Admin)
router.get('/financial-assistance', asyncRoute(async (req, res) => {
  const isScholar = req.user.role === 'scholar' || req.user.role === 'beneficiary';
  const isStaff = ['admin', 'staff', 'teacher', 'mentor'].includes(req.user.role);
  if (!isScholar && !isStaff) return fail(res, 403, 'Access denied.');

  const where = isScholar ? { beneficiaryId: req.user.id } : {};
  const records = await ProgramAssistance.findAll({
    where,
    include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name', 'email', 'university'] }],
    order: [['supportDate', 'DESC'], ['createdAt', 'DESC']]
  });
  res.json(records.map(publicAssistance));
}));

router.get('/financial-assistance/summary', asyncRoute(async (req, res) => {
  const isScholar = req.user.role === 'scholar' || req.user.role === 'beneficiary';
  const isStaff = ['admin', 'staff', 'teacher', 'mentor'].includes(req.user.role);
  if (!isScholar && !isStaff) return fail(res, 403, 'Access denied.');

  const where = isScholar ? { beneficiaryId: req.user.id } : {};
  const records = await ProgramAssistance.findAll({
    where,
    attributes: ['currency', 'amount', 'supportType', 'disbursementMethod', 'status']
  });

  const totals = {};
  const byMethod = {};
  const byCategory = {};
  let totalDisbursedRwf = 0;

  records.forEach((record) => {
    const amount = Number(record.amount) || 0;
    const curr = record.currency || 'RWF';
    totals[curr] = (totals[curr] || 0) + amount;
    if (curr === 'RWF') totalDisbursedRwf += amount;

    const method = record.disbursementMethod || 'MTN Mobile Money';
    byMethod[method] = (byMethod[method] || 0) + amount;

    const cat = record.supportType || 'General Support';
    byCategory[cat] = (byCategory[cat] || 0) + amount;
  });

  res.json({
    record_count: records.length,
    total_rwf: totalDisbursedRwf,
    totals_by_currency: totals,
    by_method: byMethod,
    by_category: byCategory
  });
}));

// Admin CRUD: Create Disbursement (Strictly admin/staff only, read-only for scholars)
router.post('/financial-assistance', asyncRoute(async (req, res) => {
  if (req.user.role !== 'admin' && !staffRoles.has(req.user.role)) {
    return fail(res, 403, 'Access denied. Stipend records are read-only for scholars and managed exclusively by administrators.');
  }
  const {
    beneficiary_id: beneficiaryId,
    support_type: supportType,
    amount,
    currency = 'RWF',
    support_date: supportDate = new Date().toISOString().slice(0, 10),
    disbursement_method: disbursementMethod = 'MTN Mobile Money',
    recipient_account: recipientAccount = '',
    reference_number: referenceNumber = '',
    disbursed_by: disbursedBy = 'Generation Rise Foundation',
    status = 'Disbursed',
    details
  } = req.body || {};

  const numericAmount = amount === '' || amount == null ? 0 : Number(amount);
  const finalCurrency = String(currency).trim().toUpperCase();

  // Support Bulk Disbursement to ALL scholars
  if (beneficiaryId === 'ALL') {
    if (!validText(supportType, 2, 100) ||
        !Number.isFinite(numericAmount) || numericAmount < 0 ||
        !/^[A-Z]{3}$/.test(finalCurrency) || !validDate(supportDate) || !optionalText(details, 5000)) {
      return fail(res, 422, 'Enter valid disbursement and support details.');
    }
    const allScholars = await User.findAll({ where: { role: 'scholar' } });
    if (!allScholars.length) return fail(res, 404, 'No active scholars found to disburse to.');

    const createdList = [];
    for (const sc of allScholars) {
      const rec = await ProgramAssistance.create({
        beneficiaryId: sc.id,
        supportType: supportType.trim(),
        amount: numericAmount,
        currency: finalCurrency,
        supportDate,
        disbursementMethod: String(disbursementMethod || 'MTN Mobile Money').trim(),
        recipientAccount: String(recipientAccount || sc.email || '').trim(),
        referenceNumber: String(referenceNumber || `BULK-${Date.now().toString().slice(-6)}`).trim(),
        disbursedBy: String(disbursedBy || 'Generation Rise Foundation').trim(),
        details: details?.trim() || null,
        status: status.trim() || 'Disbursed',
        receivedConfirmed: true,
        confirmedAt: new Date()
      });
      createdList.push(rec);
      await notifyUser(
        sc.id,
        'Financial Support Recorded',
        `A disbursement of ${numericAmount.toLocaleString()} ${finalCurrency} via ${rec.disbursementMethod} was recorded by Generation Rise Foundation.`,
        'assistance',
        'support'
      );
    }
    return res.status(201).json(publicAssistance(await ProgramAssistance.findByPk(createdList[0].id, {
      include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name', 'email', 'university'] }]
    })));
  }

  if (!validUuid(beneficiaryId) || !validText(supportType, 2, 100) ||
      !Number.isFinite(numericAmount) || numericAmount < 0 ||
      !/^[A-Z]{3}$/.test(finalCurrency) || !validDate(supportDate) || !optionalText(details, 5000)) {
    return fail(res, 422, 'Enter valid disbursement and support details.');
  }

  const scholar = await findScholar(beneficiaryId);
  if (!scholar) return fail(res, 404, 'Scholar account not found.');

  const record = await ProgramAssistance.create({
    beneficiaryId,
    supportType: supportType.trim(),
    amount: numericAmount,
    currency: finalCurrency,
    supportDate,
    disbursementMethod: String(disbursementMethod || 'MTN Mobile Money').trim(),
    recipientAccount: String(recipientAccount || '').trim(),
    referenceNumber: String(referenceNumber || '').trim(),
    disbursedBy: String(disbursedBy || 'Generation Rise Foundation').trim(),
    details: details?.trim() || null,
    status: status.trim() || 'Disbursed',
    receivedConfirmed: true,
    confirmedAt: new Date()
  });

  await notifyUser(
    beneficiaryId,
    'Financial Support Recorded',
    `A disbursement of ${numericAmount.toLocaleString()} ${finalCurrency} via ${record.disbursementMethod} was recorded by Generation Rise Foundation.`,
    'programs',
    'support'
  );

  res.status(201).json(publicAssistance(await ProgramAssistance.findByPk(record.id, {
    include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name', 'email', 'university'] }]
  })));
}));

// Admin CRUD: Update Disbursement
router.patch('/financial-assistance/:id', asyncRoute(async (req, res) => {
  if (req.user.role !== 'admin' && !staffRoles.has(req.user.role)) {
    return fail(res, 403, 'Access denied. Only administrators can update disbursement records.');
  }
  const record = await ProgramAssistance.findByPk(req.params.id);
  if (!record) return fail(res, 404, 'Disbursement record not found.');

  const {
    status,
    details,
    amount,
    currency,
    support_type: supportType,
    support_date: supportDate,
    disbursement_method: disbursementMethod,
    recipient_account: recipientAccount,
    reference_number: referenceNumber,
    disbursed_by: disbursedBy
  } = req.body || {};

  const updates = {};
  if (status !== undefined && validText(status, 2, 50)) updates.status = status.trim();
  if (details !== undefined) updates.details = details?.trim() || null;
  if (supportType !== undefined && validText(supportType, 2, 100)) updates.supportType = supportType.trim();
  if (amount !== undefined && Number.isFinite(Number(amount)) && Number(amount) >= 0) updates.amount = Number(amount);
  if (currency !== undefined && /^[A-Z]{3}$/.test(String(currency).trim().toUpperCase())) updates.currency = String(currency).trim().toUpperCase();
  if (supportDate !== undefined && validDate(supportDate)) updates.supportDate = supportDate;
  if (disbursementMethod !== undefined) updates.disbursementMethod = String(disbursementMethod).trim();
  if (recipientAccount !== undefined) updates.recipientAccount = String(recipientAccount).trim();
  if (referenceNumber !== undefined) updates.referenceNumber = String(referenceNumber).trim();
  if (disbursedBy !== undefined) updates.disbursedBy = String(disbursedBy).trim();

  await record.update(updates);

  const updated = await ProgramAssistance.findByPk(record.id, {
    include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name', 'email', 'university'] }]
  });
  res.json(publicAssistance(updated));
}));

// Admin CRUD: Delete Disbursement
router.delete('/financial-assistance/:id', asyncRoute(async (req, res) => {
  if (req.user.role !== 'admin') {
    return fail(res, 403, 'Access denied. Only administrators can delete disbursement records.');
  }
  const record = await ProgramAssistance.findByPk(req.params.id);
  if (!record) return fail(res, 404, 'Disbursement record not found.');
  await record.destroy();
  res.json({ success: true, message: 'Disbursement record deleted successfully.' });
}));

// PDF exports
router.get('/academic-results/export', asyncRoute(async (req, res) => {
  const staff = isStaff(req.user);
  if (!staff && req.user.role !== 'scholar') return fail(res, 403, 'Access denied.');
  const records = await ProgramAcademicResult.findAll({
    where: staff ? {} : { beneficiaryId: req.user.id },
    include: academicInclude(),
    order: [['createdAt', 'DESC']]
  });
  const filtered = filterAcademicRecords(records.map(publicAcademicResult), req.query);
  const dateStamp = new Date().toISOString().slice(0, 10);

  if (req.query.mode === 'summary') {
    return sendPdf(res, `academic-results-summary-${dateStamp}.pdf`, {
      title: 'Academic Results Transcripts Report',
      subtitle: `Generated ${dateStamp} · ${filtered.length} transcript(s)`,
      columns: [
        { label: 'Scholar', weight: 1.5, value: (row) => row.beneficiary_name },
        { label: 'Campus', weight: 1, value: (row) => row.campus || '-' },
        { label: 'Combo', weight: 0.9, value: (row) => row.combination || '-' },
        { label: 'Year', weight: 0.8, value: (row) => row.year_level || '-' },
        { label: 'Ac. Year', weight: 0.9, value: (row) => row.academic_year },
        { label: 'Semester', weight: 1, value: (row) => row.term },
        { label: 'Mods', weight: 0.6, value: (row) => (row.modules || []).length },
        { label: 'Credits', weight: 0.7, value: (row) => row.total_credits },
        { label: 'Avg %', weight: 0.8, value: (row) => `${Number(row.average_score ?? 0).toFixed(2)}%` },
        { label: 'Grade', weight: 0.6, value: (row) => row.overall_aggregate },
        { label: 'Verdict', weight: 1.3, value: (row) => row.verdict },
        { label: 'Status', weight: 0.8, value: (row) => row.status }
      ],
      rows: filtered
    });
  }

  const moduleRows = filtered.flatMap((row) =>
    (row.modules || []).map((mod) => ({ row, mod }))
  );
  sendPdf(res, `academic-results-modules-${dateStamp}.pdf`, {
    title: 'Academic Results Modules & Credits Report',
    subtitle: `Generated ${dateStamp} · ${moduleRows.length} module row(s)`,
    columns: [
      { label: 'Scholar', weight: 1.5, value: ({ row }) => row.beneficiary_name },
      { label: 'Campus', weight: 0.9, value: ({ row }) => row.campus || '-' },
      { label: 'Combo', weight: 0.8, value: ({ row }) => row.combination || '-' },
      { label: 'Year', weight: 0.7, value: ({ row }) => row.year_level || '-' },
      { label: 'Semester', weight: 0.9, value: ({ row }) => row.term },
      { label: 'Module', weight: 0.9, value: ({ mod }) => mod.module_code },
      { label: 'Title', weight: 1.4, value: ({ mod }) => mod.module_name || '-' },
      { label: 'Credits', weight: 0.6, value: ({ mod }) => mod.credits },
      { label: 'Marks', weight: 0.8, value: ({ mod }) => `${mod.marks}/${mod.max_marks}` },
      { label: 'Grade', weight: 0.6, value: ({ mod }) => mod.aggregate },
      { label: 'Verdict', weight: 1.1, value: ({ row }) => row.verdict }
    ],
    rows: moduleRows
  });
}));

router.get('/financial-assistance/export', asyncRoute(async (req, res) => {
  if (req.user.role !== 'admin') return fail(res, 403, 'Access denied. Only administrators can export support records.');
  const records = await ProgramAssistance.findAll({
    include: [{ model: User, as: 'beneficiary', attributes: ['id', 'name', 'email', 'university'] }],
    order: [['supportDate', 'DESC']]
  });
  const dateStamp = new Date().toISOString().slice(0, 10);
  sendPdf(res, `support-disbursements-${dateStamp}.pdf`, {
    title: 'Financial Support & Stipend Disbursements',
    subtitle: `Generated ${dateStamp} · ${records.length} disbursement(s)`,
    columns: [
      { label: 'Scholar', weight: 1.5, value: (row) => row.beneficiary?.name },
      { label: 'University', weight: 1.4, value: (row) => row.beneficiary?.university || 'University of Rwanda' },
      { label: 'Category', weight: 1.4, value: (row) => row.supportType },
      { label: 'Amount', weight: 0.9, value: (row) => `${row.amount} ${row.currency}` },
      { label: 'Method', weight: 1.1, value: (row) => row.disbursementMethod },
      { label: 'Reference', weight: 1.1, value: (row) => row.referenceNumber || '-' },
      { label: 'Date', weight: 0.8, value: (row) => row.supportDate },
      { label: 'Status', weight: 0.8, value: (row) => row.status }
    ],
    rows: records
  });
}));

router.get('/beneficiaries/export', asyncRoute(async (req, res) => {
  if (!requireStaff(req, res)) return;
  const people = await User.findAll({
    where: { role: 'scholar' },
    include: [{ model: Cohort, as: 'cohort', attributes: ['id', 'name'], required: false }],
    order: [['name', 'ASC']]
  });
  const dateStamp = new Date().toISOString().slice(0, 10);
  sendPdf(res, `participants-${dateStamp}.pdf`, {
    title: 'Rise Her Scholars Roster',
    subtitle: `Generated ${dateStamp} · ${people.length} scholar(s)`,
    columns: [
      { label: 'Full Name', weight: 1.6, value: (row) => row.name },
      { label: 'Email', weight: 1.8, value: (row) => row.email },
      { label: 'Cohort', weight: 1.2, value: (row) => row.cohort?.name || 'Unassigned' },
      { label: 'University', weight: 1.5, value: (row) => row.university || '-' },
      { label: 'Year Level', weight: 0.9, value: (row) => row.yearLevel || '-' }
    ],
    rows: people
  });
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
    include: [
      { model: User, as: 'beneficiary', attributes: ['id', 'name'] },
      { model: ProgramAcademicModule, as: 'modules', required: false }
    ]
  }) : null;
  if (req.body?.result_id && !result) return fail(res, 404, 'Academic result not found.');
  const serialized = result ? publicAcademicResult(result) : null;
  const subject = serialized?.subject || req.body?.subject || 'Academic Modules';
  const score = serialized?.average_score ?? serialized?.score ?? req.body?.score;
  const maxScore = serialized ? 100 : (req.body?.max_score ?? 100);
  if (!validText(subject, 1, 120) || !Number.isFinite(Number(score)) || !Number.isFinite(Number(maxScore)) || Number(maxScore) <= 0) {
    return fail(res, 422, 'Valid academic result details are required.');
  }
  const percentage = Math.round(Number(score) / Number(maxScore) * 100);
  const name = serialized?.beneficiary_name || req.body?.beneficiary_name || 'Scholar';
  const modulesDetail = serialized?.modules?.length
    ? ` Modules: ${serialized.modules.map((m) => `${m.module_code} (${m.marks}%, ${m.aggregate}, ${m.credits} cr)`).join(', ')}. Total credits: ${serialized.total_credits}, Verdict: ${serialized.verdict}.`
    : '';
  const feedback = await generateText(
    `Write encouraging, constructive, two-sentence academic feedback for ${name}, achieving ${percentage}% overall in ${subject}.${modulesDetail}`,
    percentage >= 80
      ? `Excellent work across ${subject}, ${name.split(' ')[0]} (${percentage}%). Your performance reflects strong preparation; consider sharing your study strategies with peers.`
      : `Thank you for submitting your ${subject} results, ${name.split(' ')[0]} (${percentage}%). Keep building on your stronger modules and schedule targeted practice for lower-scoring units.`
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
    attributes: ['id', 'name', 'email', 'role', 'cohortId', 'university', 'yearLevel'],
    order: [['name', 'ASC']]
  });
  res.json(people.map(publicPerson));
}));

export default router;
