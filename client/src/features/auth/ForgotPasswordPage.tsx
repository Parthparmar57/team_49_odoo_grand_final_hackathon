import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

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
      setSuccessMessage(result.message || 'Password reset instructions have been sent via Brevo.');
      if (result.resetToken) {
        setDemoToken(result.resetToken);
      }
    } else {
      setError(result.error || 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col justify-between selection:bg-orange-100 selection:text-orange-600">
      
      {/* 1. TOP NAVIGATION HEADER */}
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
              <span>Sign In</span>
              <div className="w-4 h-4 ml-1.5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-3 h-3 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. CENTERED FORGOT PASSWORD CONTAINER */}
      <main className="flex-1 flex flex-col justify-center items-center py-12 px-4 bg-white">
        <div className="max-w-[460px] w-full mx-auto">
          
          {/* Card Container matching LoginPage */}
          <div className="bg-[#F4F6F6] border border-slate-200/80 rounded-[32px] shadow-sm overflow-hidden relative">
            
            {/* Top Multi-Gradient Border Strip */}
            <div className="h-[5px] bg-gradient-to-r from-[#2DD4BF] via-[#F59E0B] to-[#FF5E1E] w-full" />

            <div className="p-8 sm:p-10 space-y-6">
              
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/80 text-[#FF5E1E] text-[11px] font-bold tracking-wide mb-2">
                  <span>Brevo Email Verification</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  Forgot password
                </h1>
                <p className="text-xs text-[#64748B] font-medium max-w-sm mx-auto">
                  Enter your work email address to receive a 6-digit verification code & password reset link.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-600 text-xs leading-relaxed animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Success Banner */}
              {successMessage ? (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-teal-800 text-xs space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-teal-900 text-sm">Brevo Email Verification Sent!</div>
                      <div className="text-xs text-teal-700 mt-1 leading-relaxed">{successMessage}</div>
                    </div>
                  </div>

                  {demoToken && (
                    <div className="pt-3 border-t border-teal-200 text-xs">
                      <p className="text-slate-600 text-[11px] mb-2">
                        Check your email inbox or click below to proceed directly to the reset screen:
                      </p>
                      <Link
                        to={`/auth/reset-password/${demoToken}`}
                        className="w-full py-3 px-5 rounded-full text-xs font-bold text-white bg-[#FF5E1E] hover:bg-[#E0480C] transition shadow-md shadow-orange-500/25 inline-flex items-center justify-center gap-2"
                      >
                        <span>Proceed to Reset Password Page</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                /* Main Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Work Email Input */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs text-[#1E293B] font-bold">
                      Work email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your work email"
                        className="w-full px-5 py-3 rounded-full bg-white border border-slate-200 text-slate-900 placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FF5E1E]/40 focus:border-[#FF5E1E] text-xs transition-all shadow-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Send Reset Link Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-full text-xs font-bold text-white bg-[#FF5E1E] hover:bg-[#E0480C] active:scale-[0.99] transition shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Sending Code...</span>
                        </>
                      ) : (
                        <span>Send Reset Link</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Bottom Back to Sign in link */}
              <div className="text-center pt-2 text-xs font-medium text-[#64748B]">
                Remember your password?{' '}
                <Link to="/auth/login" className="font-bold text-[#FF5E1E] hover:underline">
                  Sign in
                </Link>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* 3. FOOTER MATCHING LOGIN PAGE EXACTLY */}
      <footer className="bg-[#0A0D14] text-slate-400 pt-8 pb-4 px-6 text-xs font-sans border-t border-slate-900 overflow-hidden relative">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center">
            <img src="/logo-footer.webp" alt="PeoplePay360" className="h-7 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-6 text-slate-400 text-xs font-medium">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <a href="#about" className="hover:text-white transition">Terms of Service</a>
            <a href="#resources" className="hover:text-white transition">Privacy Policy</a>
            <a href="#industries" className="hover:text-white transition">Refund Policy</a>
          </div>

          <div className="text-slate-500 text-[11px]">
            &copy; 2026 PeoplePay360. All rights reserved.
          </div>
        </div>

        {/* GIANT GRADIENT TEXT WATERMARK */}
        <div className="w-full text-center pointer-events-none select-none overflow-hidden leading-none pt-6 mt-2 opacity-90">
          <span className="text-[13vw] sm:text-[15vw] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#FF5E1E] via-[#EAB308] via-[#2DD4BF] to-[#06B6D4]">
            PeoplePay360
          </span>
        </div>
      </footer>
    </div>
  );
};
