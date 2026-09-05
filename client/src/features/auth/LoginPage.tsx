import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, ShieldCheck, Info } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Mesh Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Logo & Name */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20 mb-4 ring-1 ring-white/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
            PeoplePay<span className="text-orange-500">360</span>
          </h2>
          <p className="mt-1 text-center text-xs uppercase tracking-widest text-slate-400 font-semibold">
            HR & Payroll Automation Platform
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Glassmorphism Form Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          <div className="mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white">Welcome Back</h3>
            <p className="text-slate-400 text-xs mt-1">
              Sign in to access your HR & Payroll workspace.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm animate-shake">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Work Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Work Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-slate-900 shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Admin Created Account Note */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400 leading-relaxed">
              Accounts are created by an administrator. Don't have an account?{' '}
              <span className="font-semibold text-slate-200">Contact your Admin</span>.
            </p>
          </div>
        </div>

        {/* Demo Quick Logins Footer */}
        <div className="mt-6 p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl text-center">
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Seeded Database Presets (Live PostgreSQL)</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <button
              onClick={() => { setEmail('admin@peoplepay360.com'); setPassword('Password123!'); }}
              className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 rounded-lg font-medium transition-all cursor-pointer"
            >
              Admin
            </button>
            <button
              onClick={() => { setEmail('hr.manager@peoplepay360.com'); setPassword('Password123!'); }}
              className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 rounded-lg font-medium transition-all cursor-pointer"
            >
              HR Manager
            </button>
            <button
              onClick={() => { setEmail('payroll.manager@peoplepay360.com'); setPassword('Password123!'); }}
              className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 rounded-lg font-medium transition-all cursor-pointer"
            >
              Payroll Manager
            </button>
            <button
              onClick={() => { setEmail('rahul@example.com'); setPassword('Password123!'); }}
              className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 rounded-lg font-medium transition-all cursor-pointer"
            >
              Employee
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
