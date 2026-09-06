import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const getTargetPath = (userRole?: string) => {
    if (from && !from.startsWith('/auth') && from !== '/' && from !== '/dashboard') {
      return from;
    }
    return userRole === 'ADMIN' ? '/admin/users' : '/dashboard';
  };

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

    if (result.success && result.user) {
      const targetPath = getTargetPath(result.user.role);
      navigate(targetPath, { replace: true });
    } else {
      setError(result.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  const setDemoAccount = async (personaEmail: string, personaRole: string) => {
    setEmail(personaEmail);
    setPassword('odoo@123');
    setActivePersona(personaRole);
    setError(null);
    setIsSubmitting(true);

    const result = await login({ email: personaEmail, password: 'odoo@123' });
    setIsSubmitting(false);

    if (result.success && result.user) {
      const targetPath = getTargetPath(result.user.role);
      navigate(targetPath, { replace: true });
    } else {
      setError(result.error || 'Failed to sign in. Please verify credentials.');
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-white text-slate-900 font-sans flex flex-col justify-between selection:bg-orange-100 selection:text-orange-600">

      {/* 2. TOP NAVIGATION HEADER */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo.webp" alt="PeoplePay360" className="h-9 w-auto object-contain" />
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center justify-center gap-8 text-xs font-bold text-[#334155] absolute left-1/2 -translate-x-1/2">
            <Link to="/" className="hover:text-[#FF5E1E] transition">Home</Link>
            <a href="#about" className="hover:text-[#FF5E1E] transition">About</a>
            <a href="#features" className="hover:text-[#FF5E1E] transition">Features</a>
          </nav>
        </div>
      </header>

      {/* 3. CENTERED LANDSCAPE LOGIN CONTAINER WITH BLURRED BACKGROUND FEATURES */}
      <main className="flex-1 flex flex-col justify-center items-center py-8 px-4 sm:px-6 hero-gradient-bg relative overflow-hidden">

        {/* Background Glowing Blurred Radial Orbs */}
        <div className="absolute top-10 -left-16 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-16 w-96 h-96 bg-teal-400/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-300/25 rounded-full blur-3xl pointer-events-none" />



        <div className="max-w-4xl w-full mx-auto relative z-10">

          {/* Glassmorphic Landscape Card Container */}
          <div className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-[32px] shadow-2xl overflow-hidden relative">

            {/* Top Multi-Gradient Border Strip */}
            <div className="h-[5px] bg-gradient-to-r from-[#2DD4BF] via-[#F59E0B] to-[#FF5E1E] w-full" />

            {/* 2-Column Landscape Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200/60">

              {/* LEFT COLUMN: Welcome & Sign In Form */}
              <div className="md:col-span-7 p-8 sm:p-10 space-y-5">
                {/* Header */}
                <div className="text-left space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                    Welcome back
                  </h1>
                  <p className="text-xs text-[#64748B] font-medium">
                    Sign in to your PeoplePay360 account.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3.5 bg-red-50/90 border border-red-200 rounded-2xl flex items-start gap-3 text-red-600 text-xs leading-relaxed animate-shake">
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
                      className="w-full px-5 py-3 rounded-full bg-white/90 border border-slate-200 text-[#0F172A] placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-2xs font-medium"
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
                        className="w-full pl-5 pr-11 py-3 rounded-full bg-white/90 border border-slate-200 text-[#0F172A] placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-2xs font-medium"
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
                <div className="pt-1 text-left text-xs text-[#64748B]">
                  Don't have an account?{' '}
                  <span className="font-bold text-[#FF5E1E] hover:underline cursor-pointer">
                    Contact Admin
                  </span>
                </div>
              </div>

              {/* RIGHT COLUMN: 1-Click Role Login Presets */}
              <div className="md:col-span-5 p-8 sm:p-10 bg-slate-50/60 backdrop-blur-md flex flex-col justify-between space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/80 text-orange-700 font-extrabold text-[10px] uppercase tracking-wider mb-3">
                    Quick Access
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    1-Click Role Login
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Test the application with preset accounts. (Password: <code className="text-slate-800 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">odoo@123</code>)
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: 'Admin', email: 'admin@ex.com', persona: 'ADMIN', color: 'text-[#FF5E1E] border-orange-200 hover:border-orange-500' },
                    { label: 'HR Manager', email: 'hrmanager@ex.com', persona: 'HR_MANAGER', color: 'text-teal-700 border-teal-200 hover:border-teal-500' },
                    { label: 'Payroll User', email: 'payrolluser@ex.com', persona: 'HR_PAYROLL_USER', color: 'text-indigo-700 border-indigo-200 hover:border-indigo-500' },
                    { label: 'Payroll Manager', email: 'payrollmanager@ex.com', persona: 'HR_PAYROLL_MANAGER', color: 'text-purple-700 border-purple-200 hover:border-purple-500' },
                    { label: 'Employee', email: 'employee@ex.com', persona: 'EMPLOYEE', color: 'text-emerald-700 border-emerald-200 hover:border-emerald-500' },
                  ].map((role) => (
                    <button
                      key={role.persona}
                      type="button"
                      onClick={() => setDemoAccount(role.email, role.persona)}
                      className={`w-full py-2.5 px-4 bg-white/90 hover:bg-white border rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-between text-xs font-bold ${activePersona === role.persona
                        ? `${role.color} ring-2 ring-orange-500/20 font-black shadow-sm`
                        : `${role.color} text-slate-700`
                        }`}
                    >
                      <span>{role.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal font-mono">{role.email}</span>
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-slate-400 text-center font-medium">
                  Instant sign-in with full role permissions
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>


    </div>
  );
};
