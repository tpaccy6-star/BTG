export const COMMON_CAMPUSES = [
  'RUKARA',
  'CST (Kigali)',
  'HUYE',
  'CMHS (Remera)',
  'BUSOGO',
  'GIKONDO',
  'NYAGATARE'
];

export const COMMON_COMBINATIONS = [
  'CSE',
  'Computer Science',
  'Software Engineering',
  'Information Systems',
  'MCE',
  'PCB',
  'Mathematics & Physics',
  'Education & Sciences',
  'Social Sciences',
  'Medicine & Health',
  'Economics'
];

export const COMMON_YEAR_LEVELS = [
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5'
];

export const COMMON_TERMS = [
  'Semester I',
  'Semester II',
  'Semester III',
  'Term 1',
  'Term 2',
  'Term 3',
  'Annual'
];

export const COMMON_VERDICTS = [
  'PASS',
  'DISTINCTION',
  'PROCEED WITH RETAKE',
  'RETAKE',
  'REPEAT YEAR',
  'FAIL',
  'PENDING'
];

export function roundTwo(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function computeAggregate(percentage) {
  const pct = Number(percentage);
  if (!Number.isFinite(pct)) return 'F';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

export function normalizeAcademicYear(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s*-\s*/g, '-');
}

export function computeTranscriptSummary(modules) {
  const validRows = (modules || []).filter((m) => String(m.module_code || '').trim() !== '' || m.marks !== '');
  if (!validRows.length) {
    return {
      moduleCount: 0,
      creditedCount: 0,
      totalCredits: 0,
      averageScore: 0,
      unweightedAverage: 0,
      overallAggregate: '—',
      failedCount: 0,
      passedCount: 0,
      isWeighted: false,
      hasFullCredits: false,
      suggestedVerdict: 'PENDING'
    };
  }

  const normalized = validRows.map((m) => {
    const marks = Number(m.marks);
    const maxMarks = Number(m.max_marks) > 0 ? Number(m.max_marks) : 100;
    const credits = Number(m.credits) > 0 ? Number(m.credits) : 0;
    const percentage = Number.isFinite(marks) ? (marks / maxMarks) * 100 : 0;
    return { credits, percentage };
  });

  const totalCredits = roundTwo(normalized.reduce((sum, item) => sum + item.credits, 0));
  const credited = normalized.filter((item) => item.credits > 0);
  const unweightedAverage = roundTwo(
    normalized.reduce((sum, item) => sum + item.percentage, 0) / normalized.length
  );
  const averageScore = totalCredits > 0
    ? roundTwo(credited.reduce((sum, item) => sum + item.percentage * item.credits, 0) / totalCredits)
    : unweightedAverage;

  const failedCount = normalized.filter((item) => item.percentage < 50).length;
  const passedCount = normalized.length - failedCount;
  const overallAggregate = computeAggregate(averageScore);

  let suggestedVerdict = 'PASS';
  if (failedCount > 0) {
    suggestedVerdict = averageScore >= 50 && failedCount <= 2 ? 'PROCEED WITH RETAKE' : 'FAIL';
  }

  return {
    moduleCount: normalized.length,
    creditedCount: credited.length,
    totalCredits,
    averageScore,
    unweightedAverage,
    overallAggregate,
    failedCount,
    passedCount,
    isWeighted: totalCredits > 0,
    hasFullCredits: credited.length === normalized.length,
    suggestedVerdict
  };
}

export function computeYearSummaries(records) {
  const groups = new Map();
  (records || []).forEach((record) => {
    const yearLevel = (record.year_level || 'Unspecified Year').trim();
    const academicYear = normalizeAcademicYear(record.academic_year || 'Unspecified');
    const key = `${record.beneficiary_id}::${academicYear.toLowerCase()}::${yearLevel.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        beneficiary_id: record.beneficiary_id,
        beneficiary_name: record.beneficiary_name || 'Scholar',
        beneficiary_email: record.beneficiary_email || '',
        school: record.school || 'University of Rwanda',
        campus: record.campus || '',
        combination: record.combination || '',
        year_level: yearLevel,
        academic_year: academicYear,
        semesters: [],
        allModules: []
      });
    }
    const group = groups.get(key);
    if (!group.campus && record.campus) group.campus = record.campus;
    if (!group.combination && record.combination) group.combination = record.combination;
    group.semesters.push(record);
    (record.modules || []).forEach((m) => group.allModules.push(m));
  });

  return Array.from(groups.values()).map((group) => {
    const summary = computeTranscriptSummary(group.allModules);
    const semesterTerms = [...new Set(group.semesters.map((s) => s.term).filter(Boolean))];
    const explicitFail = group.semesters.some((s) => /fail|repeat/i.test(s.verdict || ''));
    const explicitRetake = group.semesters.some((s) => /retake/i.test(s.verdict || ''));
    let yearVerdict = summary.suggestedVerdict;
    if (explicitFail && yearVerdict === 'PASS') yearVerdict = 'FAIL';
    else if (explicitRetake && yearVerdict === 'PASS') yearVerdict = 'PROCEED WITH RETAKE';

    return {
      ...group,
      semesterCount: group.semesters.length,
      semesterTerms,
      ...summary,
      yearVerdict
    };
  });
}

export function guessCampusFromUniversity(university) {
  const text = String(university || '').toLowerCase();
  if (!text) return '';
  if (text.includes('rukar')) return 'RUKARA';
  if (text.includes('cst') || text.includes('kigali')) return 'CST (Kigali)';
  if (text.includes('huye')) return 'HUYE';
  if (text.includes('remera') || text.includes('cmhs')) return 'CMHS (Remera)';
  if (text.includes('busogo')) return 'BUSOGO';
  if (text.includes('gikondo')) return 'GIKONDO';
  if (text.includes('nyagatare')) return 'NYAGATARE';
  return '';
}

export function guessYearLevelFromProfile(yearLevel) {
  const match = String(yearLevel || '').match(/year\s*\d+/i);
  if (!match) return '';
  const digits = match[0].replace(/\D+/g, '');
  return digits ? `Year ${digits}` : '';
}

export function createEmptyModuleRow() {
  return {
    localKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    module_code: '',
    module_name: '',
    credits: '',
    marks: '',
    max_marks: 100,
    aggregate: '',
    aggregateManual: false
  };
}

function splitTokens(line) {
  if (line.includes('\t')) {
    return line.split('\t').map((cell) => cell.trim());
  }
  if (line.includes(',')) {
    return line.split(',').map((cell) => cell.trim());
  }
  return line.trim().split(/\s{2,}/).map((cell) => cell.trim());
}

export function parseTranscriptText(rawText) {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const meta = {
    student_name: '',
    campus: '',
    combination: '',
    academic_year: '',
    year_level: '',
    term: '',
    verdict: ''
  };

  let moduleRow = null;
  let creditsRow = null;
  let marksRow = null;
  let aggregateRow = null;
  const verticalRows = [];

  for (const line of lines) {
    const yearHeading = line.match(/marks\s+of\s+(year\s*\d+)/i);
    if (yearHeading) {
      const digits = yearHeading[1].replace(/\D+/g, '');
      meta.year_level = digits ? `Year ${digits}` : yearHeading[1];
      continue;
    }

    const kvMatch = line.match(/^([A-Za-z\s]+?)\s*:\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim().toLowerCase();
      const val = kvMatch[2].trim();
      if (key.includes('name')) { meta.student_name = val; continue; }
      if (key.includes('campus')) { meta.campus = val; continue; }
      if (key.includes('combination') || key.includes('program') || key.includes('department')) { meta.combination = val; continue; }
      if (key.includes('academic year')) { meta.academic_year = normalizeAcademicYear(val); continue; }
      if (key === 'year' || key.includes('year level') || key.includes('year of study')) { meta.year_level = val; continue; }
      if (key.includes('semester') || key.includes('term')) { meta.term = val; continue; }
      if (key === 'verdict') { meta.verdict = val; continue; }
    }

    if (/^semester\s+[ivx0-9]+$/i.test(line) || /^term\s+\d+$/i.test(line)) {
      meta.term = line.replace(/\s+/g, ' ').replace(/^semester/i, 'Semester').replace(/^term/i, 'Term');
      continue;
    }

    const tokens = splitTokens(line);
    if (tokens.length >= 2) {
      const head = tokens[0].toLowerCase().replace(/:$/, '');
      if (['module', 'modules', 'course', 'courses', 'code'].includes(head)) {
        moduleRow = tokens.slice(1).filter(Boolean);
        continue;
      }
      if (['credit', 'credits', 'cr'].includes(head)) {
        creditsRow = tokens.slice(1);
        continue;
      }
      if (['mark', 'marks', 'score', 'scores'].includes(head)) {
        marksRow = tokens.slice(1);
        continue;
      }
      if (['aggregate', 'aggregates', 'grade', 'grades'].includes(head)) {
        aggregateRow = tokens.slice(1);
        continue;
      }
    }

    // Fallback vertical line: MODULE_CODE  MARKS  [CREDITS]  [AGGREGATE]
    if (tokens.length >= 2 && /^[A-Za-z]{2,}[A-Za-z0-9_-]*$/.test(tokens[0]) && !Number.isNaN(Number(tokens[1]))) {
      const code = tokens[0];
      const marks = Number(tokens[1]);
      const maybeCredits = tokens[2] !== undefined && tokens[2] !== '' && !Number.isNaN(Number(tokens[2])) ? Number(tokens[2]) : '';
      const maybeAgg = tokens[3] || (tokens[2] && Number.isNaN(Number(tokens[2])) ? tokens[2] : '');
      verticalRows.push({
        localKey: `${Date.now()}_${verticalRows.length}_${Math.random().toString(36).slice(2, 6)}`,
        module_code: code,
        module_name: '',
        credits: maybeCredits,
        marks: String(marks),
        max_marks: 100,
        aggregate: maybeAgg || computeAggregate(marks),
        aggregateManual: Boolean(maybeAgg)
      });
    }
  }

  let modules = [];
  if (moduleRow && moduleRow.length > 0) {
    modules = moduleRow.map((code, idx) => {
      const rawMark = marksRow?.[idx] ?? '';
      const numericMark = Number(rawMark);
      const rawCredit = creditsRow?.[idx] ?? '';
      const rawAgg = aggregateRow?.[idx] ?? '';
      const computedAgg = rawMark !== '' && Number.isFinite(numericMark) ? computeAggregate(numericMark) : '';
      return {
        localKey: `${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        module_code: code,
        module_name: '',
        credits: rawCredit !== '' && Number.isFinite(Number(rawCredit)) ? Number(rawCredit) : '',
        marks: rawMark !== '' && Number.isFinite(numericMark) ? String(numericMark) : '',
        max_marks: 100,
        aggregate: rawAgg || computedAgg,
        aggregateManual: Boolean(rawAgg)
      };
    });
  } else if (verticalRows.length > 0) {
    modules = verticalRows;
  }

  return { meta, modules };
}
