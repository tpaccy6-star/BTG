import { useCallback, useEffect, useMemo, useState } from 'react';
import AcademicResultsSection from '../components/AcademicResultsSection';
import PdfViewerModal from '../components/PdfViewerModal';
import {
  createSingleReportPdfBlobUrl,
  exportAssistancePdf,
  exportProgramReportsPdf
} from '../utils/pdfExports';
import {
  ArrowDownToLine,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  HeartHandshake,
  LoaderCircle,
  MessageCircle,
  Search,
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
  reports: ['PDF Reports', 'Scholars submit PDF progress reports; Admin receives, reads, and downloads them in the built-in PDF viewer.'],
  'academic-results': ['Academic results', 'Record multi-module transcripts with flexible templates, credits per module, weighted averages, and filtered reports.'],
  'friendly-weeks': ['Friendly Weeks', 'Coordinate participant check-ins, activities, and milestones.'],
  mentorship: ['Mentorship', 'Connect mentorship goals and follow-ups to existing portal accounts.'],
  assistance: ['Financial Support & Stipends', 'Track all living stipends, tuition payments, and educational grants offered across University of Rwanda campuses.'],
};

const emptyForms = {
  reports: { title: '', content: '', file: null },
  'academic-results': { school: '', academic_year: '', term: '', subject: '', score: '', max_score: '', beneficiary_id: '', file: null },
  'friendly-weeks': { beneficiary_one_id: '', beneficiary_two_id: '', week_start: '', notes: '', focus: 'all' },
  mentorship: { beneficiary_id: '', mentor_name: '', goal: '', next_session: '', notes: '' },
  assistance: {
    beneficiary_id: '',
    support_type: 'Monthly Living & Academic Stipend',
    amount: '',
    currency: 'RWF',
    support_date: new Date().toISOString().slice(0, 10),
    disbursement_method: 'MTN Mobile Money',
    recipient_account: '',
    reference_number: '',
    disbursed_by: 'Generation Rise Foundation',
    status: 'Disbursed',
    details: ''
  },
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

function AttachmentList({ attachments, onDownload, onViewPdf }) {
  if (!attachments?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((file) => {
        const isPdf = (file.file_name || '').toLowerCase().endsWith('.pdf') || file.content_type === 'application/pdf';
        return (
          <div key={file.id} className="inline-flex flex-wrap items-center gap-1.5">
            {isPdf && onViewPdf && (
              <button type="button" onClick={() => onViewPdf(file)} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-800">
                <Eye size={14} /> View PDF · {file.file_name}
              </button>
            )}
            <button type="button" onClick={() => onDownload(file)} className={quietButtonClass}>
              <ArrowDownToLine size={14} /> {isPdf && onViewPdf ? 'Download PDF' : file.file_name}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ScholarSelect({ name, label, value, scholars, exclude, allowAll, onChange }) {
  return (
    <Field label={label}>
      <select className={inputClass} value={value || ''} onChange={(event) => onChange(name, event.target.value)}>
        <option value="">Select a scholar</option>
        {allowAll && <option value="ALL">🌟 All Scholars (Bulk Disbursement to All UR Scholars)</option>}
        {scholars.filter((person) => person.id !== exclude).map((person) => (
          <option key={person.id} value={person.id}>
            {person.full_name || person.name} · {person.university || 'University of Rwanda'} ({person.email})
          </option>
        ))}
      </select>
    </Field>
  );
}

export default function ProgramWorkspace({ currentView, setCurrentView, userRole, currentUser = null }) {
  const availableViews = views;
  const activeView = availableViews.some((view) => view.id === currentView) ? currentView : 'programs';
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
  const [reportSearch, setReportSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');
  const [pdfViewer, setPdfViewer] = useState(null);

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
        try {
          const res = await request('/api/program/beneficiaries');
          if (Array.isArray(res) && res.length > 0) {
            setScholars(res);
          } else {
            const users = await request('/api/users');
            setScholars(Array.isArray(users) ? users.filter((u) => u.role === 'scholar') : []);
          }
        } catch {
          const users = await request('/api/users');
          setScholars(Array.isArray(users) ? users.filter((u) => u.role === 'scholar') : []);
        }
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
    setPdfViewer((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
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
      if (activeView === 'reports') {
        if (!form.file) {
          throw new Error('Reports are limited to PDF files. Please select a .pdf file to submit.');
        }
        const isPdfFile = (form.file.name || '').toLowerCase().endsWith('.pdf') || form.file.type === 'application/pdf';
        if (!isPdfFile) {
          throw new Error('Reports are limited to PDF files only (.pdf).');
        }
        if (!payload.content || payload.content.trim().length < 5) {
          payload.content = `Submitted PDF report: ${form.file.name}`.slice(0, 10000);
        }
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
      return result.feedback;
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

  const closePdfViewer = () => {
    setPdfViewer((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
  };

  const openPdfAttachment = async (file, record = null) => {
    setError('');
    setPdfViewer((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return {
        title: record?.title || file.file_name,
        subtitle: record ? `${record.beneficiary_name || 'Scholar'} · ${file.file_name}` : file.file_name,
        fileName: file.file_name,
        file,
        record,
        blobUrl: '',
        isLoading: true,
        error: ''
      };
    });
    try {
      const response = await request(`/api/program/attachments/${file.id}/download?inline=1`);
      const rawBlob = await response.blob();
      const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfViewer((prev) => (prev ? { ...prev, blobUrl, isLoading: false } : null));
    } catch (viewerError) {
      setPdfViewer((prev) => (prev
        ? { ...prev, isLoading: false, error: viewerError.message || 'Could not load PDF file.' }
        : null));
    }
  };

  const openGeneratedReportPdf = (record) => {
    setError('');
    const blobUrl = createSingleReportPdfBlobUrl(record);
    setPdfViewer((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return {
        title: record.title,
        subtitle: `${record.beneficiary_name || 'Scholar'} · Generated Report PDF`,
        fileName: `${(record.title || 'report').replace(/[^a-zA-Z0-9_-]+/g, '_')}.pdf`,
        record,
        file: null,
        blobUrl,
        isLoading: false,
        error: ''
      };
    });
  };

  const filteredReports = useMemo(() => {
    if (activeView !== 'reports') return [];
    const q = reportSearch.trim().toLowerCase();
    return records.filter((rec) => {
      if (reportStatusFilter !== 'all' && rec.status !== reportStatusFilter) return false;
      if (!q) return true;
      const haystack = [
        rec.title,
        rec.beneficiary_name,
        rec.content,
        rec.staff_feedback,
        ...(rec.attachments || []).map((a) => a.file_name)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [activeView, records, reportSearch, reportStatusFilter]);

  const activePdfViewer = useMemo(() => {
    if (!pdfViewer) return null;
    if (!pdfViewer.record?.id) return pdfViewer;
    const latestRecord = records.find((r) => r.id === pdfViewer.record.id) || pdfViewer.record;
    return { ...pdfViewer, record: latestRecord };
  }, [pdfViewer, records]);

  const title = useMemo(() => {
    if (activeView === 'programs') {
      return ['Program Suite', 'Your reports, academic progress, check-ins, mentorship, and support in one place.'];
    }
    if (activeView === 'academic-results') {
      return isStaff
        ? ['Academic Results Report', 'View all scholars’ marks across campuses, filter and search all tables, and manage credits per module.']
        : ['My Academic Results', 'Enter your own marks with flexible module templates, add or remove modules anytime, and assign credits per module.'];
    }
    return titles[activeView];
  }, [activeView, isStaff]);

  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl">
      <div className="mb-5 sm:mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-800 dark:text-yellow-400 sm:text-xs sm:tracking-[0.2em]">
          RISE HER · Generation Rise Foundation
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">{title[0]}</h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-sm">{title[1]}</p>
          </div>
          <span className="max-w-full rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
            {isScholar ? 'Rise Her Scholar Workspace' : 'Generation Rise Foundation Workspace'}
          </span>
        </div>
      </div>

      <nav aria-label="Program features" className="mb-5 grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900 sm:mb-6 sm:grid-cols-3 sm:gap-2 sm:p-2 lg:grid-cols-6">
        {availableViews.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => navigate(id)} aria-current={activeView === id ? 'page' : undefined}
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition sm:gap-2 sm:py-3 sm:text-sm ${activeView === id ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}>
            <Icon size={16} className="shrink-0" /> <span className="truncate">{label}</span>
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
            {userRole === 'admin' && <Stat label="Support records" value={dashboard?.stats?.financial_assistance_count} />}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {availableViews.slice(1).map(({ id, label, icon: Icon }) => (
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
      ) : activeView === 'academic-results' ? (
        <AcademicResultsSection
          records={records}
          scholars={scholars}
          currentUser={currentUser}
          isStaff={isStaff}
          isLoading={isLoading}
          isSaving={isSaving}
          request={request}
          onReload={loadData}
          onDownloadAttachment={downloadAttachment}
          onNotice={(message) => {
            setError('');
            setNotice(message);
          }}
          onError={(message) => {
            setNotice('');
            setError(message);
          }}
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {((isScholar && activeView === 'reports') ||
              (userRole === 'admin' && activeView === 'assistance') ||
              (isStaff && ['friendly-weeks', 'mentorship'].includes(activeView))) && (
                <button type="button" onClick={() => setShowForm((value) => !value)} className={buttonClass}>
                  {activeView === 'reports' ? 'Submit a report'
                    : activeView === 'friendly-weeks' ? 'Plan a Friendly Week'
                      : activeView === 'mentorship' ? 'Create mentorship plan'
                        : 'Record support'}
                </button>
              )}
            {isStaff && activeView === 'friendly-weeks' && (
              <button type="button" onClick={generatePairings} disabled={isSaving} className={quietButtonClass}>
                <Sparkles size={15} /> Generate pairings
              </button>
            )}
            {activeView === 'reports' && (
              <button type="button" onClick={() => exportProgramReportsPdf(filteredReports)} className={quietButtonClass}>
                <ArrowDownToLine size={15} /> Export Reports PDF
              </button>
            )}
            {activeView === 'assistance' && (
              <button type="button" onClick={() => exportAssistancePdf(records)} className={quietButtonClass}>
                <ArrowDownToLine size={15} /> Export PDF
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-4 sm:grid-cols-2">
                {activeView === 'reports' && <>
                  <Field label="Report title *"><input required minLength={3} maxLength={160} placeholder="e.g. Semester II Progress Report" className={inputClass} value={form.title} onChange={(event) => setField('title', event.target.value)} /></Field>
                  <Field label="Report PDF file (.pdf only) *">
                    <input
                      required
                      type="file"
                      accept="application/pdf,.pdf"
                      className={inputClass}
                      onChange={(event) => {
                        const chosen = event.target.files?.[0] || null;
                        if (chosen && !chosen.name.toLowerCase().endsWith('.pdf') && chosen.type !== 'application/pdf') {
                          event.target.value = '';
                          setField('file', null);
                          setError('Reports are limited to PDF files only (.pdf).');
                          return;
                        }
                        setError('');
                        setField('file', chosen);
                      }}
                    />
                    <span className="mt-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Only PDF files (.pdf) are allowed so Admin can view reports directly in the built-in PDF viewer.
                    </span>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Summary notes (optional if details are in your PDF)">
                      <textarea maxLength={10000} rows={4} placeholder="Optional highlights, challenges, or support needs..." className={inputClass} value={form.content} onChange={(event) => setField('content', event.target.value)} />
                    </Field>
                    <button type="button" onClick={assistReport} disabled={isSaving} className={`${quietButtonClass} mt-2`}><Sparkles size={14} /> Help me structure this</button>
                  </div>
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
                {activeView === 'assistance' && isStaff && <>
                  <ScholarSelect name="beneficiary_id" label="Scholar (University of Rwanda)" value={form.beneficiary_id} scholars={scholars} allowAll onChange={setField} />
                  <Field label="Support Category / Purpose">
                    <input
                      required
                      type="text"
                      className={inputClass}
                      list="support-category-suggestions"
                      placeholder="Type custom category or choose (e.g. Monthly Living Stipend, Tuition, Laptop Grant...)"
                      value={form.support_type}
                      onChange={(event) => setField('support_type', event.target.value)}
                    />
                    <datalist id="support-category-suggestions">
                      <option value="Monthly Living & Academic Stipend" />
                      <option value="University Tuition & Registration Fees" />
                      <option value="STEM Laptop & Equipment Grant" />
                      <option value="Transportation & Commute Allowance" />
                      <option value="Health Insurance (RAMA / Mutuelle)" />
                      <option value="Research & Field Work Grant" />
                      <option value="Emergency Relief & Welfare Grant" />
                    </datalist>
                  </Field>
                  <Field label="Amount (RWF)"><input required type="number" min="0" step="any" className={inputClass} placeholder="e.g. 60000" value={form.amount} onChange={(event) => setField('amount', event.target.value)} /></Field>
                  <Field label="Disbursement Method (The way money was sent)">
                    <select className={inputClass} value={form.disbursement_method} onChange={(event) => setField('disbursement_method', event.target.value)}>
                      <option value="MTN Mobile Money">MTN Mobile Money (MoMo)</option>
                      <option value="Airtel Money">Airtel Money</option>
                      <option value="Bank Transfer (Bank of Kigali)">Bank Transfer (Bank of Kigali)</option>
                      <option value="Bank Transfer (Equity Bank Rwanda)">Bank Transfer (Equity Bank Rwanda)</option>
                      <option value="Direct University Tuition Payment">Direct University Tuition Payment</option>
                      <option value="Direct Equipment Procurement">Direct Equipment Procurement</option>
                      <option value="Cash Voucher">Cash Voucher</option>
                    </select>
                  </Field>
                  <Field label="Recipient MoMo Phone or Bank Account"><input className={inputClass} placeholder="e.g. +250 788 123 456 or Bank Acc #" value={form.recipient_account} onChange={(event) => setField('recipient_account', event.target.value)} /></Field>
                  <Field label="Transaction Reference / Receipt Slip #"><input className={inputClass} placeholder="e.g. MOM-202611-9841 or BK-049102" value={form.reference_number} onChange={(event) => setField('reference_number', event.target.value)} /></Field>
                  <Field label="Disbursement Date"><input required type="date" className={inputClass} value={form.support_date} onChange={(event) => setField('support_date', event.target.value)} /></Field>
                  <Field label="Disbursed By"><input className={inputClass} value={form.disbursed_by} onChange={(event) => setField('disbursed_by', event.target.value)} /></Field>
                  <div className="sm:col-span-2"><Field label="Purpose & Details (Optional)"><textarea rows={2} className={inputClass} placeholder="Additional notes or semester details..." value={form.details} onChange={(event) => setField('details', event.target.value)} /></Field></div>
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
              {activeView === 'reports' && (
                <>
                  {isStaff && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="relative min-w-[220px] flex-1">
                        <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          aria-label="Search PDF reports"
                          placeholder="Search reports by scholar, title, or PDF filename..."
                          value={reportSearch}
                          onChange={(e) => setReportSearch(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                      </div>
                      <select
                        aria-label="Filter reports by status"
                        value={reportStatusFilter}
                        onChange={(e) => setReportStatusFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                      >
                        <option value="all">All Status ({records.length})</option>
                        <option value="Pending">Pending</option>
                        <option value="Viewed">Viewed</option>
                        <option value="Reviewed">Reviewed</option>
                      </select>
                    </div>
                  )}

                  {filteredReports.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                      No PDF reports match your search or filter.
                    </div>
                  ) : filteredReports.map((record) => {
                    const pdfFiles = (record.attachments || []).filter((f) =>
                      (f.file_name || '').toLowerCase().endsWith('.pdf') || f.content_type === 'application/pdf'
                    );
                    return (
                      <RecordCard key={record.id} title={record.title} subtitle={`${record.beneficiary_name || 'You'} · ${record.created_at ? new Date(record.created_at).toLocaleDateString() : ''}`} status={record.status}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">{record.content}</p>
                        {record.staff_feedback && <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-950 dark:bg-blue-950 dark:text-blue-100">{record.staff_feedback}</p>}
                        {pdfFiles.length > 0 ? (
                          <AttachmentList
                            attachments={pdfFiles}
                            onDownload={downloadAttachment}
                            onViewPdf={(file) => openPdfAttachment(file, record)}
                          />
                        ) : (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openGeneratedReportPdf(record)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-800"
                            >
                              <Eye size={14} /> View in PDF Viewer
                            </button>
                          </div>
                        )}
                        {isStaff && record.status !== 'Viewed' && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => changeStatus(`/api/program/reports/${record.id}`, { status: 'Viewed' }, 'Report marked as viewed.')}
                              className={quietButtonClass}
                            >
                              <Check size={14} /> Mark as Viewed
                            </button>
                          </div>
                        )}
                      </RecordCard>
                    );
                  })}
                </>
              )}
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
              {activeView === 'assistance' && (
                <div className="space-y-4">
                  {/* Executive / Scholar Summary Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900 to-blue-950 text-white shadow-sm border border-blue-800">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                        {isScholar ? 'Total Support Received' : 'Total Disbursed (All Scholars)'}
                      </p>
                      <p className="text-2xl font-black mt-1 text-yellow-400">
                        {records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toLocaleString()} RWF
                      </p>
                      <p className="text-[10px] text-blue-200 mt-1">
                        {isScholar ? 'University of Rwanda Scholar' : `${records.length} Total Disbursements Recorded`}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Delivery Method</p>
                      <p className="text-xl font-bold mt-1 text-slate-800 dark:text-white">MTN MoMo & Bank of Kigali</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">100% Direct Delivery</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Institutional Affiliation</p>
                      <p className="text-xl font-bold mt-1 text-blue-900 dark:text-yellow-400 truncate">University of Rwanda</p>
                      <p className="text-[10px] text-slate-500 mt-1">All Campuses Covered</p>
                    </div>
                  </div>

                  {/* Ledger Cards */}
                  {records.map((record) => (
                    <div key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition hover:shadow-md">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-black text-slate-900 dark:text-white">{record.support_type}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-yellow-400 border border-blue-200 dark:border-blue-800">
                              {record.disbursement_method || 'MTN Mobile Money'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Beneficiary: <strong className="text-slate-700 dark:text-slate-200">{record.beneficiary_name}</strong>
                            {record.beneficiary_university && ` · ${record.beneficiary_university}`}
                            {` · Disbursed on ${record.support_date}`}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                            {Number(record.amount) > 0 ? `${Number(record.amount).toLocaleString()} ${record.currency || 'RWF'}` : 'In-Kind'}
                          </span>
                          <div className="mt-1">
                            <span className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              ✓ {record.status || 'Disbursed'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Transaction Details Box */}
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150 dark:border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Recipient Account / MoMo</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{record.recipient_account || 'Registered Scholar MoMo'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Transaction Reference</span>
                          <span className="font-mono font-bold text-blue-900 dark:text-yellow-400">{record.reference_number || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Disbursed By</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{record.disbursed_by || 'Generation Rise Foundation'}</span>
                        </div>
                      </div>

                      {record.details && (
                        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          <strong>Notes:</strong> {record.details}
                        </p>
                      )}

                      {/* Admin CRUD Actions (Status update & Delete) - Hidden for Scholars */}
                      {userRole === 'admin' && (
                        <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex gap-1.5 items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Status:</span>
                            {['Disbursed', 'Approved', 'Under Review'].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => changeStatus(`/api/program/financial-assistance/${record.id}`, { status: st }, `Status marked as ${st}.`)}
                                className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition ${record.status === st
                                  ? 'bg-blue-900 text-white border-blue-900 dark:bg-yellow-400 dark:text-slate-950'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                  }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete this disbursement of ${Number(record.amount).toLocaleString()} RWF?`)) {
                                try {
                                  await request(`/api/program/financial-assistance/${record.id}`, { method: 'DELETE' });
                                  setNotice('Disbursement record deleted successfully.');
                                  await loadData();
                                } catch (err) {
                                  setError(err.message || 'Failed to delete record.');
                                }
                              }
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition border border-red-200 dark:border-red-900/50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <PdfViewerModal
        viewer={activePdfViewer}
        isStaff={isStaff}
        isSaving={isSaving}
        onClose={closePdfViewer}
        onDownload={downloadAttachment}
        onMarkViewed={async (reportId) => {
          await changeStatus(`/api/program/reports/${reportId}`, { status: 'Viewed' }, 'Report marked as viewed.');
          setPdfViewer((prev) =>
            prev
              ? { ...prev, record: prev.record ? { ...prev.record, status: 'Viewed' } : prev.record }
              : prev
          );
        }}
      />
    </section>
  );
}
