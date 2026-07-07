import React from 'react';
import { Flame, GraduationCap, Users, BookOpen, Award, MapPin, Globe, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const mockEvents = [
  { id: 1, title: 'Leadership Workshop', type: 'f2f', date: 'Today', time: '2:00 PM', location: 'Main Hall', attendees: 42 },
  { id: 2, title: 'Financial Literacy 101', type: 'online', date: 'Tomorrow', time: '10:00 AM', location: 'Zoom', attendees: 156 },
  { id: 3, title: 'Community Service Day', type: 'f2f', date: 'Oct 25', time: '8:00 AM', location: 'City Park', attendees: 85 },
];

export default function LandingPage({ onEnterPortal }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-x-hidden selection:bg-yellow-400 selection:text-blue-955">
      {/* Premium Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-400/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="/Logo.png" alt="Generation Rise" className="w-12 h-12 object-contain logo-sharp shrink-0" />
          <span className="font-black text-base text-blue-900 tracking-wide">Generation Rise</span>
        </div>
        <button 
          onClick={onEnterPortal} 
          className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl shadow-lg shadow-blue-900/10 text-xs uppercase tracking-widest transition-all"
        >
          Enter Portal
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-16 pt-20 pb-22 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <span className="text-xs font-black text-blue-900 uppercase tracking-[0.25em] bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
            Building The Generation Rise
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-blue-955 leading-tight tracking-tight">
            Empowering Scholars,<br />
            <span className="text-blue-900 bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">Creating Impact.</span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg font-medium leading-relaxed max-w-xl">
            An advanced, user-centered NGO learning and operations ecosystem. Connecting scholars with dedicated mentors to foster professional growth, career readiness, entrepreneurship, and compliant global reporting.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={onEnterPortal} 
              className="px-8 py-4 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest border border-blue-900"
            >
              Access Portal
            </button>
            <button 
              onClick={() => {
                document.getElementById('pillars-section')?.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-black rounded-2xl transition-all text-sm uppercase tracking-widest border border-slate-200 shadow-sm"
            >
              Learn More
            </button>
          </div>
        </motion.div>

        {/* Hero Widget Preview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white border border-slate-200/60 p-8 rounded-[3rem] shadow-xl relative"
        >
          <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 rounded-full animate-ping" />
          <h3 className="font-black text-xl text-blue-950 mb-6">Scholar Hub Dashboard</h3>
          <div className="space-y-6 text-sm">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-400/10 text-yellow-600 rounded-xl"><Flame size={20} /></div>
                <span className="font-bold text-slate-600">Daily Study Streak</span>
              </div>
              <span className="font-black text-blue-900 text-lg">14 Days</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-xs text-slate-400 uppercase tracking-widest">
                <span>Overall Progression</span>
                <span className="text-blue-900">68%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "68%" }}
                  transition={{ duration: 1.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-900 to-yellow-500 rounded-full" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Attendance Rate</span>
                <span className="font-black text-blue-950 text-lg block mt-1">92%</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tasks Completed</span>
                <span className="font-black text-blue-950 text-lg block mt-1">13 / 15</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Metrics Banner */}
      <section className="bg-blue-955 py-16 px-6 lg:px-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e3a8a,transparent)] opacity-40" />
        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Total Scholars Active', val: '245+' },
            { label: 'Certified Mentors', val: '24' },
            { label: 'Scholar Engagement', val: '92%' },
            { label: 'NGO Compliance', val: '100%' }
          ].map((metric, i) => (
            <div key={i} className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-white">{metric.val}</p>
              <p className="text-[10px] sm:text-xs font-bold text-blue-200 uppercase tracking-widest">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars Section */}
      <section id="pillars-section" className="max-w-7xl mx-auto px-6 lg:px-16 py-24 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-black text-blue-955 tracking-tight">Ecosystem Learning Pillars</h2>
          <p className="text-slate-500 font-medium">Equipping future leaders with critical readiness and sustainable real-world competencies.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { title: 'Career Readiness', desc: 'CV development, interview simulator tools, resume reviews, and internship prep.', icon: GraduationCap, color: 'border-blue-200 bg-white hover:border-blue-500 hover:shadow-lg text-blue-700' },
            { title: 'Entrepreneurship', desc: 'Value proposition design, ideation, business model canvas, and seed financials.', icon: Users, color: 'border-yellow-200 bg-white hover:border-yellow-500 hover:shadow-lg text-yellow-600' },
            { title: 'Professional English', desc: 'Email etiquettes, written documentation, public speaking, and debate exercises.', icon: BookOpen, color: 'border-slate-200 bg-white hover:border-slate-500 hover:shadow-lg text-slate-600' },
            { title: 'Life Skills', desc: 'Goal setting, time management logs, budgeting, and emotional intelligence.', icon: Award, color: 'border-blue-200 bg-white hover:border-blue-400 hover:shadow-lg text-blue-600' }
          ].map((p, i) => (
            <div key={i} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${p.color} flex flex-col justify-between hover:-translate-y-1 transition-all`}>
              <div>
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 flex items-center justify-center mb-4 sm:mb-6">
                  <p.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="text-sm sm:text-lg font-bold text-blue-955 mb-1 sm:mb-2">{p.title}</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 leading-normal sm:leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Landing Page Footer */}
      <footer className="text-center py-12 border-t border-slate-200 bg-white text-slate-400 text-xs">
        <p>© 2026 Building The Generation Rise. All rights reserved.</p>
      </footer>
    </div>
  );
}
