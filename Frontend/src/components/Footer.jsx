import React from 'react';

export default function Footer({ isDarkMode }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`hidden lg:block mt-auto pt-6 pb-24 lg:pb-6 px-4 lg:px-8 border-t transition-colors duration-200 text-xs shrink-0 ${
      isDarkMode 
        ? 'bg-[#0b0f19]/40 border-slate-800/60 text-slate-400' 
        : 'bg-white/40 border-slate-200/60 text-slate-500'
    }`}>
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: Copyright & Brand */}
        <div className="flex items-center space-x-2">
          <span className={`font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>Generation Rise</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span>&copy; {currentYear} All rights reserved.</span>
        </div>

        {/* Center: System Status Indicator */}
        <div className="flex items-center space-x-2 bg-slate-100/50 dark:bg-slate-900/40 px-3 py-1.5 rounded-full border border-slate-200/40 dark:border-slate-800/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Systems Operational
          </span>
        </div>

        {/* Right Side: Quick Links */}
        <div className="flex items-center space-x-6 font-semibold">
          <a 
            href="#/settings" 
            className="hover:text-blue-900 dark:hover:text-yellow-400 transition-colors"
          >
            Support
          </a>
          <a 
            href="#/settings" 
            className="hover:text-blue-900 dark:hover:text-yellow-400 transition-colors"
          >
            Privacy Policy
          </a>
          <a 
            href="#/settings" 
            className="hover:text-blue-900 dark:hover:text-yellow-400 transition-colors"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
