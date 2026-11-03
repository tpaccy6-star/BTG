import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2, Megaphone, ShieldAlert, MessageCircle, Info, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell({ setCurrentView, isDarkMode }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark all as read', err);
      fetchNotifications();
    }
  };

  const handleMarkSingleRead = async (id, e) => {
    if (e) e.stopPropagation();
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleDismissNotification = async (id, e) => {
    if (e) e.stopPropagation();
    // Optimistic delete
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to dismiss notification', err);
      fetchNotifications();
    }
  };

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      handleMarkSingleRead(item.id);
    }
    setIsOpen(false);

    if (item.type === 'message' && setCurrentView) {
      setCurrentView('chat');
      window.location.hash = '#/chat';
    } else if (item.type === 'announcement' && setCurrentView) {
      setCurrentView('announcements');
      window.location.hash = '#/announcements';
    } else if (item.title?.toLowerCase().includes('password') && setCurrentView) {
      setCurrentView('profile');
      window.location.hash = '#/profile';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'announcement':
        return <Megaphone size={14} className="text-blue-600 dark:text-yellow-450" />;
      case 'message':
        return <MessageCircle size={14} className="text-emerald-500" />;
      case 'alert':
        return <ShieldAlert size={14} className="text-amber-500" />;
      default:
        return <Info size={14} className="text-blue-500 dark:text-yellow-450" />;
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`rise-notification-button relative p-2.5 rounded-xl transition-all cursor-pointer ${
          isOpen 
            ? 'bg-blue-100 dark:bg-slate-800 text-blue-900 dark:text-yellow-450' 
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl z-50 overflow-hidden text-slate-800 dark:text-white"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
              <div className="flex items-center space-x-2">
                <span className="font-black text-xs uppercase tracking-wider text-blue-955 dark:text-white">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-yellow-450/20 text-blue-900 dark:text-yellow-450">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-900 dark:text-yellow-450 hover:underline cursor-pointer"
                >
                  <CheckCheck size={12} />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Notifications Scroll List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="py-10 text-center px-4">
                  <Bell size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">All caught up!</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">No notifications right now.</p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 flex items-start space-x-3 transition-colors cursor-pointer group ${
                      !item.isRead 
                        ? 'bg-blue-50/40 dark:bg-slate-850/60 hover:bg-blue-50/80 dark:hover:bg-slate-800' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs truncate ${!item.isRead ? 'font-black text-blue-955 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                          {item.title}
                        </p>
                        <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                          {formatTimestamp(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {/* Actions on hover */}
                    <div className="flex items-center space-x-1 shrink-0 pt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {!item.isRead && (
                        <button
                          onClick={(e) => handleMarkSingleRead(item.id, e)}
                          title="Mark as read"
                          className="p-1 text-blue-900 dark:text-yellow-450 hover:bg-white dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                        >
                          <CheckCheck size={13} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDismissNotification(item.id, e)}
                        title="Dismiss"
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Popover Footer */}
            <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (setCurrentView) {
                    setCurrentView('announcements');
                    window.location.hash = '#/announcements';
                  }
                }}
                className="w-full py-1.5 px-3 rounded-xl text-[11px] font-bold text-blue-900 dark:text-yellow-450 hover:bg-white dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>View All Broadcasts & Announcements</span>
                <ExternalLink size={11} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
