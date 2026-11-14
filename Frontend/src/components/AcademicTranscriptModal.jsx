import { useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  FileDown,
  LoaderCircle,
  X
} from 'lucide-react';
import jsPDF from 'jspdf';
import { computeYearSummaries } from '../utils/academicCalculations';
import {
  GradeBadge,
  ReviewStatusBadge,
  VerdictBadge,
  academicPrimaryButtonClass,
  academicQuietButtonClass
} from './academicUiHelpers';

function downloadTranscriptPdf(record, yearSummary) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`ACADEMIC RESULTS TRANSCRIPT · ${(record.year_level || 'ACADEMIC RECORD').toUpperCase()}`, 40, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`NAMES: ${record.beneficiary_name || 'Scholar'}`, 40, 68);
  doc.text(`CAMPUS: ${record.campus || '—'}`, 280, 68);
  doc.text(`COMBINATION: ${record.combination || '—'}`, 480, 68);
  doc.text(`ACADEMIC YEAR: ${record.academic_year || '—'}`, 40, 86);
  doc.text(`SEMESTER: ${record.term || '—'}`, 280, 86);
  doc.text(`INSTITUTION: ${record.school || 'University of Rwanda'}`, 480, 86);

  const modules = record.modules || [];
  let y = 114;
  doc.setFillColor(26, 54, 95);
  doc.rect(40, y, pageWidth - 80, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('#', 50, y + 14);
  doc.text('MODULE CODE', 80, y + 14);
  doc.text('MODULE TITLE', 200, y + 14);
  doc.text('CREDITS', 460, y + 14);
  doc.text('MARKS', 550, y + 14);
  doc.text('AGGREGATE', 650, y + 14);

  y += 22;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');

  modules.forEach((mod, idx) => {
    if (y > 510) {
      doc.addPage();
      y = 40;
    }
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(40, y, pageWidth - 80, 20, 'F');
    }
    doc.text(String(idx + 1), 50, y + 14);
    doc.text(String(mod.module_code || ''), 80, y + 14);
    doc.text(String(mod.module_name || '—').slice(0, 45), 200, y + 14);
    doc.text(String(mod.credits ?? 0), 460, y + 14);
    doc.text(`${Number(mod.marks).toFixed(2)} / ${mod.max_marks ?? 100}`, 550, y + 14);
    doc.text(String(mod.aggregate || '—'), 660, y + 14);
    y += 20;
  });

  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    `SEMESTER TOTAL CREDITS: ${record.total_credits ?? 0}    |    AVERAGE: ${Number(record.average_score ?? 0).toFixed(2)}% (${record.overall_aggregate || '—'})    |    VERDICT: ${record.verdict || 'PENDING'}`,
    40,
    y
  );

  if (yearSummary) {
    y += 20;
    doc.text(
      `AVERAGE OF ${(record.year_level || 'YEAR').toUpperCase()}: TOTAL CREDITS ${yearSummary.totalCredits}    |    AVERAGE ${yearSummary.averageScore.toFixed(2)}% (${yearSummary.overallAggregate})    |    VERDICT ${yearSummary.yearVerdict}`,
      40,
      y
    );
  }

  const safeName = (record.beneficiary_name || 'scholar').replace(/[^a-zA-Z0-9_-]+/g, '_');
  doc.save(`${safeName}_${record.academic_year || 'transcript'}_${record.term || 'results'}.pdf`);
}

export default function AcademicTranscriptModal({
  record,
  allRecords = [],
  isStaff,
  isSaving = false,
  onClose,
  onEdit,
  onDownloadAttachment,
  onMarkViewed,
  onUpdateModuleCredits
}) {
  const [editingModId, setEditingModId] = useState(null);
  const [creditDraft, setCreditDraft] = useState('');
  const [savingCredit, setSavingCredit] = useState(false);

  const yearSummary = useMemo(() => {
    if (!record) return null;
    const summaries = computeYearSummaries(allRecords);
    return summaries.find(
      (item) =>
        item.beneficiary_id === record.beneficiary_id &&
        item.academic_year.toLowerCase() === String(record.academic_year || '').trim().toLowerCase() &&
        item.year_level.toLowerCase() === String(record.year_level || 'Unspecified Year').trim().toLowerCase()
    );
  }, [allRecords, record]);

  if (!record) return null;

  const modules = record.modules || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Academic Transcript Details"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-2.5 backdrop-blur-sm sm:p-4"
    >
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        {/* Top Modal Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-800 dark:text-yellow-400">
              MARKS OF {(record.year_level || 'ACADEMIC TERM').toUpperCase()}
            </p>
            <h2 className="mt-1 break-words text-lg font-black text-slate-900 dark:text-white sm:text-xl">
              {record.beneficiary_name || 'Scholar Transcript'}
            </h2>
            <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">
              {record.school} · {record.campus || 'Campus not specified'} · {record.combination || 'General'} · {record.academic_year} · {record.term}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end sm:gap-2">
            <ReviewStatusBadge value={record.status} />
            {isStaff && onMarkViewed && record.status !== 'Viewed' && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => onMarkViewed(record.id)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50 sm:px-3.5 sm:py-2"
              >
                <Check size={14} /> Mark as Viewed
              </button>
            )}
            <button
              type="button"
              onClick={() => downloadTranscriptPdf(record, yearSummary)}
              className={academicQuietButtonClass}
            >
              <FileDown size={14} /> Download PDF
            </button>
            {!isStaff && typeof onEdit === 'function' && (
              <button
                type="button"
                onClick={() => onEdit(record)}
                className={academicPrimaryButtonClass}
              >
                <Edit3 size={14} /> Edit My Marks & Credits
              </button>
            )}
            <button type="button" onClick={onClose} className={academicQuietButtonClass}>
              <X size={14} /> Close
            </button>
          </div>
        </div>

        {/* Metadata Strip matching Transcript Sheet */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-3 sm:p-3.5 lg:grid-cols-5">
          <div className="min-w-0">
            <span className="block text-[10px] font-black uppercase text-slate-400">Names</span>
            <span className="break-words font-bold text-slate-900 dark:text-white">{record.beneficiary_name || 'You'}</span>
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-black uppercase text-slate-400">Campus</span>
            <span className="break-words font-bold text-slate-900 dark:text-white">{record.campus || '—'}</span>
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-black uppercase text-slate-400">Combination</span>
            <span className="break-words font-bold text-slate-900 dark:text-white">{record.combination || '—'}</span>
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-black uppercase text-slate-400">Academic Year</span>
            <span className="break-words font-bold text-slate-900 dark:text-white">{record.academic_year}</span>
          </div>
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <span className="block text-[10px] font-black uppercase text-slate-400">Semester</span>
            <span className="break-words font-bold text-slate-900 dark:text-white">{record.term}</span>
          </div>
        </div>

        {/* Horizontal Transcript Matrix */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Semester Modules Sheet ({modules.length} Modules)
            </h3>
            {modules.length > 2 && (
              <span className="text-[10px] font-semibold text-slate-400 sm:hidden">Swipe →</span>
            )}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-center text-xs">
              <tbody>
                <tr className="border-b border-slate-200 bg-blue-950 text-white dark:border-slate-800">
                  <th className="sticky left-0 z-10 min-w-[82px] border-r border-blue-900/60 bg-blue-950 px-2.5 py-2.5 text-left text-[10px] font-black uppercase tracking-wider sm:min-w-[110px] sm:px-3">
                    MODULE
                  </th>
                  {modules.map((mod) => (
                    <th key={mod.id || mod.module_code} className="min-w-[84px] px-2.5 py-2.5 font-black sm:min-w-[88px] sm:px-3">
                      <div>{mod.module_code}</div>
                      {mod.module_name && (
                        <div className="mx-auto mt-0.5 max-w-[92px] truncate text-[10px] font-normal text-blue-200 sm:max-w-[110px]" title={mod.module_name}>
                          {mod.module_name}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <th className="sticky left-0 z-10 min-w-[82px] border-r border-slate-200 bg-slate-50 px-2.5 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 sm:min-w-[110px] sm:px-3">
                    CREDITS
                  </th>
                  {modules.map((mod) => {
                    const canInline = Boolean(onUpdateModuleCredits && mod.id && mod.id !== record.id);
                    const isEditingCell = editingModId === mod.id;
                    return (
                      <td key={`${mod.id || mod.module_code}-cr`} className="px-3 py-2 font-bold text-slate-700 dark:text-slate-200">
                        {isEditingCell ? (
                          <div className="inline-flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={creditDraft}
                              onChange={(e) => setCreditDraft(e.target.value)}
                              className="w-14 rounded border border-blue-400 bg-white px-1.5 py-0.5 text-center text-xs font-bold dark:bg-slate-900"
                            />
                            <button
                              type="button"
                              disabled={savingCredit}
                              title="Save module credits"
                              onClick={async () => {
                                const numeric = creditDraft === '' ? 0 : Number(creditDraft);
                                if (!Number.isFinite(numeric) || numeric < 0) return;
                                setSavingCredit(true);
                                try {
                                  await onUpdateModuleCredits(record.id, mod.id, numeric);
                                  setEditingModId(null);
                                } finally {
                                  setSavingCredit(false);
                                }
                              }}
                              className="rounded bg-blue-900 p-1 text-white hover:bg-blue-800"
                            >
                              {savingCredit ? <LoaderCircle size={11} className="animate-spin" /> : <Check size={11} />}
                            </button>
                          </div>
                        ) : canInline ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingModId(mod.id);
                              setCreditDraft(String(mod.credits ?? 0));
                            }}
                            title="Click to assign or update credits"
                            className={`rounded-md border px-2 py-0.5 text-xs font-black transition ${Number(mod.credits) > 0
                              ? 'border-slate-200 bg-white text-slate-800 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                              : 'border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-500 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                          >
                            {Number(mod.credits) > 0 ? mod.credits : '+ Credits'}
                          </button>
                        ) : (
                          Number(mod.credits) > 0 ? mod.credits : <span className="text-amber-600 dark:text-amber-400">0</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <th className="sticky left-0 z-10 min-w-[82px] border-r border-slate-200 bg-white px-2.5 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:min-w-[110px] sm:px-3">
                    MARKS
                  </th>
                  {modules.map((mod) => (
                    <td key={`${mod.id || mod.module_code}-mk`} className="px-2.5 py-2.5 font-black text-slate-900 dark:text-white sm:px-3">
                      {Number(mod.marks).toFixed(2)}
                      {Number(mod.max_marks) !== 100 && (
                        <span className="text-[10px] font-normal text-slate-400">/{mod.max_marks}</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="bg-white dark:bg-slate-900">
                  <th className="sticky left-0 z-10 min-w-[82px] border-r border-slate-200 bg-white px-2.5 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:min-w-[110px] sm:px-3">
                    AGGREGATES
                  </th>
                  {modules.map((mod) => (
                    <td key={`${mod.id || mod.module_code}-ag`} className="px-2.5 py-2.5 sm:px-3">
                      <GradeBadge grade={mod.aggregate} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Semester Summary + Average of Year */}
        <div className="mt-5 grid gap-3 sm:gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950 sm:p-4">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {record.term} Summary
            </h4>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="font-bold text-slate-500">TOTAL CREDITS</dt>
                <dd className="text-sm font-black text-slate-900 dark:text-white">{record.total_credits ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="font-bold text-slate-500">AVERAGE</dt>
                <dd className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                  {Number(record.average_score ?? 0).toFixed(2)}%
                  <GradeBadge grade={record.overall_aggregate} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="font-bold text-slate-500">VERDICT</dt>
                <dd><VerdictBadge verdict={record.verdict} /></dd>
              </div>
            </dl>
          </div>

          {yearSummary && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 dark:border-blue-900 dark:bg-blue-950/30 sm:p-4">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-blue-900 dark:text-yellow-400">
                AVERAGE OF {yearSummary.year_level.toUpperCase()} ({yearSummary.academic_year})
              </h4>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                Combined across: {yearSummary.semesterTerms.join(' + ') || `${yearSummary.semesterCount} semester(s)`} ({yearSummary.moduleCount} modules)
              </p>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-bold text-slate-600 dark:text-slate-300">TOTAL CREDITS</dt>
                  <dd className="text-sm font-black text-blue-950 dark:text-white">{yearSummary.totalCredits}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-bold text-slate-600 dark:text-slate-300">AVERAGE</dt>
                  <dd className="flex items-center gap-2 text-sm font-black text-blue-950 dark:text-white">
                    {yearSummary.averageScore.toFixed(2)}%
                    <GradeBadge grade={yearSummary.overallAggregate} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-bold text-slate-600 dark:text-slate-300">VERDICT</dt>
                  <dd><VerdictBadge verdict={yearSummary.yearVerdict} /></dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Attachments */}
        {record.attachments?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {record.attachments.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => onDownloadAttachment(file)}
                className={`${academicQuietButtonClass} max-w-full`}
              >
                <ArrowDownToLine size={14} className="shrink-0" /> <span className="truncate">{file.file_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Staff Feedback Display (Read-Only if previously recorded) */}
        {record.staff_feedback && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
            <strong className="block text-[10px] uppercase tracking-wider">Review Notes</strong>
            <p className="mt-1 whitespace-pre-wrap">{record.staff_feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
}
