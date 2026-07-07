import React, { useState, useEffect } from 'react';
import { Users, Flame, CheckCircle2, MessageCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ScholarsView({ currentUser, setCurrentView, lessons }) {
  const [roster, setRoster] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/roster', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setRoster(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoster();
  }, []);

  const totalLessonsCount = lessons?.length || 10;

  const filteredRoster = roster.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.university.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMessageScholar = (scholarId) => {
    localStorage.setItem('activeChatChannel', scholarId);
    setCurrentView('chat');
    window.location.hash = '#/chat';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Assigned Scholars</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Track academic completion, class check-ins, and send logs.</p>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search scholars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-blue-700 text-slate-800 dark:text-white transition-all shadow-sm"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
          Loading assigned scholars...
        </div>
      ) : filteredRoster.length === 0 ? (
        <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
          No scholars found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredRoster.map(s => {
            const completed = s.submissions?.filter(sub => sub.status === 'completed' || sub.status === 'graded').length || 0;
            const progress = totalLessonsCount > 0 ? Math.round((completed / totalLessonsCount) * 100) : 0;

            const records = s.attendanceRecords || [];
            const present = records.filter(r => r.status === 'present').length;
            const late = records.filter(r => r.status === 'late').length;
            const attRate = records.length > 0 ? Math.round(((present + late) / records.length) * 100) : 92;

            return (
              <motion.div 
                key={s.id}
                whileHover={{ y: -2 }}
                className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-900 text-yellow-400 font-bold flex items-center justify-center text-[10px] sm:text-xs shadow-inner shrink-0">
                      {s.initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm truncate leading-tight">{s.name}</h3>
                      <p className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase truncate mt-0.5">{s.university}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-4 border-t border-b border-slate-50 dark:border-slate-800 py-2 sm:py-3">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className="p-1 sm:p-2 bg-orange-50/50 dark:bg-orange-950/20 text-orange-500 dark:text-orange-400 rounded-lg shrink-0"><Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                      <div className="min-w-0">
                        <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block leading-none">Streak</span>
                        <span className="font-bold text-[10px] sm:text-xs text-slate-800 dark:text-white block mt-1 truncate">{s.streakDays}d</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className="p-1 sm:p-2 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0"><CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                      <div className="min-w-0">
                        <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block leading-none">Attend</span>
                        <span className="font-bold text-[10px] sm:text-xs text-slate-800 dark:text-white block mt-1 truncate">{attRate}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="flex justify-between font-bold text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <span>Progress</span>
                      <span className="text-blue-900 dark:text-yellow-450">{progress}%</span>
                    </div>
                    <div className="w-full h-1 sm:h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                      <div className="bg-blue-900 dark:bg-yellow-400 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 sm:space-x-3 mt-4 sm:mt-5">
                  <button 
                    onClick={() => handleMessageScholar(s.id)}
                    className="flex-1 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-650 hover:text-blue-900 dark:text-slate-300 dark:hover:text-white border border-slate-200/60 dark:border-slate-700 rounded-lg sm:rounded-xl font-bold text-[8px] sm:text-[9px] uppercase tracking-widest transition-all flex items-center justify-center space-x-1.5 sm:space-x-2"
                  >
                    <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Message</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
