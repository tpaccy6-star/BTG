import React, { useState, useEffect } from 'react';
import { Download, Scan, CheckCircle2, ListChecks, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AttendanceView({ currentUser, userRole, onUpdateUser }) {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [markStatus, setMarkStatus] = useState('present');
  const [actionMessage, setActionMessage] = useState('');

  const isScholar = userRole === 'scholar';

  useEffect(() => {
    if (!isScholar) {
      fetchRoster();
    }
  }, [userRole]);

  const fetchRoster = async () => {
    setLoading(true);
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

  // Scholar self check-in
  const handleSelfCheckIn = async () => {
    setActionMessage('');
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scholarId: currentUser.id,
          date: today,
          status: 'present'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check in.');
      }

      setActionMessage('Successfully checked in for today!');
      
      // Update session statistics locally via callback
      if (onUpdateUser) {
        onUpdateUser();
      }
    } catch (err) {
      setActionMessage(`Check-in error: ${err.message}`);
    }
  };

  // Mentor marks a scholar's attendance
  const handleMarkScholar = async (scholarId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scholarId,
          date: dateStr,
          status
        })
      });

      if (response.ok) {
        setActionMessage('Attendance recorded successfully!');
        fetchRoster(); // Reload roster to sync stats
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate scholar stats
  const attendanceRecords = currentUser?.attendanceRecords || [];
  const totalSessions = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const rate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 92;

  if (isScholar) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.98 }} 
        className="space-y-10"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-blue-955 dark:text-white tracking-tight">Attendance Record</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1">Monitoring your impact and engagement for NGO compliance.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-3">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Global Rate</p>
              <p className="text-2xl font-black text-blue-950 dark:text-white">{rate}%</p>
            </div>
            <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-2"></div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sessions</p>
              <p className="text-2xl font-black text-blue-950 dark:text-white">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* History */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-blue-955 dark:text-white">Session History</h3>
              <button className="text-blue-600 dark:text-yellow-455 font-bold text-sm flex items-center"><Download size={14} className="mr-2" /> Download Record</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/20 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-5">Event Date</th>
                    <th className="px-8 py-5">Verified By</th>
                    <th className="px-8 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-8 py-6 text-center text-slate-400 dark:text-slate-550 font-medium">No check-ins logged yet. Use the scan portal to self-register.</td>
                    </tr>
                  ) : (
                    attendanceRecords.map((at, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-all">
                        <td className="px-8 py-6 font-black text-blue-955 dark:text-white text-sm">{at.date}</td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400">{at.verifiedBy || 'Self-Registered'}</td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                            at.status === 'present' ? 'bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-455' : 
                            at.status === 'late' ? 'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-450' : 
                            'bg-red-100 dark:bg-red-955/20 text-red-700 dark:text-red-400'
                          }`}>{at.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Scan Widget */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-2xl font-black text-blue-955 dark:text-white mb-6 tracking-tight">Quick Scan</h3>
              <div className="w-full aspect-square bg-slate-50 dark:bg-slate-950/30 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center space-y-5 group cursor-pointer hover:border-blue-900 dark:hover:border-yellow-450 transition-all">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-blue-900 dark:group-hover:text-yellow-450 transition-all">
                  <Scan size={36} strokeWidth={1} />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-relaxed">Simulate a QR Code scanning session at your classroom location to self-check-in.</p>
                {actionMessage && (
                  <div className="text-xs font-bold text-blue-900 dark:text-yellow-455 bg-blue-50/80 dark:bg-blue-950/20 px-3 py-2 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                    {actionMessage}
                  </div>
                )}
                <button 
                  onClick={handleSelfCheckIn}
                  className="w-full py-4 bg-blue-900 hover:bg-blue-800 dark:bg-slate-805 dark:hover:bg-slate-750 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md dark:shadow-none transition-all"
                >
                  Check In Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Mentor/Teacher roster interface
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl font-black text-blue-955 dark:text-white tracking-tight">Roster Registry</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1">Log session attendance marks for active scholars.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-6 mb-8 justify-between">
          <div className="flex items-center space-x-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Session Date</label>
              <input 
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white"
              />
            </div>
          </div>
          {actionMessage && (
            <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 px-4 py-2.5 rounded-xl text-xs font-bold">
              {actionMessage}
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">Loading roster data...</div>
        ) : (
          <div className="overflow-x-auto w-full -mx-4 sm:mx-0">
            <table className="w-full text-left min-w-[500px] sm:min-w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/20 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 sm:px-8 py-4 sm:py-5">Scholar</th>
                  <th className="px-4 sm:px-8 py-4 sm:py-5">Attendance Ratio</th>
                  <th className="px-4 sm:px-8 py-4 sm:py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {roster.map(s => {
                  const records = s.attendanceRecords || [];
                  const present = records.filter(r => r.status === 'present').length;
                  const late = records.filter(r => r.status === 'late').length;
                  const ratio = records.length > 0 ? Math.round(((present + late) / records.length) * 100) : 100;
                  
                  // Find if they already have attendance logged for the active dateStr
                  const activeRecord = records.find(r => r.date === dateStr);
                  
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-all">
                      <td className="px-4 sm:px-8 py-4 sm:py-5 font-black text-blue-955 dark:text-white">
                        <p className="text-xs sm:text-sm">{s.name}</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">{s.email}</p>
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                          <span className="font-black text-blue-900 dark:text-yellow-455 text-xs sm:text-sm">{ratio}%</span>
                          <span className="text-[9px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium">({records.length} logged)</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
                        <div className="inline-flex space-x-1 sm:space-x-2">
                          {['present', 'late', 'absent'].map(status => {
                            const isCurrent = activeRecord?.status === status;
                            return (
                              <button
                                key={status}
                                onClick={() => handleMarkScholar(s.id, status)}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all border ${
                                  isCurrent
                                    ? status === 'present' ? 'bg-green-600 text-white border-green-600' :
                                      status === 'late' ? 'bg-yellow-500 text-white border-yellow-500' :
                                      'bg-red-600 text-white border-red-600'
                                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
