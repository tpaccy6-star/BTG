import React from 'react';
import { Users, CheckCircle2, BarChart, FolderOpen, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';

const teacherStats = { totalScholars: 520, activeCohorts: 4, avgCompletion: 64, pendingReviews: 35, globalAttendance: 85 };

const cohortList = [
  { id: 1, name: 'Cohort 1', scholars: 120, progress: 75, status: 'On Track', attendance: 92 },
  { id: 2, name: 'Cohort 2', scholars: 150, progress: 45, status: 'Needs Attention', attendance: 78 },
  { id: 3, name: 'Cohort 3', scholars: 130, progress: 80, status: 'Excelling', attendance: 95 },
  { id: 4, name: 'Cohort 4', scholars: 120, progress: 20, status: 'Just Started', attendance: 88 },
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
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Global monitoring across all {teacherStats.activeCohorts} cohorts.</p>
        </div>
        <button 
          onClick={() => { setCurrentView('announcements'); window.location.hash = '#/announcements'; }}
          className="px-5 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-md transition-all flex items-center text-[10px] uppercase tracking-widest"
        >
          <Megaphone size={14} className="mr-1.5" /> Global Announcement
        </button>
      </div>

      {/* Teacher KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Global Scholars', value: teacherStats.totalScholars, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-955/30' },
          { label: 'Global Attendance', value: `${teacherStats.globalAttendance}%`, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-955/30' },
          { label: 'Avg Completion', value: `${teacherStats.avgCompletion}%`, icon: BarChart, color: 'text-yellow-600 dark:text-yellow-450', bg: 'bg-yellow-50 dark:bg-yellow-955/30' },
          { label: 'Active Cohorts', value: teacherStats.activeCohorts, icon: FolderOpen, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-955/30' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{stat.label}</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white mt-1.5 sm:mt-1 leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
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
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-6 tracking-tight">Attendance Monitor</h2>
            <div className="h-48 flex items-end justify-around px-4">
              {[40, 70, 45, 90, 65, 85, 55].map((h, i) => (
                <div key={i} className="w-6 bg-blue-900 dark:bg-blue-800 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer relative group" style={{ height: `${h}%` }}>
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{h}%</div>
                </div>
              ))}
            </div>
            <div className="flex justify-around mt-4 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
