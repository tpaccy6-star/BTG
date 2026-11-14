import { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpDown,
  BookOpen,
  Check,
  Edit3,
  Eye,
  FilterX,
  LoaderCircle,
  Plus,
  Search,
  Trash2
} from 'lucide-react';
import {
  computeAggregate,
  computeYearSummaries,
  normalizeAcademicYear
} from '../utils/academicCalculations';
import { exportAcademicReportPdf } from '../utils/pdfExports';
import AcademicMarksEditor from './AcademicMarksEditor';
import AcademicTranscriptModal from './AcademicTranscriptModal';
import {
  GradeBadge,
  ReviewStatusBadge,
  VerdictBadge,
  academicCompactInputClass,
  academicPrimaryButtonClass,
  academicQuietButtonClass
} from './academicUiHelpers';

const EMPTY_FILTERS = {
  scholarId: 'all',
  campus: 'all',
  combination: 'all',
  yearLevel: 'all',
  academicYear: 'all',
  term: 'all',
  verdict: 'all',
  aggregate: 'all',
  status: 'all'
};

function uniqueOptions(records, getter) {
  const seen = new Map();
  records.forEach((rec) => {
    const raw = String(getter(rec) || '').trim();
    if (!raw) return;
    const key = raw.toLowerCase();
    if (!seen.has(key)) seen.set(key, raw);
  });
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

function SortHeader({ label, columnKey, sortConfig, onSort, align = 'left' }) {
  const active = sortConfig.key === columnKey;
  return (
    <th className={`px-3 py-3 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider transition ${active ? 'text-blue-900 dark:text-yellow-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
      >
        {label}
        <ArrowUpDown size={11} />
      </button>
    </th>
  );
}

function StudentExpandedMiniTable({
  record,
  yearSummary = null,
  isStaff = false,
  isSaving = false,
  editingCreditKey = null,
  creditDraft = '',
  savingCreditKey = null,
  onStartEditCredit,
  onChangeCreditDraft,
  onSaveCredit,
  onCancelEditCredit,
  onMarkViewed,
  onViewSheet,
  onEditRecord,
  onDeleteRecord
}) {
  const modules = record.modules || [];

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Student / Transcript Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-950/60 sm:flex-row sm:items-start sm:justify-between sm:px-4 sm:py-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-white break-words">
              {record.beneficiary_name || 'Scholar'}
            </h3>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-900 dark:bg-blue-950 dark:text-yellow-400">
              {record.campus || 'UR'} · {record.combination || 'General'}
            </span>
            <VerdictBadge verdict={record.verdict} />
            <ReviewStatusBadge value={record.status} />
          </div>
          <p className="mt-1 break-words text-[11px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs">
            {record.beneficiary_email ? `${record.beneficiary_email} · ` : ''}
            {record.school || 'University of Rwanda'} · {record.year_level || 'Study Year'} · {record.academic_year} · {record.term}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
          {isStaff && record.status !== 'Viewed' && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onMarkViewed(record.id)}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check size={13} /> Mark as Viewed
            </button>
          )}
          <button
            type="button"
            title="View Transcript Sheet"
            onClick={() => onViewSheet(record.id)}
            className={academicQuietButtonClass}
          >
            <Eye size={13} /> View Sheet
          </button>
          {!isStaff && (
            <button
              type="button"
              title="Edit My Modules & Credits"
              onClick={() => onEditRecord(record)}
              className={academicQuietButtonClass}
            >
              <Edit3 size={13} /> Edit
            </button>
          )}
          {!isStaff && record.status === 'Pending' && (
            <button
              type="button"
              title="Delete Record"
              onClick={() => onDeleteRecord(record)}
              className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-400"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {modules.length > 2 && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/40 px-3.5 py-1 text-[10px] font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-950/30 sm:hidden">
          <span>{modules.length} modules recorded</span>
          <span>Swipe table horizontally →</span>
        </div>
      )}

      {/* Horizontal Mini-Table: Modules as Columns, Credits / Marks / Aggregate as Rows */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-center text-xs">
          <tbody>
            <tr className="border-b border-slate-200 bg-blue-950 text-white dark:border-slate-800">
              <th className="sticky left-0 z-10 min-w-[82px] border-r border-blue-900/60 bg-blue-950 px-2.5 py-2.5 text-left text-[10px] font-black uppercase tracking-wider sm:min-w-[110px] sm:px-3">
                MODULE
              </th>
              {modules.map((mod, idx) => (
                <th
                  key={mod.id || `${mod.module_code}_${idx}`}
                  className="min-w-[86px] border-l border-blue-900/60 px-2 py-2 font-black sm:min-w-[100px] sm:px-3"
                >
                  <div>{mod.module_code}</div>
                  {mod.module_name && (
                    <div
                      className="mx-auto mt-0.5 max-w-[92px] truncate text-[10px] font-normal text-blue-200 sm:max-w-[115px]"
                      title={mod.module_name}
                    >
                      {mod.module_name}
                    </div>
                  )}
                </th>
              ))}
              <th className="min-w-[94px] border-l border-blue-800 bg-blue-900 px-2.5 py-2 text-[10px] font-black uppercase tracking-wider text-yellow-300 sm:min-w-[110px] sm:px-3">
                TOTAL / AVG
              </th>
            </tr>

            <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              <th className="sticky left-0 z-10 min-w-[82px] border-r border-slate-200 bg-slate-50 px-2.5 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 sm:min-w-[110px] sm:px-3">
                CREDITS
              </th>
              {modules.map((mod, idx) => {
                const rowKey = `${record.id}_${mod.id || mod.module_code}`;
                const canInlineCredit = !isStaff && mod.id && mod.id !== record.id;
                const isEditing = !isStaff && editingCreditKey === rowKey;
                const numericCredits = Number(mod.credits ?? 0);

                return (
                  <td
                    key={`${rowKey}_cr_${idx}`}
                    className="border-l border-slate-100 px-2.5 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-200"
                  >
                    {isEditing ? (
                      <div className="inline-flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={creditDraft}
                          onChange={(e) => onChangeCreditDraft(e.target.value)}
                          className="w-14 rounded-lg border border-blue-400 bg-white px-1.5 py-0.5 text-center text-xs font-bold dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          disabled={savingCreditKey === rowKey}
                          onClick={() => onSaveCredit(record, mod, rowKey)}
                          className="rounded-lg bg-blue-900 p-1 text-white hover:bg-blue-800"
                          title="Save Credits"
                        >
                          {savingCreditKey === rowKey ? <LoaderCircle size={11} className="animate-spin" /> : <Check size={11} />}
                        </button>
                        <button
                          type="button"
                          onClick={onCancelEditCredit}
                          className="rounded-lg border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100 dark:border-slate-700"
                        >
                          ×
                        </button>
                      </div>
                    ) : canInlineCredit ? (
                      <button
                        type="button"
                        onClick={() => onStartEditCredit(rowKey, numericCredits)}
                        className={`rounded-lg border px-2 py-0.5 text-xs font-black transition ${numericCredits > 0
                          ? 'border-slate-200 bg-white text-slate-800 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                          : 'border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-500 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                      >
                        {numericCredits > 0 ? `${numericCredits} cr` : '+ Add credits'}
                      </button>
                    ) : (
                      <span>{numericCredits}</span>
                    )}
                  </td>
                );
              })}
              <td className="border-l border-slate-200 bg-slate-100/80 px-3 py-2 font-black text-blue-950 dark:border-slate-800 dark:bg-slate-900 dark:text-yellow-400">
                {record.total_credits ?? 0}
              </td>
            </tr>

            <tr className="border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
              <th className="sticky left-0 z-10 min-w-[82px] border-r border-slate-200 bg-white px-2.5 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:min-w-[110px] sm:px-3">
                MARKS
              </th>
              {modules.map((mod, idx) => (
                <td
                  key={`${mod.id || mod.module_code}_mk_${idx}`}
                  className="border-l border-slate-100 px-2 py-2.5 font-black text-slate-900 dark:border-slate-800 dark:text-white sm:px-2.5"
                >
                  {Number(mod.marks).toFixed(2)}
                  {Number(mod.max_marks ?? 100) !== 100 && (
                    <span className="text-[10px] font-normal text-slate-400">/{mod.max_marks}</span>
                  )}
                </td>
              ))}
              <td className="border-l border-slate-200 bg-slate-50 px-2.5 py-2.5 font-black text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:px-3">
                {Number(record.average_score ?? 0).toFixed(2)}%
              </td>
            </tr>

            <tr className="bg-white dark:bg-slate-900">
              <th className="sticky left-0 z-10 min-w-[82px] border-r border-slate-200 bg-white px-2.5 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:min-w-[110px] sm:px-3">
                AGGREGATES
              </th>
              {modules.map((mod, idx) => (
                <td
                  key={`${mod.id || mod.module_code}_ag_${idx}`}
                  className="border-l border-slate-100 px-2 py-2.5 dark:border-slate-800 sm:px-2.5"
                >
                  <GradeBadge grade={mod.aggregate || computeAggregate(mod.percentage ?? mod.marks)} />
                </td>
              ))}
              <td className="border-l border-slate-200 bg-slate-50 px-2.5 py-2.5 dark:border-slate-800 dark:bg-slate-950 sm:px-3">
                <GradeBadge grade={record.overall_aggregate} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {yearSummary && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-blue-50/40 px-3.5 py-2 text-[11px] dark:border-slate-800 dark:bg-blue-950/20 sm:px-4">
          <span className="font-black uppercase tracking-wider text-blue-950 dark:text-yellow-400">
            AVERAGE OF {yearSummary.year_level.toUpperCase()} ({yearSummary.academic_year})
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-bold text-slate-700 dark:text-slate-200">
            <span>Total Credits: {yearSummary.totalCredits}</span>
            <span>Average: {yearSummary.averageScore.toFixed(2)}% ({yearSummary.overallAggregate})</span>
            <VerdictBadge verdict={yearSummary.yearVerdict} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AcademicResultsSection({
  records = [],
  currentUser = null,
  isStaff = false,
  isLoading = false,
  isSaving = false,
  request,
  onReload,
  onDownloadAttachment,
  onNotice,
  onError
}) {
  const [showEditor, setShowEditor] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecordId, setViewingRecordId] = useState(null);

  // Admin opens on expanded students + modules horizontal table by default
  const [activeTab, setActiveTab] = useState(isStaff ? 'modules' : 'transcripts');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', dir: 'desc' });

  // Scholar inline credit editing inside mini-table
  const [editingCreditKey, setEditingCreditKey] = useState(null);
  const [creditDraft, setCreditDraft] = useState('');
  const [savingCreditKey, setSavingCreditKey] = useState(null);

  const viewingRecord = useMemo(
    () => records.find((r) => r.id === viewingRecordId) || null,
    [records, viewingRecordId]
  );

  // Dynamic filter options for Admin
  const filterOptions = useMemo(() => ({
    scholars: uniqueOptions(records, (r) => r.beneficiary_name)
      .map((name) => {
        const match = records.find((r) => r.beneficiary_name === name);
        return { id: match?.beneficiary_id || name, name };
      }),
    campuses: uniqueOptions(records, (r) => r.campus),
    combinations: uniqueOptions(records, (r) => r.combination),
    yearLevels: uniqueOptions(records, (r) => r.year_level),
    academicYears: uniqueOptions(records, (r) => normalizeAcademicYear(r.academic_year)),
    terms: uniqueOptions(records, (r) => r.term),
    verdicts: uniqueOptions(records, (r) => r.verdict)
  }), [records]);

  const hasActiveFilter = isStaff && (
    Boolean(searchQuery.trim()) ||
    Object.values(filters).some((value) => value !== 'all')
  );

  const clearFilters = () => {
    setSearchQuery('');
    setFilters(EMPTY_FILTERS);
  };

  // Scholars see NO filters; Admin filters apply cleanly across all views
  const filteredRecords = useMemo(() => {
    if (!isStaff) return records;
    const q = searchQuery.trim().toLowerCase();
    const norm = (val) => String(val || '').trim().toLowerCase();

    return records.filter((rec) => {
      if (filters.scholarId !== 'all' && rec.beneficiary_id !== filters.scholarId) return false;
      if (filters.campus !== 'all' && norm(rec.campus) !== norm(filters.campus)) return false;
      if (filters.combination !== 'all' && norm(rec.combination) !== norm(filters.combination)) return false;
      if (filters.yearLevel !== 'all' && norm(rec.year_level) !== norm(filters.yearLevel)) return false;
      if (filters.academicYear !== 'all' && norm(normalizeAcademicYear(rec.academic_year)) !== norm(filters.academicYear)) return false;
      if (filters.term !== 'all' && norm(rec.term) !== norm(filters.term)) return false;
      if (filters.verdict !== 'all' && norm(rec.verdict) !== norm(filters.verdict)) return false;
      if (filters.status !== 'all' && norm(rec.status) !== norm(filters.status)) return false;
      if (filters.aggregate !== 'all') {
        const target = norm(filters.aggregate);
        const matchesTranscript = norm(rec.overall_aggregate) === target;
        const matchesModule = (rec.modules || []).some((m) => norm(m.aggregate) === target);
        if (!matchesTranscript && !matchesModule) return false;
      }
      if (q) {
        const haystack = [
          rec.beneficiary_name,
          rec.beneficiary_email,
          rec.beneficiary_university,
          rec.school,
          rec.campus,
          rec.combination,
          rec.year_level,
          rec.academic_year,
          rec.term,
          rec.subject,
          rec.verdict,
          rec.status,
          rec.overall_aggregate,
          ...(rec.modules || []).flatMap((m) => [m.module_code, m.module_name, m.aggregate])
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [records, filters, isStaff, searchQuery]);

  // Flat module rows preserved for PDF export of Modules view
  const filteredModuleRows = useMemo(() => {
    const rows = [];
    filteredRecords.forEach((rec) => {
      (rec.modules || []).forEach((mod) => {
        rows.push({
          rowKey: `${rec.id}_${mod.id || mod.module_code}_${mod.sort_order}`,
          record: rec,
          module: mod,
          beneficiary_name: rec.beneficiary_name || 'Scholar',
          campus: rec.campus || '—',
          combination: rec.combination || '—',
          year_level: rec.year_level || '—',
          academic_year: rec.academic_year || '—',
          term: rec.term || '—',
          module_code: mod.module_code,
          module_name: mod.module_name || '',
          credits: Number(mod.credits ?? 0),
          marks: Number(mod.marks ?? 0),
          max_marks: Number(mod.max_marks ?? 100),
          aggregate: mod.aggregate || computeAggregate(mod.percentage ?? mod.marks),
          verdict: rec.verdict || 'PENDING',
          status: rec.status || 'Pending'
        });
      });
    });
    return rows;
  }, [filteredRecords]);

  // Year summaries across visible transcripts
  const yearSummaries = useMemo(
    () => computeYearSummaries(filteredRecords),
    [filteredRecords]
  );

  const yearSummaryByRecordId = useMemo(() => {
    const lookup = new Map();
    yearSummaries.forEach((summaryItem) => {
      (summaryItem.semesters || []).forEach((sem) => {
        lookup.set(sem.id, summaryItem);
      });
    });
    return lookup;
  }, [yearSummaries]);

  const handleSort = (columnKey) => {
    setSortConfig((prev) => ({
      key: columnKey,
      dir: prev.key === columnKey && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedTranscripts = useMemo(() => {
    const dir = sortConfig.dir === 'asc' ? 1 : -1;
    return [...filteredRecords].sort((a, b) => {
      switch (sortConfig.key) {
        case 'scholar':
          return dir * String(a.beneficiary_name || '').localeCompare(String(b.beneficiary_name || ''));
        case 'campus':
          return dir * String(a.campus || '').localeCompare(String(b.campus || ''));
        case 'year':
          return dir * String(a.academic_year || '').localeCompare(String(b.academic_year || ''));
        case 'term':
          return dir * String(a.term || '').localeCompare(String(b.term || ''));
        case 'credits':
          return dir * ((Number(a.total_credits) || 0) - (Number(b.total_credits) || 0));
        case 'average':
          return dir * ((Number(a.average_score) || 0) - (Number(b.average_score) || 0));
        case 'verdict':
          return dir * String(a.verdict || '').localeCompare(String(b.verdict || ''));
        case 'status':
          return dir * String(a.status || '').localeCompare(String(b.status || ''));
        default:
          return dir * (new Date(a.created_at || 0) - new Date(b.created_at || 0));
      }
    });
  }, [filteredRecords, sortConfig]);

  // Filtered KPIs
  const kpis = useMemo(() => {
    const uniqueScholars = new Set(filteredRecords.map((r) => r.beneficiary_id)).size;
    const totalModules = filteredRecords.reduce((sum, r) => sum + (r.modules?.length || 0), 0);
    const missingCreditsModules = filteredRecords.reduce(
      (sum, r) => sum + (r.modules || []).filter((m) => !(Number(m.credits) > 0)).length,
      0
    );
    const totalCredits = filteredRecords.reduce((sum, r) => sum + (Number(r.total_credits) || 0), 0);
    const avgOverall = filteredRecords.length
      ? filteredRecords.reduce((sum, r) => sum + (Number(r.average_score) || 0), 0) / filteredRecords.length
      : null;
    const passCount = filteredRecords.filter((r) => /pass|distinction/i.test(r.verdict || '')).length;
    const pendingCount = filteredRecords.filter((r) => r.status === 'Pending').length;
    return {
      uniqueScholars,
      totalModules,
      missingCreditsModules,
      totalCredits,
      avgOverall,
      passCount,
      pendingCount
    };
  }, [filteredRecords]);

  // Scholar CRUD handlers
  const handleSaveTranscript = async (payload, file, recordId) => {
    onError('');
    onNotice('');
    try {
      const url = recordId
        ? `/api/program/academic-results/${recordId}`
        : '/api/program/academic-results';
      const method = recordId ? 'PUT' : 'POST';
      const saved = await request(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (file && saved?.id) {
        const upload = new FormData();
        upload.append('file', file);
        await request(`/api/program/academic-results/${saved.id}/attachments`, {
          method: 'POST',
          body: upload
        });
      }

      onNotice(recordId ? 'Academic marks and credits updated.' : 'Academic transcript saved.');
      setShowEditor(false);
      setEditingRecord(null);
      await onReload();
    } catch (err) {
      onError(err.message || 'Could not save academic results.');
    }
  };

  const handleSaveInlineCredit = async (record, mod, rowKey) => {
    const numeric = creditDraft === '' ? 0 : Number(creditDraft);
    if (!Number.isFinite(numeric) || numeric < 0) {
      onError('Credits must be 0 or greater.');
      return;
    }
    setSavingCreditKey(rowKey);
    onError('');
    try {
      await request(`/api/program/academic-results/${record.id}/modules/${mod.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ credits: numeric })
      });
      setEditingCreditKey(null);
      onNotice(`Updated credits for ${mod.module_code} to ${numeric}.`);
      await onReload();
    } catch (err) {
      onError(err.message || 'Could not update module credits.');
    } finally {
      setSavingCreditKey(null);
    }
  };

  const handleUpdateModalCredit = async (resultId, moduleId, credits) => {
    onError('');
    try {
      await request(`/api/program/academic-results/${resultId}/modules/${moduleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ credits })
      });
      onNotice(`Updated module credits to ${credits}.`);
      await onReload();
    } catch (err) {
      onError(err.message || 'Could not update module credits.');
      throw err;
    }
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm(`Delete academic result (${record.academic_year} · ${record.term})?`)) {
      return;
    }
    onError('');
    try {
      await request(`/api/program/academic-results/${record.id}`, { method: 'DELETE' });
      if (viewingRecordId === record.id) setViewingRecordId(null);
      onNotice('Academic result deleted.');
      await onReload();
    } catch (err) {
      onError(err.message || 'Could not delete academic result.');
    }
  };

  // Admin strictly marks academic transcripts as Viewed
  const handleMarkViewed = async (recordId) => {
    onError('');
    try {
      await request(`/api/program/academic-results/${recordId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Viewed' })
      });
      onNotice('Academic transcript marked as viewed.');
      await onReload();
    } catch (err) {
      onError(err.message || 'Could not mark academic result as viewed.');
    }
  };

  const handleExportPdf = () => {
    onError('');
    try {
      exportAcademicReportPdf({
        activeTab,
        records: sortedTranscripts,
        moduleRows: filteredModuleRows,
        yearSummaries
      });
    } catch (err) {
      onError(err.message || 'Could not export academic results PDF.');
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
        {isStaff ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-900 dark:bg-blue-950 dark:text-yellow-400">
              Admin View-Only Academic Reports
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              View all scholars’ expanded module tables, filter and search results, mark transcripts as viewed, and download PDF reports.
            </p>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setShowEditor((prev) => (editingRecord ? true : !prev));
              }}
              className={`${academicPrimaryButtonClass} w-full sm:w-auto`}
            >
              <Plus size={15} />
              Add My Academic Marks
            </button>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Enter your semester marks and credits module by module.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <button type="button" onClick={handleExportPdf} className={`${academicQuietButtonClass} w-full sm:w-auto`}>
            <ArrowDownToLine size={14} /> Export PDF ({isStaff ? (activeTab === 'modules' ? 'All Modules' : activeTab === 'years' ? 'Year Averages' : 'Summary') : 'My Results'})
          </button>
        </div>
      </div>

      {/* Clean Scholar Marks Entry Form */}
      {!isStaff && showEditor && (
        <AcademicMarksEditor
          key={editingRecord?.id || 'new-academic-entry'}
          initialRecord={editingRecord}
          currentUser={currentUser}
          isSaving={isSaving}
          onSave={handleSaveTranscript}
          onCancel={() => {
            setShowEditor(false);
            setEditingRecord(null);
          }}
        />
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-[11px]">
            {isStaff ? 'Student Transcripts' : 'My Transcripts'}
          </p>
          <p className="mt-1.5 text-xl font-black text-blue-950 dark:text-white sm:text-2xl">{filteredRecords.length}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
            {isStaff ? `${kpis.uniqueScholars} scholar(s) · ${kpis.pendingCount} unviewed` : `${kpis.pendingCount} awaiting admin view`}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-[11px]">Modules Tracked</p>
          <p className="mt-1.5 text-xl font-black text-slate-900 dark:text-white sm:text-2xl">{kpis.totalModules}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
            {kpis.missingCreditsModules > 0
              ? <span className="font-bold text-amber-600 dark:text-amber-400">{kpis.missingCreditsModules} module(s) need credits</span>
              : 'All modules have credits'}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-[11px]">Total Credits</p>
          <p className="mt-1.5 text-xl font-black text-slate-900 dark:text-white sm:text-2xl">{kpis.totalCredits}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{yearSummaries.length} study-year summary group(s)</p>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-[11px]">Overall Average</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
              {kpis.avgOverall == null ? '—' : `${kpis.avgOverall.toFixed(2)}%`}
            </span>
            {kpis.avgOverall != null && <GradeBadge grade={computeAggregate(kpis.avgOverall)} />}
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{kpis.passCount} pass verdict(s)</p>
        </div>
      </div>

      {/* Admin Only: Search, Multi-Filters, and Report View Tabs */}
      {isStaff && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="relative w-full min-w-0 flex-1 sm:min-w-[240px]">
              <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                aria-label="Search all academic results tables"
                placeholder="Search scholar, campus, combination, module code (e.g. PE80441), year, semester, verdict..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>
                Showing {filteredRecords.length} of {records.length} transcripts ({filteredModuleRows.length} modules)
              </span>
              {hasActiveFilter && (
                <button type="button" onClick={clearFilters} className={academicQuietButtonClass}>
                  <FilterX size={13} /> Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
            <select
              aria-label="Filter by scholar"
              value={filters.scholarId}
              onChange={(e) => setFilters((prev) => ({ ...prev, scholarId: e.target.value }))}
              className={`${academicCompactInputClass} min-w-0`}
            >
              <option value="all">All Scholars</option>
              {filterOptions.scholars.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              aria-label="Filter by campus"
              value={filters.campus}
              onChange={(e) => setFilters((prev) => ({ ...prev, campus: e.target.value }))}
              className={`${academicCompactInputClass} min-w-0`}
            >
              <option value="all">All Campuses</option>
              {filterOptions.campuses.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              aria-label="Filter by combination"
              value={filters.combination}
              onChange={(e) => setFilters((prev) => ({ ...prev, combination: e.target.value }))}
              className={`${academicCompactInputClass} min-w-0`}
            >
              <option value="all">All Combinations</option>
              {filterOptions.combinations.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              aria-label="Filter by year of study"
              value={filters.yearLevel}
              onChange={(e) => setFilters((prev) => ({ ...prev, yearLevel: e.target.value }))}
              className={`${academicCompactInputClass} min-w-0`}
            >
              <option value="all">All Study Years</option>
              {filterOptions.yearLevels.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              aria-label="Filter by academic year"
              value={filters.academicYear}
              onChange={(e) => setFilters((prev) => ({ ...prev, academicYear: e.target.value }))}
              className={`${academicCompactInputClass} min-w-0`}
            >
              <option value="all">All Academic Years</option>
              {filterOptions.academicYears.map((ay) => <option key={ay} value={ay}>{ay}</option>)}
            </select>

            <select
              aria-label="Filter by semester"
              value={filters.term}
              onChange={(e) => setFilters((prev) => ({ ...prev, term: e.target.value }))}
              className={`${academicCompactInputClass} min-w-0`}
            >
              <option value="all">All Semesters</option>
              {filterOptions.terms.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              aria-label="Filter by aggregate grade"
              value={filters.aggregate}
              onChange={(e) => setFilters((prev) => ({ ...prev, aggregate: e.target.value }))}
              className={`${academicCompactInputClass} min-w-0`}
            >
              <option value="all">All Aggregates</option>
              {['A', 'B', 'C', 'D', 'F'].map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </select>

            <select
              aria-label="Filter by verdict or status"
              value={filters.verdict !== 'all' ? `verdict:${filters.verdict}` : filters.status !== 'all' ? `status:${filters.status}` : 'all'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') {
                  setFilters((prev) => ({ ...prev, verdict: 'all', status: 'all' }));
                } else if (val.startsWith('verdict:')) {
                  setFilters((prev) => ({ ...prev, verdict: val.slice(8), status: 'all' }));
                } else if (val.startsWith('status:')) {
                  setFilters((prev) => ({ ...prev, verdict: 'all', status: val.slice(7) }));
                }
              }}
              className={`${academicCompactInputClass} min-w-0`}
            >
              <option value="all">All Verdicts & Status</option>
              <optgroup label="Verdicts">
                {filterOptions.verdicts.map((v) => <option key={v} value={`verdict:${v}`}>{v}</option>)}
              </optgroup>
              <optgroup label="Viewed Status">
                <option value="status:Pending">Pending</option>
                <option value="status:Viewed">Viewed</option>
                <option value="status:Reviewed">Reviewed</option>
              </optgroup>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800 sm:flex sm:flex-wrap sm:gap-2">
            {[
              { id: 'modules', label: `All Modules · Full Students (${filteredRecords.length})` },
              { id: 'transcripts', label: `Transcripts Summary (${filteredRecords.length})` },
              { id: 'years', label: `Year Averages Report (${yearSummaries.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-3.5 py-2 text-left text-xs font-black transition sm:text-center ${activeTab === tab.id
                  ? 'bg-blue-900 text-white shadow-sm dark:bg-yellow-400 dark:text-slate-950'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Content */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <LoaderCircle size={18} className="animate-spin" /> Loading academic results…
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <BookOpen size={28} className="mx-auto text-blue-900 dark:text-yellow-400" />
          <h2 className="mt-3 font-black text-slate-900 dark:text-white">No academic results recorded yet</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isStaff
              ? 'Scholar-submitted academic transcripts will appear here across all campuses once scholars add their marks.'
              : 'Click "Add My Academic Marks" above to enter your modules, marks, and credits.'}
          </p>
        </div>
      ) : !isStaff ? (
        /* SCHOLAR VIEW: NO FILTERS — Clean Expanded Transcript Cards with Scholar Credit Entry */
        <div className="space-y-4">
          {sortedTranscripts.map((rec) => (
            <StudentExpandedMiniTable
              key={rec.id}
              record={rec}
              yearSummary={yearSummaryByRecordId.get(rec.id) || null}
              isStaff={false}
              isSaving={isSaving}
              editingCreditKey={editingCreditKey}
              creditDraft={creditDraft}
              savingCreditKey={savingCreditKey}
              onStartEditCredit={(rowKey, currentVal) => {
                setEditingCreditKey(rowKey);
                setCreditDraft(String(currentVal ?? 0));
              }}
              onChangeCreditDraft={setCreditDraft}
              onSaveCredit={handleSaveInlineCredit}
              onCancelEditCredit={() => setEditingCreditKey(null)}
              onViewSheet={(id) => setViewingRecordId(id)}
              onEditRecord={(record) => {
                setEditingRecord(record);
                setShowEditor(true);
              }}
              onDeleteRecord={handleDeleteRecord}
            />
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="font-black text-slate-900 dark:text-white">No results match your current search or filters</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try clearing one or more filters to view all academic records.</p>
          <button type="button" onClick={clearFilters} className={`${academicQuietButtonClass} mt-4`}>
            <FilterX size={14} /> Reset Filters
          </button>
        </div>
      ) : activeTab === 'modules' ? (
        /* ADMIN TAB 1 (DEFAULT): FULL STUDENTS LIST EXPANDED WITH MINI TABLE (MODULES AS COLUMNS, MARKS/CREDITS/AGGREGATE AS ROWS) */
        <div className="space-y-4">
          {sortedTranscripts.map((rec) => (
            <StudentExpandedMiniTable
              key={rec.id}
              record={rec}
              yearSummary={yearSummaryByRecordId.get(rec.id) || null}
              isStaff={true}
              isSaving={isSaving}
              onMarkViewed={handleMarkViewed}
              onViewSheet={(id) => setViewingRecordId(id)}
            />
          ))}
        </div>
      ) : activeTab === 'transcripts' ? (
        /* ADMIN TAB 2: COMPACT TRANSCRIPTS SUMMARY TABLE (VIEW + MARK AS VIEWED ONLY) */
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Mobile Cards View */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
            {sortedTranscripts.map((rec) => {
              const modList = rec.modules || [];
              return (
                <div key={rec.id} className="space-y-3 p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-black text-slate-900 dark:text-white">
                        {rec.beneficiary_name || 'Scholar'}
                      </p>
                      <p className="break-words text-[11px] text-slate-500 dark:text-slate-400">
                        {rec.beneficiary_email || rec.school}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <VerdictBadge verdict={rec.verdict} />
                      <ReviewStatusBadge value={rec.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] dark:bg-slate-950">
                    <div className="min-w-0">
                      <span className="block text-[10px] font-black uppercase text-slate-400">Campus & Combo</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {rec.campus || '—'} · {rec.combination || 'General'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] font-black uppercase text-slate-400">Term</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {rec.year_level || '—'} · {rec.academic_year} · {rec.term}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase text-slate-400">Credits</span>
                      <span className="font-black text-slate-900 dark:text-white">{rec.total_credits ?? 0}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase text-slate-400">Average</span>
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-black text-slate-900 dark:text-white">
                          {Number(rec.average_score ?? 0).toFixed(2)}%
                        </span>
                        <GradeBadge grade={rec.overall_aggregate} />
                      </div>
                    </div>
                  </div>

                  {modList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {modList.slice(0, 4).map((m) => (
                        <span
                          key={m.id || m.module_code}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {m.module_code}: {Number(m.marks).toFixed(1)} ({m.aggregate})
                        </span>
                      ))}
                      {modList.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setViewingRecordId(rec.id)}
                          className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-black text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200"
                        >
                          +{modList.length - 4} more
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5">
                    {rec.status !== 'Viewed' && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleMarkViewed(rec.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check size={13} /> Mark Viewed
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setViewingRecordId(rec.id)}
                      className={academicQuietButtonClass}
                    >
                      <Eye size={13} /> View Sheet
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <SortHeader label="Scholar" columnKey="scholar" sortConfig={sortConfig} onSort={handleSort} />
                  <SortHeader label="Campus & Combo" columnKey="campus" sortConfig={sortConfig} onSort={handleSort} />
                  <SortHeader label="Year / Ac. Year" columnKey="year" sortConfig={sortConfig} onSort={handleSort} />
                  <SortHeader label="Semester" columnKey="term" sortConfig={sortConfig} onSort={handleSort} />
                  <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Modules Preview
                  </th>
                  <SortHeader label="Credits" columnKey="credits" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  <SortHeader label="Average" columnKey="average" sortConfig={sortConfig} onSort={handleSort} align="right" />
                  <SortHeader label="Verdict" columnKey="verdict" sortConfig={sortConfig} onSort={handleSort} />
                  <SortHeader label="Status" columnKey="status" sortConfig={sortConfig} onSort={handleSort} />
                  <th className="px-3 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedTranscripts.map((rec) => {
                  const modList = rec.modules || [];
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="px-3 py-3">
                        <p className="font-black text-slate-900 dark:text-white">{rec.beneficiary_name || 'Scholar'}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{rec.beneficiary_email || rec.school}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{rec.campus || '—'}</p>
                        <p className="text-[11px] text-slate-500">{rec.combination || 'General'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{rec.year_level || '—'}</p>
                        <p className="text-[11px] text-slate-500">{rec.academic_year}</p>
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-700 dark:text-slate-200">{rec.term}</td>
                      <td className="max-w-[280px] px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {modList.slice(0, 4).map((m) => (
                            <span
                              key={m.id || m.module_code}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              {m.module_code}: {Number(m.marks).toFixed(1)} ({m.aggregate})
                            </span>
                          ))}
                          {modList.length > 4 && (
                            <button
                              type="button"
                              onClick={() => setViewingRecordId(rec.id)}
                              className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-black text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200"
                            >
                              +{modList.length - 4} more
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-black text-slate-900 dark:text-white">
                        {rec.total_credits ?? 0}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <span className="font-black text-slate-900 dark:text-white">
                            {Number(rec.average_score ?? 0).toFixed(2)}%
                          </span>
                          <GradeBadge grade={rec.overall_aggregate} />
                        </div>
                      </td>
                      <td className="px-3 py-3"><VerdictBadge verdict={rec.verdict} /></td>
                      <td className="px-3 py-3"><ReviewStatusBadge value={rec.status} /></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {rec.status !== 'Viewed' && (
                            <button
                              type="button"
                              title="Mark as Viewed"
                              disabled={isSaving}
                              onClick={() => handleMarkViewed(rec.id)}
                              className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Mark Viewed
                            </button>
                          )}
                          <button
                            type="button"
                            title="View Transcript Sheet"
                            onClick={() => setViewingRecordId(rec.id)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 hover:border-blue-400 hover:text-blue-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ADMIN TAB 3: YEAR AVERAGES REPORT (AVERAGE OF YEAR X) */
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Mobile Cards View */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
            {yearSummaries.map((item) => (
              <div key={item.key} className="space-y-2.5 p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-black text-slate-900 dark:text-white">{item.beneficiary_name}</p>
                    <p className="break-words text-[11px] text-slate-500">{item.beneficiary_email}</p>
                  </div>
                  <VerdictBadge verdict={item.yearVerdict} />
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] dark:bg-slate-950">
                  <div className="min-w-0">
                    <span className="block text-[10px] font-black uppercase text-slate-400">Campus & Combo</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {item.campus || '—'} · {item.combination || 'General'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-black uppercase text-slate-400">Year / Ac. Year</span>
                    <span className="font-black text-blue-950 dark:text-yellow-400">
                      {item.year_level} ({item.academic_year})
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase text-slate-400">Semesters</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {item.semesterTerms.join(', ') || `${item.semesterCount} term(s)`} ({item.moduleCount} mods)
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase text-slate-400">Credits & Average</span>
                    <div className="inline-flex flex-wrap items-center gap-1.5">
                      <span className="font-black text-slate-900 dark:text-white">
                        {item.totalCredits} cr · {item.averageScore.toFixed(2)}%
                      </span>
                      <GradeBadge grade={item.overallAggregate} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setViewingRecordId(item.semesters[0]?.id)}
                    className={academicQuietButtonClass}
                  >
                    <Eye size={13} /> Open
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[880px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                  <th className="px-4 py-3">Scholar</th>
                  <th className="px-3 py-3">Campus & Combination</th>
                  <th className="px-3 py-3">Year of Study</th>
                  <th className="px-3 py-3">Academic Year</th>
                  <th className="px-3 py-3">Semesters Included</th>
                  <th className="px-3 py-3 text-right">Total Credits</th>
                  <th className="px-3 py-3 text-right">Year Average</th>
                  <th className="px-3 py-3">Year Verdict</th>
                  <th className="px-4 py-3 text-right">Transcript</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {yearSummaries.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <p className="font-black text-slate-900 dark:text-white">{item.beneficiary_name}</p>
                      <p className="text-[11px] text-slate-500">{item.beneficiary_email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{item.campus || '—'}</p>
                      <p className="text-[11px] text-slate-500">{item.combination || 'General'}</p>
                    </td>
                    <td className="px-3 py-3 font-black text-blue-950 dark:text-yellow-400">{item.year_level}</td>
                    <td className="px-3 py-3 font-bold text-slate-700 dark:text-slate-200">{item.academic_year}</td>
                    <td className="px-3 py-3">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {item.semesterTerms.join(', ') || `${item.semesterCount} term(s)`}
                      </span>
                      <span className="block text-[10px] text-slate-500">{item.moduleCount} total modules</span>
                    </td>
                    <td className="px-3 py-3 text-right font-black text-slate-900 dark:text-white">
                      {item.totalCredits}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <span className="font-black text-slate-900 dark:text-white">
                          {item.averageScore.toFixed(2)}%
                        </span>
                        <GradeBadge grade={item.overallAggregate} />
                      </div>
                    </td>
                    <td className="px-3 py-3"><VerdictBadge verdict={item.yearVerdict} /></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setViewingRecordId(item.semesters[0]?.id)}
                        className={academicQuietButtonClass}
                      >
                        <Eye size={13} /> Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transcript Detail Modal */}
      {viewingRecord && (
        <AcademicTranscriptModal
          record={viewingRecord}
          allRecords={records}
          isStaff={isStaff}
          isSaving={isSaving}
          onClose={() => setViewingRecordId(null)}
          onEdit={!isStaff ? (rec) => {
            setViewingRecordId(null);
            setEditingRecord(rec);
            setShowEditor(true);
          } : undefined}
          onUpdateModuleCredits={!isStaff ? handleUpdateModalCredit : undefined}
          onDownloadAttachment={onDownloadAttachment}
          onMarkViewed={isStaff ? handleMarkViewed : undefined}
        />
      )}
    </div>
  );
}
