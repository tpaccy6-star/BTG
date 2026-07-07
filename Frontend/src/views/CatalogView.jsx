import React, { useState } from 'react';
import { BookOpen, CheckSquare, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CatalogView({ currentUser, setCurrentView, lessons, onSelectLesson }) {
  const [selectedPillar, setSelectedPillar] = useState('entrepreneur');

  const submissions = currentUser?.submissions || [];

  const learningPillars = [
    { id: 'career', title: 'Career Readiness', color: 'bg-blue-900', est: '~45 min/lesson' },
    { id: 'entrepreneur', title: 'Entrepreneurship', color: 'bg-yellow-500', est: '~60 min/lesson' },
    { id: 'english', title: 'Professional English', color: 'bg-slate-700', est: '~30 min/lesson' },
    { id: 'life', title: 'Life Skills', color: 'bg-blue-700', est: '~40 min/lesson' },
  ];

  // Dynamically compute progress per pillar based on lessons from db
  const pillarStats = learningPillars.map(p => {
    const pillarLessons = lessons?.filter(l => l.pillar === p.id) || [];
    const total = pillarLessons.length;
    const completed = submissions.filter(s => s.lesson?.pillar === p.id && (s.status === 'completed' || s.status === 'graded')).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { ...p, total, completed, progress };
  });

  const activePillar = pillarStats.find(p => p.id === selectedPillar);

  // Group lessons of current selected pillar
  const activeLessons = lessons?.filter(l => l.pillar === selectedPillar) || [];

  // Sequential unlock logic:
  // - First lesson is always unlocked.
  // - Lesson index `i` is unlocked if lesson index `i-1` is completed (status is completed or graded).
  const lessonsWithStatus = activeLessons.map((lesson, idx) => {
    const sub = submissions.find(s => s.lessonId === lesson.id);
    let status = 'due';
    let lockedBy = null;
    
    if (sub) {
      status = sub.status; // 'completed' or 'graded'
    } else {
      // Check if previous lesson was completed
      if (idx > 0) {
        const prevLesson = activeLessons[idx - 1];
        const prevSub = submissions.find(s => s.lessonId === prevLesson.id);
        const prevCompleted = prevSub && (prevSub.status === 'completed' || prevSub.status === 'graded');
        if (!prevCompleted) {
          status = 'locked';
          lockedBy = prevLesson.title;
        }
      }
    }

    return { ...lesson, status, lockedBy };
  });

  const handleLessonClick = (lesson) => {
    if (lesson.status !== 'locked') {
      onSelectLesson(lesson.id);
      setCurrentView('lesson');
      window.location.hash = `#/lesson`;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.98 }} 
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Learning Catalog</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Explore courses, master new skills, and track your progress.</p>
      </div>

      {/* Pillars Navigation Tabs */}
      <div className="flex flex-wrap gap-2.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 rounded-2xl">
        {pillarStats.map((pillar) => {
          const isSelected = selectedPillar === pillar.id;
          return (
            <button
              key={pillar.id}
              onClick={() => setSelectedPillar(pillar.id)}
              className={`flex-1 min-w-[150px] px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 ${
                isSelected 
                  ? 'bg-blue-900 dark:bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-blue-900 dark:hover:text-white'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${pillar.color} ${isSelected ? 'ring-2 ring-white/50' : ''}`} />
              <span>{pillar.title}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Pillar Details Card */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-fit lg:sticky lg:top-24">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Active Program</span>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-450 rounded-full">
                {activePillar?.est}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              {activePillar?.title}
            </h2>
            <p className="text-slate-505 dark:text-slate-400 font-medium text-xs leading-relaxed mb-6">
              Equip yourself with practical competencies. Complete all modules under this pillar to earn your certification.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between text-[11px] font-bold text-slate-505 dark:text-slate-400">
                <span>Pillar Progress</span>
                <span className="text-blue-900 dark:text-yellow-400 font-bold">
                  {activePillar?.progress}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                <div 
                  className={`h-full rounded-full ${activePillar?.color} transition-all duration-500`}
                  style={{ width: `${activePillar?.progress}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-2">
                {activePillar?.completed} of {activePillar?.total} lessons completed
              </p>
            </div>
          </div>

          <button 
            onClick={() => {
              const firstOpen = lessonsWithStatus.find(l => l.status === 'due' || l.status === 'completed' || l.status === 'graded');
              if (firstOpen) {
                handleLessonClick(firstOpen);
              } else if (lessonsWithStatus.length > 0) {
                handleLessonClick(lessonsWithStatus[0]);
              }
            }} 
            className="mt-8 w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm transition-all"
          >
            Resume Learning
          </button>
        </div>

        {/* Module List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight mb-2">Module Curriculum</h3>
          {lessonsWithStatus.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
              No lessons available in this pillar.
            </div>
          ) : (
            lessonsWithStatus.map((mod, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={mod.id}
                className={`relative group/tooltip p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all flex items-center justify-between group ${
                  mod.status === 'locked' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                }`}
                onClick={() => handleLessonClick(mod)}
              >
                {/* Custom Hover Tooltip */}
                {mod.status === 'locked' && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-950 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-xl border border-slate-800">
                    Unlock this module by completing "{mod.lockedBy}" first
                  </div>
                )}
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    mod.status === 'completed' || mod.status === 'graded'
                      ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400' 
                      : mod.status === 'due' 
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-400' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}>
                    {mod.status === 'completed' || mod.status === 'graded' ? <CheckSquare size={16} /> : i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-blue-900 dark:group-hover:text-yellow-400 transition-colors">
                      {mod.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{mod.duration} mins • {mod.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                    mod.status === 'graded'
                      ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-455 border border-green-200 dark:border-green-850'
                      : mod.status === 'completed' 
                      ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-850/50' 
                      : mod.status === 'due' 
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-450 border border-blue-200/50 dark:border-blue-850/50' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-800'
                  }`}>
                    {mod.status}
                  </span>
                  {mod.status !== 'locked' && <ChevronRight size={16} className="text-slate-400" />}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
