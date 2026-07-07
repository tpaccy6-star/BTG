import React from 'react';
import { 
  Home, BookOpen, FileText, Settings, User, 
  CheckCircle2, MessageCircle, Users, ListChecks, 
  BarChart, Database, Shield, Sun, Moon
} from 'lucide-react';

export default function Sidebar({ 
  userRole, 
  currentView, 
  setCurrentView, 
  isDesktopSidebarOpen,
  currentUser,
  isDarkMode,
  setIsDarkMode
}) {
  let items = [];
  if (userRole === 'scholar') {
    items = [
      { id: 'dashboard', icon: Home, label: 'Dashboard' },
      { id: 'catalog', icon: BookOpen, label: 'Catalog' },
      { id: 'tasks', icon: FileText, label: 'Tasks' },
      { id: 'attendance', icon: CheckCircle2, label: 'Attendance' },
      { id: 'chat', icon: MessageCircle, label: 'Mentor Chat' },
      { id: 'profile', icon: User, label: 'Profile' },
    ];
  } else if (userRole === 'mentor') {
    items = [
      { id: 'dashboard', icon: Home, label: 'Mentor Hub' },
      { id: 'scholars', icon: Users, label: 'My Scholars' },
      { id: 'attendance', icon: ListChecks, label: 'Attendance' },
      { id: 'grading', icon: ListChecks, label: 'Grading' },
      { id: 'chat', icon: MessageCircle, label: 'Messages' },
    ];
  } else if (userRole === 'teacher') {
    items = [
      { id: 'dashboard', icon: Home, label: 'Global Hub' },
      { id: 'cohorts', icon: Users, label: 'All Cohorts' },
      { id: 'attendance', icon: Users, label: 'Attendance' },
      { id: 'curriculum', icon: Database, label: 'Curriculum' },
      { id: 'announcements', icon: MessageCircle, label: 'Broadcasts' },
    ];
  } else if (userRole === 'admin') {
    items = [
      { id: 'dashboard', icon: Shield, label: 'Overview' },
      { id: 'users', icon: Users, label: 'User Directory' },
      { id: 'attendance', icon: BarChart, label: 'NGO Reports' },
      { id: 'curriculum', icon: Database, label: 'Curriculum' },
      { id: 'settings', icon: Settings, label: 'System' },
    ];
  }

  return (
    <aside className={`
      hidden lg:flex flex-col border-r transition-all duration-300 ease-in-out z-20 shrink-0 p-4
      ${isDesktopSidebarOpen ? 'w-60' : 'w-20'}
      ${isDarkMode ? 'bg-[#0b0f19] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}
    `}>


      {/* Branding Header */}
      <div className={`h-16 flex items-center mb-6 border-b pb-4 ${isDarkMode ? 'border-slate-850' : 'border-slate-100'} ${!isDesktopSidebarOpen && 'justify-center px-0 border-none'}`}>
        <div className="flex items-center">
          <img src="/Logo.png" alt="Generation Rise" className="w-10 h-10 object-contain logo-sharp shrink-0" />
          {isDesktopSidebarOpen && (
            <span className={`font-black text-sm tracking-tight ml-2.5 leading-none ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>
              Generation<br/>Rise
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        <p className={`px-2 text-[9px] font-black uppercase tracking-widest mb-3 transition-opacity ${
          isDarkMode ? 'text-slate-500' : 'text-slate-400'
        } ${!isDesktopSidebarOpen && 'opacity-0 h-0 overflow-hidden'}`}>
          Main Menu
        </p>
        {items.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                window.location.hash = `#/${item.id}`;
              }}
              className={`w-full flex items-center transition-all duration-200 group ${
                !isDesktopSidebarOpen ? 'justify-center py-1' : 'justify-start py-0.5'
              }`}
              title={!isDesktopSidebarOpen ? item.label : ''}
            >
              <span className={`w-full inline-flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? (isDarkMode ? 'bg-slate-850 text-white shadow-sm' : 'bg-blue-900 text-white shadow-sm')
                  : (isDarkMode ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-blue-900')
              } ${!isDesktopSidebarOpen ? 'justify-center w-12' : 'space-x-3'}`}>
                <item.icon size={18} className={isActive ? 'text-yellow-400' : 'text-slate-400 group-hover:text-blue-900 dark:group-hover:text-white'} />
                {isDesktopSidebarOpen && <span className="font-semibold text-xs whitespace-nowrap">{item.label}</span>}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Elements */}
      <div className={`mt-auto space-y-4 pt-4 border-t ${isDarkMode ? 'border-slate-850' : 'border-slate-100'}`}>
        {/* Dark Mode Switcher */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`w-full flex items-center transition-all duration-200 group ${
            !isDesktopSidebarOpen ? 'justify-center' : 'justify-start'
          }`}
          title={!isDesktopSidebarOpen ? (isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode') : ''}
        >
          <span className={`w-full inline-flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
            isDarkMode ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-blue-900'
          } ${!isDesktopSidebarOpen ? 'justify-center w-12' : 'space-x-3'}`}>
            {isDarkMode ? (
              <>
                <Sun size={18} className="text-yellow-400" />
                {isDesktopSidebarOpen && <span className="font-semibold text-xs whitespace-nowrap">Light Theme</span>}
              </>
            ) : (
              <>
                <Moon size={18} className="text-slate-400 group-hover:text-blue-900" />
                {isDesktopSidebarOpen && <span className="font-semibold text-xs whitespace-nowrap">Dark Theme</span>}
              </>
            )}
          </span>
        </button>

        {/* User Card Details */}
        <div className={`flex items-center ${!isDesktopSidebarOpen ? 'justify-center' : 'space-x-3 px-2 pt-1'}`}>
          <div className="w-9 h-9 rounded-xl bg-blue-900 text-yellow-400 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-white/10 shadow-sm">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser?.name} className="w-full h-full object-cover" />
            ) : (
              currentUser?.initials || currentUser?.name?.slice(0, 2).toUpperCase() || 'U'
            )}
          </div>
          {isDesktopSidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-bold truncate leading-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {currentUser?.name || 'User'}
              </p>
              <p className="text-[9px] text-slate-500 truncate mt-0.5 leading-none">
                {currentUser?.email || 'user@generationrise.org'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
