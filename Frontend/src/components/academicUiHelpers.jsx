export const academicInputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-950';

export const academicCompactInputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

export const academicPrimaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600';

export const academicQuietButtonClass =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-600';

export function GradeBadge({ grade }) {
  const g = String(grade || '—').toUpperCase();
  const tone =
    g.startsWith('A')
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
      : g.startsWith('B')
        ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
        : g.startsWith('C')
          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
          : g.startsWith('D')
            ? 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800'
            : g === '—'
              ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800';

  return (
    <span className={`inline-flex min-w-[26px] items-center justify-center rounded-lg border px-2 py-0.5 text-[11px] font-black ${tone}`}>
      {grade || '—'}
    </span>
  );
}

export function VerdictBadge({ verdict }) {
  const v = String(verdict || 'PENDING').toUpperCase();
  const tone =
    v.includes('FAIL') || v.includes('REPEAT')
      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
      : v.includes('RETAKE') || v.includes('PENDING') || v.includes('PROBATION')
        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${tone}`}>
      {verdict || 'PENDING'}
    </span>
  );
}

export function ReviewStatusBadge({ value }) {
  const tone =
    value === 'Reviewed'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
      : value === 'Viewed'
        ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
        : value === 'Follow-up'
          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${tone}`}>
      {value || 'Pending'}
    </span>
  );
}
