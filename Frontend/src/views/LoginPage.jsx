import React, { useState } from 'react';
import { 
  GraduationCap, Users, Award, Shield, Flame, 
  ArrowLeft, Lock, Mail, AlertCircle, Sparkles,
  Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage({ onLoginSuccess, onBackToHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  
  // Password Visibility Toggle State
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password Simulated Wizard States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCodeInput, setForgotCodeInput] = useState('');
  const [forgotCodeGenerated, setForgotCodeGenerated] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = async (presetEmail) => {
    setEmail(presetEmail);
    setPassword('password123');
    setError('');
    
    // Auto submit to make login experience seamless
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: presetEmail, password: 'password123' })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotNext = (e) => {
    e?.preventDefault();
    setError('');
    if (forgotStep === 1) {
      if (!forgotEmail) {
        setError('Please enter a valid email address.');
        return;
      }
      // Generate simulated code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setForgotCodeGenerated(code);
      setForgotStep(2);
    } else if (forgotStep === 2) {
      if (forgotCodeInput === forgotCodeGenerated) {
        setForgotStep(3);
      } else {
        setError('Incorrect verification code. Please check the code shown in the simulator helper.');
      }
    } else if (forgotStep === 3) {
      if (forgotNewPass.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (forgotNewPass !== forgotConfirmPass) {
        setError('Passwords do not match.');
        return;
      }
      // Success simulation: auto fill manual login credentials
      setEmail(forgotEmail);
      setPassword(forgotNewPass);
      setForgotStep(4);
    }
  };

  const handleForgotCancel = () => {
    setShowForgotPassword(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotCodeInput('');
    setForgotNewPass('');
    setForgotConfirmPass('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 lg:p-10 relative overflow-hidden font-sans selection:bg-yellow-400 selection:text-blue-950">
      
      {/* Decorative background glow circles */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-yellow-400/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Main card */}
      <div className="relative w-full max-w-[960px] min-h-[580px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(15,23,42,0.08)] border border-slate-100/50 flex flex-col md:flex-row overflow-hidden z-10">
        
        {/* Left Side: Colored decorative panel with curve divider */}
        <div className="relative w-full md:w-[42%] bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between items-center text-center overflow-hidden shrink-0">
          
          {/* Subtle concentric circles in bg */}
          <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-white/5 rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[-100px] left-[-100px] w-72 h-72 bg-white/5 rounded-full pointer-events-none"></div>

          {/* Vertical Wave divider - visible on desktop */}
          <svg 
            className="absolute top-0 right-[-1px] h-full w-16 text-white fill-current pointer-events-none hidden md:block" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
          >
            <path d="M0,0 C30,20 75,55 15,100 L100,100 L100,0 Z" />
          </svg>

          {/* Horizontal Wave divider - visible on mobile */}
          <svg 
            className="absolute bottom-[-1px] left-0 w-full h-8 text-white fill-current pointer-events-none md:hidden" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
          >
            <path d="M0,100 C30,60 70,60 100,100 Z" />
          </svg>

          {/* Header/Logo section */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg mb-3 overflow-hidden p-1">
              <img src="/Logo.png" alt="Generation Rise Logo" className="w-full h-full object-contain logo-sharp" />
            </div>
            <span className="font-bold text-[10px] uppercase tracking-[0.3em] text-blue-200">generation rise</span>
          </div>

          {/* Message section */}
          <div className="relative z-10 max-w-[250px] my-10 md:my-0">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">Welcome Back!</h2>
            <p className="text-xs text-blue-200/80 mt-3 font-semibold leading-relaxed">
              {showPresets 
                ? "To login with custom credentials, switch back to manual account mode." 
                : "To access a demo workspace instantly, view the developer presets."
              }
            </p>
          </div>

          {/* Action button to toggle Presets vs Credentials */}
          <div className="relative z-10 w-full max-w-[200px]">
            <button
              onClick={() => {
                setShowPresets(!showPresets);
                setShowForgotPassword(false);
                setError('');
              }}
              className="w-full py-3 border border-white hover:bg-white hover:text-blue-955 text-white rounded-full font-bold text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-98"
            >
              {showPresets ? "Manual Login" : "Demo Accounts"}
            </button>
          </div>
        </div>

        {/* Right Side: Form / Presets panel */}
        <div className="w-full md:w-[58%] bg-white p-8 sm:p-12 flex flex-col justify-center relative min-h-[400px]">
          
          {/* Back to Landing button in top right */}
          <button 
            onClick={onBackToHome}
            className="absolute top-6 right-6 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-505 hover:text-slate-800 rounded-full border border-slate-200/60 font-bold text-[9px] uppercase tracking-wider transition-all flex items-center"
          >
            <ArrowLeft size={10} className="mr-1" /> Back to Home
          </button>

          <AnimatePresence mode="wait">
            {showForgotPassword ? (
              <motion.div
                key="forgot-password-wizard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 animate-fade-in"
              >
                <div>
                  <h2 className="text-2xl font-black text-blue-900 tracking-tight capitalize">Reset Password</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Step {forgotStep} of 4: {
                    forgotStep === 1 ? 'Verify Email Address' :
                    forgotStep === 2 ? 'Verify 6-Digit Code' :
                    forgotStep === 3 ? 'Set New Password' :
                    'Success'
                  }</p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-650 border border-red-100 rounded-2xl p-4 text-xs font-bold text-center flex items-center justify-center space-x-2 animate-shake">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleForgotNext} className="space-y-4">
                  {forgotStep === 1 && (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block ml-2">Email Address</label>
                      <div className="relative">
                        <input 
                          type="email" 
                          required
                          placeholder="scholar@generationrise.org"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-transparent hover:border-slate-200/80 focus:border-blue-900 focus:bg-white rounded-full text-xs font-semibold focus:outline-none transition-all text-slate-808"
                        />
                        <Mail size={14} className="absolute left-4 top-4 text-slate-400" />
                      </div>
                    </div>
                  )}

                  {forgotStep === 2 && (
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-450 border border-yellow-100 dark:border-yellow-900/30 rounded-2xl text-[11px] font-bold text-center">
                        Simulated SMS/Email Code Sent: <span className="text-xs font-black tracking-widest text-blue-955 dark:text-yellow-350">{forgotCodeGenerated}</span>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block ml-2">6-Digit Verification Code</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. 123456"
                            maxLength={6}
                            value={forgotCodeInput}
                            onChange={(e) => setForgotCodeInput(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-transparent hover:border-slate-200/80 focus:border-blue-900 focus:bg-white rounded-full text-xs font-semibold focus:outline-none transition-all text-slate-805 tracking-[0.5em] text-center"
                          />
                          <Lock size={14} className="absolute left-4 top-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {forgotStep === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block ml-2">New Password</label>
                        <div className="relative">
                          <input 
                            type={showForgotNewPass ? 'text' : 'password'} 
                            required
                            placeholder="••••••••"
                            value={forgotNewPass}
                            onChange={(e) => setForgotNewPass(e.target.value)}
                            className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-transparent hover:border-slate-200/80 focus:border-blue-900 focus:bg-white rounded-full text-xs font-semibold focus:outline-none transition-all text-slate-800"
                          />
                          <Lock size={14} className="absolute left-4 top-4 text-slate-400" />
                          <button
                            type="button"
                            onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                          >
                            {showForgotNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block ml-2">Confirm New Password</label>
                        <div className="relative">
                          <input 
                            type={showForgotNewPass ? 'text' : 'password'} 
                            required
                            placeholder="••••••••"
                            value={forgotConfirmPass}
                            onChange={(e) => setForgotConfirmPass(e.target.value)}
                            className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-transparent hover:border-slate-200/80 focus:border-blue-900 focus:bg-white rounded-full text-xs font-semibold focus:outline-none transition-all text-slate-800"
                          />
                          <Lock size={14} className="absolute left-4 top-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  {forgotStep === 4 && (
                    <div className="text-center space-y-3 py-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Sparkles size={24} />
                      </div>
                      <p className="text-xs font-bold text-slate-605">Your password has been reset successfully!</p>
                      <p className="text-[10px] text-slate-400">Click below to return to the login panel with credentials auto-filled.</p>
                    </div>
                  )}

                  <div className="pt-4 flex justify-between space-x-3">
                    {forgotStep < 4 ? (
                      <>
                        <button
                          type="button"
                          onClick={handleForgotCancel}
                          className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-505 hover:text-slate-800 border border-slate-200/60 rounded-full font-bold text-xs uppercase tracking-widest transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-md"
                        >
                          {forgotStep === 1 ? 'Send Code' : forgotStep === 2 ? 'Verify' : 'Reset Password'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleForgotCancel}
                        className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-md"
                      >
                        Return to Login
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            ) : !showPresets ? (
              <motion.div
                key="manual-login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-black text-blue-900 tracking-tight capitalize">welcome</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Login to your account to continue</p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-650 border border-red-100 rounded-2xl p-4 text-xs font-bold text-center flex items-center justify-center space-x-2 animate-shake">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block ml-2">Email Address</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        required
                        placeholder="scholar@generationrise.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-transparent hover:border-slate-200/80 focus:border-blue-900 focus:bg-white rounded-full text-xs font-semibold focus:outline-none transition-all text-slate-808"
                      />
                      <Mail size={14} className="absolute left-4 top-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Password</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotStep(1);
                          setForgotEmail(email);
                          setError('');
                        }}
                        className="text-[9px] font-bold text-blue-900 hover:underline tracking-wide"
                      >
                        Forgot your password?
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-transparent hover:border-slate-200/80 focus:border-blue-900 focus:bg-white rounded-full text-xs font-semibold focus:outline-none transition-all text-slate-800"
                      />
                      <Lock size={14} className="absolute left-4 top-4 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-center md:justify-start">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full sm:w-auto px-12 py-3.5 bg-yellow-400 hover:bg-yellow-350 text-blue-955 font-black rounded-full text-xs uppercase tracking-widest shadow-md transition-all active:scale-98 disabled:opacity-50"
                    >
                      {isLoading ? 'Verifying Identity...' : 'Log In'}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="presets-login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight capitalize flex items-center">
                    <Sparkles size={20} className="text-yellow-500 mr-2" /> Developer presets
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Select a profile to instantly auto-fill credentials and enter the portal.</p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-650 border border-red-100 rounded-2xl p-4 text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { r: 'scholar', l: 'Scholar Account', email: 'scholar@generationrise.org', i: GraduationCap, color: 'text-blue-900 hover:border-blue-500 hover:bg-blue-50/25' },
                    { r: 'mentor', l: 'Mentor Account', email: 'mentor@generationrise.org', i: Users, color: 'text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50/25' },
                    { r: 'teacher', l: 'Teacher Account', email: 'teacher@generationrise.org', i: Award, color: 'text-orange-700 hover:border-orange-500 hover:bg-orange-50/25' },
                    { r: 'admin', l: 'Admin Account', email: 'admin@generationrise.org', i: Shield, color: 'text-purple-700 hover:border-purple-500 hover:bg-purple-50/25' }
                  ].map(preset => {
                    const PresetIcon = preset.i;
                    const isSelected = email === preset.email;
                    return (
                      <button
                        key={preset.r}
                        type="button"
                        onClick={() => handlePresetSelect(preset.email)}
                        className={`flex flex-col p-4 bg-slate-50 border transition-all text-left cursor-pointer active:scale-98 ${preset.color} ${
                          isSelected 
                            ? 'ring-2 ring-yellow-400 border-yellow-500 scale-[1.02] bg-yellow-50/20 shadow-md' 
                            : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 mb-1.5">
                          <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100">
                            <PresetIcon size={16} />
                          </div>
                          <span className="font-bold text-xs text-slate-800">{preset.l}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium overflow-hidden text-ellipsis whitespace-nowrap block w-full">
                          {preset.email}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
