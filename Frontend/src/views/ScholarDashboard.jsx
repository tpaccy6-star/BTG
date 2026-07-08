import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, Flame, CheckCircle2, Activity, Clock, MapPin, Globe, Zap, Share2, BookOpen, Award, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import LevelUpModal from '../components/LevelUpModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const mockEvents = [
  { id: 1, title: 'Leadership Workshop', type: 'f2f', date: 'Today', time: '2:00 PM', location: 'Main Hall', attendees: 42 },
  { id: 2, title: 'Financial Literacy 101', type: 'online', date: 'Tomorrow', time: '10:00 PM', location: 'Zoom', attendees: 156 },
  { id: 3, title: 'Community Service Day', type: 'f2f', date: 'Oct 25', time: '8:00 AM', location: 'City Park', attendees: 85 },
];

export default function ScholarDashboard({ currentUser, setCurrentView, lessons }) {
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [currentLevelState, setCurrentLevelState] = useState(1);
  const [justUnlockedBadge, setJustUnlockedBadge] = useState(null);
  const certificateRef = useRef(null);

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

  const totalXP = (completedCount * 100) + (presentAttendance * 20) + (streak * 10);
  const actualLevel = Math.floor(totalXP / 500) + 1;

  useEffect(() => {
    if (currentUser?.id) {
      const savedLevel = localStorage.getItem(`level_${currentUser.id}`);
      if (savedLevel && parseInt(savedLevel) < actualLevel) {
        setCurrentLevelState(actualLevel);
        setShowLevelUpModal(true);
      } else if (!savedLevel) {
        // Just save it if not present
        localStorage.setItem(`level_${currentUser.id}`, actualLevel);
      }
    }
  }, [actualLevel, currentUser?.id]);

  const handleModalClose = () => {
    setShowLevelUpModal(false);
    if (currentUser?.id) {
      localStorage.setItem(`level_${currentUser.id}`, actualLevel);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificateRef.current) return;
    
    // Temporarily make it visible for canvas capture
    certificateRef.current.style.display = 'block';
    
    try {
      const canvas = await html2canvas(certificateRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${currentUser?.name}_GenerationRise_Certificate.pdf`);
    } catch (err) {
      console.error('Error generating certificate:', err);
    } finally {
      // Hide it again
      certificateRef.current.style.display = 'none';
    }
  };

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

  const chartData = {
    labels: ['Completed', 'Due', 'Pending'],
    datasets: [
      {
        data: [completedCount, dueCount, totalLessons - completedCount - dueCount > 0 ? totalLessons - completedCount - dueCount : 0],
        backgroundColor: ['#22c55e', '#ef4444', '#cbd5e1'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const chartOptions = {
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw} Lessons`
        }
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.98 }} 
      className="space-y-8"
    >
      {showLevelUpModal && (
        <LevelUpModal 
          level={currentLevelState} 
          newBadge={justUnlockedBadge}
          onClose={handleModalClose} 
        />
      )}
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
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all mt-6">
            <h2 className="text-lg font-bold text-slate-850 dark:text-white tracking-tight mb-6">Learning Analytics</h2>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 shrink-0 relative">
                <Doughnut data={chartData} options={chartOptions} />
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{overallProgress}%</span>
                </div>
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Completed Lessons</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{completedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tasks Due</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{dueCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Upcoming / Pending</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{Math.max(0, totalLessons - completedCount - dueCount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {/* Gamification widget */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-black text-slate-850 dark:text-white tracking-tight">Leaderboard & XP</h2>
              <span className="text-[10px] font-black text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 px-2.5 py-1 rounded-full">Level {Math.floor(((completedCount * 100) + (presentAttendance * 20) + (streak * 10)) / 500) + 1}</span>
            </div>
            
            {/* XP progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
                <span>{((completedCount * 100) + (presentAttendance * 20) + (streak * 10))} XP earned</span>
                <span>{(Math.floor(((completedCount * 100) + (presentAttendance * 20) + (streak * 10)) / 500) + 1) * 500} XP Goal</span>
              </div>
              <div className="w-full h-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-1000" style={{ width: `${((((completedCount * 100) + (presentAttendance * 20) + (streak * 10)) % 500) / 500) * 100}%` }}></div>
              </div>
            </div>

            {/* Achievements/Badges Row */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none">Unlocked Badges</p>
              <div className="flex gap-2">
                {[
                  (streak >= 14 ? { emoji: '🔥', title: '14-Day Streak', desc: 'Active check-ins' } : streak >= 7 ? { emoji: '🔥', title: '7-Day Streak', desc: 'Active check-ins' } : streak >= 3 ? { emoji: '🔥', title: '3-Day Streak', desc: 'Active check-ins' } : { emoji: '🌱', title: 'Seedling', desc: 'Just started' }),
                  (completedCount >= 10 ? { emoji: '📚', title: 'Catalog Devourer', desc: 'Completed 10 lessons' } : completedCount >= 5 ? { emoji: '📖', title: 'Avid Reader', desc: 'Completed 5 lessons' } : { emoji: '📝', title: 'First Steps', desc: 'Completed a lesson' }),
                  (overallProgress >= 100 ? { emoji: '🎓', title: 'Verified Graduate', desc: 'All lessons completed' } : overallProgress >= 50 ? { emoji: '🌟', title: 'Halfway There', desc: '50% completion' } : { emoji: '🎯', title: 'On Target', desc: 'Working on goals' })
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
            
            {/* Download Certificate Action */}
            {overallProgress >= 100 && (
              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 mt-4">
                <button 
                  onClick={handleDownloadCertificate}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-black py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 text-xs uppercase tracking-wider"
                >
                  <Download size={16} />
                  <span>Download Certificate</span>
                </button>
              </div>
            )}
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

      {/* Hidden Certificate Template for PDF Generation */}
      <div 
        ref={certificateRef} 
        style={{ 
          display: 'none', 
          width: '800px', 
          height: '600px', 
          background: '#ffffff', 
          padding: '40px', 
          position: 'fixed', 
          top: '-9999px', 
          left: '-9999px',
          border: '10px solid #1e3a8a'
        }}
      >
        <div style={{ border: '2px solid #facc15', height: '100%', padding: '40px', textAlign: 'center', position: 'relative' }}>
          <h1 style={{ fontSize: '40px', color: '#1e3a8a', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '900' }}>Certificate of Completion</h1>
          <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '40px' }}>Generation Rise Leadership & Life Skills Program</p>
          
          <p style={{ fontSize: '16px', color: '#334155' }}>This is to certify that</p>
          <h2 style={{ fontSize: '36px', color: '#0f172a', margin: '20px 0', borderBottom: '2px solid #cbd5e1', display: 'inline-block', paddingBottom: '10px', minWidth: '300px' }}>{currentUser?.name || 'Scholar'}</h2>
          
          <p style={{ fontSize: '16px', color: '#334155', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Has successfully completed all academic requirements, demonstrating excellence, dedication, and leadership potential in the Generation Rise program.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '80px', padding: '0 40px' }}>
            <div style={{ borderTop: '2px solid #0f172a', width: '200px', paddingTop: '10px' }}>
              <p style={{ fontWeight: 'bold', color: '#0f172a' }}>Director of Education</p>
            </div>
            <div style={{ width: '80px', height: '80px', background: '#facc15', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a8a', fontWeight: 'bold' }}>
              SEAL
            </div>
            <div style={{ borderTop: '2px solid #0f172a', width: '200px', paddingTop: '10px' }}>
              <p style={{ fontWeight: 'bold', color: '#0f172a' }}>Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
