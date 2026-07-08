import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function Tabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="my-6 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      {/* Tab Headers */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-x-auto">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors relative ${
              activeTab === index 
                ? 'text-blue-900 dark:text-yellow-400' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.title}
            {activeTab === index && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 dark:bg-yellow-400"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {tabs[activeTab].content}
        </motion.div>
      </div>
    </div>
  );
}
