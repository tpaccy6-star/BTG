import React, { useState } from 'react';
import { LogOut, User, Settings, Shield, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileView({ currentUser, onLogout, onUpdateUser }) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  const handleSaveInfo = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      setEditMessage('Name and email cannot be empty.');
      return;
    }

    setSavingInfo(true);
    setEditMessage('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setEditMessage('Profile details updated successfully!');
        setIsEditingInfo(false);
        if (onUpdateUser) {
          await onUpdateUser();
        }
      } else {
        throw new Error(data.error || 'Failed to update details.');
      }
    } catch (err) {
      setEditMessage(`Error: ${err.message}`);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const fileToUpload = e.target.files[0];
    if (!fileToUpload) return;
    
    setUploading(true);
    setUploadMessage('');

    const formData = new FormData();
    formData.append('avatar', fileToUpload);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setUploadMessage('Profile picture updated!');
        if (onUpdateUser) {
          await onUpdateUser();
        }
      } else {
        throw new Error(data.error || 'Failed to upload picture.');
      }
    } catch (err) {
      setUploadMessage(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Compute scholar stats
  const attendanceRecords = currentUser?.attendanceRecords || [];
  const totalSessions = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
  const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 92;

  const initials = currentUser?.initials || currentUser?.name?.slice(0, 2).toUpperCase() || 'AJ';
  const name = currentUser?.name || 'Alex Johnson';
  const streak = currentUser?.streakDays !== undefined ? currentUser.streakDays : 14;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.98 }} 
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl font-black text-blue-955 dark:text-white tracking-tight">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1">Manage your account settings, credentials, and achievements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Card Left */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center h-fit">
          <div className="w-24 h-24 rounded-[2rem] bg-blue-900 dark:bg-slate-850 text-yellow-400 text-3xl font-black flex items-center justify-center shadow-xl shadow-blue-900/10 mb-4 border-4 border-white dark:border-slate-900 ring-4 ring-yellow-400/20 overflow-hidden relative">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>

          {/* Picture Uploader */}
          <div className="mb-6">
            <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-150 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-650 dark:text-slate-300 hover:text-blue-900 dark:hover:text-yellow-450 transition-all cursor-pointer">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden" 
              />
              <Upload size={10} />
              <span>{uploading ? 'Uploading...' : 'Upload Picture'}</span>
            </label>
            {uploadMessage && (
              <p className={`text-[10px] font-bold mt-1.5 ${uploadMessage.includes('error') ? 'text-red-500' : 'text-blue-900 dark:text-yellow-450'}`}>
                {uploadMessage}
              </p>
            )}
          </div>

          <h2 className="text-2xl font-black text-blue-955 dark:text-white">{name}</h2>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">{currentUser?.university || 'Scholar University'}</p>
          <span className="mt-4 px-3.5 py-1.5 bg-yellow-100 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-455 font-black text-[10px] rounded-full uppercase tracking-wider border border-yellow-200/50 dark:border-yellow-900/30">
            {currentUser?.yearLevel || 'Year 2 Scholar'}
          </span>

          <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-8" />

          {/* Streaks & Progress Summary */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Attendance</p>
              <p className="text-xl font-black text-blue-955 dark:text-white mt-1">{attendanceRate}%</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Streak</p>
              <p className="text-xl font-black text-blue-955 dark:text-white mt-1">{streak} Days</p>
            </div>
          </div>

          <button onClick={onLogout} className="mt-8 w-full py-4 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-955/40 text-red-600 dark:text-red-450 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-2 border border-red-200/20 dark:border-red-900/30">
            <LogOut size={16} />
            <span>Log Out Portal</span>
          </button>
        </div>

        {/* Details & Settings Right */}
        <div className="lg:col-span-2 space-y-8">
          {/* Academic Info */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
              <h3 className="text-xl font-black text-blue-955 dark:text-white tracking-tight">Academic Scholarship Details</h3>
              <button 
                onClick={() => {
                  if (isEditingInfo) {
                    handleSaveInfo();
                  } else {
                    setEditName(currentUser?.name || '');
                    setEditEmail(currentUser?.email || '');
                    setEditMessage('');
                    setIsEditingInfo(true);
                  }
                }}
                disabled={savingInfo}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 dark:bg-slate-850 dark:hover:bg-slate-750 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {isEditingInfo ? (savingInfo ? 'Saving...' : 'Save Info') : 'Edit Info'}
              </button>
            </div>
            
            {isEditingInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Full Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Email Address</label>
                    <input 
                      type="email" 
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                {editMessage && (
                  <p className={`text-[10px] font-bold ${editMessage.includes('Error') || editMessage.includes('cannot') ? 'text-red-500' : 'text-blue-900 dark:text-yellow-455'}`}>{editMessage}</p>
                )}
                <div className="flex space-x-3">
                  <button 
                    type="button"
                    onClick={() => setIsEditingInfo(false)}
                    className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 text-slate-655 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Ecosystem Email', val: currentUser?.email },
                  { label: 'Scholar Role / Authority', val: currentUser?.role?.toUpperCase() },
                  { label: 'Matriculation Year', val: '2025' },
                  { label: 'NGO Compliance Status', val: 'Fully Compliant' }
                ].map((detail, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{detail.label}</span>
                    <span className="text-sm font-bold text-blue-955 dark:text-white mt-1">{detail.val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification settings */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-blue-955 dark:text-white tracking-tight">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-blue-955 dark:text-white">Email Bulletins</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Receive weekly progress and grading bulletins from mentor Sarah.</p>
                </div>
                <button 
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`w-12 h-7 rounded-full transition-all duration-300 relative ${
                    emailAlerts ? 'bg-blue-900 dark:bg-yellow-455' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white dark:bg-slate-950 rounded-full shadow absolute top-1 transition-all duration-300 ${
                    emailAlerts ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-blue-955 dark:text-white">Push Notifications</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Receive live alerts when homework deadlines are updated.</p>
                </div>
                <button 
                  onClick={() => setPushAlerts(!pushAlerts)}
                  className={`w-12 h-7 rounded-full transition-all duration-300 relative ${
                    pushAlerts ? 'bg-blue-900 dark:bg-yellow-455' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white dark:bg-slate-950 rounded-full shadow absolute top-1 transition-all duration-300 ${
                    pushAlerts ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
