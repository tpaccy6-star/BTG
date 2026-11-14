import React, { useState, useEffect } from 'react';
import { Users, Megaphone, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeacherDashboard({ currentUser, setCurrentView }) {
  const [cohortList, setCohortList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCohorts = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/cohorts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error('Failed to load cohorts');
        }
        const data = await res.json();
        if (isMounted) {
          setCohortList(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching cohorts in TeacherDashboard:', err);
        if (isMounted) {
          setError(err.message || 'Unable to fetch cohorts');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCohorts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Academic Oversight</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
            {loading
              ? 'Loading active cohorts...'
              : `Global monitoring across all ${cohortList.length} registered cohorts.`}
          </p>
        </div>
        <button
          onClick={() => { setCurrentView('announcements'); window.location.hash = '#/announcements'; }}
          className="px-5 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-md transition-all flex items-center text-[10px] uppercase tracking-widest"
        >
          <Megaphone size={14} className="mr-1.5" /> Global Announcement
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Cohort Lifecycle Management</h2>
            {loading && <Loader2 size={16} className="animate-spin text-blue-900 dark:text-yellow-400" />}
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200/50 dark:border-red-900/30 text-xs font-semibold">
              Failed to load live cohorts: {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(n => (
                <div key={n} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="w-16 h-5 rounded-full bg-slate-100 dark:bg-slate-800" />
                  </div>
                  <div className="h-5 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
                </div>
              ))}
            </div>
          ) : cohortList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              No active cohorts currently registered in the system.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cohortList.map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-bold text-blue-900 dark:text-yellow-400 border border-slate-100 dark:border-slate-700 text-xs">
                      C{c.id}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${c.status === 'Excelling' ? 'bg-blue-50 dark:bg-blue-955/40 text-blue-750 dark:text-blue-400' :
                      c.status === 'Needs Attention' ? 'bg-red-50 dark:bg-red-955/40 text-red-650 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-550 dark:text-slate-400'
                      }`}>
                      {c.status || 'Active'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">{c.name}</h4>
                  {c.university && (
                    <p className="text-[10px] text-blue-900 dark:text-yellow-400 font-bold uppercase tracking-widest mb-1 truncate">
                      {c.university}
                    </p>
                  )}
                  {c.description && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-2 leading-relaxed">
                      {c.description}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-6">
                    {c.scholars ?? 0} Scholars (Cross-Campus)
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                      <span className="text-slate-400 dark:text-slate-500">Completion</span>
                      <span className="text-blue-900 dark:text-yellow-450">{c.progress ?? 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-900 dark:bg-yellow-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, c.progress ?? 0))}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Quick Tool Belt for Creators */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-850 dark:text-white tracking-tight border-b border-slate-50 dark:border-slate-800 pb-3">Creator Toolbox</h2>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { title: 'Create & Modify Lessons', desc: 'Add handouts, study notes & covers', action: 'curriculum', url: '#/curriculum' },
                { title: 'Grade Student Tasks', desc: 'Score homework & write feedback comments', action: 'tasks', url: '#/tasks' },
                { title: 'Broadcast Bulletins', desc: 'Post push-alerts to scholar dashboards', action: 'announcements', url: '#/announcements' }
              ].map((tool, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentView(tool.action);
                    window.location.hash = tool.url;
                  }}
                  className="w-full text-left p-3.5 bg-slate-50 dark:bg-slate-950/20 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 transition-all flex flex-col group"
                >
                  <span className="text-xs font-black text-blue-900 dark:text-yellow-450 group-hover:underline">{tool.title}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{tool.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
