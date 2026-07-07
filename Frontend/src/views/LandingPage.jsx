import React from 'react';
import { Flame, GraduationCap, Users, BookOpen, Award, MapPin, Phone, Mail, CheckCircle2, ChevronRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage({ onEnterPortal }) {
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-x-hidden selection:bg-yellow-400 selection:text-blue-955">
      {/* Glow decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-400/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 lg:px-16 py-4 flex items-center justify-between">
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
          <a href="#contact" className="hover:text-blue-900 transition-colors">Contact</a>
        </nav>

        <button 
          onClick={onEnterPortal} 
          className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl shadow-lg shadow-blue-900/10 text-xs uppercase tracking-widest transition-all"
        >
          Enter Portal
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-16 pt-20 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <span className="text-xs font-black text-blue-900 uppercase tracking-[0.2em] bg-blue-50 px-4 py-2 rounded-full border border-blue-100 inline-block">
            Empowerment Ecosystem
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-blue-950 leading-tight tracking-tight">
            Inspiring & empowering <br />
            <span className="text-blue-900 bg-gradient-to-r from-blue-900 to-indigo-750 bg-clip-text text-transparent">young women.</span>
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
              href="#about"
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-black rounded-2xl transition-all text-sm uppercase tracking-widest border border-slate-200 shadow-sm flex items-center justify-center"
            >
              Learn More
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
          <h3 className="font-black text-xl text-blue-950 mb-6 flex items-center"><TrendingUp className="mr-2 text-blue-900" /> Scholar Hub Dashboard</h3>
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

      {/* About Us Section */}
      <section id="about" className="max-w-7xl mx-auto px-6 lg:px-16 py-24 border-t border-slate-200/40 bg-white">
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
              <h4 className="font-black text-blue-950 text-base">Impact Focus</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                We implement an impressive portfolio of educational and career development programs to provide young women and girls with the opportunities and resources they need to be what they want to be.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs List */}
      <section id="programs" className="max-w-7xl mx-auto px-6 lg:px-16 py-24 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Active Development</span>
          <h2 className="text-3xl font-black text-blue-955 tracking-tight">Our Popular Programs</h2>
          <p className="text-slate-500 font-medium text-sm">Promoting education, health, and economic empowerment for girls.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {programList.map((prog, i) => (
            <div key={i} className="bg-white border border-slate-200/50 hover:border-blue-900 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <prog.icon size={22} />
                </div>
                <h3 className="font-black text-base text-blue-950 mb-2">{prog.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{prog.desc}</p>
              </div>
              <div className="flex items-center text-blue-900 font-black text-[10px] uppercase tracking-wider mt-6 cursor-pointer">
                <span>Read program specs</span> <ChevronRight size={12} className="ml-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Statistics */}
      <section id="impact" className="bg-blue-955 py-24 px-6 lg:px-16 text-white relative overflow-hidden">
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
                <span className="text-xs font-black block uppercase tracking-wider text-slate-205">{data.suffix}</span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium pt-2 border-t border-slate-800/40">{data.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* FAQs Section */}
      <section className="bg-white border-t border-slate-200/40 py-24 px-6 lg:px-16">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Support Guides</span>
            <h2 className="text-3xl font-black text-blue-955 tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              { q: 'How to Make a Donation?', a: 'Generation Rise empowers young girls through educational donations. Please reach out to info@generationrise.org to support our leadership programs.' },
              { q: 'How to Become a Volunteer?', a: 'We accept active, passionate community volunteers to coordinate peer workshops and curriculum training modules.' },
              { q: 'How to Raise Funds for our Programs?', a: 'You can help by organizing fundraising events, starting a crowdfunding campaign, or securing sponsorships. We provide resources to ensure your efforts are successful and impactful.' }
            ].map((faq, i) => (
              <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
                <h4 className="font-black text-blue-955 text-sm">{faq.q}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Contact Info */}
      <footer id="contact" className="bg-slate-900 text-slate-300 py-16 px-6 lg:px-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/Logo.png" alt="Generation Rise Logo" className="w-10 h-10 object-contain invert brightness-0" />
              <span className="font-black text-sm text-white uppercase tracking-wider">Generation Rise</span>
            </div>
            <p className="text-xs text-slate-450 leading-relaxed font-medium max-w-sm">
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
