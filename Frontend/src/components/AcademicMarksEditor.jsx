import { useMemo, useState } from 'react';
import {
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  X
} from 'lucide-react';
import {
  COMMON_CAMPUSES,
  COMMON_COMBINATIONS,
  COMMON_TERMS,
  COMMON_VERDICTS,
  COMMON_YEAR_LEVELS,
  computeAggregate,
  computeTranscriptSummary,
  createEmptyModuleRow,
  guessCampusFromUniversity,
  guessYearLevelFromProfile
} from '../utils/academicCalculations';
import {
  GradeBadge,
  VerdictBadge,
  academicCompactInputClass,
  academicInputClass,
  academicPrimaryButtonClass,
  academicQuietButtonClass
} from './academicUiHelpers';

function toEditableRows(record) {
  if (record?.modules?.length) {
    return record.modules.map((mod, idx) => ({
      localKey: mod.id || `row_${idx}_${Date.now()}`,
      module_code: mod.module_code || '',
      module_name: mod.module_name || '',
      credits: mod.credits === 0 ? '0' : String(mod.credits ?? ''),
      marks: mod.marks ?? '',
      max_marks: mod.max_marks ?? 100,
      aggregate: mod.aggregate || '',
      aggregateManual: false
    }));
  }
  return [createEmptyModuleRow()];
}

export default function AcademicMarksEditor({
  initialRecord = null,
  currentUser = null,
  isSaving = false,
  onSave,
  onCancel
}) {
  const isEditing = Boolean(initialRecord?.id);
  const [school, setSchool] = useState(initialRecord?.school || 'University of Rwanda');
  const [campus, setCampus] = useState(
    initialRecord?.campus || guessCampusFromUniversity(currentUser?.university)
  );
  const [combination, setCombination] = useState(initialRecord?.combination || '');
  const [yearLevel, setYearLevel] = useState(
    initialRecord?.year_level || guessYearLevelFromProfile(currentUser?.yearLevel || currentUser?.year_level)
  );
  const [academicYear, setAcademicYear] = useState(initialRecord?.academic_year || '2025-2026');
  const [term, setTerm] = useState(initialRecord?.term || 'Semester II');
  const [verdictMode, setVerdictMode] = useState(initialRecord?.verdict ? 'custom' : 'auto');
  const [customVerdict, setCustomVerdict] = useState(initialRecord?.verdict || '');
  const [modules, setModules] = useState(() => toEditableRows(initialRecord));
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState('');

  const summary = useMemo(() => computeTranscriptSummary(modules), [modules]);
  const effectiveVerdict = verdictMode === 'custom' && customVerdict.trim()
    ? customVerdict.trim()
    : summary.suggestedVerdict;

  const updateModuleRow = (localKey, field, value) => {
    setModules((prev) =>
      prev.map((row) => {
        if (row.localKey !== localKey) return row;
        const next = { ...row, [field]: value };
        if (field === 'aggregate') {
          next.aggregateManual = Boolean(String(value).trim());
        }
        if (field === 'marks' || field === 'max_marks') {
          const numMarks = Number(next.marks);
          const numMax = Number(next.max_marks) > 0 ? Number(next.max_marks) : 100;
          if (!next.aggregateManual) {
            next.aggregate = next.marks === '' || !Number.isFinite(numMarks)
              ? ''
              : computeAggregate((numMarks / numMax) * 100);
          }
        }
        return next;
      })
    );
  };

  const addModule = () => {
    setModules((prev) => [...prev, createEmptyModuleRow()]);
  };

  const removeModule = (localKey) => {
    setModules((prev) => {
      if (prev.length <= 1) return [createEmptyModuleRow()];
      return prev.filter((row) => row.localKey !== localKey);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');

    const populated = modules.filter(
      (m) => String(m.module_code || '').trim() !== '' || m.marks !== ''
    );
    if (!populated.length) {
      setLocalError('Add at least one module with a code and marks.');
      return;
    }

    const cleanedModules = [];
    for (let i = 0; i < populated.length; i += 1) {
      const m = populated[i];
      const code = String(m.module_code || '').trim();
      const marks = Number(m.marks);
      const maxMarks = Number(m.max_marks) > 0 ? Number(m.max_marks) : 100;
      const credits = m.credits === '' || m.credits == null ? 0 : Number(m.credits);
      if (!code) {
        setLocalError(`Enter a module code on row ${i + 1}.`);
        return;
      }
      if (m.marks === '' || !Number.isFinite(marks) || marks < 0) {
        setLocalError(`Enter valid marks for ${code}.`);
        return;
      }
      if (!Number.isFinite(credits) || credits < 0) {
        setLocalError(`Credits must be 0 or greater for ${code}.`);
        return;
      }
      if (marks > maxMarks) {
        setLocalError(`Marks (${marks}) cannot exceed max (${maxMarks}) for ${code}.`);
        return;
      }
      cleanedModules.push({
        module_code: code,
        module_name: String(m.module_name || '').trim(),
        credits,
        marks,
        max_marks: maxMarks,
        aggregate: String(m.aggregate || '').trim() || computeAggregate((marks / maxMarks) * 100)
      });
    }

    const payload = {
      school: school.trim() || 'University of Rwanda',
      campus: campus.trim(),
      combination: combination.trim(),
      year_level: yearLevel.trim(),
      academic_year: academicYear.trim(),
      term: term.trim(),
      verdict: effectiveVerdict,
      modules: cleanedModules
    };

    await onSave(payload, file, initialRecord?.id || null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            {isEditing ? 'Edit Academic Marks & Module Credits' : 'Academic Marks Entry'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentUser?.name
              ? `Submitting as ${currentUser.name} · Add modules with their code, name, credits, marks, max score, and aggregate.`
              : 'Add your semester details and each module with all of its attributes.'}
          </p>
        </div>
        <button type="button" onClick={onCancel} className={academicQuietButtonClass}>
          <X size={14} /> Close
        </button>
      </div>

      {localError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200">
          {localError}
        </div>
      )}

      {/* Semester & Program Metadata */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Institution / School *</span>
          <input
            required
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="University of Rwanda"
            className={academicInputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Campus</span>
          <input
            list="academic-campus-options"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            placeholder="e.g. RUKARA"
            className={academicInputClass}
          />
          <datalist id="academic-campus-options">
            {COMMON_CAMPUSES.map((c) => <option key={c} value={c} />)}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Combination / Program</span>
          <input
            list="academic-combination-options"
            value={combination}
            onChange={(e) => setCombination(e.target.value)}
            placeholder="e.g. CSE"
            className={academicInputClass}
          />
          <datalist id="academic-combination-options">
            {COMMON_COMBINATIONS.map((c) => <option key={c} value={c} />)}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Year of Study</span>
          <input
            list="academic-year-level-options"
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
            placeholder="e.g. Year 2"
            className={academicInputClass}
          />
          <datalist id="academic-year-level-options">
            {COMMON_YEAR_LEVELS.map((y) => <option key={y} value={y} />)}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Academic Year *</span>
          <input
            required
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="e.g. 2025-2026"
            className={academicInputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Semester / Term *</span>
          <input
            required
            list="academic-term-options"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="e.g. Semester II"
            className={academicInputClass}
          />
          <datalist id="academic-term-options">
            {COMMON_TERMS.map((t) => <option key={t} value={t} />)}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Verdict</span>
          <select
            value={verdictMode === 'auto' ? '__AUTO__' : customVerdict}
            onChange={(e) => {
              if (e.target.value === '__AUTO__') {
                setVerdictMode('auto');
                setCustomVerdict('');
              } else {
                setVerdictMode('custom');
                setCustomVerdict(e.target.value);
              }
            }}
            className={academicInputClass}
          >
            <option value="__AUTO__">Auto ({summary.suggestedVerdict})</option>
            {COMMON_VERDICTS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      </div>

      {/* Modules Entry Table with All Module Attributes */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Modules & Attributes ({modules.length} module{modules.length === 1 ? '' : 's'})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Fill all attributes for each module and click Add Module to add more rows.
            </p>
          </div>
          <button type="button" onClick={addModule} className={academicPrimaryButtonClass}>
            <Plus size={14} /> Add Module
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[740px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <th className="w-10 px-3 py-2.5">#</th>
                <th className="w-36 px-2 py-2.5">Module Code *</th>
                <th className="px-2 py-2.5">Module Name / Title</th>
                <th className="w-28 px-2 py-2.5">Credits</th>
                <th className="w-28 px-2 py-2.5">Marks *</th>
                <th className="w-24 px-2 py-2.5">Max Marks</th>
                <th className="w-28 px-2 py-2.5">Aggregate</th>
                <th className="w-16 px-2 py-2.5 text-center">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {modules.map((row, idx) => (
                <tr key={row.localKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-3 py-2 font-bold text-slate-400">{idx + 1}</td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      aria-label={`Module code ${idx + 1}`}
                      value={row.module_code}
                      onChange={(e) => updateModuleRow(row.localKey, 'module_code', e.target.value)}
                      placeholder="e.g. PE80441"
                      className={academicCompactInputClass}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      aria-label={`Module name ${idx + 1}`}
                      value={row.module_name}
                      onChange={(e) => updateModuleRow(row.localKey, 'module_name', e.target.value)}
                      placeholder="e.g. Software Engineering"
                      className={academicCompactInputClass}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      aria-label={`Credits ${idx + 1}`}
                      min="0"
                      step="0.5"
                      value={row.credits}
                      onChange={(e) => updateModuleRow(row.localKey, 'credits', e.target.value)}
                      placeholder="0"
                      className={academicCompactInputClass}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      aria-label={`Marks ${idx + 1}`}
                      min="0"
                      step="0.01"
                      value={row.marks}
                      onChange={(e) => updateModuleRow(row.localKey, 'marks', e.target.value)}
                      placeholder="0.00"
                      className={academicCompactInputClass}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      aria-label={`Max marks ${idx + 1}`}
                      min="1"
                      step="any"
                      value={row.max_marks}
                      onChange={(e) => updateModuleRow(row.localKey, 'max_marks', e.target.value)}
                      className={academicCompactInputClass}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        aria-label={`Aggregate ${idx + 1}`}
                        maxLength={10}
                        value={row.aggregate}
                        onChange={(e) => updateModuleRow(row.localKey, 'aggregate', e.target.value)}
                        placeholder="Auto"
                        className={`${academicCompactInputClass} w-14 text-center uppercase`}
                      />
                      {row.aggregate && <GradeBadge grade={row.aggregate} />}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      title="Remove module"
                      aria-label={`Remove module ${row.module_code || idx + 1}`}
                      onClick={() => removeModule(row.localKey)}
                      className="inline-flex rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Computed Summary Bar */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Modules</span>
          <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
            {summary.moduleCount}
            <span className="ml-2 text-xs font-semibold text-slate-500">
              ({summary.passedCount} pass{summary.failedCount > 0 ? ` · ${summary.failedCount} fail` : ''})
            </span>
          </p>
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Credits</span>
          <p className="mt-1 text-lg font-black text-blue-950 dark:text-yellow-400">{summary.totalCredits}</p>
          <p className="text-[10px] font-semibold text-slate-500">
            {summary.moduleCount > 0 && !summary.hasFullCredits
              ? `${summary.creditedCount}/${summary.moduleCount} modules credited`
              : 'All modules credited'}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Average & Grade</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {summary.moduleCount > 0 ? `${summary.averageScore.toFixed(2)}%` : '—'}
            </span>
            {summary.moduleCount > 0 && <GradeBadge grade={summary.overallAggregate} />}
          </div>
          <p className="text-[10px] font-semibold text-slate-500">
            {summary.isWeighted ? 'Credit-weighted average' : 'Unweighted mean (add credits)'}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Verdict</span>
          <div className="mt-1.5">
            <VerdictBadge verdict={effectiveVerdict} />
          </div>
        </div>
      </div>

      {!isEditing && (
        <label className="block max-w-md">
          <span className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
            Transcript / Slip Attachment (optional)
          </span>
          <input
            type="file"
            accept=".doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className={academicInputClass}
          />
        </label>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="submit" disabled={isSaving} className={academicPrimaryButtonClass}>
          {isSaving && <LoaderCircle size={15} className="animate-spin" />}
          <Save size={15} />
          {isEditing ? 'Save Updated Marks & Credits' : 'Save Academic Transcript'}
        </button>
        <button type="button" onClick={onCancel} className={academicQuietButtonClass}>
          Cancel
        </button>
      </div>
    </form>
  );
}
