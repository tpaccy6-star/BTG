import React, { useState } from 'react';
import { 
  LogOut, 
  User, 
  Settings, 
  Shield, 
  Upload, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Camera 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileView({ currentUser, onLogout, onUpdateUser }) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Profile Details Edit State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editUniversity, setEditUniversity] = useState(currentUser?.university || '');
  const [editYearLevel, setEditYearLevel] = useState(currentUser?.yearLevel || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editMessage, setEditMessage] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });

  const role = currentUser?.role || 'scholar';
  const isAdmin = role === 'admin';

  const roleDisplay = {
    scholar: 'Scholar',
    beneficiary: 'Scholar',
    mentor: 'Lead Mentor',
    teacher: 'Faculty Educator',
    staff: 'Operations Staff',
    admin: 'System Administrator'
  }[role] || 'Member';

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
          email: editEmail.trim(),
          university: editUniversity.trim(),
          yearLevel: editYearLevel.trim(),
          phone: editPhone.trim(),
          bio: editBio.trim()
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
        setUploadMessage('Profile portrait updated successfully!');
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: '', message: '' });

    if (!currentPassword) {
      setPasswordStatus({ type: 'error', message: 'Please enter your current password.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordStatus({ 
          type: 'success', 
          message: 'Password updated successfully! Next time you log in, please use your new password.' 
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(data.error || 'Failed to change password.');
      }
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const completedTasksCount = currentUser?.submissions?.filter(s => s.status === 'completed' || s.status === 'graded')?.length || 0;
  const initials = currentUser?.initials || currentUser?.name?.slice(0, 2).toUpperCase() || 'AJ';
  const name = currentUser?.name || 'User';
  const streak = currentUser?.streakDays !== undefined ? currentUser.streakDays : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl font-black text-blue-955 dark:text-white tracking-tight">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-base sm:text-lg mt-1">
          A personal space to review your credentials, customize your profile portrait, and secure your account credentials within Rise Her.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card Left: Portrait & Summary */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center h-fit">
          <div className="relative group mb-4">
            <div className="w-28 h-28 rounded-[2rem] bg-blue-900 dark:bg-slate-850 text-yellow-400 text-3xl font-black flex items-center justify-center shadow-xl shadow-blue-900/10 border-4 border-white dark:border-slate-900 ring-4 ring-yellow-400/20 overflow-hidden">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>

            {/* Quick Camera Overlay Label */}
            <label className="absolute -bottom-2 -right-2 p-2.5 bg-yellow-450 hover:bg-yellow-400 text-slate-950 rounded-2xl shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95 border-2 border-white dark:border-slate-900" title={currentUser?.avatarUrl ? "Change photo" : "Upload photo"}>
              <Camera size={16} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Picture Uploader Controls */}
          <div className="mb-4">
            <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-650 dark:text-slate-300 hover:text-blue-900 dark:hover:text-yellow-450 transition-all cursor-pointer">
              <Upload size={12} />
              <span>{uploading ? 'Uploading photo...' : currentUser?.avatarUrl ? 'Change photo' : 'Upload photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
            {uploadMessage && (
              <p className={`text-[10px] font-bold mt-2 ${uploadMessage.includes('error') ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {uploadMessage}
              </p>
            )}
          </div>

          <h2 className="text-2xl font-black text-blue-955 dark:text-white">{name}</h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
            {currentUser?.university || (role === 'mentor' ? 'Mentorship Faculty' : 'Rise Her Platform')}
          </p>
          <span className="mt-3 px-3.5 py-1.5 bg-yellow-100 dark:bg-yellow-950/20 text-yellow-750 dark:text-yellow-450 font-black text-[10px] rounded-full uppercase tracking-wider border border-yellow-200/50 dark:border-yellow-900/30">
            {currentUser?.yearLevel || roleDisplay}
          </span>

          <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-6" />

          {/* Role-Specific Stats Summary */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {role === 'scholar' || role === 'beneficiary' ? (
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tasks Done</p>
                <p className="text-xl font-black text-blue-955 dark:text-white mt-1">{completedTasksCount}</p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Platform Role</p>
                <p className="text-sm font-black text-blue-955 dark:text-white mt-2 truncate">{roleDisplay}</p>
              </div>
            )}
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Streak</p>
              <p className="text-xl font-black text-blue-955 dark:text-white mt-1">{streak} Days</p>
            </div>
          </div>

          <button 
            onClick={onLogout} 
            className="mt-8 w-full py-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-955/40 text-red-600 dark:text-red-450 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-2 border border-red-200/20 dark:border-red-900/30 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Right Side: Editable Details + Change Password + Preferences */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card 1: Editable Profile Information */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-blue-955 dark:text-white tracking-tight">Personal & Account Information</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">Keep your identification and institutional details updated.</p>
              </div>
              <button
                onClick={() => {
                  if (isEditingInfo) {
                    handleSaveInfo();
                  } else {
                    setEditName(currentUser?.name || '');
                    setEditEmail(currentUser?.email || '');
                    setEditUniversity(currentUser?.university || '');
                    setEditYearLevel(currentUser?.yearLevel || '');
                    setEditPhone(currentUser?.phone || '');
                    setEditBio(currentUser?.bio || '');
                    setEditMessage('');
                    setIsEditingInfo(true);
                  }
                }}
                disabled={savingInfo}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-850 dark:bg-yellow-450 dark:hover:bg-yellow-400 text-white dark:text-slate-950 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isEditingInfo ? (savingInfo ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
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
                      placeholder="e.g. Sarah Miller"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. mentor@generationrise.org"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">University / Department</label>
                    <input
                      type="text"
                      value={editUniversity}
                      onChange={(e) => setEditUniversity(e.target.value)}
                      placeholder="e.g. University of Rwanda / Mentorship Team"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Title / Specialization</label>
                    <input
                      type="text"
                      value={editYearLevel}
                      onChange={(e) => setEditYearLevel(e.target.value)}
                      placeholder="e.g. Lead Mentor / Senior Advisor"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Contact Phone Number</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. +250 788 123 456"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Biography & Focus Summary</label>
                    <textarea
                      rows={3}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Share a short bio, office hours, or mentorship focus..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white resize-none"
                    />
                  </div>
                </div>

                {editMessage && (
                  <p className={`text-xs font-bold ${editMessage.includes('Error') || editMessage.includes('cannot') ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {editMessage}
                  </p>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Email Address', val: currentUser?.email },
                  { label: 'Role & Authority', val: roleDisplay },
                  { label: 'University / Institution', val: currentUser?.university || 'Generation Rise Foundation' },
                  { label: 'Title / Level', val: currentUser?.yearLevel || 'Active Participant' },
                  { label: 'Contact Phone', val: currentUser?.phone || 'Not specified' },
                  { label: 'Mentorship / Bio Summary', val: currentUser?.bio || 'Empowering scholars through leadership, mentorship, and academic growth.', full: true }
                ].map((detail, i) => (
                  <div key={i} className={`flex flex-col ${detail.full ? 'md:col-span-2' : ''}`}>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{detail.label}</span>
                    <span className="text-sm font-bold text-blue-955 dark:text-white mt-1 break-words">{detail.val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Password Change (Everyone except Admin) */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-50 dark:border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-yellow-450/10 text-blue-900 dark:text-yellow-450">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-blue-955 dark:text-white tracking-tight">
                  {isAdmin ? 'System Credentials' : 'Change Password'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  {isAdmin 
                    ? 'Security access rules for administrative accounts.' 
                    : 'Personalize your credentials by updating your account password.'}
                </p>
              </div>
            </div>

            {isAdmin ? (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex items-start space-x-3">
                <Shield size={20} className="text-blue-900 dark:text-yellow-450 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Master Administrator Protection</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Master Administrator credentials are securely governed by infrastructure access policies and cannot be modified from the user portal.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Current Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                        required
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        required
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {passwordStatus.message && (
                  <div className={`p-3.5 rounded-xl flex items-center space-x-2.5 text-xs font-semibold ${
                    passwordStatus.type === 'success' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30' 
                      : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/30'
                  }`}>
                    {passwordStatus.type === 'success' ? (
                      <CheckCircle2 size={16} className="shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0" />
                    )}
                    <span>{passwordStatus.message}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-850 dark:bg-yellow-450 dark:hover:bg-yellow-400 text-white dark:text-slate-950 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {passwordLoading ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card 3: Communication Preferences */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-blue-955 dark:text-white tracking-tight">Communication Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-blue-955 dark:text-white">Email Correspondence</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Receive weekly updates, announcements, and key project notifications via email.</p>
                </div>
                <button
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`w-12 h-7 rounded-full transition-all duration-300 relative cursor-pointer ${
                    emailAlerts ? 'bg-blue-900 dark:bg-yellow-450' : 'bg-slate-200 dark:bg-slate-800'
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
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Be alerted immediately for direct messages, broadcasts, and system updates.</p>
                </div>
                <button
                  onClick={() => setPushAlerts(!pushAlerts)}
                  className={`w-12 h-7 rounded-full transition-all duration-300 relative cursor-pointer ${
                    pushAlerts ? 'bg-blue-900 dark:bg-yellow-450' : 'bg-slate-200 dark:bg-slate-800'
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
