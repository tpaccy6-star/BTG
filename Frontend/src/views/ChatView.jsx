import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';

export default function ChatView({ currentUser, userRole }) {
  const [messages, setMessages] = useState([]);
  const [localChatInput, setLocalChatInput] = useState('');
  const [activeChannel, setActiveChannel] = useState('group-all'); // 'group-all' or direct scholarId/mentorId
  const [scholarsList, setScholarsList] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-detected mentor ID if current user is a scholar
  const [detectedMentorId, setDetectedMentorId] = useState('mentor-all');
  const [showSidebarMobile, setShowSidebarMobile] = useState(true);

  useEffect(() => {
    // 1. Fetch message history
    const fetchChatHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/chat/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
          
          // If scholar, find the mentor's ID from incoming messages
          if (userRole === 'scholar') {
            const mentorMsg = data.find(m => m.senderId !== currentUser.id && m.recipientId !== 'group-all');
            if (mentorMsg) {
              setDetectedMentorId(mentorMsg.senderId);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load chat logs:', err);
      }
    };

    fetchChatHistory();

    // 2. Fetch roster if mentor/teacher to list scholars to chat with
    if (userRole !== 'scholar') {
      const fetchRoster = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/roster', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setScholarsList(data);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchRoster();
    }

    // 3. Connect Socket.io client
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
    const socket = io(socketUrl);
    socketRef.current = socket;

    // Join personal room to receive direct messages
    socket.emit('joinRoom', { userId: currentUser.id });

    // Handle new message event
    socket.on('newMessage', (msg) => {
      setMessages((prev) => {
        // Prevent duplicate append
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUser, userRole]);

  // Scroll to bottom whenever messages list grows
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!localChatInput.trim()) return;

    const recipientId = activeChannel;
    
    // Emit message to Socket server
    socketRef.current.emit('sendMessage', {
      senderId: currentUser.id,
      senderName: currentUser.name,
      recipientId,
      content: localChatInput
    });

    setLocalChatInput('');
  };

  // Filter messages matching activeChannel
  const filteredMessages = messages.filter(m => {
    if (activeChannel === 'group-all') {
      return m.recipientId === 'group-all';
    } else {
      // Direct message: sender is current user and recipient is activeChannel OR sender is activeChannel and recipient is current user
      return (m.senderId === currentUser.id && m.recipientId === activeChannel) ||
             (m.senderId === activeChannel && m.recipientId === currentUser.id);
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.98 }} 
      className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm h-[75vh] flex overflow-hidden"
    >
      {/* Channels list */}
      <div className={`w-full md:w-80 border-r border-slate-100 dark:border-slate-800 flex-col shrink-0 ${
        showSidebarMobile ? 'flex' : 'hidden md:flex'
      }`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black text-blue-955 dark:text-white tracking-tight">Messages</h2>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {/* Global group channel */}
          <div 
            onClick={() => {
              setActiveChannel('group-all');
              setShowSidebarMobile(false);
            }}
            className={`flex items-center space-x-4 p-4 rounded-2xl cursor-pointer transition-all border ${
              activeChannel === 'group-all' 
                ? 'bg-blue-50/50 dark:bg-blue-955/20 border-blue-100/40 dark:border-blue-900/30' 
                : 'hover:bg-slate-50 dark:hover:bg-slate-850/50 border-transparent'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 dark:bg-yellow-455 text-blue-900 font-bold flex items-center justify-center shrink-0">C4</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-blue-955 dark:text-white text-sm truncate">Kigali Cohort 4 (Group)</h4>
              <p className="text-xs text-slate-400 dark:text-slate-550 truncate mt-0.5">Cohort global board</p>
            </div>
          </div>

          {/* Scholar Mode: Direct DM to Mentor */}
          {userRole === 'scholar' && (
            <div 
              onClick={() => {
                setActiveChannel(detectedMentorId);
                setShowSidebarMobile(false);
              }}
              className={`flex items-center space-x-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                activeChannel === detectedMentorId 
                  ? 'bg-blue-50/50 dark:bg-blue-955/20 border-blue-100/40 dark:border-blue-900/30' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-850/50 border-transparent'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-900 dark:bg-slate-800 text-yellow-400 dark:text-yellow-455 font-bold flex items-center justify-center shrink-0">SM</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-blue-955 dark:text-white text-sm truncate">Sarah Miller (Mentor)</h4>
                <p className="text-xs text-slate-400 dark:text-slate-550 truncate mt-0.5">Direct chat channel</p>
              </div>
            </div>
          )}

          {/* Mentor/Admin Mode: List of assigned scholars */}
          {userRole !== 'scholar' && (
            <>
              <p className="px-3 pt-4 pb-2 text-[10px] font-black text-slate-400 dark:text-slate-505 uppercase tracking-widest">Scholars DMs</p>
              {scholarsList.map(s => (
                <div 
                  key={s.id}
                  onClick={() => {
                    setActiveChannel(s.id);
                    setShowSidebarMobile(false);
                  }}
                  className={`flex items-center space-x-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                    activeChannel === s.id 
                      ? 'bg-blue-50/50 dark:bg-blue-955/20 border-blue-100/40 dark:border-blue-900/30' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-850/50 border-transparent'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-900 dark:bg-slate-800 text-yellow-400 dark:text-yellow-455 font-bold flex items-center justify-center shrink-0 overflow-hidden">
                    {s.avatarUrl ? (
                      <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      s.initials
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-blue-955 dark:text-white text-sm truncate">{s.name}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-550 truncate mt-0.5">{s.university}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className={`flex-1 flex flex-col h-full bg-slate-50/30 dark:bg-slate-955/20 ${
        showSidebarMobile ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Header */}
        <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Back to Channels button for mobile */}
            <button 
              type="button"
              onClick={() => setShowSidebarMobile(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-blue-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              title="Back to channels"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-900 dark:bg-slate-800 text-yellow-400 dark:text-yellow-455 font-bold flex items-center justify-center shadow-md dark:shadow-none overflow-hidden shrink-0">
              {activeChannel === 'group-all' ? (
                'C4'
              ) : userRole === 'scholar' ? (
                'SM'
              ) : (
                (() => {
                  const partner = scholarsList.find(s => s.id === activeChannel);
                  return partner?.avatarUrl ? (
                    <img src={partner.avatarUrl} alt={partner.name} className="w-full h-full object-cover" />
                  ) : (
                    partner?.initials || 'DM'
                  );
                })()
              )}
            </div>
            <div>
              <h3 className="font-black text-blue-955 dark:text-white leading-tight">
                {activeChannel === 'group-all' 
                  ? 'Kigali Cohort 4 (Group Chat)' 
                  : userRole === 'scholar' 
                  ? 'Sarah Miller (Mentor)' 
                  : scholarsList.find(s => s.id === activeChannel)?.name || 'Direct Conversation'}
              </h3>
              <span className="text-emerald-500 text-[10px] font-black uppercase tracking-wider flex items-center mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Active Channel
              </span>
            </div>
          </div>
        </div>

        {/* Messages Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-2">
              <MessageCircle size={36} className="text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">No messages logged in this channel yet.</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isSelf = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm text-xs leading-relaxed ${
                    isSelf 
                      ? 'bg-blue-900 dark:bg-slate-850 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-slate-900 text-blue-950 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-800'
                  }`}>
                    {!isSelf && <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{msg.senderName}</p>}
                    <p className="font-medium">{msg.content}</p>
                    <span className={`text-[8px] font-bold block mt-1.5 text-right uppercase ${
                      isSelf ? 'text-blue-200 dark:text-slate-450' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-4 shrink-0">
          <input
            type="text"
            value={localChatInput}
            onChange={(e) => setLocalChatInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 font-medium text-xs text-blue-955 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 transition-all"
          />
          <button type="submit" className="p-4 bg-blue-900 hover:bg-blue-800 dark:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-2xl shadow-lg dark:shadow-none shadow-blue-200/50 hover:scale-105 active:scale-95 transition-all">
            <Send size={18} />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
