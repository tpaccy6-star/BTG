import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  HelpCircle, 
  ShieldCheck, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  MessageCircle, 
  HeartHandshake, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

export default function LegalModal({ isOpen, onClose, activeTab = 'support', onSelectTab, setCurrentView }) {
  if (!isOpen) return null;

  const navigateTo = (view) => {
    if (setCurrentView) {
      setCurrentView(view);
      window.location.hash = `#/${view}`;
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-900 dark:text-yellow-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
                  Rise Her Project · Generation Rise Foundation
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">
                {activeTab === 'support' && 'Help & Program Support'}
                {activeTab === 'privacy' && 'Scholar Data Privacy Policy'}
                {activeTab === 'terms' && 'Platform Terms of Service'}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 sm:px-7 bg-slate-50/70 dark:bg-slate-950/40 gap-2 sm:gap-4 overflow-x-auto">
            <button
              onClick={() => onSelectTab('support')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
                activeTab === 'support'
                  ? 'border-blue-900 text-blue-900 dark:border-yellow-400 dark:text-yellow-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <HelpCircle size={15} />
              <span>Support</span>
            </button>
            <button
              onClick={() => onSelectTab('privacy')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'border-blue-900 text-blue-900 dark:border-yellow-400 dark:text-yellow-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck size={15} />
              <span>Privacy Policy</span>
            </button>
            <button
              onClick={() => onSelectTab('terms')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
                activeTab === 'terms'
                  ? 'border-blue-900 text-blue-900 dark:border-yellow-400 dark:text-yellow-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FileText size={15} />
              <span>Terms of Service</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-slate-600 dark:text-slate-300">
            {/* SUPPORT CONTENT */}
            {activeTab === 'support' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white mb-2">How can we assist you today?</h3>
                  <p className="leading-relaxed text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    The Rise Her Project, initiated by the Generation Rise Foundation, supports young women scholars across Rwanda. Whether you require academic guidance, financial/supplies assistance, or technical support, our team and mentors are here to help.
                  </p>
                </div>

                {/* Quick Action Cards Connected to App Views */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 flex items-center justify-center mb-3">
                        <HeartHandshake size={18} />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Request Support & Assistance</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Submit requests for educational supplies, tuition support, or emergency scholar assistance.</p>
                    </div>
                    {setCurrentView && (
                      <button 
                        onClick={() => navigateTo('assistance')}
                        className="mt-4 inline-flex items-center text-xs font-bold text-blue-900 dark:text-yellow-400 hover:underline"
                      >
                        Open Support Workspace <ExternalLink size={12} className="ml-1" />
                      </button>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 flex items-center justify-center mb-3">
                        <MessageCircle size={18} />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Connect with Your Mentor</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Need help with study modules, homework questions, or career planning? Message your assigned mentor.</p>
                    </div>
                    {setCurrentView && (
                      <button 
                        onClick={() => navigateTo('chat')}
                        className="mt-4 inline-flex items-center text-xs font-bold text-blue-900 dark:text-yellow-400 hover:underline"
                      >
                        Go to Mentor Chat <ExternalLink size={12} className="ml-1" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Contact Info */}
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-850 space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">Contact Rise Her Coordination Team</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center space-x-2.5">
                      <Mail size={15} className="text-blue-900 dark:text-yellow-400 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">Email</p>
                        <a href="mailto:support@generationrise.org" className="text-slate-500 hover:underline">support@generationrise.org</a>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <Phone size={15} className="text-blue-900 dark:text-yellow-400 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">Helpline</p>
                        <span className="text-slate-500">+250 788 123 456</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <MapPin size={15} className="text-blue-900 dark:text-yellow-400 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">Kigali Office</p>
                        <span className="text-slate-500">31 KG 213 St, Kigali</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQ Snippets */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-850 dark:text-white">Frequently Asked Questions</h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      <p className="font-bold text-slate-800 dark:text-slate-200">How do I connect with my assigned mentor?</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">Use the Mentor Chat feature from the workspace to send real-time questions, schedule study sessions, and ask for academic advice.</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      <p className="font-bold text-slate-800 dark:text-slate-200">How do I claim my program certificate?</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">Upon 100% completion of your curriculum modules and graded tasks, your official verified certificate unlocks on your dashboard.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRIVACY POLICY CONTENT */}
            {activeTab === 'privacy' && (
              <div className="space-y-5 text-xs sm:text-sm">
                <div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white mb-1">Scholar & Beneficiary Data Protection</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Last updated: Academic Year 2026 · Compliant with Rwandan Law N° 058/2021</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                      <CheckCircle2 size={14} className="text-emerald-500 mr-1.5" /> 1. Commitment to Privacy
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                      The Generation Rise Foundation and the Rise Her Project are committed to safeguarding the personal data of all scholars, educators, mentors, and program partners. All personal records collected through this portal are treated with the utmost confidentiality.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                      <CheckCircle2 size={14} className="text-emerald-500 mr-1.5" /> 2. Data We Process
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                      We collect scholar account credentials, educational institution details, lesson completion logs, assignment submissions, mentor feedback notes, learning progress records, and assistance applications.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                      <CheckCircle2 size={14} className="text-emerald-500 mr-1.5" /> 3. Purpose of Processing
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                      Data is processed solely to administer the Rise Her scholarship and mentorship program, monitor academic progression, provide qualitative feedback, issue verified credentials, and report aggregated outcomes to accredited NGO partners.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                      <CheckCircle2 size={14} className="text-emerald-500 mr-1.5" /> 4. Strict Confidentiality & Security
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                      We will never sell or monetize scholar data. All communications, assignment uploads, and personal details are strictly isolated by role-based access controls (RBAC) and protected by industry-standard encryption.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                      <CheckCircle2 size={14} className="text-emerald-500 mr-1.5" /> 5. Scholar Rights
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                      Scholars and beneficiaries retain the right to inspect their records, request corrections to grades or submissions, or export their data by contacting <span className="font-bold text-blue-900 dark:text-yellow-400">privacy@generationrise.org</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TERMS OF SERVICE CONTENT */}
            {activeTab === 'terms' && (
              <div className="space-y-5 text-xs sm:text-sm">
                <div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white mb-1">Scholar & Mentor Portal Terms</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">Rise Her Project · Generation Rise Foundation Code of Conduct & Academic Agreement</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                      <CheckCircle2 size={14} className="text-emerald-500 mr-1.5" /> 1. Scholar Code of Conduct
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                      Participants are expected to actively engage in assigned modules, attend designated workshops, interact with mentors and peers with mutual respect, and maintain academic integrity on all tasks and assessments.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                      <CheckCircle2 size={14} className="text-emerald-500 mr-1.5" /> 2. Mentorship & Youth Safeguarding
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                      Mentors and educators must strictly follow Rise Her child and youth safeguarding policies. All communications must remain focused on educational development, career guidance, and positive empowerment.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                      <CheckCircle2 size={14} className="text-emerald-500 mr-1.5" /> 3. Program Engagement & Active Standing
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                      Maintaining good standing in the scholarship program requires consistent participation in learning modules, timely homework submissions, and active mentor engagement.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                      <CheckCircle2 size={14} className="text-emerald-500 mr-1.5" /> 4. Academic Integrity & Original Work
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                      All homework, assessments, and reports uploaded must represent the scholar's authentic work. Plagiarism or submission of fraudulent records will be subject to academic review.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                      <CheckCircle2 size={14} className="text-emerald-500 mr-1.5" /> 5. Account Security
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                      You are responsible for maintaining the confidentiality of your login credentials. Do not share your login details with other individuals. Notify platform administrators immediately if you suspect unauthorized access.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer of modal */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white dark:bg-yellow-400 dark:hover:bg-yellow-350 dark:text-blue-950 font-bold text-xs rounded-xl shadow transition-all uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

