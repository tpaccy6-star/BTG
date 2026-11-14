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

export function normalizeAggregateInput(value, percentage) {
  if (typeof value !== 'string' || !value.trim()) {
    return computeAggregate(percentage);
  }
  const trimmed = value.trim().slice(0, 10);
  if (!/\s/.test(trimmed) && trimmed.length <= 3) {
    return trimmed.toUpperCase();
  }
  return trimmed;
}

export function parseRawModules(rawModules) {
  if (!Array.isArray(rawModules) || rawModules.length === 0 || rawModules.length > 50) {
    return { error: 'Add between 1 and 50 modules.' };
  }

  const normalized = [];
  for (let index = 0; index < rawModules.length; index += 1) {
    const item = rawModules[index] || {};
    const moduleCode = String(
      item.module_code ?? item.moduleCode ?? item.code ?? item.subject ?? ''
    ).trim();
    const moduleName = String(
      item.module_name ?? item.moduleName ?? item.name ?? ''
    ).trim();
    const creditsRaw = item.credits === '' || item.credits == null ? 0 : Number(item.credits);
    const marksRaw = Number(item.marks ?? item.score);
    const maxRaw = item.max_marks ?? item.maxMarks ?? item.max_score;
    const maxMarks = maxRaw === '' || maxRaw == null ? 100 : Number(maxRaw);

    if (!moduleCode || moduleCode.length > 60) {
      return { error: `Module row ${index + 1} requires a module code (1–60 characters).` };
    }
    if (moduleName.length > 160) {
      return { error: `Module name on row ${index + 1} must be 160 characters or fewer.` };
    }
    if (!Number.isFinite(creditsRaw) || creditsRaw < 0) {
      return { error: `Credits on module ${moduleCode} must be 0 or greater.` };
    }
    if (!Number.isFinite(marksRaw) || marksRaw < 0) {
      return { error: `Marks on module ${moduleCode} must be 0 or greater.` };
    }
    if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
      return { error: `Maximum marks on module ${moduleCode} must be greater than 0.` };
    }
    if (marksRaw > maxMarks) {
      return { error: `Marks (${marksRaw}) cannot exceed maximum marks (${maxMarks}) on module ${moduleCode}.` };
    }

    const percentage = roundTwo((marksRaw / maxMarks) * 100);
    const aggregate = normalizeAggregateInput(item.aggregate, percentage);

    normalized.push({
      moduleCode,
      moduleName: moduleName || null,
      credits: roundTwo(creditsRaw),
      marks: roundTwo(marksRaw),
      maxMarks: roundTwo(maxMarks),
      percentage,
      aggregate,
      sortOrder: index
    });
  }

  return { modules: normalized };
}

export function parseTemplateModules(rawModules) {
  if (!Array.isArray(rawModules) || rawModules.length === 0 || rawModules.length > 50) {
    return { error: 'A template must include between 1 and 50 modules.' };
  }

  const normalized = [];
  for (let index = 0; index < rawModules.length; index += 1) {
    const item = rawModules[index] || {};
    const moduleCode = String(
      item.module_code ?? item.moduleCode ?? item.code ?? item.subject ?? ''
    ).trim();
    const moduleName = String(
      item.module_name ?? item.moduleName ?? item.name ?? ''
    ).trim();
    const creditsRaw = item.credits === '' || item.credits == null ? 0 : Number(item.credits);
    const maxRaw = item.max_marks ?? item.maxMarks ?? item.max_score;
    const maxMarks = maxRaw === '' || maxRaw == null ? 100 : Number(maxRaw);

    if (!moduleCode || moduleCode.length > 60) {
      return { error: `Template module row ${index + 1} requires a module code (1–60 characters).` };
    }
    if (moduleName.length > 160) {
      return { error: `Template module name on row ${index + 1} must be 160 characters or fewer.` };
    }
    if (!Number.isFinite(creditsRaw) || creditsRaw < 0) {
      return { error: `Template credits on module ${moduleCode} must be 0 or greater.` };
    }
    if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
      return { error: `Template maximum marks on module ${moduleCode} must be greater than 0.` };
    }

    normalized.push({
      module_code: moduleCode,
      module_name: moduleName,
      credits: roundTwo(creditsRaw),
      max_marks: roundTwo(maxMarks)
    });
  }

  return { modules: normalized };
}

export function computeTranscriptSummary(modules) {
  if (!Array.isArray(modules) || modules.length === 0) {
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

  const withPct = modules.map((mod) => {
    const marks = Number(mod.marks ?? mod.score ?? 0);
    const maxMarks = Number(mod.maxMarks ?? mod.max_marks ?? mod.maxScore ?? 100) || 100;
    const credits = Number(mod.credits ?? 0) || 0;
    const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
    return { credits, percentage };
  });

  const totalCredits = roundTwo(withPct.reduce((sum, item) => sum + item.credits, 0));
  const credited = withPct.filter((item) => item.credits > 0);
  const unweightedAverage = roundTwo(
    withPct.reduce((sum, item) => sum + item.percentage, 0) / withPct.length
  );
  const averageScore = totalCredits > 0
    ? roundTwo(credited.reduce((sum, item) => sum + item.percentage * item.credits, 0) / totalCredits)
    : unweightedAverage;

  const failedCount = withPct.filter((item) => item.percentage < 50).length;
  const passedCount = withPct.length - failedCount;
  const overallAggregate = computeAggregate(averageScore);

  let suggestedVerdict = 'PASS';
  if (failedCount > 0) {
    suggestedVerdict = averageScore >= 50 && failedCount <= 2 ? 'PROCEED WITH RETAKE' : 'FAIL';
  }

  return {
    moduleCount: withPct.length,
    creditedCount: credited.length,
    totalCredits,
    averageScore,
    unweightedAverage,
    overallAggregate,
    failedCount,
    passedCount,
    isWeighted: totalCredits > 0,
    hasFullCredits: credited.length === withPct.length,
    suggestedVerdict
  };
}

export function buildSubjectSummary(modules, combination) {
  if (!modules.length) return 'Academic Result';
  if (modules.length === 1) {
    const first = modules[0];
    return first.moduleName ? `${first.moduleCode} · ${first.moduleName}` : first.moduleCode;
  }
  const prefix = combination ? `${combination} · ` : '';
  return `${prefix}${modules.length} Modules (${modules.slice(0, 3).map((m) => m.moduleCode).join(', ')}${modules.length > 3 ? '…' : ''})`.slice(0, 120);
}
