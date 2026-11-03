import React, { useState, useEffect } from 'react';
import { 
  Home, BookOpen, FileText, MessageCircle,
  CheckCircle2, User, PanelLeftClose, PanelLeftOpen, Bell, Sun, Moon
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Import modular layouts and views
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './views/LoginPage';
import ScholarDashboard from './views/ScholarDashboard';
import MentorDashboard from './views/MentorDashboard';
import TeacherDashboard from './views/TeacherDashboard';
import AdminDashboard from './views/AdminDashboard';
import AttendanceView from './views/AttendanceView';
import CatalogView from './views/CatalogView';
import LessonView from './views/LessonView';
import TasksView from './views/TasksView';
import ChatView from './views/ChatView';
import ProfileView from './views/ProfileView';

// Newly implemented dashboard views
import ScholarsView from './views/ScholarsView';
import CohortsView from './views/CohortsView';
import CurriculumView from './views/CurriculumView';
import AnnouncementsView from './views/AnnouncementsView';
import UsersDirectoryView from './views/UsersDirectoryView';
import SettingsView from './views/SettingsView';
import ProgramWorkspace from './views/ProgramWorkspace';

const programWorkspaceViews = new Set([
  'programs',
  'reports',
  'academic-results',
  'friendly-weeks',
  'mentorship',
  'assistance',
]);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('scholar');
  const [currentView, setCurrentView] = useState('dashboard');
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Auto-adapt if user hasn't explicitly set their override in localStorage
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Active curriculum elements
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('entrepreneur-1');
  const [loadingSession, setLoadingSession] = useState(true);

  // --- 1. Session check on load ---
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoadingSession(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (response.ok && data.user) {
          setCurrentUser(data.user);
          setUserRole(data.user.role);
          setIsLoggedIn(true);
        } else {
          // Token expired or invalid
          handleLogout();
        }
      } catch (err) {
        console.error('Session verification error:', err);
      } finally {
        setLoadingSession(false);
      }
    };

    verifySession();
  }, []);

  // --- 2. Synchronize navigation state with window hash ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash !== '#/login' && hash !== '#/home' && hash) {
        const view = hash.replace('#/', '');
        if ([
          'dashboard', 'catalog', 'lesson', 'tasks', 'attendance', 'programs',
          'chat', 'profile', 'scholars', 'grading', 'users', 
          'curriculum', 'reports', 'academic-results', 'friendly-weeks',
          'mentorship', 'assistance', 'settings', 'cohorts', 'announcements'
        ].includes(view)) {
          setCurrentView(view);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Sync initial mount
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!isLoggedIn && !loadingSession && window.location.hash !== '#/login') {
      window.location.hash = '#/login';
    }
  }, [isLoggedIn, loadingSession]);

  // --- 3. Load curriculum catalog once authenticated ---
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchLessons = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/lessons', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setLessons(data);
          if (data.length > 0) {
            setSelectedLessonId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load lessons:', err);
      }
    };

    fetchLessons();
  }, [isLoggedIn]);

  // Refresh user object (e.g. following upload or attendance log)
  const refreshUserSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (data) => {
    localStorage.setItem('token', data.token);
    setCurrentUser(data.user);
    setUserRole(data.user.role);
    setIsLoggedIn(true);
    setCurrentView('dashboard');
    window.location.hash = '#/dashboard';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentView('dashboard');
    window.location.hash = '#/login';
  };

  const toggleDesktopSidebar = () => setIsDesktopSidebarOpen(!isDesktopSidebarOpen);

  // Render loading screen during initial session verification
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-inner border border-slate-100 mb-4 animate-pulse">
          <BookOpen size={24} className="text-blue-900" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest">Verifying Connection...</p>
      </div>
    );
  }

  // --- Auth layout guards ---
  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Mobile Bottom Navigation Component
  const MobileNavbar = () => {
    let items = [];
    if (userRole === 'scholar' || userRole === 'beneficiary') {
      items = [
        { id: 'dashboard', icon: Home, label: 'Dashboard' },
        { id: 'catalog', icon: BookOpen, label: 'Catalog' },
        { id: 'tasks', icon: FileText, label: 'Tasks' },
        { id: 'chat', icon: MessageCircle, label: 'Chat' },
        { id: 'programs', icon: BookOpen, label: 'Programs' },
        { id: 'profile', icon: User, label: 'Profile' }
      ];
    } else {
      // Mentor/Teacher/Admin
      items = [
        { id: 'dashboard', icon: Home, label: 'Hub' },
        { id: 'tasks', icon: FileText, label: 'Grading' },
        { id: 'attendance', icon: CheckCircle2, label: 'Attendance' },
        { id: 'chat', icon: MessageCircle, label: 'DMs' },
        { id: 'programs', icon: BookOpen, label: 'Programs' },
        { id: 'profile', icon: User, label: 'Profile' }
      ];
    }

    return (
      <div className="rise-mobile-nav lg:hidden fixed bottom-0 left-0 right-0 border-t pb-safe z-50 transition-all duration-200">
        <nav
          aria-label="Mobile navigation"
          className="flex h-16 items-stretch justify-around px-1"
        >
          {items.map((item) => {
            const isActive = currentView === item.id
              || (item.id === 'programs' && programWorkspaceViews.has(currentView));
            const activeColor = 'text-blue-900';
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.id === 'dashboard' ? 'Home' : item.label}
                aria-current={isActive ? 'page' : undefined}
                title={item.id === 'dashboard' ? 'Home' : item.label}
                onClick={() => {
                  setCurrentView(item.id);
                  window.location.hash = `#/${item.id}`;
                }}
                className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-500 ${
                  isActive ? activeColor : 'text-slate-400'
                }`}
              >
                <item.icon size={18} className={isActive ? activeColor : 'text-slate-400'} />
                <span className="w-full break-words text-[7px] font-black uppercase leading-tight tracking-tight">
                  {item.id === 'dashboard' ? 'Home' : item.label}
                </span>
              </button>
            );
          })}

        </nav>
      </div>
    );
  };

  return (
    <div className={`rise-app flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDarkMode ? 'dark' : ''
    }`}>
      
      {/* Sidebar Layout */}
      <Sidebar 
        userRole={userRole} 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isDesktopSidebarOpen={isDesktopSidebarOpen} 
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Main Container Area */}
      <main className="flex-1 flex flex-col h-screen min-w-0 relative">
        <Header 
          currentUser={currentUser}
          userRole={userRole}
          currentView={currentView}
          isDesktopSidebarOpen={isDesktopSidebarOpen}
          toggleDesktopSidebar={toggleDesktopSidebar}
          setCurrentView={setCurrentView}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
        
        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 p-4 lg:p-10 pb-20 lg:pb-6">
            <div className="w-full h-full">
              <AnimatePresence mode="wait">
                {currentView === 'dashboard' && (userRole === 'scholar' || userRole === 'beneficiary') && (
                  <ScholarDashboard currentUser={currentUser} setCurrentView={setCurrentView} lessons={lessons} key="scholar-dash" />
                )}
                {currentView === 'dashboard' && userRole === 'mentor' && (
                  <MentorDashboard currentUser={currentUser} setCurrentView={setCurrentView} lessons={lessons} key="mentor-dash" />
                )}
                {currentView === 'dashboard' && userRole === 'teacher' && (
                  <TeacherDashboard currentUser={currentUser} setCurrentView={setCurrentView} key="teacher-dash" />
                )}
                {currentView === 'dashboard' && (userRole === 'admin' || userRole === 'staff') && (
                  <AdminDashboard currentUser={currentUser} setCurrentView={setCurrentView} key="admin-dash" />
                )}
                
                {currentView === 'attendance' && (
                  <AttendanceView currentUser={currentUser} userRole={userRole} onUpdateUser={refreshUserSession} key="attendance" />
                )}
                {currentView === 'catalog' && (
                  <CatalogView currentUser={currentUser} setCurrentView={setCurrentView} lessons={lessons} onSelectLesson={setSelectedLessonId} key="catalog" />
                )}
                {currentView === 'lesson' && (
                  <LessonView currentUser={currentUser} lessons={lessons} selectedLessonId={selectedLessonId} setCurrentView={setCurrentView} onUpdateUser={refreshUserSession} key="lesson" />
                )}
                {currentView === 'tasks' && (
                  <TasksView currentUser={currentUser} userRole={userRole} lessons={lessons} onUpdateUser={refreshUserSession} key="tasks" />
                )}
                {currentView === 'chat' && (
                  <ChatView currentUser={currentUser} userRole={userRole} key="chat" />
                )}
                {currentView === 'profile' && (
                  <ProfileView currentUser={currentUser} onLogout={handleLogout} onUpdateUser={refreshUserSession} key="profile" />
                )}

                {/* Dynamic fully-implemented views */}
                {currentView === 'scholars' && (
                  <ScholarsView currentUser={currentUser} setCurrentView={setCurrentView} lessons={lessons} key="scholars" />
                )}
                {currentView === 'grading' && (
                  <TasksView currentUser={currentUser} userRole={userRole} lessons={lessons} onUpdateUser={refreshUserSession} key="grading" />
                )}
                {currentView === 'cohorts' && (
                  <CohortsView currentUser={currentUser} userRole={userRole} key="cohorts" />
                )}
                {currentView === 'curriculum' && (
                  <CurriculumView lessons={lessons} onUpdateUser={refreshUserSession} key="curriculum" />
                )}
                {currentView === 'announcements' && (
                  <AnnouncementsView userRole={userRole} key="announcements" />
                )}
                {currentView === 'users' && (
                  <UsersDirectoryView key="users" />
                )}
                {currentView === 'settings' && (
                  <SettingsView currentUser={currentUser} userRole={userRole} onLogout={handleLogout} onUpdateUser={refreshUserSession} key="settings" />
                )}

                {programWorkspaceViews.has(currentView) && (
                  <ProgramWorkspace
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                    userRole={userRole}
                    key="program-workspace"
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
          <Footer isDarkMode={isDarkMode} />
        </div>

        {/* Mobile bottom nav layout */}
        <MobileNavbar />
      </main>
    </div>
  );
}
