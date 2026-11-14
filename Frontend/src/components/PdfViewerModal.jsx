import {
  ArrowDownToLine,
  Check,
  ExternalLink,
  FileText,
  LoaderCircle,
  X
} from 'lucide-react';
import { ReviewStatusBadge } from './academicUiHelpers';

export default function PdfViewerModal({
  viewer,
  isStaff = false,
  isSaving = false,
  onClose,
  onDownload,
  onMarkViewed
}) {
  if (!viewer) return null;

  const {
    title = 'Report PDF',
    subtitle = '',
    fileName = 'report.pdf',
    blobUrl = '',
    isLoading = false,
    error = '',
    record = null,
    file = null
  } = viewer;

  const handleDownloadClick = () => {
    if (file && onDownload) {
      onDownload(file);
      return;
    }
    if (!blobUrl) return;
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    anchor.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="PDF Report Viewer"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5"
    >
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-yellow-400">
              <FileText size={18} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-black text-slate-900 dark:text-white">{title}</h2>
                {record?.status && <ReviewStatusBadge value={record.status} />}
              </div>
              {subtitle && (
                <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isStaff && record && onMarkViewed && record.status !== 'Viewed' && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => onMarkViewed(record.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check size={14} /> Mark as Viewed
              </button>
            )}
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <ExternalLink size={14} /> Open Tab
              </a>
            )}
            {(blobUrl || file) && (
              <button
                type="button"
                onClick={handleDownloadClick}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-800"
              >
                <ArrowDownToLine size={14} /> Download PDF
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <X size={14} /> Close
            </button>
          </div>
        </div>

        {/* Viewer Body (Read & Download Only) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLoading ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950">
              <LoaderCircle size={24} className="animate-spin text-blue-900 dark:text-yellow-400" />
              <span>Loading PDF document…</span>
            </div>
          ) : error ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
              {error}
            </div>
          ) : blobUrl ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                <iframe
                  src={blobUrl}
                  title={fileName}
                  className="h-[64vh] w-full bg-white"
                />
              </div>

              {record?.content && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Scholar Report Notes
                  </span>
                  <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                    {record.content}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
