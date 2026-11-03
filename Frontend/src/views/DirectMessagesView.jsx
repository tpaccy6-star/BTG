import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, Search, Send } from 'lucide-react';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';

export default function DirectMessagesView({ currentUser, userRole }) {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeContactId, setActiveContactId] = useState(userRole === 'mentor' ? null : 'group-all');
  const [messageInput, setMessageInput] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [threadSearch, setThreadSearch] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [onlineContactIds, setOnlineContactIds] = useState(() => new Set());
  const [typingUser, setTypingUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showContactsOnMobile, setShowContactsOnMobile] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeContactIdRef = useRef(activeContactId);
  const typingTimeoutRef = useRef(null);
  const typingRecipientIdRef = useRef(null);
  const isTypingRef = useRef(false);
  activeContactIdRef.current = activeContactId;

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');

    const loadMessages = async () => {
      try {
        const [contactsResponse, messagesResponse] = await Promise.all([
          fetch('/api/chat/contacts', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/chat/history', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        if (!contactsResponse.ok || !messagesResponse.ok) {
          throw new Error('Unable to load messages and contacts.');
        }

        const [contactData, messageData] = await Promise.all([
          contactsResponse.json(),
          messagesResponse.json()
        ]);
        if (!active) return;
        setContacts(contactData);
        setMessages(messageData);
        setActiveContactId(current => current || (
          userRole === 'mentor' ? contactData[0]?.id || null : 'group-all'
        ));
      } catch (loadError) {
        console.error('Failed to load direct messages:', loadError);
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMessages();

    const socketUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : window.location.origin;
    const socket = io(socketUrl, { auth: { token } });
    socketRef.current = socket;
    socket.on('newMessage', (message) => {
      setMessages(previous => previous.some(item => item.id === message.id)
        ? previous
        : [...previous, message]);
      if (message.senderId !== currentUser.id) {
        const conversationId = message.recipientId === 'group-all'
          ? 'group-all'
          : message.senderId;
        if (activeContactIdRef.current !== conversationId) {
          setUnreadCounts(previous => ({
            ...previous,
            [conversationId]: (previous[conversationId] || 0) + 1
          }));
        }
      }
    });
    socket.on('messageError', message => setError(message));
    socket.on('communicationError', message => setError(message));
    socket.on('presenceSnapshot', ids => setOnlineContactIds(new Set(ids)));
    socket.on('presenceUpdate', ({ userId, online }) => {
      setOnlineContactIds(previous => {
        const updated = new Set(previous);
        if (online) updated.add(userId);
        else updated.delete(userId);
        return updated;
      });
    });
    socket.on('userTyping', ({ userId, userName, isTyping }) => {
      if (userId !== activeContactIdRef.current) return;
      setTypingUser(isTyping ? { userId, userName } : null);
    });
    socket.on('connect_error', () => setError('Unable to connect to messaging. Please sign in again.'));
    socket.emit('joinRoom', { userId: currentUser.id });

    return () => {
      active = false;
      clearTimeout(typingTimeoutRef.current);
      socket.disconnect();
    };
  }, [currentUser.id, userRole]);

  const activeContact = contacts.find(contact => contact.id === activeContactId);
  const contactGroups = userRole === 'mentor'
    ? [
        {
          label: 'Assigned scholars',
          contacts: contacts.filter(contact => ['scholar', 'beneficiary'].includes(contact.role))
        },
        {
          label: 'Staff members',
          contacts: contacts.filter(contact => !['scholar', 'beneficiary'].includes(contact.role))
        }
      ]
    : [
          { label: 'People', contacts }
      ];
  const conversationMessages = messages.filter(message => activeContactId === 'group-all'
    ? message.recipientId === 'group-all'
    : (message.senderId === currentUser.id && message.recipientId === activeContactId) ||
      (message.senderId === activeContactId && message.recipientId === currentUser.id)
  );
  const visibleMessages = conversationMessages.filter(message =>
    message.content.toLowerCase().includes(threadSearch.trim().toLowerCase())
  );
  const conversationSummaries = useMemo(() => {
    const summaries = new Map();
    for (const message of messages) {
      const conversationId = message.recipientId === 'group-all'
        ? 'group-all'
        : message.senderId === currentUser.id
          ? message.recipientId
          : message.senderId;
      summaries.set(conversationId, message);
    }
    return summaries;
  }, [messages, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length, activeContactId]);

  useEffect(() => {
    if (isTypingRef.current && typingRecipientIdRef.current) {
      socketRef.current?.emit('typing', {
        recipientId: typingRecipientIdRef.current,
        isTyping: false
      });
      isTypingRef.current = false;
      typingRecipientIdRef.current = null;
    }
    clearTimeout(typingTimeoutRef.current);
    setTypingUser(null);
    setThreadSearch('');
    setUnreadCounts(previous => ({ ...previous, [activeContactId]: 0 }));
  }, [activeContactId]);

  const handleMessageInput = (event) => {
    const content = event.target.value;
    setMessageInput(content);
    if (!activeContactId || activeContactId === 'group-all' || !socketRef.current) return;

    if (!isTypingRef.current && content.trim()) {
      isTypingRef.current = true;
      typingRecipientIdRef.current = activeContactId;
      socketRef.current.emit('typing', { recipientId: activeContactId, isTyping: true });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socketRef.current?.emit('typing', { recipientId: typingRecipientIdRef.current, isTyping: false });
        typingRecipientIdRef.current = null;
      }
    }, 900);
    if (!content.trim() && isTypingRef.current) {
      isTypingRef.current = false;
      socketRef.current.emit('typing', { recipientId: typingRecipientIdRef.current, isTyping: false });
      typingRecipientIdRef.current = null;
    }
  };
  const visibleContactGroups = contactGroups
    .map(group => ({
      ...group,
      contacts: group.contacts.filter(contact =>
        contact.name.toLowerCase().includes(contactSearch.trim().toLowerCase()) ||
        contact.role.toLowerCase().includes(contactSearch.trim().toLowerCase())
      )
    }))
    .filter(group => group.contacts.length > 0);

  const sendMessage = (event) => {
    event?.preventDefault();
    const content = messageInput.trim();
    if (!content || !activeContactId || !socketRef.current) return;

    setError('');
    clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current && activeContactId !== 'group-all') {
      socketRef.current.emit('typing', { recipientId: typingRecipientIdRef.current, isTyping: false });
      isTypingRef.current = false;
      typingRecipientIdRef.current = null;
    }
    socketRef.current.emit('sendMessage', {
      recipientId: activeContactId,
      content
    }, response => {
      if (response?.error) {
        setError(response.error);
        return;
      }
      setMessageInput(current => current === content ? '' : current);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex h-[75vh] overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <aside className={`w-full shrink-0 border-r border-slate-100 dark:border-slate-800 md:flex md:w-80 md:flex-col ${
        showContactsOnMobile ? 'flex flex-col' : 'hidden'
      }`}>
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <h1 className="text-xl font-black tracking-tight text-blue-955 dark:text-white">Messages</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {userRole === 'mentor'
              ? 'Message staff and your assigned scholars.'
              : 'Message anyone in your community or join the group conversation.'}
          </p>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
          {userRole !== 'mentor' && (
            <button
              type="button"
              onClick={() => {
                setActiveContactId('group-all');
                setUnreadCounts(previous => ({ ...previous, 'group-all': 0 }));
                setShowContactsOnMobile(false);
                setError('');
              }}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                activeContactId === 'group-all'
                  ? 'border-blue-100 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/30'
                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400 font-black text-blue-900">RH</span>
              <span>
                <span className="block text-sm font-bold text-blue-955 dark:text-white">Community group</span>
                <span className="mt-0.5 block truncate text-xs text-slate-400 dark:text-slate-500">
                  {conversationSummaries.get('group-all')?.content || 'Shared conversation'}
                </span>
              </span>
              {unreadCounts['group-all'] > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-900 px-1 text-[10px] font-bold text-white">
                  {unreadCounts['group-all']}
                </span>
              )}
            </button>
          )}
          {contacts.length > 0 && (
            <label className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 dark:border-slate-800">
              <Search size={15} className="shrink-0 text-slate-400" />
              <input
                value={contactSearch}
                onChange={event => setContactSearch(event.target.value)}
                placeholder="Search people"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-xs outline-none dark:text-white"
              />
            </label>
          )}
          {visibleContactGroups.map(group => (
            <section key={group.label}>
              <h2 className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {group.label}
              </h2>
              <div className="space-y-1">
                {group.contacts.map(contact => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => {
                      setActiveContactId(contact.id);
                      setUnreadCounts(previous => ({ ...previous, [contact.id]: 0 }));
                      setShowContactsOnMobile(false);
                      setError('');
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                      activeContactId === contact.id
                        ? 'border-blue-100 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/30'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-900 font-bold text-yellow-400">
                      {contact.avatarUrl
                        ? <img src={contact.avatarUrl} alt="" className="h-full w-full object-cover" />
                        : contact.initials || contact.name?.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="relative -ml-5 mt-7 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white dark:border-slate-900">
                        <span className={`absolute inset-0 rounded-full ${onlineContactIds.has(contact.id) ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-blue-955 dark:text-white">{contact.name}</span>
                        <span className="mt-0.5 block truncate text-xs capitalize text-slate-400 dark:text-slate-500">
                          {conversationSummaries.get(contact.id)?.content || (
                            ['scholar', 'beneficiary'].includes(contact.role)
                              ? contact.university || 'Assigned scholar'
                              : contact.role
                          )}
                        </span>
                    </span>
                    {unreadCounts[contact.id] > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-900 px-1 text-[10px] font-bold text-white">
                          {unreadCounts[contact.id]}
                        </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))}
          {loading && <p className="px-3 py-5 text-sm text-slate-400">Loading contacts...</p>}
          {contacts.length === 0 && !error && !loading && (
            <p className="px-3 py-5 text-sm text-slate-400">
              {userRole === 'mentor'
                ? 'No staff or assigned scholars are available to message.'
                : 'No contacts are available.'}
            </p>
          )}
          {contacts.length > 0 && visibleContactGroups.length === 0 && contactSearch && (
            <p className="px-3 py-5 text-sm text-slate-400">No contacts match your search.</p>
          )}
        </div>
      </aside>

      <section className={`flex min-w-0 flex-1 flex-col bg-slate-50/30 dark:bg-slate-950/20 ${
        showContactsOnMobile ? 'hidden md:flex' : 'flex'
      }`}>
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
          <button
            type="button"
            onClick={() => setShowContactsOnMobile(true)}
            className="p-2 text-slate-500 md:hidden"
            aria-label="Back to contacts"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-900 font-bold text-yellow-400">
            {activeContactId === 'group-all'
              ? 'RH'
              : activeContact?.avatarUrl
              ? <img src={activeContact.avatarUrl} alt="" className="h-full w-full object-cover" />
              : activeContact?.initials || activeContact?.name?.slice(0, 2).toUpperCase() || <MessageCircle size={18} />}
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-black text-blue-955 dark:text-white">
              {activeContactId === 'group-all' ? 'Community group' : activeContact?.name || 'Select a conversation'}
            </h2>
            {activeContactId === 'group-all' ? (
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Group conversation</p>
            ) : activeContact && (
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className={`h-1.5 w-1.5 rounded-full ${onlineContactIds.has(activeContact.id) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                {onlineContactIds.has(activeContact.id) ? 'Online' : 'Offline'}
                <span className="normal-case tracking-normal">
                  · {['scholar', 'beneficiary'].includes(activeContact.role) ? 'Assigned scholar' : activeContact.role}
                </span>
              </p>
            )}
          </div>
          <label className="ml-auto hidden max-w-48 flex-1 items-center gap-2 rounded-xl border border-slate-100 px-3 sm:flex dark:border-slate-800">
            <Search size={14} className="shrink-0 text-slate-400" />
            <input
              value={threadSearch}
              onChange={event => setThreadSearch(event.target.value)}
              placeholder="Search conversation"
              aria-label="Search conversation"
              className="min-w-0 flex-1 bg-transparent py-2 text-xs outline-none dark:text-white"
            />
          </label>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</p>}
          {typingUser && activeContactId !== 'group-all' && (
            <p className="text-xs font-medium italic text-slate-400">{typingUser.userName} is typing...</p>
          )}
          {!activeContact && activeContactId !== 'group-all' ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
              <MessageCircle size={36} />
              <p className="text-sm font-semibold">Choose a contact to start a conversation.</p>
            </div>
          ) : visibleMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
              <MessageCircle size={36} />
              <p className="text-xs font-semibold">
                {threadSearch ? 'No messages match your search.' : 'No messages in this conversation yet.'}
              </p>
            </div>
          ) : visibleMessages.map(message => {
            const isSelf = message.senderId === currentUser.id;
            return (
              <div key={message.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                  isSelf
                    ? 'rounded-tr-none bg-blue-900 text-white'
                    : 'rounded-tl-none border border-slate-100 bg-white text-blue-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white'
                }`}>
                  {!isSelf && <p className="mb-1 text-[9px] font-black uppercase tracking-wide text-slate-400">{message.senderName}</p>}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <time className="mt-1.5 block text-right text-[8px] font-bold text-slate-400">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="flex shrink-0 items-center gap-3 border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <textarea
            value={messageInput}
            onChange={handleMessageInput}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage(event);
              }
            }}
            placeholder={activeContact || activeContactId === 'group-all' ? 'Write a message... (Enter to send, Shift+Enter for a new line)' : 'Select a contact first'}
            disabled={!activeContact && activeContactId !== 'group-all'}
            rows={1}
            className="min-h-[50px] max-h-[150px] flex-1 resize-y rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-medium text-blue-955 placeholder-slate-400 focus:border-blue-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={(!activeContact && activeContactId !== 'group-all') || !messageInput.trim()}
            aria-label="Send message"
            className="rounded-2xl bg-blue-900 p-4 text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </section>
    </motion.div>
  );
}
