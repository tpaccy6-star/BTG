import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Award, Star, X } from 'lucide-react';

export default function LevelUpModal({ level, newBadge, onClose }) {
  useEffect(() => {
    // Trigger confetti explosion on mount
    const end = Date.now() + 3 * 1000;
    const colors = ['#facc15', '#3b82f6', '#10b981'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-800"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} className="text-slate-500 dark:text-slate-400" />
          </button>

          <div className="w-24 h-24 mx-auto mb-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center border-4 border-yellow-400">
            {newBadge ? (
              <span className="text-5xl">{newBadge.emoji}</span>
            ) : (
              <Star className="w-12 h-12 text-yellow-500 fill-yellow-500" />
            )}
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {newBadge ? 'Badge Unlocked!' : 'Level Up!'}
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
            {newBadge ? (
              <>You earned the <strong className="text-slate-800 dark:text-slate-200">{newBadge.title}</strong> badge.</>
            ) : (
              <>Congratulations! You reached <strong className="text-yellow-600 dark:text-yellow-500">Level {level}</strong>!</>
            )}
            <br/><span className="text-xs opacity-80 block mt-2">Keep up the great work.</span>
          </p>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-yellow-950 font-black rounded-xl shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Awesome!
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
