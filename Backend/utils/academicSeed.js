import {
  User,
  ProgramAcademicResult,
  ProgramAcademicModule,
  ProgramModuleTemplate
} from '../models.js';
import {
  buildSubjectSummary,
  computeAggregate,
  computeTranscriptSummary
} from './academicUtils.js';

export const defaultAcademicTemplates = [
  {
    name: 'UR Rukara · CSE · Year 2 · Semester II',
    school: 'University of Rwanda',
    campus: 'RUKARA',
    combination: 'CSE',
    yearLevel: 'Year 2',
    term: 'Semester II',
    modules: [
      { module_code: 'PE80441', module_name: '', credits: 0, max_marks: 100 },
      { module_code: 'CT80441', module_name: '', credits: 0, max_marks: 100 },
      { module_code: 'CL80311', module_name: '', credits: 0, max_marks: 100 },
      { module_code: 'CS80143', module_name: '', credits: 0, max_marks: 100 },
      { module_code: 'CS80241', module_name: '', credits: 0, max_marks: 100 },
      { module_code: 'CS80441', module_name: '', credits: 0, max_marks: 100 },
      { module_code: 'MA80443', module_name: '', credits: 0, max_marks: 100 },
      { module_code: 'MA80444', module_name: '', credits: 0, max_marks: 100 },
      { module_code: 'CE80441', module_name: '', credits: 0, max_marks: 100 }
    ]
  },
  {
    name: 'UR CST · Software Engineering · Year 2 · Semester I',
    school: 'University of Rwanda',
    campus: 'CST (Kigali)',
    combination: 'Software Engineering',
    yearLevel: 'Year 2',
    term: 'Semester I',
    modules: [
      { module_code: 'CS2101', module_name: 'Data Structures & Algorithms', credits: 15, max_marks: 100 },
      { module_code: 'CS2102', module_name: 'Database Systems', credits: 15, max_marks: 100 },
      { module_code: 'CS2103', module_name: 'Software Engineering Principles', credits: 15, max_marks: 100 },
      { module_code: 'MA2101', module_name: 'Discrete Mathematics', credits: 15, max_marks: 100 }
    ]
  }
];

const SAMPLE_RUKARA_CSE_BASE = {
  school: 'University of Rwanda',
  campus: 'RUKARA',
  combination: 'CSE',
  yearLevel: 'Year 2',
  academicYear: '2025-2026',
  term: 'Semester II'
};

const SAMPLE_SCHOLAR_TRANSCRIPTS = [
  {
    email: 'irra@gr.com',
    marks: [
      ['PE80441', 76.98],
      ['CT80441', 85.76],
      ['CL80311', 70.25],
      ['CS80143', 67.50],
      ['CS80241', 85.71],
      ['CS80441', 66.51],
      ['MA80443', 66.56],
      ['MA80444', 68.63],
      ['CE80441', 81.00]
    ]
  },
  {
    email: 'scholar@generationrise.org',
    marks: [
      ['PE80441', 79.45],
      ['CT80441', 88.20],
      ['CL80311', 73.60],
      ['CS80143', 71.15],
      ['CS80241', 87.90],
      ['CS80441', 69.80],
      ['MA80443', 70.10],
      ['MA80444', 72.40],
      ['CE80441', 83.50]
    ]
  }
];

/**
 * Seeds a sample UR Rukara CSE Year 2 Semester II transcript for a scholar if they have none yet.
 */
async function seedSampleTranscriptForEmail(email, marksPairs) {
  const scholar = await User.findOne({ where: { email } });
  if (!scholar) return;

  const existingCount = await ProgramAcademicResult.count({
    where: { beneficiaryId: scholar.id }
  });
  if (existingCount > 0) return;

  const sampleModules = marksPairs.map(([moduleCode, marks], index) => ({
    moduleCode,
    moduleName: null,
    credits: 0,
    marks,
    maxMarks: 100,
    aggregate: computeAggregate(marks),
    sortOrder: index
  }));

  const summary = computeTranscriptSummary(sampleModules);
  const created = await ProgramAcademicResult.create({
    beneficiaryId: scholar.id,
    ...SAMPLE_RUKARA_CSE_BASE,
    subject: buildSubjectSummary(sampleModules, SAMPLE_RUKARA_CSE_BASE.combination),
    score: summary.averageScore,
    maxScore: 100,
    totalCredits: summary.totalCredits,
    averageScore: summary.averageScore,
    overallAggregate: summary.overallAggregate,
    verdict: summary.suggestedVerdict,
    status: 'Pending'
  });

  await ProgramAcademicModule.bulkCreate(
    sampleModules.map((m) => ({
      academicResultId: created.id,
      ...m
    }))
  );
}

/**
 * Seeds default academic templates and initial sample transcripts for Irra Rosine and Tuyisabe Rahab.
 */
export async function seedAcademicTemplatesAndSample() {
  const existingTemplates = await ProgramModuleTemplate.count();
  if (existingTemplates === 0) {
    await ProgramModuleTemplate.bulkCreate(
      defaultAcademicTemplates.map((tpl) => ({
        name: tpl.name,
        school: tpl.school,
        campus: tpl.campus,
        combination: tpl.combination,
        yearLevel: tpl.yearLevel,
        term: tpl.term,
        modulesJson: JSON.stringify(tpl.modules)
      }))
    );
  }

  for (const sample of SAMPLE_SCHOLAR_TRANSCRIPTS) {
    await seedSampleTranscriptForEmail(sample.email, sample.marks);
  }
}
