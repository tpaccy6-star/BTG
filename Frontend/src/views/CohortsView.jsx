import React, { useState, useEffect } from 'react';
import { Users, BarChart, CheckCircle2, Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';

export default function CohortsView({ currentUser, userRole }) {
  const [cohortsList, setCohortsList] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  
  // Modal & form states
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [cohortEditing, setCohortEditing] = useState(null);
  const [cohortName, setCohortName] = useState('');
  const [cohortUniv, setCohortUniv] = useState('');
  const [cohortScholars, setCohortScholars] = useState('0');
  const [cohortProgress, setCohortProgress] = useState('0');
  const [cohortStatus, setCohortStatus] = useState('Active');
  const [cohortAttendance, setCohortAttendance] = useState('90');
  
  const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, idToDelete: null });
  const [error, setError] = useState('');

  const fetchCohorts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cohorts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCohortsList(data);
        if (data.length > 0) {
          setSelectedCohort(prev => {
            if (!prev) return data[0];
            const found = data.find(c => c.id === prev.id);
            return found || data[0];
          });
        } else {
          setSelectedCohort(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch cohorts:', err);
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, []);

  const openCohortCreate = () => {
    setCohortEditing(null);
    setCohortName('');
    setCohortUniv('');
    setCohortScholars('0');
    setCohortProgress('0');
    setCohortStatus('Active');
    setCohortAttendance('90');
    setError('');
    setIsCohortModalOpen(true);
  };

  const openCohortEdit = (cohort) => {
    setCohortEditing(cohort);
    setCohortName(cohort.name);
    setCohortUniv(cohort.university || '');
    setCohortScholars(cohort.scholars?.toString() || '0');
    setCohortProgress(cohort.progress?.toString() || '0');
    setCohortStatus(cohort.status || 'Active');
    setCohortAttendance(cohort.attendance?.toString() || '90');
    setError('');
    setIsCohortModalOpen(true);
  };

  const handleCohortSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = cohortEditing ? `/api/admin/cohorts/${cohortEditing.id}` : '/api/admin/cohorts';
    const method = cohortEditing ? 'PUT' : 'POST';

    const payload = {
      name: cohortName,
      university: cohortUniv,
      scholars: parseInt(cohortScholars, 10) || 0,
      progress: parseInt(cohortProgress, 10) || 0,
      status: cohortStatus,
      attendance: parseInt(cohortAttendance, 10) || 0
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setIsCohortModalOpen(false);
        fetchCohorts();
      } else {
        throw new Error(data.error || 'Failed to save cohort.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCohort = async (id) => {
    setConfirmModalState({ isOpen: true, idToDelete: id });
  };

  const executeDeleteCohort = async () => {
    const id = confirmModalState.idToDelete;
    if (!id) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/cohorts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCohorts();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete cohort.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
    <ConfirmModal 
      isOpen={confirmModalState.isOpen}
      onClose={() => setConfirmModalState({ isOpen: false, idToDelete: null })}
      onConfirm={executeDeleteCohort}
      title="Delete Cohort"
      message="Are you sure you want to delete this cohort? All associated users and lessons will lose this cohort link."
      confirmText="Delete Cohort"
    />
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Cohort Oversight</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Monitor enrollment metrics, attendance rates, and progress across regions.</p>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={openCohortCreate}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm self-start md:self-auto"
          >
            <Plus size={14} />
            <span>Create Cohort</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cohort Grid List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">Active Cohorts</h2>
          
          {cohortsList.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
              <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">No cohorts registered yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {cohortsList.map(c => {
                const isSelected = selectedCohort && selectedCohort.id === c.id;
                return (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedCohort(c)}
                    className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected 
                        ? 'bg-blue-900 text-white border-blue-900 dark:bg-slate-800 dark:border-slate-700 shadow-md' 
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4 sm:mb-6">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-bold border ${
                          isSelected ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-blue-900 dark:text-yellow-400'
                        } text-[10px] sm:text-xs`}>
                          C{c.id}
                        </div>
                        <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${
                          isSelected 
                            ? 'bg-white/20 text-white' 
                            : c.status === 'Excelling' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' : 'bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400'
                        }`}>{c.status}</span>
                      </div>
   
                      <h3 className="text-xs sm:text-base font-bold tracking-tight leading-tight">{c.name}</h3>
                      <p className={`text-[8px] sm:text-[9px] font-bold uppercase mt-1 tracking-widest ${
                        isSelected ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                      }`}>{c.scholars} Scholars</p>
                    </div>
   
                    <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
                      <div className="flex justify-between text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">
                        <span className={isSelected ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}>Avg Progress</span>
                        <span className={isSelected ? 'text-white' : 'text-blue-900 dark:text-yellow-400'}>{c.progress}%</span>
                      </div>
                      <div className={`w-full h-1 sm:h-1.5 rounded-full overflow-hidden ${
                        isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        <div 
                          className={`h-full rounded-full ${isSelected ? 'bg-yellow-400' : 'bg-blue-900 dark:bg-yellow-400'}`} 
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Cohort Metrics */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 h-fit lg:sticky lg:top-24">
          {selectedCohort ? (
            <>
              <div className="border-b border-slate-50 dark:border-slate-800 pb-6">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Detailed Analysis</span>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">{selectedCohort.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{selectedCohort.university || 'No campus specified'}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-850 rounded-xl">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg"><Users size={16} /></div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Total Enrollment</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">{selectedCohort.scholars}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-850 rounded-xl">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg"><CheckCircle2 size={16} /></div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Avg Attendance</span>
                  </div>
                  <span className="font-bold text-emerald-650 dark:text-emerald-400 text-xs">{selectedCohort.attendance}%</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-850 rounded-xl">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-450 rounded-lg"><BarChart size={16} /></div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Completion Rate</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">{selectedCohort.progress}%</span>
                </div>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/40 dark:border-blue-900/30 p-4 rounded-xl text-[10px] space-y-1">
                <h4 className="font-bold text-blue-950 dark:text-blue-400">Academic Note</h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">This cohort progress is monitored dynamically. Change user cohort mappings to update enrollment details.</p>
              </div>

              {userRole === 'admin' && (
                <div className="flex space-x-3 pt-6 border-t border-slate-100 dark:border-slate-800 pb-2">
                  <button
                    onClick={() => openCohortEdit(selectedCohort)}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white rounded-xl font-bold text-xs uppercase transition-colors"
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCohort(selectedCohort.id)}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-650 dark:text-red-400 rounded-xl font-bold text-xs uppercase transition-colors"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-slate-400 font-medium text-sm">Select a cohort to view detailed analysis.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cohorts CRUD Modal */}
      <AnimatePresence>
        {isCohortModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCohortModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-6">
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">{cohortEditing ? 'Edit Cohort' : 'Create Cohort'}</h3>
                <button onClick={() => setIsCohortModalOpen(false)} className="p-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-350 hover:text-slate-650 dark:hover:text-white"><X size={16} /></button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-650 border border-red-100 p-3 rounded-xl text-xs font-bold flex items-center">
                  <AlertTriangle size={14} className="mr-2 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCohortSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cohort Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Cohort 5 - Musanze" 
                    value={cohortName} 
                    onChange={e => setCohortName(e.target.value)} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-blue-700 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Associated University / Hub</label>
                  <input 
                    type="text" 
                    placeholder="e.g. INES-Ruhengeri" 
                    value={cohortUniv} 
                    onChange={e => setCohortUniv(e.target.value)} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-blue-700 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Scholars Enrollment</label>
                    <input 
                      type="number" 
                      value={cohortScholars} 
                      onChange={e => setCohortScholars(e.target.value)} 
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-blue-700 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Avg Progress %</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={cohortProgress} 
                      onChange={e => setCohortProgress(e.target.value)} 
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-blue-700 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Status Indicator</label>
                    <select 
                      value={cohortStatus} 
                      onChange={e => setCohortStatus(e.target.value)} 
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-blue-700 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Excelling">Excelling</option>
                      <option value="Needs Attention">Needs Attention</option>
                      <option value="Just Started">Just Started</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Avg Attendance %</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={cohortAttendance} 
                      onChange={e => setCohortAttendance(e.target.value)} 
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 dark:focus:border-blue-700 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white" 
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-6 justify-end border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setIsCohortModalOpen(false)} className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 rounded-xl font-bold text-xs uppercase hover:bg-slate-55 dark:hover:bg-slate-750">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-900 text-white rounded-xl font-bold text-xs uppercase flex items-center hover:bg-blue-950">
                    <Plus size={12} className="mr-1.5" /> 
                    {cohortEditing ? 'Save Changes' : 'Create Cohort'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}

