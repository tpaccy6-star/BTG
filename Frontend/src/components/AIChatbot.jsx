import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, MessageSquare, Copy, Check, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownRenderer from './MarkdownRenderer';

export default function AIChatbot({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const role = currentUser?.role || 'scholar';
  const name = currentUser?.name || 'User';

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
  }, [currentUser, name, role]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportHistory = () => {
    const logs = messages
      .map(m => `[${m.sender === 'user' ? 'USER' : 'AI ASSISTANT'} - ${new Date(m.timestamp).toLocaleTimeString()}]\n${m.text}\n`)
      .join('\n');
    const blob = new Blob([logs], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generation_rise_chat_history_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleSend = async (textToSend) => {
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    // Append user message
    const userMsgId = Date.now().toString();
    const newMessages = [...messages, { id: userMsgId, sender: 'user', text: queryText, timestamp: new Date() }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const history = newMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      const res = await fetch('/api/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: queryText, history })
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
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : (isMaximized ? '90vh' : '500px'),
              width: isMaximized ? '90vw' : '360px',
              bottom: isMaximized ? '5vh' : '80px',
              right: isMaximized ? '5vw' : '24px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden z-[60] ${isMaximized ? 'rounded-2xl' : 'rounded-3xl'}`}
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
              <div className="flex items-center space-x-1.5" onClick={e => e.stopPropagation()}>
                <button
                  onClick={handleExportHistory}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  title="Export Chat History"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => {
                    setIsMaximized(!isMaximized);
                    setIsMinimized(false);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  title={isMaximized ? "Restore size" : "Maximize"}
                >
                  <div className="w-3 h-3 border-2 border-current rounded-sm"></div>
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  <div className="w-3 h-0.5 bg-current"></div>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-950/20">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] group relative ${
                    msg.sender === 'user' ? 'self-end ml-auto' : 'self-start'
                  }`}
                >
                  <div
                    className={`p-3 text-xs leading-relaxed shadow-sm rounded-2xl relative ${
                      msg.sender === 'user'
                        ? 'bg-blue-900 dark:bg-yellow-400 text-white dark:text-blue-950 font-semibold rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-750/30'
                    }`}
                  >
                    <MarkdownRenderer content={msg.text} />
                    
                    <button 
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 dark:text-slate-500 transition-opacity"
                      title="Copy to clipboard"
                    >
                      {copiedId === msg.id ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                    </button>
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

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-150 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-end space-x-2 shrink-0">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a question... (Enter for new line, Shift+Enter to send)"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white min-h-[40px] max-h-[120px] resize-y"
                rows="1"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2 bg-blue-900 hover:bg-blue-800 dark:bg-yellow-400 dark:hover:bg-yellow-350 text-white dark:text-blue-950 rounded-xl shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center"
              >
                <Send size={14} />
              </button>
            </div>
            </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
