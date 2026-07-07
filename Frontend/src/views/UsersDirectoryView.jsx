import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, GraduationCap, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UsersDirectoryView() {
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUsersList(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.university && u.university.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield size={14} className="text-purple-600 dark:text-purple-450" />;
      case 'teacher': return <Award size={14} className="text-orange-500 dark:text-orange-400" />;
      case 'mentor': return <Users size={14} className="text-emerald-500 dark:text-emerald-400" />;
      default: return <GraduationCap size={14} className="text-blue-900 dark:text-yellow-450" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">User Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Audit profile registries, streak statistics, and university listings.</p>
        </div>

        {/* Directory Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search user profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white transition-all shadow-sm"
            />
            <Search size={12} className="absolute left-3 top-3 text-slate-400" />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-yellow-450 text-slate-800 dark:text-white transition-all shadow-sm"
            >
              <option value="all">All Roles</option>
              <option value="scholar">Scholars</option>
              <option value="mentor">Mentors</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">Loading user profiles directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">No system accounts found matching query parameters.</div>
        ) : (
          <>
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80">
                  <th className="px-6 py-4">Profile</th>
                  <th className="px-6 py-4">Ecosystem Email</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Institution</th>
                  <th className="px-6 py-4 text-right">Streak Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-blue-900 dark:text-yellow-455 font-bold flex items-center justify-center text-[10px] shrink-0 border border-slate-200/20 dark:border-slate-700/30">
                        {u.initials}
                      </div>
                      <span className="truncate text-xs">{u.name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1.5 text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">
                        {getRoleIcon(u.role)}
                        <span>{u.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">{u.university || 'Global HQ'}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-blue-900 dark:text-yellow-455">
                      {u.streakDays !== undefined ? `${u.streakDays} Days` : '0 Days'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="space-y-4 md:hidden p-4">
            {filteredUsers.map(u => (
              <div key={u.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-blue-900 dark:text-yellow-455 font-bold flex items-center justify-center text-[10px] shrink-0 border border-slate-200/20 dark:border-slate-700/30">
                      {u.initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">{u.name}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{u.email}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center space-x-1.5 text-xs font-semibold capitalize text-slate-705 dark:text-slate-300">
                    {getRoleIcon(u.role)}
                    <span>{u.role}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/45 dark:border-slate-855/60">
                  <div>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 block font-semibold uppercase tracking-wider">Institution</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">{u.university || 'Global HQ'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 block font-semibold uppercase tracking-wider">Streak Check</span>
                    <span className="text-xs font-bold text-blue-900 dark:text-yellow-455">{u.streakDays !== undefined ? `${u.streakDays} Days` : '0 Days'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
