import React, { useState, useEffect } from 'react';
import { FileText, BookOpen, Download, CheckCircle2, AlertCircle, Edit, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TasksView({ currentUser, userRole, lessons, onUpdateUser }) {
  const [activeTaskTab, setActiveTaskTab] = useState('due');
  const [submissionsList, setSubmissionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingScore, setGradingScore] = useState('');
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [activeGradingId, setActiveGradingId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  const isScholar = userRole === 'scholar';

  useEffect(() => {
    fetchSubmissions();
  }, [userRole]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissionsList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async (submissionId) => {
    if (!gradingScore) {
      setActionMessage('Score is required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          score: parseInt(gradingScore, 10),
          feedback: gradingFeedback
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit grade.');
      }

      setActionMessage('Grading logged successfully!');
      setActiveGradingId(null);
      setGradingScore('');
      setGradingFeedback('');
      fetchSubmissions();
      
      if (onUpdateUser) {
        onUpdateUser();
      }
    } catch (err) {
      setActionMessage(`Grading error: ${err.message}`);
    }
  };

  // Compute scholar tasks list
  // Map every lesson. If submission exists, use status. If not, it is 'due'.
  const scholarTasks = lessons?.map(lesson => {
    const sub = submissionsList.find(s => s.lessonId === lesson.id);
    return {
      id: lesson.id,
      title: lesson.title,
      pillar: lesson.pillar,
      type: 'assignment',
      status: sub ? sub.status : 'due',
      submittedAt: sub ? new Date(sub.submittedAt).toLocaleDateString() : null,
      marks: sub && sub.score !== null ? `${sub.score}/100` : null,
      feedback: sub ? sub.feedback : null,
      fileUrl: sub ? sub.fileUrl : null,
      due: 'End of Cohort'
    };
  }) || [];

  if (isScholar) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.98 }} 
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-blue-955 dark:text-white tracking-tight">Academic Tasks</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1">Submit assignments, take assessments, and review feedback.</p>
          </div>
          {/* Tab Selection */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTaskTab('due')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTaskTab === 'due' 
                  ? 'bg-blue-900 dark:bg-slate-800 text-white shadow-md' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-white'
              }`}
            >
              Due Tasks
            </button>
            <button
              onClick={() => setActiveTaskTab('completed')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTaskTab === 'completed' 
                  ? 'bg-blue-900 dark:bg-slate-800 text-white shadow-md' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-white'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Task Cards Lists */}
        <div className="space-y-6">
          {scholarTasks
            .filter(task => {
              if (activeTaskTab === 'due') return task.status === 'due';
              return task.status === 'completed' || task.status === 'graded';
            })
            .map(task => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all group"
              >
                <div className="flex items-start md:items-center space-x-5">
                  <div className="p-4 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-yellow-450">
                    <FileText size={24} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2.5 mb-1.5">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{task.pillar}</span>
                      <span className="text-slate-200 dark:text-slate-700 text-xs">•</span>
                      <span className="text-xs font-bold text-blue-900 dark:text-yellow-450">{task.type}</span>
                    </div>
                    <h3 className="text-xl font-black text-blue-955 dark:text-white group-hover:text-blue-900 dark:group-hover:text-yellow-400 transition-colors">{task.title}</h3>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t border-slate-50 dark:border-slate-800 pt-4 md:pt-0 md:border-t-0 shrink-0">
                  {task.status === 'due' ? (
                    <>
                      <div className="text-right sm:mr-4">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Deadline</p>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-0.5">{task.due}</p>
                      </div>
                      <button 
                        onClick={() => {
                          // Find index of this lesson and set it
                          // Let the main page handle moving to 'lesson' and setting selected ID
                          window.location.hash = `#/catalog`;
                        }} 
                        className="px-6 py-3.5 bg-blue-900 hover:bg-blue-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all"
                      >
                        Open Workspace
                      </button>
                    </>
                  ) : (
                    <>
                      {task.status === 'graded' && (
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl max-w-sm border border-slate-100 dark:border-slate-800 flex flex-col">
                          <div className="flex justify-between items-baseline mb-2">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Grade</span>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-450 bg-green-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg border border-green-200/40 dark:border-green-900/30">{task.marks}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            <span className="font-bold text-blue-955 dark:text-white">Mentor Feedback:</span> "{task.feedback}"
                          </p>
                        </div>
                      )}
                      <div className="flex flex-col text-right sm:items-end">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                          task.status === 'graded' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30' 
                            : 'bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30'
                        }`}>
                          {task.status}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 uppercase tracking-wide">Submitted {task.submittedAt}</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
        </div>
      </motion.div>
    );
  }  // Mentor Review Board
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl font-black text-blue-955 dark:text-white tracking-tight">Grading Panel</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1">Grade scholar task submissions and upload qualitative feedback logs.</p>
      </div>      <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        {actionMessage && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-955/20 text-blue-900 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 p-4 rounded-xl text-xs font-bold text-center">
            {actionMessage}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-505 font-medium">Loading submissions logs...</div>
        ) : submissionsList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-505 font-medium">No scholar submissions logged.</div>
        ) : (
          <div className="overflow-x-auto w-full -mx-4 sm:mx-0">
            <table className="w-full text-left min-w-[700px] sm:min-w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 sm:px-8 py-4 sm:py-5">Scholar</th>
                  <th className="px-4 sm:px-8 py-4 sm:py-5">Course Task</th>
                  <th className="px-4 sm:px-8 py-4 sm:py-5">Submitted At</th>
                  <th className="px-4 sm:px-8 py-4 sm:py-5">Status / Score</th>
                  <th className="px-4 sm:px-8 py-4 sm:py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {submissionsList.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/20 transition-all">
                    <td className="px-4 sm:px-8 py-4 sm:py-5 font-black text-blue-955 dark:text-white">
                      <p className="text-xs sm:text-sm">{sub.scholar?.name || 'Active Scholar'}</p>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      {sub.lesson?.title}
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-5">
                      {sub.status === 'graded' ? (
                        <span className="text-[9px] sm:text-xs font-black text-emerald-600 dark:text-emerald-455 bg-green-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-green-200 dark:border-green-900/30">
                          Graded: {sub.score}/100
                        </span>
                      ) : (
                        <span className="text-[9px] sm:text-[10px] font-black text-orange-655 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-900/30 uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-5 text-right">
                      {activeGradingId === sub.id ? (
                        <div className="p-4 bg-slate-50 dark:bg-slate-955 rounded-2xl border border-slate-100 dark:border-slate-800 text-left space-y-4 max-w-sm ml-auto">
                          {sub.fileUrl && (
                            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-2">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest block">Submitted Homework File</span>
                              <div className="flex flex-col space-y-2">
                                <a 
                                  href={sub.fileUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-xs font-bold text-blue-900 dark:text-yellow-450 hover:underline flex items-center justify-between"
                                >
                                  <span className="flex items-center">
                                    <FileText size={14} className="mr-1.5 shrink-0 text-slate-450" />
                                    <span className="truncate max-w-[150px]">{sub.fileUrl.split('/').pop() || 'Open Attachment'}</span>
                                  </span>
                                  <span className="text-[9px] uppercase tracking-wider font-bold bg-blue-50 dark:bg-yellow-450/10 px-1.5 py-0.5 rounded text-blue-900 dark:text-yellow-455">Open</span>
                                </a>
                                {/\.(jpg|jpeg|png|gif|webp)$/i.test(sub.fileUrl) && (
                                  <div className="w-full h-24 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 flex items-center justify-center">
                                    <img src={sub.fileUrl} alt="Homework thumbnail" className="h-full object-cover w-full opacity-90 hover:opacity-100 transition-opacity" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Score (0-100)</label>
                            <input 
                              type="number"
                              min="0"
                              max="100"
                              value={gradingScore}
                              onChange={(e) => setGradingScore(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold text-slate-880 dark:text-white focus:outline-none focus:border-blue-900 dark:focus:border-yellow-455"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-1">Feedback</label>
                            <textarea
                              value={gradingFeedback}
                              onChange={(e) => setGradingFeedback(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-850 dark:text-white focus:outline-none focus:border-blue-900 dark:focus:border-yellow-455"
                              rows="3"
                            />
                          </div>
                          <div className="flex space-x-2 justify-end">
                            <button 
                              onClick={() => setActiveGradingId(null)}
                              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 rounded-lg font-bold text-[10px] uppercase animate-fade-in"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleGradeSubmit(sub.id)}
                              className="px-3 py-1.5 bg-blue-900 dark:bg-slate-800 hover:bg-blue-800 dark:hover:bg-slate-750 text-white rounded-lg font-bold text-[10px] uppercase flex items-center"
                            >
                              <Save size={12} className="mr-1" /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex space-x-2">
                          {sub.fileUrl && (
                            <a 
                              href={sub.fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[9px] sm:text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider transition-all flex items-center"
                            >
                              <Download size={12} className="mr-1" /> Homework
                            </a>
                          )}
                          <button 
                            onClick={() => {
                              setActiveGradingId(sub.id);
                              setGradingScore(sub.score || '');
                              setGradingFeedback(sub.feedback || '');
                            }}
                            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-900 hover:bg-blue-800 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider transition-all flex items-center"
                          >
                            <Edit size={12} className="mr-1" /> Grade
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
