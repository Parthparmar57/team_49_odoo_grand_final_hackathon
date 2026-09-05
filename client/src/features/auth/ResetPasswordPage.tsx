import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Eye,
  EyeOff,
  Key,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { resetPassword } = useAuth();

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const isFormValid = hasMinLength && passwordsMatch && hasNumberOrSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid or missing password reset token.');
      return;
    }

    if (!isFormValid) {
      setError('Please ensure all password requirements are met.');
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword({ token, verificationCode, password });
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 3000);
    } else {
      setError(result.error || 'Failed to reset password. Token or verification code may be expired or invalid.');
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

      {/* 2. CENTERED RESET PASSWORD CONTAINER */}
      <main className="flex-1 flex flex-col justify-center items-center py-12 px-4 bg-white">
        <div className="max-w-[460px] w-full mx-auto">
          
          {/* Card Container matching LoginPage */}
          <div className="bg-[#F4F6F6] border border-slate-200/80 rounded-[32px] shadow-sm overflow-hidden relative">
            
            {/* Top Multi-Gradient Border Strip */}
            <div className="h-[5px] bg-gradient-to-r from-[#2DD4BF] via-[#F59E0B] to-[#FF5E1E] w-full" />

            <div className="p-8 sm:p-10 space-y-6">
              
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 text-teal-700 text-[11px] font-bold tracking-wide mb-2">
                  <span>Brevo Code Verification</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  Set new password
                </h1>
                <p className="text-xs text-[#64748B] font-medium max-w-sm mx-auto">
                  Enter your Brevo verification code & choose a secure new password.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-600 text-xs leading-relaxed animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Success Screen */}
              {isSuccess ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#0F172A]">Password Reset Successful!</h4>
                    <p className="text-xs text-[#64748B] mt-1">
                      Your password has been verified and updated. Redirecting to login page in 3 seconds...
                    </p>
                  </div>
                  <Link
                    to="/auth/login"
                    className="w-full py-3.5 px-6 rounded-full text-xs font-bold text-white bg-[#FF5E1E] hover:bg-[#E0480C] transition shadow-md shadow-orange-500/25 inline-flex items-center justify-center gap-2"
                  >
                    <span>Go to Sign In Now</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </Link>
                </div>
              ) : (
                /* Main Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 6-Digit Email Verification Code Input */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs text-[#1E293B] font-bold">
                        Verification Code
                      </label>
                      <span className="text-[10px] text-teal-600 font-bold">6-digit Brevo Code</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter 6-digit code e.g. 482910"
                        className="w-full px-5 py-3 rounded-full bg-white border border-slate-200 text-slate-900 placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FF5E1E]/40 focus:border-[#FF5E1E] text-xs font-mono tracking-wider transition-all shadow-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                        <Key className="w-4 h-4 text-[#FF5E1E]" />
                      </div>
                    </div>
                  </div>

                  {/* New Password Input */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs text-[#1E293B] font-bold">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-5 py-3 rounded-full bg-white border border-slate-200 text-slate-900 placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FF5E1E]/40 focus:border-[#FF5E1E] text-xs transition-all shadow-sm pr-12"
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

                  {/* Confirm Password Input */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs text-[#1E293B] font-bold">
                      Confirm new password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-5 py-3 rounded-full bg-white border border-slate-200 text-slate-900 placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FF5E1E]/40 focus:border-[#FF5E1E] text-xs transition-all shadow-sm pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1.5 text-xs text-left">
                    <div className={`flex items-center gap-2 ${hasMinLength ? 'text-teal-600 font-semibold' : 'text-slate-400'}`}>
                      {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      At least 8 characters long
                    </div>
                    <div className={`flex items-center gap-2 ${hasNumberOrSpecial ? 'text-teal-600 font-semibold' : 'text-slate-400'}`}>
                      {hasNumberOrSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      Contains a number or special character
                    </div>
                    <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-teal-600 font-semibold' : 'text-slate-400'}`}>
                      {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      Passwords match
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !isFormValid}
                      className="w-full py-3.5 px-6 rounded-full text-xs font-bold text-white bg-[#FF5E1E] hover:bg-[#E0480C] active:scale-[0.99] transition shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <span>Reset Password</span>
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
