import React, { useState, useEffect } from 'react';
import { ChevronRight, BookOpen, PlayCircle, FileText, Download, CheckCircle2, Upload, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function LessonView({ currentUser, lessons, selectedLessonId, setCurrentView, onUpdateUser }) {
  const lesson = lessons?.find(l => l.id === selectedLessonId);

  const [lessonChecklist, setLessonChecklist] = useState({ video: false, reading: false, quiz: false });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  
  // Video playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [interact, setInteract] = useState(false);

  // Synchronize and persist checklist state to localStorage
  useEffect(() => {
    if (lesson) {
      const saved = localStorage.getItem(`checklist_${currentUser?.id || 'guest'}_${lesson.id}`);
      if (saved) {
        setLessonChecklist(JSON.parse(saved));
      } else {
        setLessonChecklist({ video: false, reading: false, quiz: false });
      }
      setIsPlaying(false);
      setInteract(false);
    }
  }, [lesson?.id, currentUser?.id]);

  useEffect(() => {
    if (lesson) {
      localStorage.setItem(`checklist_${currentUser?.id || 'guest'}_${lesson.id}`, JSON.stringify(lessonChecklist));
    }
  }, [lessonChecklist, currentUser?.id, lesson?.id]);

  if (!lesson) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100">
        <p>No active lesson selected. Please return to the Learning Catalog.</p>
        <button 
          onClick={() => { setCurrentView('catalog'); window.location.hash = '#/catalog'; }} 
          className="mt-4 px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-xs uppercase"
        >
          Catalog
        </button>
      </div>
    );
  }

  // Parse resources
  let resourcesList = [];
  try {
    if (lesson.resources) {
      resourcesList = JSON.parse(lesson.resources);
    }
  } catch (err) {
    console.error('Error parsing resources:', err);
  }

  // Parse video restrictions
  let restrictions = { noScroll: false, autoplay: false, controls: true, allowFullscreen: true };
  try {
    if (lesson.videoRestrictions) {
      restrictions = { ...restrictions, ...JSON.parse(lesson.videoRestrictions) };
    }
  } catch (err) {
    console.error('Error parsing restrictions:', err);
  }

  // Find if user already submitted homework
  const submission = currentUser?.submissions?.find(s => s.lessonId === lesson.id);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e) => {
    e?.preventDefault();
    if (!file) {
      setUploadMessage('Please select a file to upload.');
      return;
    }

    setSubmitting(true);
    setUploadMessage('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lessonId', lesson.id);

      const response = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit task.');
      }

      setUploadMessage('Homework submitted successfully!');
      setFile(null);
      
      if (onUpdateUser) {
        onUpdateUser();
      }
    } catch (err) {
      setUploadMessage(err.message || 'Error uploading file.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to resolve video tag / iframe source
  const parseVideoSource = (url) => {
    if (!url) return null;
    
    const urlTrim = url.trim();
    if (urlTrim.startsWith('<iframe')) {
      const match = urlTrim.match(/src="([^"]+)"/);
      if (match && match[1]) {
        return { type: 'youtube', src: match[1] };
      }
      return { type: 'iframe-raw', html: urlTrim };
    }

    const ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(mbed)?)\/||user\/(?:[^\/]+)\/|shorts\/)|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/;
    const ytMatch = url.match(ytReg);
    if (ytMatch && ytMatch[1]) {
      return { type: 'youtube', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
    }

    return { type: 'direct', src: url };
  };

  const videoSource = parseVideoSource(lesson.videoUrl);

  const getEmbedSrc = () => {
    if (!videoSource || !videoSource.src) return '';
    let src = videoSource.src;
    
    // Check if we need to append parameters
    const separator = src.includes('?') ? '&' : '?';
    let params = [];
    if (restrictions.autoplay || isPlaying) params.push('autoplay=1');
    if (!restrictions.controls) params.push('controls=0');
    
    return src + (params.length > 0 ? separator + params.join('&') : '');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.98 }} 
      className="space-y-8"
    >
      {/* Mobile Back Button */}
      <div className="lg:hidden">
        <button
          onClick={() => { setCurrentView('catalog'); window.location.hash = '#/catalog'; }}
          className="inline-flex items-center space-x-2 text-xs font-black text-blue-900 dark:text-yellow-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>Back to Catalog</span>
        </button>
      </div>

      {/* Breadcrumb */}
      <nav className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
        <button 
          onClick={() => { setCurrentView('catalog'); window.location.hash = '#/catalog'; }} 
          className="hover:text-blue-900 dark:hover:text-yellow-400"
        >
          Catalog
        </button>
        <ChevronRight size={12} />
        <span className="text-slate-505 dark:text-slate-400 uppercase">{lesson.pillar}</span>
        <ChevronRight size={12} />
        <span className="text-blue-900 dark:text-yellow-400 font-black">{lesson.title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-blue-900 dark:text-white tracking-tight">{lesson.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{lesson.duration} mins • Curriculum Workspace</p>
        </div>
        <button 
          onClick={() => { setCurrentView('catalog'); window.location.hash = '#/catalog'; }} 
          className="px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl font-bold text-xs shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-center"
        >
          <BookOpen size={16} className="mr-2" /> Back to Catalog
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Video & Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dynamic Video Player */}
          <div 
            onMouseLeave={() => setInteract(false)}
            className="relative aspect-video w-full bg-[#0F172A] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden group"
          >
            {!isPlaying ? (
              // Cover placeholder splash
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: lesson.coverUrl 
                    ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.85)), url(${lesson.coverUrl})`
                    : 'linear-gradient(to bottom right, #0b1329, #0f172a)'
                }}
              >
                <button 
                  onClick={() => {
                    setIsPlaying(true);
                    setLessonChecklist(prev => ({ ...prev, video: true }));
                  }}
                  className="w-20 h-20 bg-yellow-400 hover:bg-yellow-350 text-blue-900 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                >
                  <PlayCircle size={36} fill="currentColor" stroke="none" className="ml-1" />
                </button>
                <p className="text-white font-bold text-sm mt-4 z-10">{lesson.title}</p>
                <p className="text-slate-400 text-xs mt-1.5 z-10">Click play to launch video lecture</p>
              </div>
            ) : (
              // Playing state
              <div className="w-full h-full relative">
                {/* Scroll trap prevention overlay */}
                {restrictions.noScroll && !interact && (
                  <div 
                    onClick={() => setInteract(true)} 
                    className="absolute inset-0 z-20 bg-black/0 hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center text-white/0 hover:text-white/90 text-xs font-bold font-sans uppercase tracking-wider select-none"
                  >
                    Click to interact with video
                  </div>
                )}

                {videoSource ? (
                  videoSource.type === 'youtube' ? (
                    <iframe
                      src={getEmbedSrc()}
                      className="w-full h-full"
                      style={{ pointerEvents: (restrictions.noScroll && !interact) ? 'none' : 'auto' }}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen={restrictions.allowFullscreen}
                    />
                  ) : videoSource.type === 'iframe-raw' ? (
                    <div 
                      className="w-full h-full raw-iframe-wrapper"
                      style={{ pointerEvents: (restrictions.noScroll && !interact) ? 'none' : 'auto' }}
                      dangerouslySetInnerHTML={{ __html: videoSource.html }}
                    />
                  ) : (
                    <video
                      src={videoSource.src}
                      controls={restrictions.controls}
                      autoPlay={restrictions.autoplay || isPlaying}
                      className="w-full h-full"
                      style={{ pointerEvents: (restrictions.noScroll && !interact) ? 'none' : 'auto' }}
                      onEnded={() => {
                        setLessonChecklist(prev => ({ ...prev, video: true }));
                      }}
                      onTimeUpdate={(e) => {
                        const videoEl = e.target;
                        if (videoEl.duration > 0 && videoEl.currentTime / videoEl.duration > 0.9) {
                          setLessonChecklist(prev => {
                            if (!prev.video) {
                              return { ...prev, video: true };
                            }
                            return prev;
                          });
                        }
                      }}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No video lecture source configured.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description Card */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Lesson Overview</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-xs">
              {lesson.description || 'This course module empowers leadership, personal growth, time management logs, and local community service verification metrics.'}
            </p>
          </div>

          {/* Lesson Rich Notes Card */}
          {lesson.notes && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-850 dark:text-white tracking-tight">Class Study Notes</h3>
              <MarkdownRenderer 
                content={lesson.notes} 
                className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed text-xs space-y-4"
              />
            </div>
          )}
        </div>        {/* Right Sidebar - Lesson checklist & Resources */}
        <div className="space-y-8">
          {/* Checklist */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-blue-900 dark:text-yellow-400 tracking-tight">Lesson Progress</h3>
            <div className="space-y-4">
              {[
                { key: 'video', label: 'Watch Video Lesson' },
                { key: 'reading', label: 'Read Reference Document' },
                { key: 'quiz', label: 'Complete Short Quiz' }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setLessonChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all text-left group"
                >
                  <span className="font-bold text-xs text-blue-950 dark:text-slate-100">{item.label}</span>
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                    lessonChecklist[item.key] 
                      ? 'bg-green-500 text-white' 
                      : 'border-2 border-slate-300 dark:border-slate-750 text-transparent'
                  }`}>
                    <CheckCircle2 size={14} strokeWidth={3} />
                  </div>
                </button>
              ))}
            </div>
          </div>          {/* Homework Submission Box */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-blue-900 dark:text-yellow-400 tracking-tight">Task Submission</h3>
            {submission ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="text-green-500" size={18} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Homework Submitted</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Status: {submission.status}</p>
                {submission.fileUrl && (
                  <a 
                    href={submission.fileUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-blue-600 dark:text-yellow-450 font-bold hover:underline flex items-center mt-1"
                  >
                    <Download size={14} className="mr-1" /> View Uploaded File
                  </a>
                )}
                {submission.status === 'graded' && (
                  <div className="border-t border-slate-200/60 dark:border-slate-800 pt-3 mt-3">
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-450">Score: {submission.score}/100</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Feedback: "{submission.feedback}"</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Upload your homework assignment for grading.</p>
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center hover:border-blue-900 dark:hover:border-yellow-450 transition-all">
                  <input 
                    type="file" 
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center space-y-1">
                    <Upload size={24} className="text-slate-400 dark:text-slate-500" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {file ? file.name : 'Choose File'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">PDF, DOCX, PNG (Max 5MB)</span>
                  </div>
                </div>
                {uploadMessage && (
                  <p className="text-xs font-bold text-center text-blue-900 dark:text-yellow-450 bg-blue-50 dark:bg-yellow-450/10 py-1 px-3 rounded-lg border border-blue-100 dark:border-yellow-450/20">
                    {uploadMessage}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-900 dark:bg-slate-800 hover:bg-blue-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase tracking-wider disabled:bg-blue-300 dark:disabled:bg-slate-800/40 transition-all flex items-center justify-center space-x-2"
                >
                  <Upload size={14} />
                  <span>{submitting ? 'Uploading...' : 'Submit Assignment'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Resources List */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-blue-900 dark:text-yellow-400 tracking-tight">Handouts & Materials</h3>
            <div className="space-y-4">
              {resourcesList.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500">No handout attachments for this lesson.</p>
              ) : (
                resourcesList.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-blue-50 dark:bg-slate-800 text-blue-900 dark:text-yellow-400 rounded-xl group-hover:scale-110 transition-transform">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-blue-900 dark:text-slate-200 line-clamp-1">{file.name}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{file.size || '1.0 MB'}</p>
                      </div>
                    </div>
                    <a 
                      href={file.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-900 dark:hover:text-yellow-450 transition-colors"
                      download
                    >
                      <Download size={16} />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
