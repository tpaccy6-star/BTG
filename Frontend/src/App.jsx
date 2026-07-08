import React, { useState, useEffect } from 'react';
import { 
  Home, BookOpen, FileText, Settings, MessageCircle, 
  CheckCircle2, User, PanelLeftClose, PanelLeftOpen, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import modular layouts and views
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './views/LandingPage';
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
import AIChatbot from './components/AIChatbot';

// View transitions animation helper
const viewVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98 }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('scholar');
  const [currentView, setCurrentView] = useState('dashboard');
  const [showPortalLogin, setShowPortalLogin] = useState(() => {
    return localStorage.getItem('showPortalLogin') === 'true';
  });
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
      if (hash === '#/login') {
        setShowPortalLogin(true);
      } else if (hash === '#/home' || !hash) {
        setShowPortalLogin(false);
      } else {
        const view = hash.replace('#/', '');
        if ([
          'dashboard', 'catalog', 'lesson', 'tasks', 'attendance', 
          'chat', 'profile', 'scholars', 'grading', 'users', 
          'curriculum', 'reports', 'settings', 'cohorts', 'announcements'
        ].includes(view)) {
          setCurrentView(view);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Sync initial mount
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
    setShowPortalLogin(false);
    localStorage.setItem('showPortalLogin', 'false');
    setCurrentView('dashboard');
    window.location.hash = '#/dashboard';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setShowPortalLogin(true);
    localStorage.setItem('showPortalLogin', 'true');
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
    const isMobile = window.innerWidth < 1024;
    if (showPortalLogin || isMobile) {
      return (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess} 
          onBackToHome={() => {
            setShowPortalLogin(false);
            localStorage.setItem('showPortalLogin', 'false');
            window.location.hash = '#/home';
          }} 
        />
      );
    }
    return (
      <LandingPage 
        onEnterPortal={() => {
          setShowPortalLogin(true);
          localStorage.setItem('showPortalLogin', 'true');
          window.location.hash = '#/login';
        }} 
      />
    );
  }

  // Mobile Bottom Navigation Component
  const MobileNavbar = () => {
    let items = [];
    if (userRole === 'scholar') {
      items = [
        { id: 'dashboard', icon: Home, label: 'Dashboard' },
        { id: 'catalog', icon: BookOpen, label: 'Catalog' },
        { id: 'tasks', icon: FileText, label: 'Tasks' },
        { id: 'chat', icon: MessageCircle, label: 'Chat' },
        { id: 'profile', icon: User, label: 'Profile' }
      ];
    } else {
      // Mentor/Teacher/Admin
      items = [
        { id: 'dashboard', icon: Home, label: 'Hub' },
        { id: 'tasks', icon: FileText, label: 'Grading' },
        { id: 'attendance', icon: CheckCircle2, label: 'Attendance' },
        { id: 'chat', icon: MessageCircle, label: 'DMs' },
        { id: 'profile', icon: User, label: 'Profile' }
      ];
    }

    return (
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 border-t pb-safe z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] transition-all duration-200 ${
        isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <nav className="flex justify-around items-center h-16 px-2">
          {items.map((item) => {
            const isActive = currentView === item.id;
            const activeColor = isDarkMode ? 'text-yellow-400' : 'text-blue-900';
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  window.location.hash = `#/${item.id}`;
                }}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? activeColor : 'text-slate-400'}`}
              >
                <item.icon size={20} className={isActive ? activeColor : 'text-slate-400'} />
                <span className="text-[8px] font-black uppercase tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  };

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-200 ${
      isDarkMode ? 'bg-[#0b0f19] text-slate-100 dark' : 'bg-slate-50 text-slate-900'
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
          isDesktopSidebarOpen={isDesktopSidebarOpen}
          toggleDesktopSidebar={toggleDesktopSidebar}
          setCurrentView={setCurrentView}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
        />
        
        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 p-4 lg:p-10 pb-20 lg:pb-6">
            <div className="w-full h-full">
              <AnimatePresence mode="wait">
                {currentView === 'dashboard' && userRole === 'scholar' && (
                  <ScholarDashboard currentUser={currentUser} setCurrentView={setCurrentView} lessons={lessons} key="scholar-dash" />
                )}
                {currentView === 'dashboard' && userRole === 'mentor' && (
                  <MentorDashboard currentUser={currentUser} setCurrentView={setCurrentView} lessons={lessons} key="mentor-dash" />
                )}
                {currentView === 'dashboard' && userRole === 'teacher' && (
                  <TeacherDashboard currentUser={currentUser} setCurrentView={setCurrentView} key="teacher-dash" />
                )}
                {currentView === 'dashboard' && userRole === 'admin' && (
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

                {/* General Fallback for unspecified pages */}
                {currentView === 'reports' && (
                  <motion.div variants={viewVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-slate-200">
                      <Settings size={40} className="text-slate-300 animate-spin" style={{ animationDuration: '6s' }} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Module Loading</h2>
                    <p className="text-slate-500 mt-3 max-w-sm font-medium leading-relaxed">This workspace panel ({currentView}) is initializing. Check back shortly.</p>
                    <button onClick={() => setCurrentView('dashboard')} className="mt-10 px-8 py-3 bg-blue-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100">Return to Hub</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <Footer isDarkMode={isDarkMode} />
        </div>

        {/* Mobile bottom nav layout */}
        <MobileNavbar />
      </main>

      {/* Floating Role-Customized AI Chatbot Assistant */}
      {currentUser && <AIChatbot currentUser={currentUser} />}
    </div>
  );
}
