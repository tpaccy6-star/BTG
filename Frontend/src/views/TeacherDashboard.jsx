import React from 'react';
import { Users, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';

const cohortList = [
  { id: 1, name: 'Cohort 1', scholars: 120, progress: 75, status: 'On Track' },
  { id: 2, name: 'Cohort 2', scholars: 150, progress: 45, status: 'Needs Attention' },
  { id: 3, name: 'Cohort 3', scholars: 130, progress: 80, status: 'Excelling' },
  { id: 4, name: 'Cohort 4', scholars: 120, progress: 20, status: 'Just Started' },
];

export default function TeacherDashboard({ currentUser, setCurrentView }) {
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
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Global monitoring across all {cohortList.length} cohorts.</p>
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
          <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Cohort Lifecycle Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cohortList.map(c => (
              <div key={c.id} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-bold text-blue-900 dark:text-yellow-400 border border-slate-100 dark:border-slate-700 text-xs">C{c.id}</div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    c.status === 'Excelling' ? 'bg-blue-50 dark:bg-blue-955/40 text-blue-750 dark:text-blue-400' : 
                    c.status === 'Needs Attention' ? 'bg-red-50 dark:bg-red-955/40 text-red-650 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-550 dark:text-slate-400'
                  }`}>{c.status}</span>
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">{c.name}</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-6">{c.scholars} Scholars</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                    <span className="text-slate-400 dark:text-slate-500">Completion</span>
                    <span className="text-blue-900 dark:text-yellow-450">{c.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-blue-900 dark:bg-yellow-400 h-full rounded-full" style={{ width: `${c.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
