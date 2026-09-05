import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { apiClient } from '../../api/client';
import {
  Sparkle,
  Lightning,
  CheckCircle,
  ArrowRight,
  UsersThree,
  ChartLineUp,
  ShieldCheck,
  Briefcase,
  CalendarCheck,
  FileText,
  Clock,
  Printer,
} from '@phosphor-icons/react';

// --- SILKY CINEMATIC FRAMER MOTION ANIMATION VARIANTS ---
const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 35, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const textRevealVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const cardScaleVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08
    }
  }
};

const heroScaleVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.95, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 1.15,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.1
    }
  }
};

// --- ICON COMPONENTS ---
const ArrowRightIcon = () => (
  <ArrowRight weight="bold" className="w-4 h-4 ml-1.5 inline-block transition-transform group-hover:translate-x-1" />
);

const ZapIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <Lightning weight="fill" className={className} />
);

const UsersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <UsersThree weight="duotone" className={className} />
);

const ChartBarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <ChartLineUp weight="duotone" className={className} />
);

const BriefcaseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Briefcase weight="duotone" className={className} />
);

const FileTextIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <FileText weight="duotone" className={className} />
);

const ClockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Clock weight="duotone" className={className} />
);

const CalendarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <CalendarCheck weight="duotone" className={className} />
);

const PrinterIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Printer weight="duotone" className={className} />
);

export const LandingPage: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'payroll' | 'leave'>('dashboard');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    apiClient.checkHealth()
      .then((res) => {
        if (res.success) setApiStatus('online');
        else setApiStatus('offline');
      })
      .catch(() => setApiStatus('offline'));
  }, []);

  const faqs = [
    {
      question: "What makes PeoplePay360 different from isolated HR software?",
      answer: "PeoplePay360 unifies Employee Master Data, Period-Based Contracts, Working Schedules, Attendance Tracking, Leave Allocations, and Payruns into one connected operational workflow, ensuring payroll always reflects active contract terms and verified attendance without manual spreadsheets."
    },
    {
      question: "How does period-specific contract management work?",
      answer: "When executing a Payrun for a specific period (e.g. September 2026), PeoplePay360 automatically evaluates and applies the exact contract valid during that timeframe, accurately accommodating wage changes, position updates, and structural adjustments."
    },
    {
      question: "What is the 2-Step Payrun Creation Wizard?",
      answer: "Instead of immediately creating a batch record, the wizard first lets you define period scope and salary structure overrides, then filters and lets you explicitly select eligible staff before building and opening the processing view."
    },
    {
      question: "How are leave balances and allocations handled?",
      answer: "Time off types define leave policies and allocation rules. Approved leave requests automatically deduct from employee balances in real-time, ensuring clear balances and accurate payroll adjustments."
    },
    {
      question: "How are payslips generated and delivered to employees?",
      answer: "Payslips calculated during Payruns break down Basic, Allowances, Deductions, Gross, and Net amounts. Officers can generate individual printable PDFs or use the bulk Send Payslips action for automated email distribution."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-600 flex flex-col overflow-x-hidden">

      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-slate-900 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2"
      >
        <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
          <ZapIcon className="w-3 h-3 fill-current" /> PLATFORM
        </span>
        <span>PeoplePay360 — Integrated HR & Payroll Operations Suite</span>
        <a href="#features" className="underline hover:text-orange-300 transition ml-1 hidden sm:inline">
          Explore Core Modules →
        </a>
      </motion.div>

      {/* 2. DYNAMIC NAVIGATION BAR */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`sticky z-50 transition-all duration-300 w-full ${
          isScrolled
            ? 'top-3 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-2'
            : 'top-0 max-w-full px-0 mt-0'
        }`}
      >
        <nav
          className={`transition-all duration-300 flex items-center justify-between ${
            isScrolled
              ? 'bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-full px-6 py-3 shadow-lg hover:shadow-xl'
              : 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 rounded-none px-6 sm:px-12 py-4 shadow-sm'
          }`}
        >
          {/* Logo */}
          <div className="flex items-center">
            <a href="#home">
              <img src="/logo.webp" alt="PeoplePay360" className="h-9 w-auto object-contain" />
            </a>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#home" className="text-orange-600 font-bold hover:text-orange-600 transition">Home</a>
            <a href="#overview" className="hover:text-orange-600 transition">Overview</a>
            <a href="#workflow" className="hover:text-orange-600 transition">Operations Workflow</a>
            <a href="#roles" className="hover:text-orange-600 transition">User Roles</a>
            <a href="#faq" className="hover:text-orange-600 transition">FAQ</a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/auth/login"
                className="group inline-flex items-center justify-center px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-600 rounded-full transition shadow-md shadow-orange-500/25"
              >
                <span>Sign Up</span>
                <div className="w-4 h-4 ml-1.5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRightIcon />
                </div>
              </Link>
            </motion.div>
          </div>
        </nav>
      </motion.header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow">

        {/* 3. HERO SECTION */}
        <section id="home" className="relative min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-90px)] flex flex-col items-center justify-center py-12 md:py-16 overflow-hidden hero-gradient-bg">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 my-auto"
          >
            {/* Tag Pill */}
            <motion.div variants={fadeInUpVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 mb-6 text-xs font-semibold text-orange-700 shadow-sm">
              <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Enterprise HR Suite</span>
              <span>Unified Employee Master, Attendance, Time Off & Payroll Engine</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 variants={fadeInUpVariants} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
              <span className="gradient-text-brand">PeoplePay360</span> — Seamless HR & Payroll <span className="text-orange-600">Operational Experience</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeInUpVariants} className="mt-6 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
              Connect employee profiles, period-specific contracts, working schedules, attendance exceptions, and leave allocations directly into automated payruns, payslips, and strategic dashboard reporting.
            </motion.p>

            {/* Centered Hero CTA */}
            <motion.div variants={fadeInUpVariants} className="relative mt-9 mb-8 flex items-center justify-center">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/auth/login"
                  className="relative z-10 group inline-flex items-center gap-3 px-7 py-3 text-sm font-bold text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 bg-[length:200%_auto] hover:bg-right rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 border border-white/20"
                >
                  <span className="tracking-wide">Open HR & Payroll Workspace</span>
                  <div className="w-6 h-6 rounded-full bg-white text-orange-600 flex items-center justify-center shadow-xs group-hover:translate-x-1 transition-transform">
                    <ArrowRight weight="bold" className="w-3.5 h-3.5 fill-current" />
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* 4. LIVE INTERACTIVE SYSTEM PREVIEW */}
        <section id="overview" className="pt-12 pb-24 md:pt-16 md:pb-28 hero-gradient-bg">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={heroScaleVariants}
            className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="card-hero-glow rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden border border-slate-200">

              {/* Control Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-200/80 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="ml-2 text-xs font-bold text-slate-700">PeoplePay360 Workspace Overview</span>
                  <span className={`ml-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${apiStatus === 'online' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    {apiStatus === 'online' ? 'System Live' : 'Operational'}
                  </span>
                </div>

                {/* Tab Switchers */}
                <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'dashboard' ? 'bg-white text-orange-600 shadow-sm font-bold' : 'hover:text-slate-900'}`}
                  >
                    <ChartBarIcon className="w-3.5 h-3.5" />
                    <span>Payroll Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('payroll')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'payroll' ? 'bg-white text-orange-600 shadow-sm font-bold' : 'hover:text-slate-900'}`}
                  >
                    <BriefcaseIcon className="w-3.5 h-3.5" />
                    <span>Payrun Batches</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('leave')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'leave' ? 'bg-white text-orange-600 shadow-sm font-bold' : 'hover:text-slate-900'}`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Time Off & Attendance</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: LIVE PAYROLL DASHBOARD */}
              {activeTab === 'dashboard' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white/95 text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xl font-sans text-xs space-y-7 text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                        Payroll & Operational Analytics Dashboard
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Real-time aggregate data across Employee Master, Contracts, Attendance, Time Off, and Payroll modules.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link to="/auth/login" className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 rounded-full shadow-md hover:opacity-95 transition">
                        Manage Live Workspace →
                      </Link>
                    </div>
                  </div>

                  {/* 4 Stat Cards */}
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainerVariants}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    <motion.div variants={cardScaleVariants} whileHover={{ y: -4 }} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 transition-all">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Net Salary Paid</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">$67.78M</div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">824 Payslips Processed</div>
                    </motion.div>
                    <motion.div variants={cardScaleVariants} whileHover={{ y: -4 }} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 transition-all">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Employees</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">206 Staff</div>
                      <div className="text-[10px] text-slate-400 font-medium">280 Total Registered</div>
                    </motion.div>
                    <motion.div variants={cardScaleVariants} whileHover={{ y: -4 }} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 transition-all">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Approved Leave Days</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">220 Days</div>
                      <div className="text-[10px] text-amber-600 font-bold mt-0.5">40 Pending Requests</div>
                    </motion.div>
                    <motion.div variants={cardScaleVariants} whileHover={{ y: -4 }} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 transition-all">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Attendance Health Score</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">89%</div>
                      <div className="text-[10px] text-teal-600 font-bold mt-0.5">On-Time & Present Rate</div>
                    </motion.div>
                  </motion.div>

                  {/* Department Breakdown */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Department Salary Expenditure & Headcount Breakdown</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <motion.div whileHover={{ y: -3 }} className="bg-white p-3 rounded-xl border border-slate-200 transition-all">
                        <div className="font-extrabold text-slate-900">Engineering</div>
                        <div className="text-xs text-orange-600 font-bold">$28.45M</div>
                        <div className="text-[10px] text-slate-500">68 Active Staff</div>
                      </motion.div>
                      <motion.div whileHover={{ y: -3 }} className="bg-white p-3 rounded-xl border border-slate-200 transition-all">
                        <div className="font-extrabold text-slate-900">Sales & Marketing</div>
                        <div className="text-xs text-orange-600 font-bold">$18.90M</div>
                        <div className="text-[10px] text-slate-500">52 Active Staff</div>
                      </motion.div>
                      <motion.div whileHover={{ y: -3 }} className="bg-white p-3 rounded-xl border border-slate-200 transition-all">
                        <div className="font-extrabold text-slate-900">Operations</div>
                        <div className="text-xs text-orange-600 font-bold">$12.30M</div>
                        <div className="text-[10px] text-slate-500">45 Active Staff</div>
                      </motion.div>
                      <motion.div whileHover={{ y: -3 }} className="bg-white p-3 rounded-xl border border-slate-200 transition-all">
                        <div className="font-extrabold text-slate-900">HR & Legal</div>
                        <div className="text-xs text-orange-600 font-bold">$8.13M</div>
                        <div className="text-[10px] text-slate-500">21 Active Staff</div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: PAYRUN BATCHES */}
              {activeTab === 'payroll' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white/95 text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xl font-sans text-xs space-y-6 text-left"
                >
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">2-Step Payrun Creation & Batch Processing</h3>
                      <p className="text-xs text-slate-500">Define batch period, filter staff, compute salary rules, validate warnings, and generate payslips.</p>
                    </div>
                    <span className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-xs">
                      Step 1 Scope → Step 2 Staff Selection
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div whileHover={{ y: -4 }} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 transition-all">
                      <div className="font-extrabold text-slate-900 text-sm">1. Batch Scope Definition</div>
                      <p className="text-slate-600 text-xs">Set payrun reference, start/end dates, and select salary structure rules container.</p>
                    </motion.div>
                    <motion.div whileHover={{ y: -4 }} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 transition-all">
                      <div className="font-extrabold text-slate-900 text-sm">2. Explicit Staff Selection</div>
                      <p className="text-slate-600 text-xs">Filter employees by department or type, and select batch participants before record creation.</p>
                    </motion.div>
                    <motion.div whileHover={{ y: -4 }} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 transition-all">
                      <div className="font-extrabold text-slate-900 text-sm">3. Compute, Validate & Send</div>
                      <p className="text-slate-600 text-xs">Calculate Basic, Allowances, Deductions, Gross & Net. Print PDF or bulk email payslips.</p>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: TIME OFF & ATTENDANCE */}
              {activeTab === 'leave' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white/95 text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xl font-sans text-xs space-y-6 text-left"
                >
                  <div className="pb-4 border-b border-slate-100">
                    <h3 className="text-lg font-extrabold text-slate-900">Time Off Allocations & Working Schedules</h3>
                    <p className="text-xs text-slate-500">Track daily check-in/out records, weekly schedule patterns, leave requests, and atomic balance deductions.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.div whileHover={{ y: -4 }} className="p-4 bg-slate-50 rounded-xl border border-slate-200 transition-all">
                      <h4 className="font-extrabold text-slate-900 text-sm mb-2">Leave Types & Allocations</h4>
                      <p className="text-slate-600 text-xs">Configure leave policies in days or hours. Approved requests automatically deduct from employee balances in real-time.</p>
                    </motion.div>
                    <motion.div whileHover={{ y: -4 }} className="p-4 bg-slate-50 rounded-xl border border-slate-200 transition-all">
                      <h4 className="font-extrabold text-slate-900 text-sm mb-2">Working Schedule Setup</h4>
                      <p className="text-slate-600 text-xs">Define weekly work patterns with shift start/end times and break duration. Total weekly hours are computed automatically.</p>
                    </motion.div>
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        </section>

        {/* 5. 5-STEP OPERATIONS WORKFLOW SECTION WITH SCROLL ANIMATIONS */}
        <section id="workflow" className="py-20 bg-white border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeInUpVariants}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <span className="text-orange-600 font-extrabold text-xs uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                End-to-End Operational Lifecycle
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-4 tracking-tight">
                How PeoplePay360 Powers Your HR & Payroll Flow
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-3">
                A connected business flow linking employee master data to contract validity, working schedules, leave allocations, payruns, and payslip delivery.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={staggerContainerVariants}
              className="grid grid-cols-1 md:grid-cols-5 gap-6 relative"
            >
              {[
                { step: '01', title: 'Employee Master', desc: 'Central hub for employee profiles, Kanban/List views, department assignments, and smart button count shortcuts.', icon: UsersIcon },
                { step: '02', title: 'Contract & Schedule', desc: 'Link historical contracts and weekly working schedules to enforce period-valid salary terms and expected hours.', icon: FileTextIcon },
                { step: '03', title: 'Time Off & Attendance', desc: 'Capture check-in/out logs, manage manual edits, allocate leave balances, and approve time off requests.', icon: CalendarIcon },
                { step: '04', title: '2-Step Payrun Wizard', desc: 'Define period scope and salary structures, filter eligible staff, and initialize batch calculations.', icon: BriefcaseIcon },
                { step: '05', title: 'Payslips & Analytics', desc: 'Compute rule breakdowns, review validation warnings, print PDF payslips, send emails, and inspect live dashboards.', icon: PrinterIcon },
              ].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={cardScaleVariants}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 font-extrabold text-xs flex items-center justify-center">
                          {item.step}
                        </span>
                        <IconComponent className="text-slate-400" />
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm mb-2">{item.title}</h3>
                      <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* 6. KEY MODULES BREAKDOWN WITH SCROLL REVEAL */}
        <section id="features" className="py-20 hero-gradient-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeInUpVariants}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <span className="text-orange-600 font-extrabold text-xs uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                Core System Modules
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-4 tracking-tight">
                Complete HR Master Management & Payroll Capabilities
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-3">
                Everything HR officers, payroll specialists, and managers need to operate efficiently with full accuracy.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={staggerContainerVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                { title: 'Employee Master Management', desc: 'Kanban, List, and Form views for staff records. Smart-button count shortcuts for related Contracts, Attendance, Time Off, and Allocations.', icon: UsersIcon },
                { title: 'Period-Based Contract Handling', desc: 'Maintain complete contract history per employee while ensuring payroll calculations execute strictly on the active, period-valid contract terms.', icon: FileTextIcon },
                { title: 'Working Schedule Setup', desc: 'Define weekly patterns by day, start/end time, and break duration. Weekly working hours are calculated automatically to benchmark attendance.', icon: ClockIcon },
                { title: 'Time Off Types & Allocations', desc: 'Configure leave policies with units (days/hours). Approved leave requests automatically deduct from allocations, keeping balances transparent.', icon: CalendarIcon },
                { title: 'Salary Structures & Rules', desc: 'Container structures holding ordered Salary Rules. Computes Basic, Allowances, Gross, Deductions, and Net salary in exact dependency sequence.', icon: BriefcaseIcon },
                { title: 'Live Payroll Reporting Dashboard', desc: 'Aggregates metrics across system records. Filter live salary costs, attendance health, and leave patterns by Period, Department, or Employee Type.', icon: ChartBarIcon },
              ].map((mod, idx) => {
                const IconComponent = mod.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={cardScaleVariants}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mb-5">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mb-2">{mod.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">{mod.desc}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* 7. ROLE-BASED SOLUTIONS */}
        <section id="roles" className="py-20 bg-white border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeInUpVariants}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <span className="text-orange-600 font-extrabold text-xs uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                Security & Access Governance
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-4 tracking-tight">
                5 Standard User Roles tailored to Organizational Hierarchy
              </h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={staggerContainerVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
            >
              {[
                { role: 'Employee', desc: 'View own details, attendance logs, and leave balances. Submit time off requests.' },
                { role: 'HR Manager', desc: 'Full CRUD access to Employees, Contracts, Schedules, Attendance, and Time Off approvals.' },
                { role: 'HR Payroll User', desc: 'All HR Manager permissions plus Create/Read/Update access to Payruns and Payslips.' },
                { role: 'HR Payroll Manager', desc: 'Full CRUD control over Payruns, Payslips, Salary Structures, and Salary Rules.' },
                { role: 'System Admin', desc: 'Complete system administration, user management, role assignments, and permission configuration.' },
              ].map((r, idx) => (
                <motion.div
                  key={idx}
                  variants={cardScaleVariants}
                  whileHover={{ y: -4 }}
                  className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2 transition-all cursor-pointer"
                >
                  <div className="text-orange-600 font-extrabold text-xs uppercase tracking-wider">{r.role}</div>
                  <p className="text-slate-600 text-xs font-medium leading-relaxed">{r.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 8. FAQ ACCORDION SECTION */}
        <section id="faq" className="py-20 hero-gradient-bg border-t border-slate-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeInUpVariants}
              className="text-center mb-14"
            >
              <span className="text-orange-600 font-extrabold text-xs uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl font-extrabold text-slate-950 mt-4 tracking-tight">
                Everything you need to know about PeoplePay360
              </h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={staggerContainerVariants}
              className="space-y-4"
            >
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <motion.div
                    key={idx}
                    variants={cardScaleVariants}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex justify-between items-center gap-4 cursor-pointer hover:bg-slate-50/80 transition"
                    >
                      <span className="font-extrabold text-slate-900 text-sm">{faq.question}</span>
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0 text-xs">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>

                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="px-5 pb-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100"
                      >
                        <p className="mt-2">{faq.answer}</p>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* 9. BOTTOM CALL TO ACTION */}
        <section className="py-20 bg-slate-950 text-white text-center relative overflow-hidden">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUpVariants}
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Streamline Your HR & Payroll Operations?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Experience the unified employee lifecycle platform built for real-world HR teams, period-based contract tracking, and automated payruns.
            </p>
            <div className="pt-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-3 px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-600 rounded-full shadow-lg shadow-orange-500/25 transition"
                >
                  <span>Access PeoplePay360 Workspace</span>
                  <ArrowRight weight="bold" className="w-4 h-4 fill-current" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

      </main>

      {/* 10. FOOTER WITH GIANT BRAND WATERMARK & POLICY LINKS */}
      <footer className="bg-black text-slate-400 text-xs pt-12 pb-6 border-t border-slate-900 overflow-hidden select-none">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12">
          {/* Top Info & Links Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-12 border-b border-slate-900/80">
            {/* Left Copyright & Brand */}
            <div className="space-y-1">
              <p className="text-slate-300 font-medium text-[11px] leading-tight">
                Copyright © {new Date().getFullYear()} PeoplePay360. All Rights Reserved.
              </p>
              <p className="text-slate-500 text-[10px]">
                Brand of PeoplePay360 Technologies Pvt. Ltd.
              </p>
            </div>

            {/* Right Legal Links */}
            <div className="flex items-center gap-6 text-[11px] font-medium text-slate-400">
              <a href="#terms" className="hover:text-white transition">Terms of Service</a>
              <a href="#privacy" className="hover:text-white transition">Privacy Policy</a>
              <a href="#refund" className="hover:text-white transition">Refund Policy</a>
            </div>
          </div>

          {/* Giant Monumental Gradient Watermark Text with Opacity Fade Gradient */}
          <div className="pt-6 pb-4 w-full overflow-hidden flex justify-center items-center px-4 relative">
            <span
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 35%, rgba(0,0,0,0.15) 100%)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 35%, rgba(0,0,0,0.15) 100%)',
              }}
              className="font-black tracking-tight text-[7.5vw] sm:text-[8vw] md:text-[8.4vw] leading-none uppercase bg-gradient-to-r from-[#FF5E1E] via-[#EAB308] to-[#14B8A6] bg-clip-text text-transparent opacity-90 drop-shadow-2xl whitespace-nowrap text-center select-none max-w-full"
            >
              PeoplePay360
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};
