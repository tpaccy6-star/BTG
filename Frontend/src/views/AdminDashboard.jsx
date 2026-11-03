import React from 'react';
import { Database, Users, Megaphone, Settings, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard({ currentUser, setCurrentView }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.98 }} 
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Platform Operations</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">High-level NGO impact and system integrity monitoring.</p>
        </div>
        <button className="px-5 py-3 bg-yellow-400 hover:bg-yellow-350 text-blue-950 rounded-xl font-bold shadow-md transition-all flex items-center text-[10px] uppercase tracking-widest border border-yellow-300">
          <Database size={14} className="mr-1.5" /> Master Export
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 tracking-tight">Recent Activity</h2>
          <div className="space-y-5">
            {[
              { user: 'Sarah Miller', action: 'Synced Curriculum Registry', time: '12m ago', icon: RefreshCcw, color: 'text-blue-600 dark:text-blue-400' },
              { user: 'System', action: 'NGO Quarterly Backup Success', time: '1h ago', icon: Database, color: 'text-emerald-600 dark:text-emerald-450' },
              { user: 'Robert Mugabe', action: 'Global Broadcast: Deadline Extended', time: '2h ago', icon: Megaphone, color: 'text-orange-600 dark:text-orange-450' },
            ].map((act, i) => (
              <div key={i} className="flex items-center space-x-4 group cursor-default">
                <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${act.color} group-hover:scale-105 transition-transform`}>
                  <act.icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-tight">{act.user}</p>
                  <p className="text-[10px] text-slate-505 dark:text-slate-400 font-medium">{act.action}</p>
                </div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{act.time}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-350 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:text-blue-900 dark:hover:text-white transition-all">Audit Full Logs</button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 tracking-tight">System Controls</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Entity Manager', icon: Users, view: 'users' },
              { label: 'Curriculum Ops', icon: Database, view: 'curriculum' },
              { label: 'Security Panel', icon: Settings, view: 'settings' },
              { label: 'System Config', icon: Settings, view: 'settings' }
            ].map((c, i) => (
              <button 
                key={i} 
                onClick={() => { setCurrentView(c.view); window.location.hash = `#/${c.view}`; }}
                className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/60 hover:border-blue-900 dark:hover:border-yellow-400 transition-all group"
              >
                <c.icon size={28} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-900 dark:group-hover:text-yellow-400 mb-3 transition-colors" />
                <span className="font-bold text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-blue-900 dark:group-hover:text-white uppercase tracking-widest text-center">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
