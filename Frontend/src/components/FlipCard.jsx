import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function FlipCard({ frontContent, backContent }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-full max-w-sm mx-auto h-48 sm:h-64 my-6" style={{ perspective: '1000px' }}>
      <motion.div
        className="relative w-full h-full text-center cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Face */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 hover:shadow-md hover:border-blue-300 dark:hover:border-yellow-400 transition-all"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">{frontContent}</h3>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-4">Click to Flip</p>
        </div>

        {/* Back Face */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 dark:from-yellow-400 dark:to-yellow-500 border border-transparent rounded-2xl shadow-md p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-white dark:text-blue-950 font-medium leading-relaxed text-sm sm:text-base">{backContent}</p>
        </div>
      </motion.div>
    </div>
  );
}
