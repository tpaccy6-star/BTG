import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Calendar, User, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnnouncementsView({ userRole }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Broadcast fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [targetCohortId, setTargetCohortId] = useState('');
  const [cohorts, setCohorts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const isTeacherOrAdmin = ['teacher', 'admin'].includes(userRole);

  useEffect(() => {
    fetchAnnouncements();
    if (isTeacherOrAdmin) {
      fetchCohorts();
    }
  }, []);

  const fetchCohorts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/cohorts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCohorts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!title || !content) {
      setMessage('Title and content are required.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title, 
          content, 
          targetRole, 
          targetCohortId: targetCohortId ? parseInt(targetCohortId) : null 
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post announcement.');
      }

      setMessage('Announcement broadcasted successfully!');
      setTitle('');
      setContent('');
      setTargetRole('all');
      setTargetCohortId('');
      setIsFormOpen(false);
      fetchAnnouncements();
    } catch (err) {
      setMessage(err.message || 'Error posting notice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Global Broadcasts</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Ecosystem notices, compliance regulations, and scheduled events.</p>
        </div>
        {isTeacherOrAdmin && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md flex items-center transition-all"
          >
            <Plus size={14} className="mr-1.5" /> Publish Notice
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Notices Feed */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-slate-805 dark:text-white tracking-tight mb-2">Announcements</h3>
          {loading ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              Loading broadcasts...
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              No active announcements logged.
            </div>
          ) : (
            announcements.map((ann, idx) => (
              <motion.div 
                key={ann.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100/80 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-4">
                  <h4 className="text-base font-bold text-slate-800 dark:text-white leading-tight">{ann.title}</h4>
                  <div className="flex items-center space-x-3 text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center"><User size={10} className="mr-1" /> {ann.author}</span>
                    <span>•</span>
                    <span className="flex items-center"><Calendar size={10} className="mr-1" /> {ann.date}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-606 dark:text-slate-400 font-medium leading-relaxed">{ann.content}</p>
              </motion.div>
            ))
          )}
        </div>

        {/* Static Sidebar Panel */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm h-fit">
          <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
            <Megaphone size={36} className="text-blue-900 dark:text-yellow-450 mb-4 animate-bounce" />
            <p className="text-xs font-bold text-slate-800 dark:text-white mb-2">Compliance Notice Board</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 font-medium leading-relaxed">All announcements represent academic/NGO policies binding on active scholars.</p>
          </div>
        </div>
      </div>

      {/* Broadcast Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Publish Notice</h3>
              {message && (
                <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 p-3.5 rounded-xl text-xs font-bold text-center">
                  {message}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Announcement Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Schedule Update for Session 4"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Message Content</label>
                  <textarea 
                    required
                    placeholder="Write detailed announcements here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-900 dark:focus:border-yellow-455 text-slate-850 dark:text-white"
                    rows="5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Target Role</label>
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white"
                    >
                      <option value="all">Everyone</option>
                      <option value="scholar">Scholars Only</option>
                      <option value="mentor">Mentors Only</option>
                      <option value="teacher">Teachers Only</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Target Cohort</label>
                    <select
                      value={targetCohortId}
                      onChange={(e) => setTargetCohortId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white"
                    >
                      <option value="">All Cohorts</option>
                      {cohorts.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 rounded-xl font-bold text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-900 dark:bg-slate-800 hover:bg-blue-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Send size={10} />
                    <span>{submitting ? 'Sending...' : 'Broadcast'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
