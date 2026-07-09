import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const handleBellClick = async () => {
    // Navigate to announcements
    window.location.hash = '#/announcements';
    
    const unreadCount = notifications.filter(n => !n.isRead).length;
    if (unreadCount > 0) {
      // Optimistic update
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      
      try {
        const token = localStorage.getItem('token');
        await fetch('/api/notifications/read-all', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to mark all as read', err);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button 
        onClick={handleBellClick}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="View Announcements"
      >
        <Bell className="text-slate-600 dark:text-slate-300" size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white dark:border-[#0b0f19]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
