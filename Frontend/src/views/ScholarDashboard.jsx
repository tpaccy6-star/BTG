import { PlayCircle, Flame, CheckCircle2, Activity, Clock, MapPin, Globe, Zap, Share2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const mockEvents = [
  { id: 1, title: 'Leadership Workshop', type: 'f2f', date: 'Today', time: '2:00 PM', location: 'Main Hall', attendees: 42 },
  { id: 2, title: 'Financial Literacy 101', type: 'online', date: 'Tomorrow', time: '10:00 AM', location: 'Zoom', attendees: 156 },
  { id: 3, title: 'Community Service Day', type: 'f2f', date: 'Oct 25', time: '8:00 AM', location: 'City Park', attendees: 85 },
];

export default function ScholarDashboard({ currentUser, setCurrentView, lessons }) {
  // Dynamic stats calculation
  const attendanceRecords = currentUser?.attendanceRecords || [];
  const totalAttendance = attendanceRecords.length;
  const presentAttendance = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 92;

  const submissions = currentUser?.submissions || [];
  const completedCount = submissions.filter(s => s.status === 'completed' || s.status === 'graded').length;
  
  // Total lessons in database
  const totalLessons = lessons?.length || 10;
  const overallProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 68;

  // Streak
  const streak = currentUser?.streakDays !== undefined ? currentUser.streakDays : 14;

  // Count of due tasks (total lessons - completed tasks)
  const dueCount = Math.max(0, totalLessons - completedCount);

  // Group lessons by pillar to calculate progress per pillar
  const pillars = [
    { id: 'career', title: 'Career Readiness', color: 'bg-blue-900', text: 'text-blue-900' },
    { id: 'entrepreneur', title: 'Entrepreneurship', color: 'bg-yellow-500', text: 'text-yellow-600' },
    { id: 'english', title: 'Professional English', color: 'bg-slate-700', text: 'text-slate-700' },
    { id: 'life', title: 'Life Skills', color: 'bg-blue-700', text: 'text-blue-700' }
  ];

  const pillarData = pillars.map(p => {
    const pillarLessons = lessons?.filter(l => l.pillar === p.id) || [];
    const totalPillar = pillarLessons.length;
    const completedPillar = submissions.filter(s => s.lesson?.pillar === p.id).length;
    const prog = totalPillar > 0 ? Math.round((completedPillar / totalPillar) * 100) : 0;
    return {
      ...p,
      progress: prog,
      total: totalPillar,
      completed: completedPillar
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.98 }} 
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome Back, {currentUser?.name}!</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">You are doing great in the {currentUser?.university || 'Scholar Program'}.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all flex items-center"><Share2 size={14} className="mr-1.5" /> Share Stats</button>
          <button onClick={() => { setCurrentView('catalog'); window.location.hash = '#/catalog'; }} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center"><PlayCircle size={14} className="mr-1.5" /> Resume Study</button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Attendance', value: `${attendanceRate}%`, icon: CheckCircle2, color: 'text-emerald-500 dark:text-emerald-450', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'Study Streak', value: `${streak} Days`, icon: Flame, color: 'text-orange-500 dark:text-orange-450', bg: 'bg-orange-50 dark:bg-orange-950/30' },
          { label: 'Overall Progress', value: `${overallProgress}%`, icon: Activity, color: 'text-blue-600 dark:text-blue-450', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Tasks Due', value: `${dueCount}`, icon: Clock, color: 'text-red-500 dark:text-red-450', bg: 'bg-red-50 dark:bg-red-950/30' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 ${stat.bg} ${stat.color} group-hover:scale-105 transition-transform`}>
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-850 dark:text-white tracking-tight">Today's Class</h2>
            <button onClick={() => { setCurrentView('attendance'); window.location.hash = '#/attendance'; }} className="text-blue-600 dark:text-blue-400 font-bold text-xs hover:underline">View Schedule</button>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50/50 dark:bg-yellow-950/10 rounded-full -mr-16 -mt-16 group-hover:scale-105 transition-transform"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 rounded-full uppercase tracking-wider">Leadership Workshop</span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center"><MapPin size={10} className="mr-1" /> Main Hall</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Modern Governance & Ethics</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs max-w-md">Learn the core principles of ethical leadership in the 21st century NGO landscape.</p>
              </div>
              <button 
                onClick={() => { setCurrentView('attendance'); window.location.hash = '#/attendance'; }}
                className="flex items-center justify-center space-x-2 bg-blue-900 text-white px-5 py-3.5 rounded-xl font-bold shadow-md hover:bg-blue-800 transition-all text-xs uppercase tracking-wider"
              >
                <CheckCircle2 size={16} />
                <span>Mark Attendance</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-850 dark:text-white tracking-tight">Active Missions</h2>
            <button onClick={() => { setCurrentView('catalog'); window.location.hash = '#/catalog'; }} className="text-blue-600 dark:text-blue-400 font-bold text-xs hover:underline">View Roadmap</button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {pillarData.slice(0, 2).map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-white ${p.color} shadow group-hover:rotate-3 transition-transform`}>
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="text-xs sm:text-base font-bold text-slate-800 dark:text-white mb-1.5 sm:mb-2 leading-tight">{p.title}</h4>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-[8px] sm:text-[9px] font-bold tracking-wider uppercase">
                    <span className="text-slate-400 dark:text-slate-550">Progression</span>
                    <span className="text-blue-900 dark:text-yellow-400">{p.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                    <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.progress}%` }} />
                  </div>
                  <p className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{p.completed} / {p.total} Modules</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-10">
          {/* Gamification widget */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-black text-slate-850 dark:text-white tracking-tight">Leaderboard & XP</h2>
              <span className="text-[10px] font-black text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 px-2.5 py-1 rounded-full">Level 4</span>
            </div>
            
            {/* XP progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
                <span>1,250 XP earned</span>
                <span>2,000 XP Goal</span>
              </div>
              <div className="w-full h-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" style={{ width: '62.5%' }}></div>
              </div>
            </div>

            {/* Achievements/Badges Row */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none">Unlocked Badges</p>
              <div className="flex gap-2">
                {[
                  { emoji: '🔥', title: '14-Day Streak', desc: 'Active check-ins' },
                  { emoji: '📚', title: 'Catalog Devourer', desc: 'Completed 5 lessons' },
                  { emoji: '🎓', title: 'Verified Graduate', desc: 'Graduation checklist complete' }
                ].map((b, idx) => (
                  <div key={idx} className="flex-1 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800 p-2.5 rounded-2xl text-center group cursor-pointer hover:scale-105 transition-all" title={`${b.title}: ${b.desc}`}>
                    <span className="text-xl block">{b.emoji}</span>
                    <span className="text-[8px] font-black text-slate-650 dark:text-slate-350 block mt-1 leading-tight truncate">{b.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none">Weekly Leaderboard</p>
              <div className="space-y-2">
                {[
                  { rank: 1, name: 'Diane Tuyisingize', xp: 1450, active: false },
                  { rank: 2, name: 'Alex Johnson (You)', xp: 1250, active: true },
                  { rank: 3, name: 'Faith Umwari', xp: 1100, active: false }
                ].map((user, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold ${
                    user.active ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-yellow-450 border border-blue-100 dark:border-blue-900/30' : 'text-slate-600 dark:text-slate-350'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${
                        user.rank === 1 ? 'bg-yellow-400 text-blue-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>{user.rank}</span>
                      <span className="truncate">{user.name}</span>
                    </div>
                    <span>{user.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 tracking-tight">NGO Impact Feed</h2>
            <div className="space-y-5">
              {mockEvents.slice(1).map(ev => (
                <div key={ev.id} className="flex items-start space-x-3.5 group cursor-pointer">
                  <div className={`p-2.5 rounded-lg ${ev.type === 'f2f' ? 'bg-orange-55 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400' : 'bg-blue-55 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'} group-hover:scale-105 transition-transform shrink-0`}>
                    {ev.type === 'f2f' ? <MapPin size={16} /> : <Globe size={16} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors">{ev.title}</p>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{ev.time} • {ev.location}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { setCurrentView('attendance'); window.location.hash = '#/attendance'; }} className="w-full mt-6 py-3 bg-slate-55 dark:bg-slate-800 text-slate-400 dark:text-slate-350 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-900 dark:hover:text-white transition-all">View Full Schedule</button>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-blue-950 dark:from-slate-900 dark:to-slate-950 p-6 sm:p-8 rounded-[2rem] text-white border border-transparent dark:border-slate-800 relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Zap size={96} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <h4 className="text-lg font-bold mb-2">Mentor Chat</h4>
              <p className="text-blue-200 dark:text-slate-300 text-xs mb-6 font-medium leading-relaxed">Need help with your current lessons? Sarah is online and ready to help.</p>
              <button onClick={() => { setCurrentView('chat'); window.location.hash = '#/chat'; }} className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-350 text-blue-950 font-bold rounded-xl shadow transition-all text-[10px] uppercase tracking-widest">Message Sarah</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
