import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, FileQuestion, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between p-6 relative font-sans overflow-hidden">
      {/* Background Soft Glow Effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-slate-200/60 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header Navbar */}
      <header className="relative z-10 max-w-6xl mx-auto w-full pt-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5E1E] to-[#FF8038] flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-xl">P</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            People<span className="text-[#FF5E1E]">Pay360</span>
          </span>
        </Link>
      </header>

      {/* Main 404 Floating Light Card */}
      <main className="relative z-10 max-w-lg mx-auto w-full my-auto py-8">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/60 text-center space-y-6">
          {/* Top Icon Badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-orange-50 border border-orange-200/80 text-[#FF5E1E] shadow-xs">
            <FileQuestion className="w-10 h-10 stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/90 border border-orange-200 text-[#FF5E1E] text-xs font-mono font-extrabold uppercase tracking-wider">
              <ShieldAlert size={14} /> 404 Route Not Found
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Page Not Found
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
            The page or route path you are looking for doesn't exist, was moved, or requires authorization.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <ArrowLeft size={15} /> Go Back
            </button>

            <Link
              to={user ? '/dashboard' : '/'}
              className="w-full sm:w-auto px-6 py-3 bg-[#FF5E1E] hover:bg-[#E0480C] text-white font-bold text-xs rounded-full shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Home size={15} /> {user ? 'Return to Dashboard' : 'Return to Home'}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 text-center text-xs text-slate-500 font-medium pb-2">
        PeoplePay360 — AI-Powered HR & Payroll Automation Platform © 2026
      </footer>
    </div>
  );
};

export default NotFoundPage;
