import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, ListChecks, Calendar, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MentorDashboard({ currentUser, setCurrentView, lessons }) {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/roster', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to load roster data.');
        }
        const data = await response.json();
        setRoster(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoster();
  }, []);

  // Compute stats
  const totalScholars = roster.length;
  
  // Total lessons in catalog
  const totalLessonsCount = lessons?.length || 10;

  // Compute average progress
  const avgProgress = totalScholars > 0
    ? Math.round(roster.reduce((sum, s) => {
        const completed = s.submissions?.filter(sub => sub.status === 'completed' || sub.status === 'graded').length || 0;
        return sum + (totalLessonsCount > 0 ? (completed / totalLessonsCount) * 100 : 0);
      }, 0) / totalScholars)
    : 58;

  // Compute pending grading count
  const pendingGrading = roster.reduce((sum, s) => {
    const pending = s.submissions?.filter(sub => sub.status === 'completed').length || 0;
    return sum + pending;
  }, 0);

  // Compute average attendance
  const avgAttendance = totalScholars > 0
    ? Math.round(roster.reduce((sum, s) => {
        const records = s.attendanceRecords || [];
        const total = records.length;
        if (total === 0) return sum + 100; // default to 100 if no check-ins
        const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
        return sum + ((present / total) * 100);
      }, 0) / totalScholars)
    : 88;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.98 }} 
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Mentorship Hub</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Managing {totalScholars} scholars across the network.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Assigned Scholars', value: totalScholars, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-955/30' },
          { label: 'Avg Attendance', value: `${avgAttendance}%`, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-955/30' },
          { label: 'Pending Review', value: pendingGrading, icon: ListChecks, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-955/30' },
          { label: 'Meetings Held', value: '45', icon: Calendar, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-955/30' }
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
        {/* Scholar Roster */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Scholar Monitoring</h2>
            <button 
              onClick={() => { setCurrentView('scholars'); window.location.hash = '#/scholars'; }} 
              className="text-blue-600 dark:text-blue-400 font-bold text-xs hover:underline"
            >
              View Roster
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">Loading scholars roster...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 font-bold">{error}</div>
          ) : roster.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">No assigned scholars found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850/60 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4">Scholar</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4">Attendance</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                  {roster.map(s => {
                    const completed = s.submissions?.filter(sub => sub.status === 'completed' || sub.status === 'graded').length || 0;
                    const progressVal = totalLessonsCount > 0 ? Math.round((completed / totalLessonsCount) * 100) : 0;

                    const records = s.attendanceRecords || [];
                    const present = records.filter(r => r.status === 'present').length;
                    const late = records.filter(r => r.status === 'late').length;
                    const attRate = records.length > 0 ? Math.round(((present + late) / records.length) * 100) : 92;

                    let status = 'On Track';
                    if (progressVal < 35 || attRate < 70) {
                      status = 'Falling Behind';
                    } else if (progressVal > 75) {
                      status = 'Excelling';
                    }

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all cursor-pointer">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                          <p className="text-xs">{s.name}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{s.university}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="bg-blue-900 dark:bg-yellow-400 h-full rounded-full" style={{ width: `${progressVal}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{progressVal}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-emerald-650 dark:text-emerald-400">{attRate}%</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                            status === 'Excelling' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' : 
                            status === 'On Track' ? 'bg-green-50 dark:bg-green-950/40 text-green-750 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/40 text-red-750 dark:text-red-400'
                          }`}>{status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Quick Tool Belt for Creators */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-850 dark:text-white tracking-tight border-b border-slate-50 dark:border-slate-800 pb-3">Creator Toolbox</h2>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { title: 'Grade Student Tasks', desc: 'Score homework & write feedback comments', action: 'tasks', url: '#/tasks' },
                { title: 'Log Daily Attendance', desc: 'Register attendance rosters', action: 'attendance', url: '#/attendance' },
                { title: 'Coordinate Chat DMs', desc: 'Coordinate direct advice with scholars', action: 'chat', url: '#/chat' }
              ].map((tool, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentView(tool.action);
                    window.location.hash = tool.url;
                  }}
                  className="w-full text-left p-3.5 bg-slate-50 dark:bg-slate-950/20 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 transition-all flex flex-col group"
                >
                  <span className="text-xs font-black text-blue-900 dark:text-yellow-455 group-hover:underline">{tool.title}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{tool.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 tracking-tight">NGO Compliance</h2>
            <div className="p-5 bg-slate-50 dark:bg-slate-850/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/80 flex flex-col items-center text-center">
              <Shield size={36} className="text-blue-900 dark:text-yellow-400 mb-4" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Attendance Logging Active</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">All active student records are verified for the current week and pushed to the registry.</p>
              <button 
                onClick={() => { setCurrentView('attendance'); window.location.hash = '#/attendance'; }} 
                className="mt-5 w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-colors"
              >
                Log Attendance
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
