import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setDemoToken(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await forgotPassword({ email });
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Password reset instructions have been sent to your email.');
      if (result.resetToken) {
        setDemoToken(result.resetToken);
      }
    } else {
      setError(result.error || 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20 mb-4 ring-1 ring-white/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
            PeoplePay<span className="text-orange-500">360</span>
          </h2>
          <p className="mt-1 text-center text-xs uppercase tracking-widest text-slate-400 font-semibold">
            Password Recovery
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          <div className="mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white">Forgot Password?</h3>
            <p className="text-slate-400 text-xs mt-1">
              Enter your work email address below and we'll send you a password reset link.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-300 text-sm">
              <div className="flex items-start gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div className="font-semibold">{successMessage}</div>
              </div>

              {/* Development Mode Quick Demo Link */}
              {demoToken && (
                <div className="mt-3 pt-3 border-t border-teal-500/20 text-xs text-teal-200">
                  <p className="font-mono bg-slate-950/80 p-2.5 rounded-lg border border-teal-500/30 break-all mb-2">
                    Token: {demoToken.slice(0, 24)}...
                  </p>
                  <Link
                    to={`/auth/reset-password/${demoToken}`}
                    className="inline-flex items-center gap-1 font-bold text-orange-400 hover:underline"
                  >
                    Click here to open Reset Password page →
                  </Link>
                </div>
              )}
            </div>
          )}

          {!successMessage && (
            <form className="space-y-5" onSubmit={handleSubmit}>
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

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-slate-900 shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
