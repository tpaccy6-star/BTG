import React from 'react';

export default function Footer({ isDarkMode }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`rise-footer hidden lg:block mt-auto pt-5 pb-5 px-4 lg:px-6 border-t transition-colors duration-200 text-xs shrink-0 ${
      isDarkMode ? 'text-slate-400' : 'text-slate-500'
    }`}>
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 md:flex-row">
        {/* Left Side: Copyright & Brand */}
        <div className="flex items-center space-x-2">
          <span className="rise-footer-brand font-bold tracking-tight">Generation Rise</span>
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
            className="rise-footer-link transition-colors"
          >
            Support
          </a>
          <a
            href="#/settings" 
            className="rise-footer-link transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#/settings" 
            className="rise-footer-link transition-colors"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
