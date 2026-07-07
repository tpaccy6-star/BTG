import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIChatbot({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const role = currentUser?.role || 'scholar';
  const name = currentUser?.name || 'User';

  // Role-specific suggestions
  const getSuggestions = () => {
    switch (role) {
      case 'scholar':
        return [
          { text: 'How to submit homework', query: 'How do I submit homework?' },
          { text: 'Log attendance check-in', query: 'How to log attendance?' },
          { text: 'My learning streak', query: 'Tell me about streak points' }
        ];
      case 'mentor':
        return [
          { text: 'How to grade tasks', query: 'How do I grade homework?' },
          { text: 'Trace scholars checklist', query: 'How to view scholar roster?' },
          { text: 'Message my scholars', query: 'Where to message scholars?' }
        ];
      case 'teacher':
        return [
          { text: 'Manage active cohorts', query: 'How to manage cohorts?' },
          { text: 'Edit lesson curriculum', query: 'How to customize courses?' },
          { text: 'Post global broadcasts', query: 'How to send broadcasts?' }
        ];
      case 'admin':
        return [
          { text: 'Reset SQLite Database', query: 'How to reset database?' },
          { text: 'Add/Edit platform users', query: 'How to edit users?' },
          { text: 'Toggle compliance settings', query: 'How to change compliance security?' }
        ];
      default:
        return [
          { text: 'General Help', query: 'Help' }
        ];
    }
  };

  // Initialize welcome message
  useEffect(() => {
    let welcomeText = `Hi ${name}! I'm your AI Platform Assistant. `;
    if (role === 'scholar') {
      welcomeText += "I can guide you on submitting homework, checking attendance, and growing your daily streak points.";
    } else if (role === 'mentor') {
      welcomeText += "I can help you review pending assignments, evaluate scores, and coordinate chats with scholars.";
    } else if (role === 'teacher') {
      welcomeText += "I can help you construct new curriculum lessons, manage cohorts, and post notifications.";
    } else if (role === 'admin') {
      welcomeText += "I can assist you with user operations, database seeds/resets, and platform variables.";
    }

    setMessages([
      { id: 'welcome', sender: 'bot', text: welcomeText, timestamp: new Date() }
    ]);
  }, [currentUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    // Append user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: queryText, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: queryText })
      });
      const data = await res.json();
      
      // Append bot response
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMsgId, sender: 'bot', text: data.response || "I couldn't process that query. Please try again.", timestamp: new Date() }]);
    } catch (err) {
      const errorMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: errorMsgId, sender: 'bot', text: "Network connection error. Please make sure the server is online.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[88px] sm:bottom-6 right-4 sm:right-6 z-[60] p-3.5 sm:p-4 bg-blue-900 hover:bg-blue-850 dark:bg-yellow-400 dark:hover:bg-yellow-350 text-white dark:text-blue-955 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center border border-blue-800 dark:border-yellow-300"
        title="AI Assistant Chatbot"
      >
        {isOpen ? <X size={18} /> : <Sparkles size={18} className="animate-pulse" />}
      </button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-[152px] sm:bottom-24 right-4 sm:right-6 z-[60] w-[calc(100vw-32px)] sm:w-[380px] h-[480px] max-h-[calc(100vh-160px)] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-3xl flex flex-col overflow-hidden backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 dark:from-slate-800 dark:to-slate-900 text-white border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-yellow-400 text-blue-950 flex items-center justify-center shadow-md animate-pulse">
                  <Bot size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-xs tracking-wide">Generation Rise AI</h4>
                  <p className="text-[9px] text-slate-300 font-medium">Online • Role: {role}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-950/20">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === 'user' ? 'self-end ml-auto' : 'self-start'
                  }`}
                >
                  <div
                    className={`p-3 text-xs leading-relaxed shadow-sm rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-blue-900 dark:bg-yellow-400 text-white dark:text-blue-950 font-semibold rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-750/30'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium mt-1 px-1">
                    {msg.sender === 'user' ? 'Sent' : 'AI Assistant'}
                  </span>
                </div>
              ))}
              {loading && (
                <div className="self-start flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750/30 p-3 rounded-2xl rounded-tl-none max-w-[80%]">
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Pills */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 shrink-0">
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">Suggested Questions</span>
              <div className="flex flex-wrap gap-1.5">
                {getSuggestions().map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sug.query)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[9px] font-bold transition-all"
                  >
                    {sug.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-150 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center space-x-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask a portal question..."
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2 bg-blue-900 hover:bg-blue-800 dark:bg-yellow-400 dark:hover:bg-yellow-350 text-white dark:text-blue-950 rounded-xl shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
