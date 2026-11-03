import React from 'react';
import { 
  Home, BookOpen, FileText, Settings, User, 
  CheckCircle2, MessageCircle, Users,
  BarChart, Database, Shield
} from 'lucide-react';

const programWorkspaceViews = new Set([
  'programs',
  'reports',
  'academic-results',
  'friendly-weeks',
  'mentorship',
  'assistance',
]);

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
  if (userRole === 'scholar' || userRole === 'beneficiary') {
    items = [
      { id: 'dashboard', icon: Home, label: 'Dashboard' },
      { id: 'catalog', icon: BookOpen, label: 'Catalog' },
      { id: 'tasks', icon: FileText, label: 'Tasks' },
      { id: 'programs', icon: Database, label: 'Program Suite' },
      { id: 'chat', icon: MessageCircle, label: 'Messages' },
      { id: 'profile', icon: User, label: 'Profile' },
    ];
  } else if (userRole === 'mentor') {
    items = [
      { id: 'chat', icon: MessageCircle, label: 'Messages' },
      { id: 'profile', icon: User, label: 'Profile' },
    ];
  } else if (userRole === 'teacher') {
    items = [
      { id: 'dashboard', icon: Home, label: 'Global Hub' },
      { id: 'cohorts', icon: Users, label: 'All Cohorts' },
      { id: 'programs', icon: Database, label: 'Program Suite' },
      { id: 'curriculum', icon: Database, label: 'Curriculum' },
      { id: 'announcements', icon: MessageCircle, label: 'Broadcasts' },
      { id: 'chat', icon: MessageCircle, label: 'Messages' },
    ];
  } else if (userRole === 'admin' || userRole === 'staff') {
    items = [
      { id: 'dashboard', icon: Shield, label: 'Overview' },
      { id: 'users', icon: Users, label: 'User Directory' },
      { id: 'programs', icon: Database, label: 'Program Suite' },
      { id: 'curriculum', icon: Database, label: 'Curriculum' },
      { id: 'settings', icon: Settings, label: 'System' },
      { id: 'chat', icon: MessageCircle, label: 'Messages' },
    ];
  }

  return (
    <aside className={`
      rise-sidebar hidden lg:flex flex-col border-r transition-all duration-300 ease-in-out z-20 shrink-0 px-3 py-5
      ${isDesktopSidebarOpen ? 'w-[258px]' : 'w-20'}
    `}>


      {/* Branding Header */}
      <div className={`rise-brand-header flex min-h-[58px] items-center gap-3 border-b px-2 pb-4 mb-5 ${!isDesktopSidebarOpen && 'justify-center px-0 border-none'}`}>
        <div className="rise-brand-mark flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border p-1.5 shadow-md">
          <img src="/rise-logo.png" alt="Rise Her" className="h-full w-full object-contain logo-sharp" />
        </div>
        {isDesktopSidebarOpen && (
          <div className="min-w-0">
            <span className="rise-brand-name block text-sm font-bold tracking-tight leading-tight">
              Rise Her
            </span>
            <span className="rise-brand-subtitle mt-1 block text-[9px] font-semibold uppercase tracking-[0.14em]">
              Generation Rise Foundation
            </span>
          </div>
        )}
      </div>

      {/* Main Navigation Menu */}
      <nav aria-label="Workspace navigation" className="rise-main-nav flex-1 space-y-1 overflow-y-auto">
        <p className={`rise-nav-label px-3 text-[9px] font-bold uppercase tracking-[0.15em] mb-2 transition-opacity ${!isDesktopSidebarOpen && 'opacity-0 h-0 overflow-hidden'}`}>
          Workspace
        </p>
        {items.map((item) => {
          const isActive = currentView === item.id
            || (item.id === 'programs' && programWorkspaceViews.has(currentView));
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCurrentView(item.id);
                window.location.hash = `#/${item.id}`;
              }}
              className="rise-nav-button w-full flex items-center transition-all duration-200 group"
              title={!isDesktopSidebarOpen ? item.label : ''}
            >
              <span className={`rise-nav-link w-full inline-flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive ? 'rise-nav-link-active' : ''
              } ${!isDesktopSidebarOpen ? 'justify-center w-12' : 'space-x-3'}`}>
                <item.icon size={18} className="rise-nav-icon shrink-0" />
                {isDesktopSidebarOpen && <span className="font-semibold text-xs whitespace-nowrap">{item.label}</span>}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Elements */}
      <div className="rise-sidebar-footer mt-auto space-y-3 pt-4 border-t">
        {/* User Card Details */}
        <div className={`flex items-center ${!isDesktopSidebarOpen ? 'justify-center' : 'space-x-3 px-2 pt-1'}`}>
          <div className="w-9 h-9 rounded-xl bg-yellow-400 text-blue-900 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-white/20 shadow-sm">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser?.name} className="w-full h-full object-cover" />
            ) : (
              currentUser?.initials || currentUser?.name?.slice(0, 2).toUpperCase() || 'U'
            )}
          </div>
          {isDesktopSidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="rise-user-name text-[11px] font-bold truncate leading-tight">
                {currentUser?.name || 'User'}
              </p>
              <p className="rise-user-email text-[9px] text-slate-300 truncate mt-0.5 leading-none">
                {currentUser?.email || 'user@generationrise.org'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
