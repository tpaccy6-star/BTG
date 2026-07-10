import React, { useState, useEffect } from 'react';
import { 
  Database, Shield, RefreshCcw, Check, AlertTriangle, Users, BookOpen, 
  Megaphone, Trash2, Edit2, Plus, X, Lock, CheckCircle2, FileText, Bell, 
  Globe, Activity, User, Save, ListTodo, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';

export default function SettingsView({ currentUser, userRole, onLogout, onUpdateUser }) {
  // Global States
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'users', 'lessons', 'announcements', 'submissions'
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [confirmModalConfig, setConfirmModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Tab: General / System states
  const [backups, setBackups] = useState([]);
  const [backingUp, setBackingUp] = useState(false);
  const [isComplianceEnabled, setIsComplianceEnabled] = useState(true);
  const [isSSLMockActive, setIsSSLMockActive] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);

  // Tab: Users CRUD states
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userEditing, setUserEditing] = useState(null); // null for create
  // User Form fields
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRoleField, setUserRoleField] = useState('scholar');
  const [userName, setUserName] = useState('');
  const [userUniv, setUserUniv] = useState('');
  const [userYear, setUserYear] = useState('');
  const [userStreak, setUserStreak] = useState('0');
  const [cohortsList, setCohortsList] = useState([]);
  const [userCohortId, setUserCohortId] = useState('');
  const [lessonCohortId, setLessonCohortId] = useState('');

  // Tab: Lessons CRUD states
  const [lessonsList, setLessonsList] = useState([]);
  const [lessonSearch, setLessonSearch] = useState('');
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonEditing, setLessonEditing] = useState(null);
  // Lesson Form fields
  const [lessonId, setLessonId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonPillar, setLessonPillar] = useState('career');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonVideo, setLessonVideo] = useState('');
  const [lessonDuration, setLessonDuration] = useState('30');
  const [lessonNotes, setLessonNotes] = useState('');
  const [lessonResources, setLessonResources] = useState([]);
  const [lessonCoverUrl, setLessonCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [lessonVideoRestrictions, setLessonVideoRestrictions] = useState({
    noScroll: false,
    autoplay: false,
    controls: true,
    allowFullscreen: true
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [previewNotesTab, setPreviewNotesTab] = useState(false);

  // Tab: Announcements CRUD states
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annEditing, setAnnEditing] = useState(null);
  // Announcement Form fields
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  // Tab: Submissions CRUD states
  const [submissionsList, setSubmissionsList] = useState([]);
  const [subSearch, setSubSearch] = useState('');
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [subScore, setSubScore] = useState('');
  const [subFeedback, setSubFeedback] = useState('');

  // Load Data based on tab selection
  useEffect(() => {
    if (userRole !== 'admin') return;

    if (activeTab === 'general') {
      fetchBackups();
    } else if (activeTab === 'users') {
      fetchUsers();
      fetchCohorts();
    } else if (activeTab === 'lessons') {
      fetchLessons();
      fetchCohorts();
    } else if (activeTab === 'announcements') {
      fetchAnnouncements();
    } else if (activeTab === 'submissions') {
      fetchSubmissions();
    }
  }, [activeTab, userRole]);

  // Alert message autohide
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // --- API Fetches ---
  const fetchCohorts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cohorts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCohortsList(data);
      }
    } catch (err) {
      console.error('Failed to load cohorts:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      } else {
        throw new Error('Failed to load users');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/lessons', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLessonsList(data);
      } else {
        throw new Error('Failed to load lessons');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/announcements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncementsList(data);
      } else {
        throw new Error('Failed to load announcements');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissionsList(data);
      } else {
        throw new Error('Failed to load submissions');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SQLite Backup Managers ---
  const fetchBackups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/backups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBackups(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBackup = async () => {
    setBackingUp(true);
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Database backup created successfully!');
        fetchBackups();
      } else {
        throw new Error(data.error || 'Failed to create database backup.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBackingUp(false);
    }
  };

  const handleDownloadBackup = async (filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/backup/download/${filename}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to download backup.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // --- User CRUD handlers ---
  const openUserCreate = () => {
    setUserEditing(null);
    setUserEmail('');
    setUserPassword('');
    setUserRoleField('scholar');
    setUserName('');
    setUserUniv('');
    setUserYear('');
    setUserStreak('0');
    setUserCohortId('');
    setModalError('');
    setIsUserModalOpen(true);
  };

  const openUserEdit = (user) => {
    setUserEditing(user);
    setUserEmail(user.email);
    setUserPassword(''); // blank means do not change
    setUserRoleField(user.role);
    setUserName(user.name);
    setUserUniv(user.university || '');
    setUserYear(user.yearLevel || '');
    setUserStreak(user.streakDays?.toString() || '0');
    setUserCohortId(user.cohortId?.toString() || '');
    setModalError('');
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = userEditing ? `/api/users/admin/${userEditing.id}` : '/api/users/admin';
    const method = userEditing ? 'PUT' : 'POST';

    const payload = {
      email: userEmail,
      role: userRoleField,
      name: userName,
      university: userRoleField === 'scholar' ? userUniv : null,
      yearLevel: userRoleField === 'scholar' ? userYear : null,
      streakDays: parseInt(userStreak, 10) || 0,
      cohortId: userRoleField === 'scholar' && userCohortId ? parseInt(userCohortId, 10) : null
    };

    if (userPassword) {
      payload.password = userPassword;
    } else if (!userEditing) {
      setModalError('Password is required for new accounts.');
      return;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(userEditing ? 'User updated successfully.' : 'User created successfully.');
        setIsUserModalOpen(false);
        fetchUsers();
      } else {
        throw new Error(data.error || 'Failed to save user.');
      }
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/users/admin/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setMessage('User deleted.');
            fetchUsers();
          } else {
            const data = await res.json();
            throw new Error(data.error || 'Failed to delete user');
          }
        } catch (err) {
          setError(err.message);
        }
      }
    });
  };

  // --- Curriculum / Lessons CRUD handlers ---
  const openLessonCreate = () => {
    setLessonEditing(null);
    setLessonId('');
    setLessonTitle('');
    setLessonPillar('career');
    setLessonDesc('');
    setLessonVideo('');
    setLessonDuration('35');
    setLessonNotes('');
    setLessonResources([]);
    setLessonCoverUrl('');
    setLessonVideoRestrictions({
      noScroll: false,
      autoplay: false,
      controls: true,
      allowFullscreen: true
    });
    setLessonCohortId('');
    setPreviewNotesTab(false);
    setModalError('');
    setIsLessonModalOpen(true);
  };

  const openLessonEdit = (lesson) => {
    setLessonEditing(lesson);
    setLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonPillar(lesson.pillar);
    setLessonDesc(lesson.description || '');
    setLessonVideo(lesson.videoUrl || '');
    setLessonDuration(lesson.duration?.toString() || '30');
    setLessonNotes(lesson.notes || '');
    setLessonResources(lesson.resources ? JSON.parse(lesson.resources) : []);
    setLessonCoverUrl(lesson.coverUrl || '');
    
    let restrictions = { noScroll: false, autoplay: false, controls: true, allowFullscreen: true };
    try {
      if (lesson.videoRestrictions) {
        restrictions = { ...restrictions, ...JSON.parse(lesson.videoRestrictions) };
      }
    } catch (e) {}
    setLessonVideoRestrictions(restrictions);
    setLessonCohortId(lesson.cohortId?.toString() || '');
    setPreviewNotesTab(false);
    setModalError('');
    setIsLessonModalOpen(true);
  };

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
        setLessonResources(prev => [...prev, data.resource]);
        setMessage('Handout document uploaded and attached.');
      } else {
        throw new Error(data.error || 'Failed to upload document.');
      }
    } catch (err) {
      setError(`Upload error: ${err.message}`);
    } finally {
      setUploadingFile(false);
      e.target.value = ''; // Reset input
    }
  };

  const removeResource = (indexToRemove) => {
    setLessonResources(prev => prev.filter((_, idx) => idx !== indexToRemove));
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
        setLessonCoverUrl(data.resource.link);
        setMessage('Cover photo uploaded successfully.');
      } else {
        throw new Error(data.error || 'Failed to upload cover.');
      }
    } catch (err) {
      setError(`Upload error: ${err.message}`);
    } finally {
      setUploadingCover(false);
      e.target.value = ''; // Reset input
    }
  };

  const formatNotesText = (tagOpen, tagClose) => {
    const textarea = document.getElementById('lesson-notes-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);
    const replacement = tagOpen + (selection || 'text') + tagClose;
    
    setLessonNotes(text.substring(0, start) + replacement + text.substring(end));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagOpen.length, start + tagOpen.length + (selection || 'text').length);
    }, 0);
  };

  const toggleRestriction = (key) => {
    setLessonVideoRestrictions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: lessonId.toLowerCase().trim().replace(/\s+/g, '-'),
          title: lessonTitle,
          pillar: lessonPillar,
          description: lessonDesc,
          videoUrl: lessonVideo,
          duration: parseInt(lessonDuration, 10) || 30,
          notes: lessonNotes,
          resources: JSON.stringify(lessonResources),
          videoRestrictions: JSON.stringify(lessonVideoRestrictions),
          cohortId: lessonCohortId ? parseInt(lessonCohortId, 10) : null,
          coverUrl: lessonCoverUrl || null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Lesson saved successfully.');
        setIsLessonModalOpen(false);
        fetchLessons();
      } else {
        throw new Error(data.error || 'Failed to save lesson.');
      }
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleDeleteLesson = async (id) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Curriculum Unit',
      message: 'Are you sure you want to delete this curriculum unit? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/admin/lessons/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setMessage('Lesson deleted.');
            fetchLessons();
          } else {
            const data = await res.json();
            throw new Error(data.error || 'Failed to delete lesson');
          }
        } catch (err) {
          setError(err.message);
        }
      }
    });
  };

  // --- Announcements CRUD handlers ---
  const openAnnCreate = () => {
    setAnnEditing(null);
    setAnnTitle('');
    setAnnContent('');
    setModalError('');
    setIsAnnModalOpen(true);
  };

  const openAnnEdit = (ann) => {
    setAnnEditing(ann);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setModalError('');
    setIsAnnModalOpen(true);
  };

  const handleAnnSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = annEditing ? `/api/admin/announcements/${annEditing.id}` : '/api/announcements';
    const method = annEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: annTitle, content: annContent })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Announcement saved.');
        setIsAnnModalOpen(false);
        fetchAnnouncements();
      } else {
        throw new Error(data.error || 'Failed to save announcement.');
      }
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleDeleteAnn = async (id) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Broadcast',
      message: 'Are you sure you want to delete this broadcast?',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/announcements/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setMessage('Broadcast deleted.');
            fetchAnnouncements();
          } else {
            const data = await res.json();
            throw new Error(data.error || 'Failed to delete broadcast');
          }
        } catch (err) {
          setError(err.message);
        }
      }
    });
  };

  // --- Submissions CRUD handlers ---
  const openGradeModal = (sub) => {
    setSelectedSub(sub);
    setSubScore(sub.score?.toString() || '');
    setSubFeedback(sub.feedback || '');
    setModalError('');
    setIsGradeModalOpen(true);
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/submissions/${selectedSub.id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          score: parseInt(subScore, 10),
          feedback: subFeedback
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Grade logged.');
        setIsGradeModalOpen(false);
        fetchSubmissions();
      } else {
        throw new Error(data.error || 'Failed to grade');
      }
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleDeleteSub = async (id) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Submission',
      message: 'Are you sure you want to delete this submission record?',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/admin/submissions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setMessage('Submission deleted.');
            fetchSubmissions();
          } else {
            const data = await res.json();
            throw new Error(data.error || 'Failed to delete submission');
          }
        } catch (err) {
          setError(err.message);
        }
      }
    });
  };


  // --- Filter selectors ---
  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredLessons = lessonsList.filter(l => 
    l.title.toLowerCase().includes(lessonSearch.toLowerCase()) || 
    l.id.toLowerCase().includes(lessonSearch.toLowerCase()) ||
    l.pillar.toLowerCase().includes(lessonSearch.toLowerCase())
  );

  const filteredSubs = submissionsList.filter(s => 
    s.scholar?.name.toLowerCase().includes(subSearch.toLowerCase()) ||
    s.lesson?.title.toLowerCase().includes(subSearch.toLowerCase()) ||
    s.status.toLowerCase().includes(subSearch.toLowerCase())
  );

  // --- Render Non-Admin View ---
  if (userRole !== 'admin') {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Account Preferences</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Configure your personal alerts, notification preferences, and account info.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left panel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between items-center text-center h-fit">
            <div className="w-16 h-16 rounded-2xl bg-blue-900 text-yellow-400 text-xl font-bold flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800 shadow">
              {currentUser?.initials || 'GR'}
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">{currentUser?.name}</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-widest mt-0.5">{currentUser?.role}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">{currentUser?.email}</p>
            {currentUser?.university && (
              <span className="mt-4 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400 text-[9px] font-bold rounded-full uppercase tracking-wider">
                {currentUser.university}
              </span>
            )}
            <button onClick={onLogout} className="mt-8 w-full py-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all">
              Log Out Portal
            </button>
          </div>

          {/* Right settings form */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center"><Bell size={16} className="text-blue-900 dark:text-yellow-450 mr-2" /> Live Alerts</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-800 dark:text-white">Email Digest Alert</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Receive notifications of assignments, grades, and broadcasts directly to your email.</p>
                  </div>
                  <button onClick={() => setEmailAlerts(!emailAlerts)} className={`w-12 h-6 rounded-full transition-all relative ${emailAlerts ? 'bg-blue-900 dark:bg-yellow-450' : 'bg-slate-200 dark:bg-slate-800'}`}>
                    <div className={`w-4 h-4 bg-white dark:bg-slate-950 rounded-full shadow absolute top-1 transition-all ${emailAlerts ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-800 dark:text-white">Browser Push Notifications</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Alerts when new chat logs or broadcast bulletins are published.</p>
                  </div>
                  <button onClick={() => setPushAlerts(!pushAlerts)} className={`w-12 h-6 rounded-full transition-all relative ${pushAlerts ? 'bg-blue-900 dark:bg-yellow-450' : 'bg-slate-200 dark:bg-slate-800'}`}>
                    <div className={`w-4 h-4 bg-white dark:bg-slate-950 rounded-full shadow absolute top-1 transition-all ${pushAlerts ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-800 dark:text-white border-b border-slate-50 dark:border-slate-800 pb-3 flex items-center"><Shield size={16} className="text-blue-900 dark:text-yellow-450 mr-2" /> Account Security</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium leading-relaxed font-semibold">For password adjustments or modifications to enrollment records, contact the NGO system administrator at <span className="font-bold text-blue-900 dark:text-yellow-450">admin@generationrise.org</span>.</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // --- Render Admin View (with tabs & CRUDs) ---
  return (
    <>
    <ConfirmModal 
      isOpen={confirmModalConfig.isOpen}
      title={confirmModalConfig.title}
      message={confirmModalConfig.message}
      onConfirm={confirmModalConfig.onConfirm}
      onClose={() => setConfirmModalConfig({ ...confirmModalConfig, isOpen: false })}
    />
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
      {/* Admin Title & Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Controls & Admin Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Super-user configuration portal with complete database operations and dashboard CRUD panels.</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-900/10 dark:bg-blue-950/30 text-blue-900 dark:text-blue-400 px-3.5 py-1.5 rounded-full border border-blue-900/20 dark:border-blue-900/40 text-xs font-bold uppercase tracking-wider">
          <Shield size={12} className="mr-1.5" /> Operations Console
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800">
        {[
          { id: 'general', title: 'System Param', icon: Database },
          { id: 'users', title: 'Users CRUD', icon: Users },
          { id: 'lessons', title: 'Curriculum CRUD', icon: BookOpen },
          { id: 'announcements', title: 'Broadcasts CRUD', icon: Megaphone },
          { id: 'submissions', title: 'Submissions CRUD', icon: FileText }
        ].map(tab => {
          const isSelected = activeTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 ${
                isSelected 
                  ? 'bg-blue-900 dark:bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <TabIcon size={12} />
              <span>{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* Notifications banner */}
      {(message || error) && (
        <div className={`p-4 rounded-xl text-xs font-bold text-center border animate-fade-in ${
          message ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' : 'bg-red-50 dark:bg-red-950/20 text-red-655 dark:text-red-450 border-red-100 dark:border-red-900/30'
        }`}>
          {message || error}
        </div>
      )}

      {/* Admin active content */}
      <div className="bg-slate-50 dark:bg-transparent">
        
        {/* TAB 1: General Parameters */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Database backups */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center space-x-3 text-blue-900 dark:text-yellow-450 border-b border-slate-50 dark:border-slate-800 pb-3">
                  <Database size={18} />
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">Database Backup & Recovery</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Generate secure copies of the system's SQLite database. You can download backups locally to preserve student registries, grades, and logs.
                </p>
                
                <button
                  onClick={handleCreateBackup}
                  disabled={backingUp}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center transition-all disabled:opacity-50"
                >
                  <RefreshCcw size={12} className={`mr-2 ${backingUp ? 'animate-spin' : ''}`} />
                  <span>{backingUp ? 'Creating Backup...' : 'Create Full Backup'}</span>
                </button>

                <div className="mt-6 space-y-3">
                  <h4 className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">Available Backups</h4>
                  {backups.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-505 italic py-2">No backups created yet.</p>
                  ) : (
                    <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 pr-1 space-y-2.5">
                      {backups.map((b, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 text-xs">
                          <div>
                            <p className="font-bold text-slate-750 dark:text-slate-300">{b.filename}</p>
                            <p className="text-[10px] text-slate-450 dark:text-slate-550 font-medium mt-0.5">Created: {new Date(b.timestamp).toLocaleString()} • Size: {b.size}</p>
                          </div>
                          <button
                            onClick={() => handleDownloadBackup(b.filename)}
                            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-blue-900 dark:text-yellow-450 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance toggles */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center space-x-3 text-blue-900 dark:text-yellow-450 border-b border-slate-50 dark:border-slate-800 pb-3">
                  <Shield size={18} />
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">System Security Parameters</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-800 dark:text-white">NGO Compliance Master Logs</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Auto-forward attendance registry summaries to master NGO archives weekly.</p>
                    </div>
                    <button onClick={() => setIsComplianceEnabled(!isComplianceEnabled)} className={`w-12 h-6 rounded-full transition-all relative ${isComplianceEnabled ? 'bg-blue-900 dark:bg-yellow-450' : 'bg-slate-200 dark:bg-slate-800'}`}>
                      <div className={`w-4 h-4 bg-white dark:bg-slate-950 rounded-full shadow absolute top-1 transition-all ${isComplianceEnabled ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-800 dark:text-white">HTTPS SSL Sandbox Enforcement</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Verify cookies carrying Bearer tokens enforce HTTPOnly flags.</p>
                    </div>
                    <button onClick={() => setIsSSLMockActive(!isSSLMockActive)} className={`w-12 h-6 rounded-full transition-all relative ${isSSLMockActive ? 'bg-blue-900 dark:bg-yellow-450' : 'bg-slate-200 dark:bg-slate-800'}`}>
                      <div className={`w-4 h-4 bg-white dark:bg-slate-950 rounded-full shadow absolute top-1 transition-all ${isSSLMockActive ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar specs */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 h-fit">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">System Parameters</h3>
              <div className="space-y-3.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-2.5">
                  <span>Environment</span>
                  <span className="font-bold text-blue-900 dark:text-yellow-450 uppercase">Local Dev</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-2.5">
                  <span>Database Engine</span>
                  <span className="font-bold text-blue-900 dark:text-yellow-450">SQLite 3</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-2.5">
                  <span>Server Port</span>
                  <span className="font-bold text-blue-900 dark:text-yellow-450">5000</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 pb-2.5">
                  <span>Encryption Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center"><Check size={12} className="mr-1" /> Active</span>
                </div>
              </div>

              <div className="bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 p-4 rounded-xl text-[10px] flex items-start space-x-2">
                <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={14} />
                <div className="space-y-1">
                  <h4 className="font-bold text-yellow-800 dark:text-yellow-550">Caution</h4>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">Database resetting is instantaneous. Backup any files prior to dropping relational schemas.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Users CRUD */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white transition-all shadow-sm"
                />
                <Globe size={14} className="absolute left-3 top-3 text-slate-400" />
              </div>
              <button 
                onClick={openUserCreate}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center shadow-md shadow-blue-900/10 dark:shadow-none"
              >
                <Plus size={14} className="mr-1.5" /> Add User
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold">Loading users...</div>
            ) : (
              <>
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">User Details</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">University / Year</th>
                      <th className="px-6 py-4">Streak</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-xs">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          <p>{u.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                            u.role === 'admin' ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30' :
                            u.role === 'teacher' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30' :
                            u.role === 'mentor' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' :
                            'bg-blue-50 dark:bg-blue-955/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'
                          }`}>{u.role}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                          {u.university ? `${u.university} (${u.yearLevel || 'Y1'})` : '-'}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                          {u.streakDays}d
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => openUserEdit(u)} className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700 text-slate-650 dark:text-slate-300 rounded-lg transition-colors"><Edit2 size={12} /></button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)} 
                            disabled={currentUser.id === u.id}
                            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-955/40 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors disabled:opacity-30"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card-based view */}
              <div className="space-y-4 md:hidden">
                {filteredUsers.map(u => (
                  <div key={u.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{u.name}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{u.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30' :
                        u.role === 'teacher' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30' :
                        u.role === 'mentor' ? 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' :
                        'bg-blue-50 dark:bg-blue-955/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'
                      }`}>{u.role}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/40 dark:border-slate-850/60">
                      <div>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider">Univ / Year</span>
                        <span className="text-xs text-slate-650 dark:text-slate-300 font-bold">{u.university ? `${u.university} (${u.yearLevel || 'Y1'})` : '-'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider">Streak</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{u.streakDays}d</span>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200/40 dark:border-slate-850/60">
                      <button onClick={() => openUserEdit(u)} className="px-3 py-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center space-x-1">
                        <Edit2 size={12} /> <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id)} 
                        disabled={currentUser.id === u.id}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-955/40 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-450 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 disabled:opacity-30"
                      >
                        <Trash2 size={12} /> <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: Curriculum CRUD */}
        {activeTab === 'lessons' && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Filter lessons..."
                  value={lessonSearch}
                  onChange={(e) => setLessonSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white transition-all shadow-sm"
                />
                <BookOpen size={14} className="absolute left-3 top-3 text-slate-400" />
              </div>
              <button 
                onClick={openLessonCreate}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center shadow-md shadow-blue-900/10 dark:shadow-none"
              >
                <Plus size={14} className="mr-1.5" /> Add Lesson
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold">Loading curriculum...</div>
            ) : (
              <>
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Lesson Details</th>
                      <th className="px-6 py-4">Pillar</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-xs">
                    {filteredLessons.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          <p>{l.title}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">ID: {l.id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                            l.pillar === 'career' ? 'bg-blue-50 dark:bg-blue-955/20 text-blue-800 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30' :
                            l.pillar === 'entrepreneur' ? 'bg-yellow-50 dark:bg-yellow-955/20 text-yellow-800 dark:text-yellow-450 border border-yellow-100 dark:border-yellow-900/30' :
                            l.pillar === 'english' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700' :
                            'bg-indigo-50 dark:bg-indigo-955/20 text-indigo-850 dark:text-indigo-405 border border-indigo-100 dark:border-indigo-900/30'
                          }`}>{l.pillar}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-505 dark:text-slate-400 font-semibold">
                          {l.duration} mins
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => openLessonEdit(l)} className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700 text-slate-650 dark:text-slate-300 rounded-lg transition-colors"><Edit2 size={12} /></button>
                          <button onClick={() => handleDeleteLesson(l.id)} className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-955/40 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card-based view */}
              <div className="space-y-4 md:hidden">
                {filteredLessons.map(l => (
                  <div key={l.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{l.title}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">ID: {l.id}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                        l.pillar === 'career' ? 'bg-blue-50 dark:bg-blue-955/20 text-blue-800 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30' :
                        l.pillar === 'entrepreneur' ? 'bg-yellow-50 dark:bg-yellow-955/20 text-yellow-800 dark:text-yellow-450 border border-yellow-100 dark:border-yellow-900/30' :
                        l.pillar === 'english' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700' :
                        'bg-indigo-50 dark:bg-indigo-955/20 text-indigo-850 dark:text-indigo-405 border border-indigo-100 dark:border-indigo-900/30'
                      }`}>{l.pillar}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/40 dark:border-slate-850/60">
                      <div>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider">Duration</span>
                        <span className="text-xs text-slate-655 dark:text-slate-400 font-bold">{l.duration} mins</span>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => openLessonEdit(l)} className="px-3 py-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center space-x-1">
                          <Edit2 size={12} /> <span>Edit</span>
                        </button>
                        <button onClick={() => handleDeleteLesson(l.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-955/40 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-all flex items-center space-x-1">
                          <Trash2 size={12} /> <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        )}

        {/* TAB 4: Announcements CRUD */}
        {activeTab === 'announcements' && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">System Broadcasts</h3>
              <button 
                onClick={openAnnCreate}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center shadow-md shadow-blue-900/10 dark:shadow-none"
              >
                <Plus size={14} className="mr-1.5" /> Publish Announcement
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold">Loading broadcasts...</div>
            ) : (
              <div className="space-y-4">
                {announcementsList.length === 0 ? (
                  <p className="text-center text-slate-400 dark:text-slate-500 py-6 font-medium text-xs">No global announcements recorded.</p>
                ) : (
                  announcementsList.map(ann => (
                    <div key={ann.id} className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-start justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                      <div className="space-y-1.5 max-w-[80%]">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">{ann.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{ann.content}</p>
                        <p className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">{ann.date} • Author: {ann.author}</p>
                      </div>
                      <div className="flex space-x-1.5 shrink-0">
                        <button onClick={() => openAnnEdit(ann)} className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/55 dark:border-slate-700 text-slate-650 dark:text-slate-300 rounded-lg"><Edit2 size={12} /></button>
                        <button onClick={() => handleDeleteAnn(ann.id)} className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-955/40 border border-red-100 dark:border-red-900/30 text-red-655 dark:text-red-400 rounded-lg"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Submissions CRUD */}
        {activeTab === 'submissions' && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Filter submissions by scholar/lesson..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white transition-all shadow-sm"
                />
                <FileText size={14} className="absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold">Loading student submissions...</div>
            ) : (
              <>
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Scholar</th>
                      <th className="px-6 py-4">Curriculum Module</th>
                      <th className="px-6 py-4">File Submission</th>
                      <th className="px-6 py-4">Grading Score</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-xs">
                    {filteredSubs.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          <p>{s.scholar?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{s.scholar?.email}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                          {s.lesson?.title || s.lessonId}
                        </td>
                        <td className="px-6 py-4">
                          {s.fileUrl ? (
                            <a href={s.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-900 dark:text-yellow-455 hover:underline font-bold text-[10px] uppercase tracking-wider flex items-center">
                              <FileText size={12} className="mr-1" /> View Upload
                            </a>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-505">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                            s.status === 'graded' ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30' : 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30'
                          }`}>
                            {s.status === 'graded' ? `${s.score} / 100` : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => openGradeModal(s)} className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-755 text-slate-650 dark:text-slate-300 rounded-lg transition-colors flex items-center space-x-1 text-[10px] font-bold">
                            <ListTodo size={11} />
                            <span>Grade</span>
                          </button>
                          <button onClick={() => handleDeleteSub(s.id)} className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-955/40 border border-red-100 dark:border-red-900/30 text-red-655 dark:text-red-450 rounded-lg transition-colors"><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card-based view */}
              <div className="space-y-4 md:hidden">
                {filteredSubs.map(s => (
                  <div key={s.id} className="bg-slate-50 dark:bg-slate-955 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-805 dark:text-white text-sm">{s.scholar?.name || 'Unknown'}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{s.scholar?.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                        s.status === 'graded' ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30' : 'bg-orange-50 dark:bg-orange-955/20 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30'
                      }`}>
                        {s.status === 'graded' ? `${s.score} / 100` : 'Pending'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/40 dark:border-slate-850/60">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider">Module</span>
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">{s.lesson?.title || s.lessonId}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/40 dark:border-slate-850/60">
                      <div>
                        {s.fileUrl ? (
                          <a href={s.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-900 dark:text-yellow-450 hover:underline font-bold text-[10px] uppercase tracking-wider flex items-center">
                            <FileText size={12} className="mr-1" /> View Upload
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => openGradeModal(s)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-750 text-slate-650 dark:text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center space-x-1">
                          <ListTodo size={12} /> <span>Grade</span>
                        </button>
                        <button onClick={() => handleDeleteSub(s.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-955/40 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-all flex items-center space-x-1">
                          <Trash2 size={12} /> <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* --- CRUD MODALS --- */}      {/* USER MODAL */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUserModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-4 sm:p-6 md:p-8 max-w-lg md:max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 sm:space-y-6 text-slate-800 dark:text-white">
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">{userEditing ? 'Edit User Profile' : 'Create User Account'}</h3>
                <button onClick={() => setIsUserModalOpen(false)} className="p-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-300"><X size={16} /></button>
              </div>

              {modalError && (
                <div className="bg-red-50 dark:bg-red-955/20 text-red-655 dark:text-red-450 border border-red-100 dark:border-red-900/30 p-3.5 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-2 animate-shake">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Full Name</label>
                  <input type="text" required placeholder="e.g. John Doe" value={userName} onChange={e => setUserName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Email Address</label>
                    <input type="email" required placeholder="name@generationrise.org" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">{userEditing ? 'Password (Leave Blank to Keep)' : 'Password'}</label>
                    <input type="password" required={!userEditing} placeholder="••••••••" value={userPassword} onChange={e => setUserPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Role / Level</label>
                    <select value={userRoleField} onChange={e => setUserRoleField(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white">
                      <option value="scholar">Scholar</option>
                      <option value="mentor">Mentor</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Streak Days (Simulate)</label>
                    <input type="number" value={userStreak} onChange={e => setUserStreak(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white" />
                  </div>
                </div>

                {userRoleField === 'scholar' && (
                  <div className="space-y-4 border-t border-slate-50 dark:border-slate-800 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">University</label>
                        <input type="text" placeholder="e.g. UR Huye Campus" value={userUniv} onChange={e => setUserUniv(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Year Level</label>
                        <input type="text" placeholder="e.g. Year 2 Scholar" value={userYear} onChange={e => setUserYear(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Assigned Cohort</label>
                      <select 
                        value={userCohortId} 
                        onChange={e => setUserCohortId(e.target.value)} 
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white"
                      >
                        <option value="">No Cohort (Unassigned)</option>
                        {cohortsList.map(cohort => (
                          <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-6 justify-end border-t border-slate-50 dark:border-slate-800">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-900 dark:bg-slate-800 hover:bg-blue-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase flex items-center transition-colors"><Save size={12} className="mr-1.5" /> Save User</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LESSON MODAL */}
      <AnimatePresence>
        {isLessonModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLessonModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-4 sm:p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 sm:space-y-6 text-slate-800 dark:text-white">
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">{lessonEditing ? 'Edit Curriculum Lesson' : 'Create Curriculum Lesson'}</h3>
                <button onClick={() => setIsLessonModalOpen(false)} className="p-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-300"><X size={16} /></button>
              </div>

              {modalError && (
                <div className="bg-red-50 dark:bg-red-955/20 text-red-655 dark:text-red-450 border border-red-100 dark:border-red-900/30 p-3.5 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-2 animate-shake">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleLessonSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Lesson ID</label>
                    <input type="text" required disabled={!!lessonEditing} placeholder="e.g. entrepreneur-5" value={lessonId} onChange={e => setLessonId(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white disabled:opacity-40" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Duration (mins)</label>
                    <input type="number" required placeholder="30" value={lessonDuration} onChange={e => setLessonDuration(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Title</label>
                  <input type="text" required placeholder="e.g. Market Research Fundamentals" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Pillar Category</label>
                    <select value={lessonPillar} onChange={e => setLessonPillar(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white">
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
                      onChange={e => setLessonCohortId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white"
                    >
                      <option value="">All Cohorts (Global)</option>
                      {cohortsList.map(cohort => (
                        <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Description</label>
                  <textarea rows="2" placeholder="Syllabus module specifications..." value={lessonDesc} onChange={e => setLessonDesc(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white" />
                </div>

                {/* Formatted Class Study Notes Editor */}
                <div className="space-y-2 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">Formatted Class Study Notes</label>
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => setPreviewNotesTab(false)}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-lg ${!previewNotesTab ? 'bg-blue-900 dark:bg-slate-800 text-white' : 'text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                      >
                        Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewNotesTab(true)}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-lg ${previewNotesTab ? 'bg-blue-900 dark:bg-slate-800 text-white' : 'text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                      >
                        Live Preview
                      </button>
                    </div>
                  </div>

                  {!previewNotesTab ? (
                    <div className="space-y-2">
                      {/* Editor Toolbars */}
                      <div className="flex flex-wrap gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                        {[
                          { label: 'Bold', action: () => formatNotesText('<strong>', '</strong>') },
                          { label: 'Italic', action: () => formatNotesText('<em>', '</em>') },
                          { label: 'H1', action: () => formatNotesText('<h1 className="text-xl font-bold text-blue-955 mt-4 mb-2">', '</h1>') },
                          { label: 'H2', action: () => formatNotesText('<h2 className="text-base font-bold text-slate-850 mt-3 mb-1.5">', '</h2>') },
                          { label: 'Bullet List', action: () => formatNotesText('<ul className="list-disc pl-5 space-y-1"><li>', '</li></ul>') },
                          { label: 'Link', action: () => {
                            const url = prompt('Enter link URL (e.g. https://google.com):');
                            if (url) formatNotesText(`<a href="${url}" target="_blank" className="text-blue-900 underline font-bold">`, '</a>');
                          }}
                        ].map((btn, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={btn.action}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-150 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 text-[10px] font-bold rounded-md transition-colors text-slate-800 dark:text-slate-200"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        id="lesson-notes-textarea"
                        value={lessonNotes}
                        onChange={(e) => setLessonNotes(e.target.value)}
                        placeholder="Write detailed formatted notes, guidelines, or summaries for scholars here..."
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 h-32 text-slate-805 dark:text-white"
                      />
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 min-h-[140px] text-xs font-sans leading-relaxed text-slate-650 dark:text-slate-300 space-y-4 overflow-y-auto max-h-[180px]">
                      {lessonNotes ? (
                        <div dangerouslySetInnerHTML={{ __html: lessonNotes }} />
                      ) : (
                        <p className="text-slate-400 dark:text-slate-500 italic">No notes text written yet.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Cover Photo upload section */}
                <div className="space-y-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">Lesson Cover Photo</label>
                  
                  {lessonCoverUrl && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                      <img src={lessonCoverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setLessonCoverUrl('')}
                        className="absolute top-2 right-2 p-1.5 bg-red-650 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md"
                        title="Remove cover photo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <label className="flex-1 flex items-center justify-center p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:border-blue-900 dark:hover:border-yellow-450 transition-all cursor-pointer">
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
                      value={lessonCoverUrl}
                      onChange={(e) => setLessonCoverUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Handout document upload section */}
                <div className="space-y-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest block">Handouts & Reference Documents</label>
                  
                  {/* List of uploaded handouts */}
                  {lessonResources.length > 0 && (
                    <div className="space-y-2">
                      {lessonResources.map((res, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs">
                          <div className="flex items-center space-x-2">
                            <FileText size={14} className="text-blue-900 dark:text-yellow-450 shrink-0" />
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[280px]">{res.name}</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500">({res.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeResource(idx)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-650 rounded-lg transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* File input selector */}
                  <div className="flex items-center space-x-3">
                    <label className="flex-1 flex items-center justify-center p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:border-blue-900 dark:hover:border-yellow-450 transition-all cursor-pointer">
                      <input 
                        type="file" 
                        onChange={handleResourceUpload}
                        className="hidden" 
                      />
                      <div className="flex items-center space-x-1.5 text-xs text-slate-605 dark:text-slate-400 font-bold">
                        <Upload size={14} className="text-slate-400" />
                        <span>{uploadingFile ? 'Uploading Handout...' : 'Upload Reference Document'}</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Video section & restrictions */}
                <div className="space-y-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest block">Video Source Link / Embed</label>
                    <textarea 
                      placeholder="Paste YouTube Link, direct MP4 link, or raw Iframe embed code here..."
                      value={lessonVideo}
                      onChange={(e) => setLessonVideo(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-805 dark:text-white"
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
                            lessonVideoRestrictions[rest.key] ? 'bg-blue-900 dark:bg-yellow-450 border-blue-900 dark:border-yellow-450 text-white dark:text-slate-950' : 'border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 text-transparent'
                          }`}>
                            <Check size={10} strokeWidth={4} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-650 dark:text-slate-400">{rest.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-6 justify-end border-t border-slate-50 dark:border-slate-800">
                  <button type="button" onClick={() => setIsLessonModalOpen(false)} className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                  <button type="submit" disabled={uploadingFile} className="px-5 py-2.5 bg-blue-900 dark:bg-slate-800 hover:bg-blue-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase flex items-center disabled:opacity-50 transition-colors"><Save size={12} className="mr-1.5" /> Save Lesson</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ANNOUNCEMENT MODAL */}
      <AnimatePresence>
        {isAnnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAnnModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-4 sm:p-6 md:p-8 max-w-lg md:max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 sm:space-y-6 text-slate-800 dark:text-white">
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">{annEditing ? 'Edit Broadcast' : 'Create Global Broadcast'}</h3>
                <button onClick={() => setIsAnnModalOpen(false)} className="p-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-300"><X size={16} /></button>
              </div>

              {modalError && (
                <div className="bg-red-50 dark:bg-red-955/20 text-red-655 dark:text-red-400 border border-red-100 dark:border-red-900/30 p-3.5 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-2 animate-shake">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAnnSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Broadcast Title</label>
                  <input type="text" required placeholder="e.g. Term Projects Extensions" value={annTitle} onChange={e => setAnnTitle(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Broadcast Content</label>
                  <textarea rows="4" required placeholder="Input detailed message contents..." value={annContent} onChange={e => setAnnContent(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-850 dark:text-white" />
                </div>

                <div className="flex space-x-3 pt-6 justify-end border-t border-slate-50 dark:border-slate-800">
                  <button type="button" onClick={() => setIsAnnModalOpen(false)} className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-900 dark:bg-slate-800 hover:bg-blue-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase flex items-center transition-colors"><Megaphone size={12} className="mr-1.5" /> Publish Broadcast</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUBMISSION GRADING MODAL */}
      <AnimatePresence>
        {isGradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGradeModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-4 sm:p-6 md:p-8 max-w-lg md:max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 sm:space-y-6 text-slate-800 dark:text-white">
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Grade Homework Submission</h3>
                <button onClick={() => setIsGradeModalOpen(false)} className="p-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-300"><X size={16} /></button>
              </div>

              {modalError && (
                <div className="bg-red-50 dark:bg-red-955/20 text-red-655 dark:text-red-450 border border-red-100 dark:border-red-900/30 p-3.5 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-2 animate-shake">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="p-4 bg-slate-50 dark:bg-slate-855 rounded-xl text-xs space-y-1.5 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white">
                <p><span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[9px] mr-2">Scholar:</span> {selectedSub?.scholar?.name}</p>
                <p><span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[9px] mr-2">Task Module:</span> {selectedSub?.lesson?.title}</p>
                {selectedSub?.fileUrl && (
                  <p><span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[9px] mr-2">File Link:</span> <a href={selectedSub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-900 dark:text-yellow-450 underline font-bold">Open Attachment</a></p>
                )}
              </div>

              <form onSubmit={handleGradeSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Numeric Score (0 - 100)</label>
                  <input type="number" min="0" max="100" required placeholder="85" value={subScore} onChange={e => setSubScore(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Feedback / Remarks</label>
                  <textarea rows="3" placeholder="Enter academic feedback here..." value={subFeedback} onChange={e => setSubFeedback(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-455 focus:bg-white dark:focus:bg-slate-900 text-slate-850 dark:text-white" />
                </div>

                <div className="flex space-x-3 pt-6 justify-end border-t border-slate-50 dark:border-slate-800">
                  <button type="button" onClick={() => setIsGradeModalOpen(false)} className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-900 dark:bg-slate-800 hover:bg-blue-800 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-xs uppercase flex items-center transition-colors"><CheckCircle2 size={12} className="mr-1.5" /> Submit Grade</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
    </>
  );
}
