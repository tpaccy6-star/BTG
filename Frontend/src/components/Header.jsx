import React, { useState } from 'react';
import { Bell, PanelLeftClose, PanelLeftOpen, User, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';

export default function Header({ 
  currentUser, 
  userRole, 
  isDesktopSidebarOpen, 
  toggleDesktopSidebar, 
  setCurrentView, 
  onLogout,
  isDarkMode
}) {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Retrieve user specifics or default back to placeholders
  const name = currentUser?.name || 'User';
  const roleName = userRole.toUpperCase() + ' PORTAL';
  const initials = currentUser?.initials || name.slice(0, 2).toUpperCase();
  const detailLabel = currentUser?.yearLevel || 'Active Participant';

  return (
    <header className={`sticky top-0 z-10 flex items-center justify-between h-20 px-4 lg:px-8 backdrop-blur-md transition-all duration-200 border-b shrink-0 ${
      isDarkMode 
        ? 'bg-[#0b0f19]/90 border-slate-800 text-white' 
        : 'bg-slate-50/90 border-slate-200/60 text-slate-800'
    }`}>
      <div className="flex items-center">
        {/* Desktop Toggle */}
        <button 
          onClick={toggleDesktopSidebar}
          className={`mr-4 p-2 rounded-lg hidden lg:block transition-colors ${
            isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-200'
          }`}
        >
          {isDesktopSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
        <div className="lg:hidden flex items-center space-x-2">
          <img src="/Logo.png" alt="Generation Rise" className="w-10 h-10 object-contain logo-sharp shrink-0" />
          <h1 className={`font-bold text-sm leading-tight ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>Generation Rise</h1>
        </div>
        <div className="hidden lg:block ml-2">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{roleName}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Real Notification Bell */}
        <NotificationBell />
        
        {/* Profile Dropdown Corner */}
        <div className={`flex items-center space-x-3 pl-4 border-l relative ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
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
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-900 text-yellow-400 font-bold border border-white shadow-sm group-hover:ring-2 ring-yellow-400 transition-all text-sm shrink-0 overflow-hidden">
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
                  isDarkMode ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-100'
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
