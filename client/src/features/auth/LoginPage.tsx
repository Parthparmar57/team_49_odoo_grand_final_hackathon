import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  Zap,
  ChevronDown,
  X,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsSubmitting(true);
    const result = await login({ email, password });
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  const setDemoAccount = (personaEmail: string, personaRole: string) => {
    setEmail(personaEmail);
    setPassword('Password123!');
    setActivePersona(personaRole);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col justify-between selection:bg-orange-100 selection:text-orange-600">
      
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      {showBanner && (
        <div className="bg-[#0B0F19] text-white text-xs py-2 px-4 flex items-center justify-between font-sans border-b border-slate-900">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
              <span className="bg-[#FF5E1E] text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" /> EVENT
              </span>
              <span className="text-slate-300 font-medium">
                We're presenting <strong>PeoplePay360</strong> at Odoo Grand Final Hackathon 2026! Learn how to automate HR & Payroll workflows.
              </span>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-slate-400 hover:text-white hidden sm:block focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. TOP NAVIGATION HEADER */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo.webp" alt="PeoplePay360" className="h-9 w-auto object-contain" />
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-[#334155]">
            <Link to="/" className="hover:text-[#FF5E1E] transition">Home</Link>
            <a href="#about" className="hover:text-[#FF5E1E] transition">About</a>
            <a href="#pricing" className="hover:text-[#FF5E1E] transition">Pricing</a>
            <a href="#features" className="hover:text-[#FF5E1E] transition">Features</a>
            <a href="#more" className="hover:text-[#FF5E1E] transition flex items-center gap-1">
              More <ChevronDown className="w-3 h-3" />
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <a
              href="#demo"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition"
            >
              Book A Demo
            </a>
            <Link
              to="/auth/login"
              className="group inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold text-white bg-[#FF5E1E] hover:bg-[#E0480C] rounded-full transition shadow-md shadow-orange-500/25"
            >
              <span>Get Started</span>
              <div className="w-4 h-4 ml-1.5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-3 h-3 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. CENTERED LOGIN CONTAINER */}
      <main className="flex-1 flex flex-col justify-center items-center py-12 px-4 bg-white">
        <div className="max-w-[460px] w-full mx-auto">
          
          {/* Card Container */}
          <div className="bg-[#F4F6F6] border border-slate-200/80 rounded-[32px] shadow-sm overflow-hidden relative">
            
            {/* Top Multi-Gradient Border Strip */}
            <div className="h-[5px] bg-gradient-to-r from-[#2DD4BF] via-[#F59E0B] to-[#FF5E1E] w-full" />

            <div className="p-8 sm:p-10 space-y-6">
              
              {/* Header */}
              <div className="text-center space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  Welcome back
                </h1>
                <p className="text-xs text-[#64748B] font-medium">
                  Sign in to your PeoplePay360 account.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-600 text-xs leading-relaxed animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Main Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Work email */}
                <div className="text-left">
                  <label htmlFor="email" className="block text-xs font-bold text-[#334155] mb-1.5">
                    Work email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-5 py-3 rounded-full bg-white border border-slate-200 text-[#0F172A] placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-2xs font-medium"
                  />
                </div>

                {/* Password */}
                <div className="text-left">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-xs font-bold text-[#334155]">
                      Password
                    </label>
                    <Link
                      to="/auth/forgot-password"
                      className="text-xs font-semibold text-[#FF5E1E] hover:underline transition-all"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-5 pr-11 py-3 rounded-full bg-white border border-slate-200 text-[#0F172A] placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-2xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Keep me signed in */}
                <div className="flex items-center justify-start text-left pt-1">
                  <label className="flex items-center gap-2 text-xs text-[#475569] font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#FF5E1E] focus:ring-orange-500 accent-[#FF5E1E] cursor-pointer"
                    />
                    <span>Keep me signed in for 30 days</span>
                  </label>
                </div>

                {/* Sign in Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 bg-[#FF5E1E] hover:bg-[#E0480C] text-white font-bold text-sm rounded-full shadow-md shadow-orange-500/25 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom Note */}
              <div className="pt-2 text-center text-xs text-[#64748B]">
                Don't have an account?{' '}
                <span className="font-bold text-[#FF5E1E] hover:underline cursor-pointer">
                  Contact Admin
                </span>
              </div>
            </div>
          </div>

          {/* Quick Demo Live Database Account Presets */}
          <div className="mt-6 p-4 bg-[#F8FAF9] border border-slate-200/80 rounded-2xl text-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Seeded Live Database Presets
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDemoAccount('admin@peoplepay360.com', 'ADMIN')}
                className={`px-3 py-1 bg-white border border-slate-200 rounded-full transition-all cursor-pointer shadow-2xs ${
                  activePersona === 'ADMIN' ? 'text-[#FF5E1E] border-orange-500' : 'text-slate-700 hover:text-[#FF5E1E]'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('hr.manager@peoplepay360.com', 'HR_MANAGER')}
                className={`px-3 py-1 bg-white border border-slate-200 rounded-full transition-all cursor-pointer shadow-2xs ${
                  activePersona === 'HR_MANAGER' ? 'text-teal-600 border-teal-500' : 'text-slate-700 hover:text-teal-600'
                }`}
              >
                HR Manager
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('payroll.manager@peoplepay360.com', 'HR_PAYROLL_MANAGER')}
                className={`px-3 py-1 bg-white border border-slate-200 rounded-full transition-all cursor-pointer shadow-2xs ${
                  activePersona === 'HR_PAYROLL_MANAGER' ? 'text-purple-600 border-purple-500' : 'text-slate-700 hover:text-purple-600'
                }`}
              >
                Payroll Manager
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('rahul@example.com', 'EMPLOYEE')}
                className={`px-3 py-1 bg-white border border-slate-200 rounded-full transition-all cursor-pointer shadow-2xs ${
                  activePersona === 'EMPLOYEE' ? 'text-indigo-600 border-indigo-500' : 'text-slate-700 hover:text-indigo-600'
                }`}
              >
                Employee
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-[#0B0F19] text-slate-400 py-8 px-6 text-xs font-sans border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <img src="/logo-footer.webp" alt="PeoplePay360" className="h-7 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-6 text-slate-400 text-xs font-medium">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <a href="#about" className="hover:text-white transition">Company</a>
            <a href="#resources" className="hover:text-white transition">Resources</a>
            <a href="#industries" className="hover:text-white transition">Industries</a>
            <a href="#compare" className="hover:text-white transition">Compare</a>
          </div>

          <div className="text-slate-500 text-[11px]">
            &copy; 2026 PeoplePay360. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
