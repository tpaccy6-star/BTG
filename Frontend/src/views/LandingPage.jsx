import React, { useState } from 'react';
import { 
  Flame, GraduationCap, Users, BookOpen, Award, MapPin, Phone, Mail, 
  CheckCircle2, ChevronRight, TrendingUp, Search, Printer, FileText, 
  ChevronDown, ChevronUp, AlertCircle, ThumbsUp, HelpCircle, CheckSquare, Square,
  Database, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage({ onEnterPortal }) {
  // Guide Sections checklist state
  const [completedSections, setCompletedSections] = useState({
    start: false,
    curriculum: false,
    tasks: false,
    attendance: false,
    chat: false
  });

  const toggleSection = (id) => {
    setCompletedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const completedCount = Object.values(completedSections).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Walkthrough Role active state
  const [activeRoleTab, setActiveRoleTab] = useState('scholar');

  // FAQs active indices
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  // Real Impact numbers
  const impactData = [
    { value: '80%', suffix: 'Graduation Rate', desc: 'Graduate High School compared to 33% nationally', color: 'text-indigo-650' },
    { value: '400+', suffix: 'Enrolled Girls', desc: 'Active scholars in leadership development programs', color: 'text-yellow-600' },
    { value: '95%', suffix: 'Alumni Score', desc: 'Alumni would recommend the program to other girls', color: 'text-green-600' },
    { value: '3,000', suffix: 'Parents Engaged', desc: 'Advancing their daughters\' education at home', color: 'text-blue-600' }
  ];

  // Programs list
  const programList = [
    { title: 'Her Voice Matters', desc: 'Focuses on communication, public expression, and digital presence.', icon: GraduationCap },
    { title: 'Ignite Program', desc: 'Drives leadership skills and confidence in young change-makers.', icon: Flame },
    { title: 'Be That Girl (BTG)', desc: 'Prepares university scholars with English, life, and tech skills.', icon: Award },
    { title: 'Empowering Women Scholars', desc: 'Supports young women pursuing higher education and careers.', icon: Users }
  ];

  // Guide search entries
  const guideTopics = [
    { id: 'start', title: 'Onboarding & Quick Start', category: 'onboard', content: 'Sign up or login via the credentials provided by the NGO directors. Use the "Enter Portal" button to access the user validation desk.', icon: HelpCircle },
    { id: 'curriculum', title: 'Curriculum & Lectures', category: 'catalog', content: 'Access your coursework inside the "Catalog" tab. Read handouts, view sequence lock details, and watch video lectures past 90% to mark tasks complete.', icon: BookOpen },
    { id: 'tasks', title: 'Homework Submissions', category: 'tasks', content: 'Upload files (PDF, DOCX, or images up to 5MB) on the lesson desk right-hand sidebar. Your submissions will immediately flag to your assigned mentor.', icon: FileText },
    { id: 'attendance', title: 'QR Check-In & Streak points', category: 'attendance', content: 'Mark daily attendance via the Attendance dashboard to keep your daily study streak going and earn streak certificates.', icon: CheckCircle2 },
    { id: 'chat', title: 'Direct Mentor Messaging', category: 'chat', content: 'Ask questions or request guidance by choosing "Mentor Chat" to reach your mentor in a real-time messaging layout.', icon: Users }
  ];

  const filteredGuideTopics = guideTopics.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Illustrated step-by-step data per role
  const roleSteps = {
    scholar: [
      { step: '1', title: 'Authenticate', desc: 'Log in with your email and password.', icon: Lock },
      { step: '2', title: 'Study Lesson', desc: 'Choose a lesson, watch video lectures, and read handout notes.', icon: BookOpen },
      { step: '3', title: 'Submit Task', desc: 'Upload your homework (max 5MB) in the sidebar.', icon: FileText },
      { step: '4', title: 'Daily Check-In', desc: 'Check in daily to build streak points.', icon: CheckCircle2 }
    ],
    mentor: [
      { step: '1', title: 'Roster Review', desc: 'Check your assigned scholars list under "My Scholars".', icon: Users },
      { step: '2', title: 'Open Task', desc: 'Preview uploaded files and documents directly.', icon: FileText },
      { step: '3', title: 'Assign Grade', desc: 'Grade from 0 to 100 and write feedback remarks.', icon: Award },
      { step: '4', title: 'Chat Guidance', desc: 'Provide mentoring advice in direct messaging logs.', icon: Mail }
    ],
    teacher: [
      { step: '1', title: 'Curriculum Ops', desc: 'Create, update, or remove syllabus units.', icon: Database },
      { step: '2', title: 'Add Notes', desc: 'Write rich learning summaries with live previews.', icon: BookOpen },
      { step: '3', title: 'Upload Handouts', desc: 'Attach PDF manuals for students to download.', icon: FileText },
      { step: '4', title: 'Broadcast Board', desc: 'Send global push notices to all dashboards.', icon: Mail }
    ],
    admin: [
      { step: '1', title: 'User CRUD', desc: 'Configure emails, passwords, and assign role privileges.', icon: Users },
      { step: '2', title: 'Manage Backups', desc: 'Create and download SQLite database backups.', icon: Award },
      { step: '3', title: 'Tweak Sandbox', desc: 'Toggle Mock SSL sandbox security parameters.', icon: Lock },
      { step: '4', title: 'Audit Registry', desc: 'Inspect system compliance and weekly NGO log archives.', icon: CheckCircle2 }
    ]
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-x-hidden selection:bg-yellow-400 selection:text-blue-955">
      {/* Dynamic print-scoped style tag to handle PDF/Printing without third party tools */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #interactive-guide, #interactive-guide * {
            visibility: visible;
          }
          #interactive-guide {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Glow decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-400/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 lg:px-16 py-4 flex items-center justify-between no-print">
        <div className="flex items-center space-x-3">
          <img src="/Logo.png" alt="Generation Rise" className="w-10 h-10 object-contain shrink-0" />
          <div>
            <span className="font-black text-sm tracking-wide text-blue-900 block leading-none">Generation Rise</span>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest font-black block mt-1">Inspiring & Empowering</span>
          </div>
        </div>
        
        {/* Desktop Nav links */}
        <nav className="hidden lg:flex items-center space-x-8 text-xs font-black uppercase tracking-wider text-slate-500">
          <a href="#about" className="hover:text-blue-900 transition-colors">About Us</a>
          <a href="#programs" className="hover:text-blue-900 transition-colors">Our Programs</a>
          <a href="#impact" className="hover:text-blue-900 transition-colors">Our Impact</a>
          <a href="#guide" className="hover:text-blue-900 transition-colors">Interactive Guide</a>
          <a href="#contact" className="hover:text-blue-900 transition-colors">Contact</a>
        </nav>

        <button 
          onClick={onEnterPortal} 
          className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl shadow-lg shadow-blue-900/10 text-xs uppercase tracking-widest transition-all animate-pulse"
        >
          Enter Portal
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-16 pt-20 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center no-print">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <span className="text-xs font-black text-blue-900 uppercase tracking-[0.2em] bg-blue-50 px-4 py-2 rounded-full border border-blue-100 inline-block">
            Empowerment Ecosystem
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-blue-955 leading-tight tracking-tight">
            Inspiring & empowering <br />
            <span className="text-blue-900 bg-gradient-to-r from-blue-900 to-indigo-755 bg-clip-text text-transparent">young women.</span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg font-medium leading-relaxed max-w-xl">
            Embracing an innovative, multi-faceted approach to achieving gender equity and empowering the next generation of female leaders in Rwanda.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={onEnterPortal} 
              className="px-8 py-4 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest border border-blue-900"
            >
              Access Portal
            </button>
            <a 
              href="#guide"
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-black rounded-2xl transition-all text-sm uppercase tracking-widest border border-slate-200 shadow-sm flex items-center justify-center"
            >
              Interactive Guide
            </a>
          </div>
        </motion.div>

        {/* Hero Widget Preview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white border border-slate-200/60 p-8 rounded-[3rem] shadow-xl relative"
        >
          <div className="absolute top-6 right-6 w-3.5 h-3.5 bg-green-500 rounded-full animate-ping" />
          <h3 className="font-black text-xl text-blue-955 mb-6 flex items-center"><TrendingUp className="mr-2 text-blue-900" /> Scholar Hub Dashboard</h3>
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
                <span className="font-black text-blue-955 text-lg block mt-1">92%</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tasks Completed</span>
                <span className="font-black text-blue-955 text-lg block mt-1">13 / 15</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* About Us Section */}
      <section id="about" className="max-w-7xl mx-auto px-6 lg:px-16 py-24 border-t border-slate-200/40 bg-white no-print">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg">Our Roots</span>
            <h2 className="text-3xl lg:text-4xl font-black text-blue-955 tracking-tight leading-tight">About Generation Rise</h2>
            <p className="text-slate-500 leading-relaxed text-sm font-medium">
              We are a community-based and community-driven organization – founded and led by a team of passionate young women, including previous program graduates.
            </p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-3">
              <h4 className="font-black text-blue-950 text-base">Innovative Philosophy</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Generation Rise embraces an innovative, multi-faceted approach to achieving gender equity and empowering the next generation of female leaders in the region.
              </p>
            </div>
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-3">
              <h4 className="font-black text-blue-955 text-base">Impact Focus</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                We implement an impressive portfolio of educational and career development programs to provide young women and girls with the opportunities and resources they need to be what they want to be.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs List */}
      <section id="programs" className="max-w-7xl mx-auto px-6 lg:px-16 py-24 space-y-12 no-print">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Active Development</span>
          <h2 className="text-3xl font-black text-blue-955 tracking-tight">Our Popular Programs</h2>
          <p className="text-slate-505 font-medium text-sm">Promoting education, health, and economic empowerment for girls.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {programList.map((prog, i) => (
            <div key={i} className="bg-white border border-slate-200/50 hover:border-blue-900 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <prog.icon size={22} />
                </div>
                <h3 className="font-black text-base text-blue-955 mb-2">{prog.title}</h3>
                <p className="text-xs text-slate-505 leading-relaxed font-medium">{prog.desc}</p>
              </div>
              <div className="flex items-center text-blue-900 font-black text-[10px] uppercase tracking-wider mt-6 cursor-pointer">
                <span>Read program specs</span> <ChevronRight size={12} className="ml-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Statistics */}
      <section id="impact" className="bg-blue-955 py-24 px-6 lg:px-16 text-white relative overflow-hidden no-print">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#1e3a8a,transparent)] opacity-40" />
        
        <div className="relative z-10 max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Measurable Results</span>
            <h2 className="text-3xl font-black text-white tracking-tight">Our Direct Work in Numbers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {impactData.map((data, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
                <span className="text-4xl font-black tracking-tight block text-yellow-400">{data.value}</span>
                <span className="text-xs font-black block uppercase tracking-wider text-slate-200">{data.suffix}</span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium pt-2 border-t border-slate-800/40">{data.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials & Instructor Highlights */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-24 space-y-16 border-t border-slate-200/40 no-print bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Testimonials */}
          <div className="space-y-8">
            <div>
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest block">Student Voices</span>
              <h2 className="text-3xl font-black text-blue-955 tracking-tight mt-1">What Our Scholars Say</h2>
            </div>
            <div className="space-y-6">
              {[
                { quote: "This platform completely changed how I study. The interactive videos and instant quiz feedback make learning complex math and logic exciting and accessible.", author: "Diane T.", role: "BTG Scholar (Computer & Math)" },
                { quote: "Being able to upload my Agri-Economics projects and receive detailed scoring and remarks from my mentor helped me secure an internship in Kigali.", author: "Faith U.", role: "BTG Scholar (Agri-Economics)" }
              ].map((t, idx) => (
                <div key={idx} className="bg-slate-50/50 border border-slate-200/60 p-6 rounded-3xl shadow-sm space-y-3">
                  <p className="text-xs text-slate-505 italic font-medium leading-relaxed">"{t.quote}"</p>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">{t.author}</h4>
                    <p className="text-[9px] text-blue-900 font-bold uppercase tracking-wider">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructor Highlights */}
          <div className="space-y-8">
            <div>
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest block">Dedicated Mentors</span>
              <h2 className="text-3xl font-black text-blue-955 tracking-tight mt-1">Meet Our Faculty Directors</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { name: "Sarah Miller", role: "Lead Career Advisor", initials: "SM", desc: "Expert in business canvas layout and CV reviews." },
                { name: "David Kabera", role: "Director of Curriculum", initials: "DK", desc: "Facilitates STEM and computer science curriculum modules." }
              ].map((inst, idx) => (
                <div key={idx} className="bg-slate-50/50 border border-slate-200/60 p-6 rounded-3xl text-center space-y-4 shadow-sm hover:-translate-y-1 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-850 flex items-center justify-center text-white font-black text-xl mx-auto shadow-md">
                    {inst.initials}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-850 text-xs">{inst.name}</h4>
                    <p className="text-[9px] text-blue-900 font-bold uppercase tracking-wider mt-0.5">{inst.role}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed">{inst.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- TASK 4: LIVE LEARNING STATS --- */}
      <section className="py-16 bg-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10">
          <div className="text-center mb-12">
            <span className="text-yellow-400 font-black tracking-widest uppercase text-[10px]">Real-Time Metrics</span>
            <h2 className="text-3xl font-black mt-2 tracking-tight">Live Platform Activity</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Active Users Today', value: '1,204' },
              { label: 'Lessons Completed', value: '45,892' },
              { label: 'Questions Asked to AI', value: '12,450' },
              { label: 'Certificates Issued', value: '890' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 border border-white/10 hover:bg-white/15 transition-colors">
                <p className="text-3xl sm:text-4xl font-black text-yellow-400 mb-2">{stat.value}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TASK 4: TESTIMONIALS --- */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="text-center mb-16">
            <span className="text-blue-900 font-black tracking-widest uppercase text-[10px]">Success Stories</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">What Our Scholars Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah M.', role: 'University Scholar', text: 'Generation Rise transformed my approach to leadership. The interactive lessons and AI mentor helped me secure a scholarship!' },
              { name: 'Nadine I.', role: 'High School Student', text: 'The English communication modules gave me the confidence to speak up in class. The gamified streaks keep me coming back every day.' },
              { name: 'Aline U.', role: 'Alumni', text: 'Being part of the Ignite Program was life-changing. The support from my mentors through the portal was incredible.' }
            ].map((test, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] shadow-sm relative hover:-translate-y-1 transition-transform">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-blue-900 font-black text-2xl">"</div>
                <p className="text-sm font-medium text-slate-600 italic leading-relaxed mb-6">"{test.text}"</p>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{test.name}</h4>
                  <p className="text-[10px] text-blue-900 font-bold uppercase tracking-widest mt-0.5">{test.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TASK 7: INTERACTIVE USER GUIDE SECTION --- */}
      <section id="guide" className="max-w-7xl mx-auto px-6 lg:px-16 py-24 border-t border-slate-200/40 bg-slate-50/50">
        <div id="interactive-guide" className="space-y-12">
          
          {/* Header of the guide & Document Action triggers */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/80 pb-6">
            <div>
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest block">Interactive Help Desk</span>
              <h2 className="text-3xl font-black text-blue-955 tracking-tight mt-1">System Operation & Walkthrough Guide</h2>
              <p className="text-slate-500 font-medium text-xs mt-1">Step-by-step checklists, searchable quick references, and tips to use the portal effectively.</p>
            </div>
            
            <div className="flex items-center space-x-3 shrink-0 no-print">
              <button 
                onClick={handlePrint}
                className="px-4 py-2.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center shadow-sm"
              >
                <Printer size={13} className="mr-2 text-slate-450" /> Print Guide / Save as PDF
              </button>
            </div>
          </div>

          {/* Quick Onboarding Progress Checklist */}
          <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[2rem] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Walkthrough Completion Progress</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Toggle sections below as you complete each guide topic.</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-black text-blue-900">{progressPercent}% Completed</span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase">{completedCount} / 5</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40 relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-900 to-indigo-600 rounded-full"
              />
            </div>

            {/* Interactive checklist boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              {[
                { id: 'start', title: '1. Onboarding' },
                { id: 'curriculum', title: '2. Study Catalog' },
                { id: 'tasks', title: '3. Submit Tasks' },
                { id: 'attendance', title: '4. Check-Ins' },
                { id: 'chat', title: '5. Direct Chat' }
              ].map(sec => {
                const isDone = completedSections[sec.id];
                return (
                  <button
                    key={sec.id}
                    onClick={() => toggleSection(sec.id)}
                    className={`p-3.5 border rounded-2xl flex items-center space-x-2.5 text-left text-xs font-black transition-all ${
                      isDone 
                        ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-inner' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {isDone ? <CheckSquare size={16} className="text-blue-900 shrink-0" /> : <Square size={16} className="text-slate-400 shrink-0" />}
                    <span>{sec.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Searchable reference topics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left panel searchable topics */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[2rem] shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <h3 className="font-black text-slate-900 text-base flex items-center"><Search size={16} className="mr-2 text-blue-900" /> Searchable Help Center</h3>
                  
                  {/* Search Input */}
                  <div className="relative flex-1 sm:max-w-xs no-print">
                    <input
                      type="text"
                      placeholder="Search setup instructions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-900 transition-all text-slate-800"
                    />
                    <Search size={12} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>

                {/* Filtered topics list */}
                <div className="space-y-4">
                  {filteredGuideTopics.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs italic">No matching help topics found.</div>
                  ) : (
                    filteredGuideTopics.map(topic => {
                      const TopicIcon = topic.icon;
                      return (
                        <div key={topic.id} className="p-5 bg-slate-50/50 border border-slate-200/40 rounded-2xl flex items-start space-x-4">
                          <div className="p-3 bg-white border border-slate-200/50 rounded-xl text-blue-900 shrink-0">
                            <TopicIcon size={16} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-800 text-xs flex items-center">{topic.title} <span className="ml-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-900 rounded-full">{topic.category}</span></h4>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{topic.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right side role specific steps walkthrough */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 p-6 rounded-[2rem] shadow-sm space-y-6">
                <h3 className="font-black text-slate-900 text-base border-b border-slate-100 pb-4">Illustrated Step Walkthroughs</h3>
                
                {/* Role selection tab row */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl no-print">
                  {['scholar', 'mentor', 'teacher', 'admin'].map(role => (
                    <button
                      key={role}
                      onClick={() => setActiveRoleTab(role)}
                      className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        activeRoleTab === role 
                          ? 'bg-blue-900 text-white shadow-sm' 
                          : 'text-slate-550 hover:bg-slate-200'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                {/* Vertical illustrated list */}
                <div className="space-y-4">
                  {roleSteps[activeRoleTab].map((step, idx) => {
                    const StepIcon = step.icon;
                    return (
                      <div key={idx} className="flex items-center space-x-3.5 text-xs">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 font-black flex items-center justify-center shadow-inner shrink-0">
                          {step.step}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-850 truncate">{step.title}</h4>
                          <p className="text-[10px] text-slate-450 truncate font-semibold">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Quick Start & Tips/Best Practices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Quick Start Guide */}
            <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[2rem] shadow-sm space-y-4">
              <h3 className="font-black text-blue-955 text-sm flex items-center border-b border-slate-50 pb-3"><ThumbsUp size={16} className="mr-2 text-blue-900" /> Quick Start Guide</h3>
              <ul className="space-y-3 text-xs leading-relaxed text-slate-505 font-medium">
                <li className="flex items-start"><ChevronRight size={14} className="mr-2 text-blue-900 shrink-0 mt-0.5" /> <strong>Credentials:</strong> Default logins are: \`scholar@generationrise.org\`, \`mentor@generationrise.org\`, \`teacher@generationrise.org\`, or \`admin@generationrise.org\` (all passwords are \`password123\`).</li>
                <li className="flex items-start"><ChevronRight size={14} className="mr-2 text-blue-900 shrink-0 mt-0.5" /> <strong>Role Testing:</strong> To fully test the evaluation flow, submit homework in a scholar tab, log out, log in as a mentor, open the task in the Grading tab, and submit a score.</li>
              </ul>
            </div>

            {/* Tips & Best Practices */}
            <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[2rem] shadow-sm space-y-4">
              <h3 className="font-black text-blue-955 text-sm flex items-center border-b border-slate-50 pb-3"><AlertCircle size={16} className="mr-2 text-blue-900" /> Tips & Best Practices</h3>
              <ul className="space-y-3 text-xs leading-relaxed text-slate-505 font-medium">
                <li className="flex items-start"><ChevronRight size={14} className="mr-2 text-blue-900 shrink-0 mt-0.5" /> <strong>Data Safety:</strong> Go to the System parameters tab inside the Admin panel to backup the SQLite database file prior to bulk updates.</li>
                <li className="flex items-start"><ChevronRight size={14} className="mr-2 text-blue-900 shrink-0 mt-0.5" /> <strong>Interactive Chat:</strong> If you are unsure how a feature functions, click the Sparkles icon on the bottom right and ask the AI Platform Assistant for guidelines!</li>
              </ul>
            </div>

          </div>

          {/* Expandable FAQs Section */}
          <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-[2rem] shadow-sm space-y-6">
            <h3 className="font-black text-slate-900 text-sm border-b border-slate-50 pb-3">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {[
                { q: 'How do I perform a database backup?', a: 'Log in as an Admin, visit Settings (System Controls), open the System Param tab, and click Create Full Backup. Download your copy directly.' },
                { q: 'What files are supported for scholar tasks?', a: 'Students can upload PDF worksheets, DOCX reports, or PNG/JPEG image files. File sizes must remain under 5MB per submission.' },
                { q: 'Can students check in their own attendance?', a: 'Yes! Scholars can log their own presence for the current date inside the Attendance dashboard by scanning the check-in simulator. They are securely blocked from marking attendance for anyone else.' }
              ].map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                    <button 
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="w-full p-4 bg-slate-50 hover:bg-slate-100/50 flex justify-between items-center text-left font-bold text-slate-800 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="p-4 border-t border-slate-100 bg-white text-slate-500 font-semibold leading-relaxed"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* Footer Contact Info */}
      <footer id="contact" className="bg-slate-900 text-slate-300 py-16 px-6 lg:px-16 border-t border-slate-800 no-print">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/Logo.png" alt="Generation Rise Logo" className="w-10 h-10 object-contain invert brightness-0" />
              <span className="font-black text-sm text-white uppercase tracking-wider">Generation Rise</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-sm">
              Inspiring & empowering young people through education. Promoting adolescent health, social gender equity, and economic empowerment.
            </p>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-[10px] font-black uppercase text-white tracking-widest">Contacts</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <Phone size={14} className="text-blue-400" />
                <span>+250793767051</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={14} className="text-blue-400" />
                <span>info@generationrise.org</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={14} className="text-blue-400 shrink-0" />
                <span>31 KG 213 Street, Kigali, Rwanda</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-[10px] font-black uppercase text-white tracking-widest">Useful Links</h4>
            <ul className="space-y-2 text-xs text-slate-400 font-bold">
              <li><a href="#about" className="hover:text-yellow-400 transition-colors">Her Voice Matters</a></li>
              <li><a href="#programs" className="hover:text-yellow-400 transition-colors">Ignite Program</a></li>
              <li><a href="#impact" className="hover:text-yellow-400 transition-colors">Empowering Women Scholars</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-12 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <p>© 2026 Building The Generation Rise. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:underline">Imprint</a>
            <a href="#" className="hover:underline">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
