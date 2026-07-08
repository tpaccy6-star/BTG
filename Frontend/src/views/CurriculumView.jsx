import React, { useState, useEffect } from 'react';
import { Database, Plus, Edit, BookOpen, Clock, Trash2, Upload, HelpCircle, FileText, Check, X, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuizBuilder from '../components/QuizBuilder';
import InteractiveWidgetModal from '../components/InteractiveWidgetModal';
import BlockBuilder from '../components/BlockBuilder';

export default function CurriculumView({ lessons, onUpdateUser }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState('career');
  
  // Form fields
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [pillar, setPillar] = useState('career');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState('45');
  const [notes, setNotes] = useState([]);
  const [quizData, setQuizData] = useState('');
  const [resources, setResources] = useState([]); // Array of handouts
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [videoRestrictions, setVideoRestrictions] = useState({
    noScroll: false,
    autoplay: false,
    controls: true,
    allowFullscreen: true
  });

  const [cohortsList, setCohortsList] = useState([]);
  const [lessonCohortId, setLessonCohortId] = useState('');

  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/cohorts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setCohortsList(data);
        }
      } catch (err) {
        console.error('Failed to fetch cohorts:', err);
      }
    };
    fetchCohorts();
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [message, setMessage] = useState('');
  const [previewNotesTab, setPreviewNotesTab] = useState(false);

  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [widgetModalType, setWidgetModalType] = useState('FlipCard');

  const activeLessons = lessons?.filter(l => l.pillar === selectedPillar) || [];

  const handleEditClick = (lesson) => {
    setId(lesson.id);
    setTitle(lesson.title);
    setPillar(lesson.pillar);
    setDescription(lesson.description || '');
    setVideoUrl(lesson.videoUrl || '');
    setDuration(lesson.duration.toString());

    let parsedNotes = [];
    if (lesson.notes) {
      try {
        const parsed = JSON.parse(lesson.notes);
        if (Array.isArray(parsed)) {
          parsedNotes = parsed;
        } else {
          parsedNotes = [{ id: Date.now().toString(), type: 'markdown', content: lesson.notes }];
        }
      } catch (e) {
        parsedNotes = [{ id: Date.now().toString(), type: 'markdown', content: lesson.notes }];
      }
    }
    setNotes(parsedNotes);

    setQuizData(lesson.quizData || '');
    setResources(lesson.resources ? JSON.parse(lesson.resources) : []);
    setCoverUrl(lesson.coverUrl || '');
    
    let restrictions = { noScroll: false, autoplay: false, controls: true, allowFullscreen: true };
    try {
      if (lesson.videoRestrictions) {
        restrictions = { ...restrictions, ...JSON.parse(lesson.videoRestrictions) };
      }
    } catch (e) {}
    setVideoRestrictions(restrictions);
    setLessonCohortId(lesson.cohortId?.toString() || '');

    setMessage('');
    setPreviewNotesTab(false);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setId('');
    setTitle('');
    setPillar(selectedPillar);
    setDescription('');
    setVideoUrl('');
    setDuration('45');
    setNotes([]);
    setQuizData('');
    setResources([]);
    setCoverUrl('');
    setVideoRestrictions({
      noScroll: false,
      autoplay: false,
      controls: true,
      allowFullscreen: true
    });
    setLessonCohortId('');
    
    setMessage('');
    setPreviewNotesTab(false);
    setIsFormOpen(true);
  };

  // Immediate upload handout action
  const handleResourceUpload = async (e) => {
    const fileToUpload = e.target.files[0];
    if (!fileToUpload) return;
    
    setUploadingFile(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/lessons/upload-resource', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setResources(prev => [...prev, data.resource]);
        setMessage('Handout document uploaded and attached.');
      } else {
        throw new Error(data.error || 'Failed to upload document.');
      }
    } catch (err) {
      setMessage(`Upload error: ${err.message}`);
    } finally {
      setUploadingFile(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleCoverUpload = async (e) => {
    const fileToUpload = e.target.files[0];
    if (!fileToUpload) return;
    
    setUploadingCover(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/lessons/upload-resource', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setCoverUrl(data.resource.link);
        setMessage('Cover photo uploaded successfully.');
      } else {
        throw new Error(data.error || 'Failed to upload cover.');
      }
    } catch (err) {
      setMessage(`Upload error: ${err.message}`);
    } finally {
      setUploadingCover(false);
      e.target.value = ''; // Reset input
    }
  };

  const removeResource = (indexToRemove) => {
    setResources(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Custom rich text notes editor formatting tool
  const formatNotesText = (tagOpen, tagClose) => {
    const textarea = document.getElementById('lesson-notes-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);
    const replacement = tagOpen + (selection || 'text') + tagClose;
    
    setNotes(text.substring(0, start) + replacement + text.substring(end));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagOpen.length, start + tagOpen.length + (selection || 'text').length);
    }, 0);
  };

  const toggleRestriction = (key) => {
    setVideoRestrictions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!id || !title || !pillar) {
      setMessage('Lesson ID, title, and pillar are required.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: id.toLowerCase().trim().replace(/\s+/g, '-'),
          title,
          pillar,
          description,
          videoUrl,
          duration: parseInt(duration, 10),
          notes: JSON.stringify(notes),
          quizData: quizData || null,
          resources: JSON.stringify(resources),
          videoRestrictions: JSON.stringify(videoRestrictions),
          cohortId: lessonCohortId ? parseInt(lessonCohortId, 10) : null,
          coverUrl: coverUrl || null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save lesson.');
      }

      setMessage('Lesson saved successfully!');
      setIsFormOpen(false);
      
      if (onUpdateUser) {
        onUpdateUser();
      }
    } catch (err) {
      setMessage(err.message || 'Error saving lesson.');
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Curriculum Ops</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Manage learning modules, upload handout documents, and configure video settings.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md flex items-center transition-all animate-fade-in"
        >
          <Plus size={14} className="mr-1.5" /> Add Lesson Unit
        </button>
      </div>

      {/* Pillars selection tabs */}
      <div className="flex flex-wrap gap-2.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 rounded-2xl">
        {[
          { id: 'career', title: 'Career Readiness' },
          { id: 'entrepreneur', title: 'Entrepreneurship' },
          { id: 'english', title: 'Professional English' },
          { id: 'life', title: 'Life Skills' }
        ].map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPillar(p.id)}
            className={`flex-1 min-w-[150px] px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all ${
              selectedPillar === p.id 
                ? 'bg-blue-900 dark:bg-slate-800 text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-blue-900 dark:hover:text-white'
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Lessons List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight mb-2">Curriculum Units</h3>
          {activeLessons.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
              No lessons recorded under this pillar. Click 'Add Lesson' to begin.
            </div>
          ) : (
            activeLessons.map((lesson, idx) => (
              <div 
                key={lesson.id} 
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-900 dark:text-yellow-450 font-bold flex items-center justify-center text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{lesson.title}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{lesson.duration} mins • ID: {lesson.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleEditClick(lesson)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg text-slate-400 hover:text-blue-900 dark:text-slate-300 dark:hover:text-yellow-450 border border-slate-200/30 dark:border-slate-700 transition-all flex items-center space-x-1 text-[10px] font-bold"
                >
                  <Edit size={12} />
                  <span>Edit</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Action Panel / Quick Details */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm h-fit">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3">Database Overview</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">Generation Rise curriculum runs serverless on an SQLite relational database. Modifications to lessons will immediately sync with the Scholar Learning Catalog.</p>
          <div className="space-y-4 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
              <span>Total Curriculum Units</span>
              <span className="font-bold text-blue-900 dark:text-yellow-450">{lessons?.length || 0}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
              <span>Career Readiness</span>
              <span className="font-bold text-blue-900 dark:text-yellow-450">{lessons?.filter(l => l.pillar === 'career').length || 0}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
              <span>Entrepreneurship</span>
              <span className="font-bold text-blue-900 dark:text-yellow-450">{lessons?.filter(l => l.pillar === 'entrepreneur').length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Creation / Edit Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-900"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative bg-white dark:bg-slate-900 w-full h-full flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900 z-10 shrink-0">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{id ? 'Edit Lesson Unit' : 'Create Lesson Unit'}</h3>
                <button onClick={() => setIsFormOpen(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                {message && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 p-3.5 rounded-xl text-xs font-bold text-center">
                    {message}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Lesson ID</label>
                    <input 
                      type="text" 
                      required
                      disabled={!!id}
                      placeholder="e.g. entrepreneur-4"
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 disabled:opacity-50 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Duration (min)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="45"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Lesson Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Value Proposition Design"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Pillar Category</label>
                    <select 
                      value={pillar} 
                      onChange={(e) => setPillar(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-455 text-slate-800 dark:text-white"
                    >
                      <option value="career">Career Readiness</option>
                      <option value="entrepreneur">Entrepreneurship</option>
                      <option value="english">Professional English</option>
                      <option value="life">Life Skills</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Cohort Restriction</label>
                    <select
                      value={lessonCohortId}
                      onChange={(e) => setLessonCohortId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white"
                    >
                      <option value="">All Cohorts (Global)</option>
                      {cohortsList.map(cohort => (
                        <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Overview Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a general overview of this lesson module..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-900 dark:focus:border-yellow-455 text-slate-850 dark:text-white"
                    rows="2"
                  />
                </div>

                {/* Block-Based Notes Editor */}
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText size={16} className="text-blue-900 dark:text-yellow-450" />
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest block">Interactive Class Study Notes</label>
                  </div>
                  <BlockBuilder blocks={notes} setBlocks={setNotes} />
                </div>

                {/* Quiz Data Input Field - Visual Builder */}
                <div className="space-y-3 mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <div className="flex items-center space-x-2">
                    <Wand2 size={16} className="text-blue-900 dark:text-yellow-450" />
                    <label className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest block">Visual Quiz Builder</label>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mb-4">Add multiple-choice or true/false questions visually. This data will be auto-compiled into the interactive quiz engine.</p>
                  <QuizBuilder quizData={quizData} setQuizData={setQuizData} />
                </div>

                {/* Cover Photo upload section */}
                <div className="space-y-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/40">
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest block">Lesson Cover Photo</label>
                  
                  {coverUrl && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                      <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCoverUrl('')}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md"
                        title="Remove cover photo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <label className="flex-1 flex items-center justify-center p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 hover:border-blue-900 dark:hover:border-yellow-450 transition-all cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden" 
                      />
                      <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400 font-bold">
                        <Upload size={14} className="text-slate-400" />
                        <span>{uploadingCover ? 'Uploading Cover...' : 'Upload Cover Photo'}</span>
                      </div>
                    </label>
                  </div>
                  
                  <div className="space-y-1">
                    <input 
                      type="text"
                      placeholder="Or paste an image URL..."
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Handout document upload section */}
                <div className="space-y-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/40">
                  <label className="text-[9px] font-bold text-slate-505 dark:text-slate-450 uppercase tracking-widest block">Handouts & Reference Documents</label>
                  
                  {/* List of uploaded handouts */}
                  {resources.length > 0 && (
                    <div className="space-y-2">
                      {resources.map((res, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs">
                          <div className="flex items-center space-x-2">
                            <FileText size={14} className="text-blue-900 dark:text-yellow-450 shrink-0" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[280px]">{res.name}</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500">({res.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeResource(idx)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-650 rounded-lg transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* File input selector */}
                  <div className="flex items-center space-x-3">
                    <label className="flex-1 flex items-center justify-center p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 hover:border-blue-900 dark:hover:border-yellow-450 transition-all cursor-pointer">
                      <input 
                        type="file" 
                        onChange={handleResourceUpload}
                        className="hidden" 
                      />
                      <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400 font-bold">
                        <Upload size={14} className="text-slate-400" />
                        <span>{uploadingFile ? 'Uploading Handout...' : 'Upload Reference Document'}</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Video section & restrictions */}
                <div className="space-y-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-505 dark:text-slate-450 uppercase tracking-widest block">Video Source Link / Embed</label>
                    <textarea 
                      placeholder="Paste YouTube Link, direct MP4 link, or raw Iframe embed code here..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white"
                      rows="2"
                    />
                  </div>

                  {/* Video restrictions toggles */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Video restrictions parameters</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'noScroll', label: 'Disable Scroll Trap (Overlay)' },
                        { key: 'autoplay', label: 'Autoplay Video Lecture' },
                        { key: 'controls', label: 'Show Player Controls' },
                        { key: 'allowFullscreen', label: 'Allow Fullscreen View' }
                      ].map(rest => (
                        <button
                          key={rest.key}
                          type="button"
                          onClick={() => toggleRestriction(rest.key)}
                          className="flex items-center space-x-2 text-left"
                        >
                          <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                            videoRestrictions[rest.key] ? 'bg-blue-900 border-blue-900 text-white' : 'border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-950 text-transparent'
                          }`}>
                            <Check size={10} strokeWidth={4} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{rest.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 justify-end border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 rounded-xl font-bold text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting || uploadingFile}
                    className="px-5 py-2.5 bg-blue-900 dark:bg-slate-800 hover:bg-blue-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Unit'}
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Advanced Creator Toolboxes */}
      <AnimatePresence>
        {widgetModalOpen && (
          <InteractiveWidgetModal 
            isOpen={widgetModalOpen}
            onClose={() => setWidgetModalOpen(false)}
            widgetType={widgetModalType}
            onInsert={(markdown) => formatNotesText(markdown, '')}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
