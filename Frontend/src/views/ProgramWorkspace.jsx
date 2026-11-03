import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileText,
  HeartHandshake,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';

const views = [
  { id: 'programs', label: 'Overview', icon: ClipboardList },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'academic-results', label: 'Academic results', icon: BookOpen },
  { id: 'friendly-weeks', label: 'Friendly Weeks', icon: Users },
  { id: 'mentorship', label: 'Mentorship', icon: MessageCircle },
  { id: 'assistance', label: 'Support & assistance', icon: HeartHandshake },
];

const endpoints = {
  reports: '/api/program/reports',
  'academic-results': '/api/program/academic-results',
  'friendly-weeks': '/api/program/friendly-weeks',
  mentorship: '/api/program/mentorship',
  assistance: '/api/program/financial-assistance',
};

const titles = {
  reports: ['Reports', 'Share progress, achievements, challenges, and support needs.'],
  'academic-results': ['Academic results', 'Track school results alongside program progress.'],
  'friendly-weeks': ['Friendly Weeks', 'Coordinate participant check-ins, activities, and milestones.'],
  mentorship: ['Mentorship', 'Connect mentorship goals and follow-ups to existing portal accounts.'],
  assistance: ['Support & assistance', 'Coordinate educational, financial, and other participant support.'],
};

const emptyForms = {
  reports: { title: '', content: '', file: null },
  'academic-results': { school: '', academic_year: '', term: '', subject: '', score: '', max_score: '', beneficiary_id: '', file: null },
  'friendly-weeks': { beneficiary_one_id: '', beneficiary_two_id: '', week_start: '', notes: '', focus: 'all' },
  mentorship: { beneficiary_id: '', mentor_name: '', goal: '', next_session: '', notes: '' },
  assistance: { beneficiary_id: '', support_type: '', amount: '', currency: 'RWF', support_date: new Date().toISOString().slice(0, 10), details: '' },
};

function messageFrom(payload, fallback) {
  return payload?.detail || payload?.error || fallback;
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-blue-950 dark:text-white">{value ?? '—'}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-950';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50';
const quietButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';

function Status({ value }) {
  const tone = value === 'Reviewed' || value === 'Completed' || value === 'Confirmed' || value === 'Delivered'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    : value === 'Follow-up' || value === 'Requested' || value === 'Pending'
      ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${tone}`}>{value || 'Pending'}</span>;
}

function RecordCard({ title, subtitle, status, children }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {status && <Status value={status} />}
      </div>
      {children && <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">{children}</div>}
    </article>
  );
}

function AttachmentList({ attachments, onDownload }) {
  if (!attachments?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((file) => (
        <button key={file.id} type="button" onClick={() => onDownload(file)} className={quietButtonClass}>
          <ArrowDownToLine size={14} /> {file.file_name}
        </button>
      ))}
    </div>
  );
}

function ScholarSelect({ name, label, value, scholars, exclude, onChange }) {
  return (
    <Field label={label}>
      <select className={inputClass} value={value || ''} onChange={(event) => onChange(name, event.target.value)}>
        <option value="">Select a scholar</option>
        {scholars.filter((person) => person.id !== exclude).map((person) => (
          <option key={person.id} value={person.id}>{person.full_name} · {person.email}</option>
        ))}
      </select>
    </Field>
  );
}

export default function ProgramWorkspace({ currentView, setCurrentView, userRole }) {
  const activeView = views.some((view) => view.id === currentView) ? currentView : 'programs';
  const isScholar = userRole === 'scholar' || userRole === 'beneficiary';
  const isStaff = ['mentor', 'teacher', 'admin', 'staff'].includes(userRole);
  const [records, setRecords] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [scholars, setScholars] = useState([]);
  const [form, setForm] = useState(() => ({ ...emptyForms.reports }));
  const [feedback, setFeedback] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);

  const token = localStorage.getItem('token');
  const request = useCallback(async (url, options = {}) => {
    const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
    if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(messageFrom(payload, `Request failed (${response.status}).`));
    }
    if (response.status === 204) return null;
    const type = response.headers.get('content-type') || '';
    return type.includes('application/json') ? response.json() : response;
  }, [token]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      if (activeView === 'programs') {
        const summary = await request('/api/program/dashboard');
        setDashboard(summary);
        setRecords([]);
      } else {
        const data = await request(endpoints[activeView]);
        setRecords(Array.isArray(data) ? data : []);
      }
      if (isStaff && ['friendly-weeks', 'mentorship', 'assistance', 'academic-results'].includes(activeView)) {
        setScholars(await request('/api/program/beneficiaries'));
      } else {
        setScholars([]);
      }
    } catch (loadError) {
      setError(loadError.message || 'Could not load program data.');
    } finally {
      setIsLoading(false);
    }
  }, [activeView, isStaff, request]);

  useEffect(() => {
    setForm({ ...(emptyForms[activeView] || emptyForms.reports) });
    setShowForm(false);
    setNotice('');
    loadData();
  }, [activeView, loadData]);

  const navigate = (viewId) => {
    setCurrentView(viewId);
    window.location.hash = `#/${viewId}`;
  };

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = { ...form };
      delete payload.file;
      if (activeView === 'academic-results') {
        payload.score = Number(payload.score);
        payload.max_score = Number(payload.max_score);
        if (isStaff) payload.beneficiary_id = payload.beneficiary_id || scholars[0]?.id;
      }
      if (activeView === 'mentorship' && isStaff) payload.mentor_name = payload.mentor_name || 'Generation Rise Mentor';
      if (activeView === 'assistance') {
        payload.amount = payload.amount === '' ? 0 : Number(payload.amount);
        if (isScholar) delete payload.beneficiary_id;
        if (isStaff && !payload.beneficiary_id) payload.beneficiary_id = scholars[0]?.id;
      }
      const created = await request(endpoints[activeView], {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (form.file && ['reports', 'academic-results'].includes(activeView)) {
        const upload = new FormData();
        upload.append('file', form.file);
        try {
          await request(`${endpoints[activeView]}/${created.id}/attachments`, {
            method: 'POST',
            body: upload,
          });
        } catch (uploadError) {
          throw new Error(`Record saved, but the attachment could not be uploaded: ${uploadError.message}`);
        }
      }
      setNotice('Your program record was saved.');
      setForm({ ...(emptyForms[activeView] || {}) });
      setShowForm(false);
      await loadData();
    } catch (saveError) {
      setError(saveError.message || 'Could not save this record.');
    } finally {
      setIsSaving(false);
    }
  };

  const changeStatus = async (url, body, successMessage) => {
    setIsSaving(true);
    setError('');
    try {
      await request(url, { method: 'PATCH', body: JSON.stringify(body) });
      setNotice(successMessage);
      await loadData();
    } catch (statusError) {
      setError(statusError.message || 'Could not update this record.');
    } finally {
      setIsSaving(false);
    }
  };

  const draftWithAI = async (kind, record) => {
    setIsSaving(true);
    setError('');
    try {
      const isReport = kind === 'report';
      const payload = isReport
        ? { report_id: record.id }
        : { result_id: record.id };
      const result = await request(`/api/program/ai/${isReport ? 'report-feedback' : 'academic-feedback'}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setFeedback((current) => ({ ...current, [record.id]: result.feedback }));
    } catch (aiError) {
      setError(aiError.message || 'Could not create a feedback draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const assistReport = async () => {
    setIsSaving(true);
    setError('');
    try {
      const result = await request('/api/program/ai/report-assist', {
        method: 'POST',
        body: JSON.stringify({ raw_title: form.title, raw_content: form.content }),
      });
      setField('content', result.content);
    } catch (aiError) {
      setError(aiError.message || 'Could not prepare report notes.');
    } finally {
      setIsSaving(false);
    }
  };

  const generatePairings = async () => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await request('/api/program/friendly-weeks/ai-generate', {
        method: 'POST',
        body: JSON.stringify({ week_start: form.week_start || undefined, focus: form.focus, auto_save: true }),
      });
      setNotice('Friendly Week pairings were generated and saved.');
      await loadData();
    } catch (pairingError) {
      setError(pairingError.message || 'Could not generate pairings.');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadAttachment = async (file) => {
    setError('');
    try {
      const response = await request(`/api/program/attachments/${file.id}/download`);
      const blobUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = file.file_name;
      anchor.click();
      URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      setError(downloadError.message || 'Could not download attachment.');
    }
  };

  const exportCsv = async (path, filename) => {
    setError('');
    try {
      const response = await request(path);
      const blobUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      setError(downloadError.message || 'Could not export records.');
    }
  };

  const title = useMemo(() => activeView === 'programs'
    ? ['Program Suite', 'Your reports, academic progress, check-ins, mentorship, and support in one place.']
    : titles[activeView], [activeView]);

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-800 dark:text-yellow-400 sm:text-xs sm:tracking-[0.2em]">
          RISE HER · Generation Rise
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{title[0]}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{title[1]}</p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
            {isScholar ? 'Participant workspace' : 'Program workspace'}
          </span>
        </div>
      </div>

      <nav aria-label="Program features" className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3 lg:grid-cols-6">
        {views.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => navigate(id)} aria-current={activeView === id ? 'page' : undefined}
            className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold transition sm:text-sm ${
              activeView === id ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{notice}</div>}

      {activeView === 'programs' ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Stat label={isStaff ? 'Participants' : 'Academic results'} value={isStaff ? dashboard?.stats?.beneficiaries_count : dashboard?.stats?.academic_results_count} />
            <Stat label="Friendly Weeks" value={dashboard?.stats?.friendly_weeks_count} />
            <Stat label={isStaff ? 'All academic results' : 'Reviewed average'} value={isStaff ? dashboard?.stats?.academic_results_count : dashboard?.stats?.reviewed_average == null ? '—' : `${dashboard.stats.reviewed_average}%`} />
            <Stat label="Mentorship plans" value={dashboard?.counts?.mentorships} />
            <Stat label="Support records" value={dashboard?.stats?.financial_assistance_count} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {views.slice(1).map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => navigate(id)}
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200"><Icon size={20} /></span>
                <h2 className="mt-4 font-black text-slate-900 dark:text-white">{label}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{titles[id][1]}</p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-black text-slate-900 dark:text-white">Recent program activity</h2>
            <div className="mt-4 space-y-3">
              {(dashboard?.activities || []).map((activity, index) => (
                <div key={`${activity.detail}-${index}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 dark:border-slate-800">
                  <div><p className="text-sm font-bold text-slate-800 dark:text-slate-100">{activity.title || activity.detail}</p><p className="text-xs text-slate-500">{activity.detail} · {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : ''}</p></div>
                  <Status value={activity.status} />
                </div>
              ))}
              {!isLoading && !dashboard?.activities?.length && <p className="text-sm text-slate-500">Your program activity will appear here.</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {((isScholar && ['reports', 'academic-results', 'assistance'].includes(activeView)) ||
              (isStaff && ['academic-results', 'friendly-weeks', 'mentorship', 'assistance'].includes(activeView))) && (
              <button type="button" onClick={() => setShowForm((value) => !value)} className={buttonClass}>
                {activeView === 'reports' ? 'Submit a report'
                  : activeView === 'academic-results' ? (isScholar ? 'Add academic result' : 'Record academic result')
                    : activeView === 'friendly-weeks' ? 'Plan a Friendly Week'
                      : activeView === 'mentorship' ? 'Create mentorship plan'
                        : isScholar ? 'Request support' : 'Record support'}
              </button>
            )}
            {isStaff && activeView === 'friendly-weeks' && (
              <button type="button" onClick={generatePairings} disabled={isSaving} className={quietButtonClass}>
                <Sparkles size={15} /> Generate pairings
              </button>
            )}
            {isStaff && activeView === 'academic-results' && (
              <button type="button" onClick={() => exportCsv('/api/program/academic-results/export', 'academic-results.csv')} className={quietButtonClass}>
                <ArrowDownToLine size={15} /> Export CSV
              </button>
            )}
            {isStaff && activeView === 'assistance' && (
              <button type="button" onClick={() => exportCsv('/api/program/financial-assistance/export', 'support-records.csv')} className={quietButtonClass}>
                <ArrowDownToLine size={15} /> Export CSV
              </button>
            )}
            <button type="button" onClick={loadData} disabled={isLoading} className={quietButtonClass}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {showForm && (
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-4 sm:grid-cols-2">
                {activeView === 'reports' && <>
                  <Field label="Report title"><input required minLength={3} maxLength={160} className={inputClass} value={form.title} onChange={(event) => setField('title', event.target.value)} /></Field>
                  <div className="sm:col-span-2">
                    <Field label="Progress, achievements, challenges, and support needs">
                      <textarea required minLength={5} maxLength={10000} rows={6} className={inputClass} value={form.content} onChange={(event) => setField('content', event.target.value)} />
                    </Field>
                    <button type="button" onClick={assistReport} disabled={isSaving} className={`${quietButtonClass} mt-2`}><Sparkles size={14} /> Help me structure this</button>
                  </div>
                  <Field label="Attachment (optional)"><input type="file" accept=".doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx" className={inputClass} onChange={(event) => setField('file', event.target.files?.[0] || null)} /></Field>
                </>}
                {activeView === 'academic-results' && <>
                  {isStaff && <ScholarSelect name="beneficiary_id" label="Scholar" value={form.beneficiary_id} scholars={scholars} onChange={setField} />}
                  <Field label="School / institution"><input required className={inputClass} value={form.school} onChange={(event) => setField('school', event.target.value)} /></Field>
                  <Field label="Academic year"><input required className={inputClass} placeholder="2026" value={form.academic_year} onChange={(event) => setField('academic_year', event.target.value)} /></Field>
                  <Field label="Term"><input required className={inputClass} value={form.term} onChange={(event) => setField('term', event.target.value)} /></Field>
                  <Field label="Subject"><input required className={inputClass} value={form.subject} onChange={(event) => setField('subject', event.target.value)} /></Field>
                  <Field label="Score"><input required type="number" min="0" step="any" className={inputClass} value={form.score} onChange={(event) => setField('score', event.target.value)} /></Field>
                  <Field label="Maximum score"><input required type="number" min="0.01" step="any" className={inputClass} value={form.max_score} onChange={(event) => setField('max_score', event.target.value)} /></Field>
                  <Field label="Attachment (optional)"><input type="file" accept=".doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx" className={inputClass} onChange={(event) => setField('file', event.target.files?.[0] || null)} /></Field>
                </>}
                {activeView === 'friendly-weeks' && <>
                  <ScholarSelect name="beneficiary_one_id" label="First scholar" value={form.beneficiary_one_id} scholars={scholars} onChange={setField} />
                  <ScholarSelect name="beneficiary_two_id" label="Second scholar" value={form.beneficiary_two_id} scholars={scholars} exclude={form.beneficiary_one_id} onChange={setField} />
                  <Field label="Week starting"><input required type="date" className={inputClass} value={form.week_start} onChange={(event) => setField('week_start', event.target.value)} /></Field>
                  <Field label="Activity focus"><select className={inputClass} value={form.focus} onChange={(event) => setField('focus', event.target.value)}><option value="all">Peer support</option><option value="academic">Academic study</option><option value="leadership">Leadership</option><option value="sisterhood">Wellbeing</option><option value="accountability">Goal setting</option></select></Field>
                  <div className="sm:col-span-2"><Field label="Activity notes (optional)"><textarea rows={3} className={inputClass} value={form.notes} onChange={(event) => setField('notes', event.target.value)} /></Field></div>
                </>}
                {activeView === 'mentorship' && <>
                  <ScholarSelect name="beneficiary_id" label="Scholar" value={form.beneficiary_id} scholars={scholars} onChange={setField} />
                  <Field label="Mentor name"><input required className={inputClass} value={form.mentor_name} onChange={(event) => setField('mentor_name', event.target.value)} /></Field>
                  <Field label="Goal"><textarea required rows={3} className={inputClass} value={form.goal} onChange={(event) => setField('goal', event.target.value)} /></Field>
                  <Field label="Next session"><input type="datetime-local" className={inputClass} value={form.next_session} onChange={(event) => setField('next_session', event.target.value)} /></Field>
                  <div className="sm:col-span-2"><Field label="Notes (optional)"><textarea rows={3} className={inputClass} value={form.notes} onChange={(event) => setField('notes', event.target.value)} /></Field></div>
                </>}
                {activeView === 'assistance' && <>
                  {isStaff && <ScholarSelect name="beneficiary_id" label="Scholar" value={form.beneficiary_id} scholars={scholars} onChange={setField} />}
                  <Field label="Type of support"><input required className={inputClass} placeholder="Transport, tuition, supplies..." value={form.support_type} onChange={(event) => setField('support_type', event.target.value)} /></Field>
                  {isStaff && <><Field label="Amount"><input type="number" min="0" step="any" className={inputClass} value={form.amount} onChange={(event) => setField('amount', event.target.value)} /></Field><Field label="Currency"><input maxLength={3} className={inputClass} value={form.currency} onChange={(event) => setField('currency', event.target.value)} /></Field></>}
                  {isStaff && <Field label="Support date"><input required type="date" className={inputClass} value={form.support_date} onChange={(event) => setField('support_date', event.target.value)} /></Field>}
                  <div className="sm:col-span-2"><Field label={isScholar ? 'What support do you need?' : 'Details'}><textarea rows={3} className={inputClass} value={form.details} onChange={(event) => setField('details', event.target.value)} /></Field></div>
                </>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={isSaving} className={buttonClass}>{isSaving && <LoaderCircle size={16} className="animate-spin" />} Save record</button>
                {activeView === 'friendly-weeks' && isStaff && <button type="button" onClick={generatePairings} disabled={isSaving} className={quietButtonClass}><Sparkles size={14} /> Generate and save pairings</button>}
                <button type="button" onClick={() => setShowForm(false)} className={quietButtonClass}>Cancel</button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900"><LoaderCircle size={18} className="animate-spin" /> Loading program records…</div>
          ) : records.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <CheckCircle2 size={26} className="mx-auto text-blue-900 dark:text-yellow-400" />
              <h2 className="mt-3 font-black text-slate-900 dark:text-white">No records yet</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">New {titles[activeView][0].toLowerCase()} will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeView === 'reports' && records.map((record) => (
                <RecordCard key={record.id} title={record.title} subtitle={`${record.beneficiary_name || 'You'} · ${record.created_at ? new Date(record.created_at).toLocaleDateString() : ''}`} status={record.status}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">{record.content}</p>
                  {record.staff_feedback && <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-950 dark:bg-blue-950 dark:text-blue-100">{record.staff_feedback}</p>}
                  <AttachmentList attachments={record.attachments} onDownload={downloadAttachment} />
                  {isStaff && <div className="mt-3 space-y-2"><textarea rows={2} placeholder="Feedback for the scholar" className={inputClass} value={feedback[record.id] ?? record.staff_feedback ?? ''} onChange={(event) => setFeedback((current) => ({ ...current, [record.id]: event.target.value }))} /><div className="flex flex-wrap gap-2"><button type="button" disabled={isSaving} onClick={() => changeStatus(`/api/program/reports/${record.id}`, { status: 'Reviewed', staff_feedback: feedback[record.id] ?? record.staff_feedback ?? '' }, 'Report reviewed.')} className={quietButtonClass}>Mark reviewed</button><button type="button" disabled={isSaving} onClick={() => changeStatus(`/api/program/reports/${record.id}`, { status: 'Follow-up', staff_feedback: feedback[record.id] ?? record.staff_feedback ?? '' }, 'Follow-up requested.')} className={quietButtonClass}>Follow up</button><button type="button" disabled={isSaving} onClick={() => draftWithAI('report', record)} className={quietButtonClass}><Sparkles size={14} /> Draft feedback</button></div></div>}
                </RecordCard>
              ))}
              {activeView === 'academic-results' && records.map((record) => (
                <RecordCard key={record.id} title={`${record.subject} · ${record.score}/${record.max_score}`} subtitle={`${record.beneficiary_name || 'You'} · ${record.school} · ${record.academic_year} · ${record.term}`} status={record.status}>
                  {record.staff_feedback && <p className="text-sm text-slate-600 dark:text-slate-300">{record.staff_feedback}</p>}
                  <AttachmentList attachments={record.attachments} onDownload={downloadAttachment} />
                  {isStaff && <div className="mt-3 space-y-2"><textarea rows={2} placeholder="Feedback for the scholar" className={inputClass} value={feedback[record.id] ?? record.staff_feedback ?? ''} onChange={(event) => setFeedback((current) => ({ ...current, [record.id]: event.target.value }))} /><div className="flex flex-wrap gap-2"><button type="button" disabled={isSaving} onClick={() => changeStatus(`/api/program/academic-results/${record.id}`, { status: 'Reviewed', staff_feedback: feedback[record.id] ?? record.staff_feedback ?? '' }, 'Academic result reviewed.')} className={quietButtonClass}>Mark reviewed</button><button type="button" disabled={isSaving} onClick={() => changeStatus(`/api/program/academic-results/${record.id}`, { status: 'Follow-up', staff_feedback: feedback[record.id] ?? record.staff_feedback ?? '' }, 'Follow-up requested.')} className={quietButtonClass}>Follow up</button><button type="button" disabled={isSaving} onClick={() => draftWithAI('academic', record)} className={quietButtonClass}><Sparkles size={14} /> Draft feedback</button></div></div>}
                </RecordCard>
              ))}
              {activeView === 'friendly-weeks' && records.map((record) => (
                <RecordCard key={record.id} title={`${record.beneficiary_one_name} & ${record.beneficiary_two_name}`} subtitle={`Week of ${record.week_start}`} status={record.status}>
                  {record.notes && <p className="text-sm text-slate-600 dark:text-slate-300">{record.notes}</p>}
                  {isStaff && <div className="mt-3 flex gap-2"><button type="button" onClick={() => changeStatus(`/api/program/friendly-weeks/${record.id}`, { status: 'Confirmed' }, 'Pairing confirmed.')} className={quietButtonClass}>Confirm</button><button type="button" onClick={() => changeStatus(`/api/program/friendly-weeks/${record.id}`, { status: 'Cancelled' }, 'Pairing cancelled.')} className={quietButtonClass}>Cancel pairing</button></div>}
                </RecordCard>
              ))}
              {activeView === 'mentorship' && records.map((record) => (
                <RecordCard key={record.id} title={record.mentor_name} subtitle={`${record.beneficiary_name || 'You'}${record.cohort_name ? ` · ${record.cohort_name}` : ''}${record.next_session ? ` · Next session ${new Date(record.next_session).toLocaleString()}` : ''}`} status={record.status}>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{record.goal}</p>
                  {record.notes && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{record.notes}</p>}
                  {isStaff && <div className="mt-3 flex gap-2"><button type="button" onClick={() => changeStatus(`/api/program/mentorship/${record.id}`, { status: 'Completed' }, 'Mentorship plan completed.')} className={quietButtonClass}>Complete</button><button type="button" onClick={() => changeStatus(`/api/program/mentorship/${record.id}`, { status: 'Cancelled' }, 'Mentorship plan cancelled.')} className={quietButtonClass}>Cancel</button></div>}
                </RecordCard>
              ))}
              {activeView === 'assistance' && records.map((record) => (
                <RecordCard key={record.id} title={record.support_type} subtitle={`${record.beneficiary_name || 'You'} · ${record.support_date}${Number(record.amount) > 0 ? ` · ${record.amount} ${record.currency}` : ''}`} status={record.status}>
                  {record.details && <p className="text-sm text-slate-600 dark:text-slate-300">{record.details}</p>}
                  {isStaff && <div className="mt-3 flex flex-wrap gap-2">{['Requested', 'Approved', 'Declined', 'Delivered'].map((status) => <button key={status} type="button" onClick={() => changeStatus(`/api/program/financial-assistance/${record.id}`, { status }, `Support marked ${status.toLowerCase()}.`)} className={quietButtonClass}>{status}</button>)}</div>}
                </RecordCard>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
