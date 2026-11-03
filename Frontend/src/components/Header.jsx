import React, { useState } from 'react';
import { Bell, PanelLeftClose, PanelLeftOpen, User, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';

export default function Header({ 
  currentUser, 
  userRole, 
  currentView,
  isDesktopSidebarOpen, 
  toggleDesktopSidebar, 
  setCurrentView, 
  onLogout,
  isDarkMode,
  setIsDarkMode
}) {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Retrieve user specifics or default back to placeholders
  const name = currentUser?.name || 'User';
  const roleName = userRole.toUpperCase() + ' PORTAL';
  const initials = currentUser?.initials || name.slice(0, 2).toUpperCase();
  const detailLabel = currentUser?.yearLevel || 'Active Participant';
  const viewLabel = ({
    dashboard: 'Dashboard',
    catalog: 'Learning catalog',
    lesson: 'Lesson desk',
    tasks: 'Tasks & submissions',
    chat: 'Mentor chat',
    profile: 'My profile',
    scholars: 'Scholar roster',
    grading: 'Grading',
    cohorts: 'Cohorts',
    curriculum: 'Curriculum',
    announcements: 'Announcements',
    users: 'User directory',
    settings: 'System settings',
    programs: 'Program suite',
    reports: 'Reports',
    'academic-results': 'Academic results',
    'friendly-weeks': 'Friendly Weeks',
    mentorship: 'Mentorship',
    assistance: 'Support & assistance',
  })[currentView] || roleName;

  return (
    <header className={`rise-header sticky top-0 z-10 flex items-center justify-between h-16 px-4 lg:px-6 backdrop-blur-md transition-all duration-200 border-b shrink-0 ${
      isDarkMode ? 'dark' : ''
    }`}>
      <div className="flex items-center">
        {/* Desktop Toggle */}
        <button 
          onClick={toggleDesktopSidebar}
          className="rise-header-toggle mr-4 p-2 rounded-lg hidden lg:block transition-colors"
        >
          {isDesktopSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
        <div className="lg:hidden flex items-center space-x-2">
          <div className="rise-brand-mark flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border p-1.5">
            <img src="/rise-logo.png" alt="Rise Her" className="h-full w-full object-contain logo-sharp shrink-0" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display font-bold text-sm text-blue-900">Rise Her</h1>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Generation Rise Foundation</span>
          </div>
        </div>
        <div className="hidden lg:flex ml-2 items-center gap-2 text-[11px]">
          <span className="text-slate-500">Workspace</span>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-800">{viewLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Theme Toggle */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="rise-header-toggle lg:hidden p-2 rounded-lg transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Real Notification Bell */}
        <NotificationBell />
        
        {/* Profile Dropdown Corner */}
        <div className={`flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l relative`}>
          <button 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} 
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="hidden sm:block text-right">
              <p className={`text-xs font-bold leading-tight transition-colors ${
                isDarkMode ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-blue-900'
              }`}>
                {name}
              </p>
              <p className={`text-[10px] mt-0.5 leading-none ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {detailLabel}
              </p>
            </div>
            <div className="rise-header-avatar flex items-center justify-center w-10 h-10 rounded-xl font-bold border shadow-sm group-hover:ring-2 ring-yellow-400 transition-all text-sm shrink-0 overflow-hidden">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isProfileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute right-0 top-full mt-3 w-48 rounded-2xl border shadow-lg py-1.5 z-50 overflow-hidden transition-colors ${
                  isDarkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-100'
                }`}
              >
                <button
                  onClick={() => {
                    setCurrentView('profile');
                    window.location.hash = '#/profile';
                    setIsProfileDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-xs font-semibold transition-colors flex items-center space-x-2.5 ${
                    isDarkMode ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-900'
                  }`}
                >
                  <User size={14} className="text-slate-400" />
                  <span>View Profile</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentView('settings');
                    window.location.hash = '#/settings';
                    setIsProfileDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-xs font-semibold transition-colors flex items-center space-x-2.5 ${
                    isDarkMode ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-900'
                  }`}
                >
                  <Settings size={14} className="text-slate-400" />
                  <span>Settings</span>
                </button>
                <div className={`border-t my-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`} />
                <button
                  onClick={() => {
                    onLogout();
                    setIsProfileDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-xs font-bold text-red-650 transition-colors flex items-center space-x-2.5 ${
                    isDarkMode ? 'hover:bg-red-950/20' : 'hover:bg-red-50'
                  }`}
                >
                  <LogOut size={14} className="text-red-500" />
                  <span>Log Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
