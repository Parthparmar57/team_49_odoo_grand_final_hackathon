import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { apiClient } from '../../api/client';
import {
  Sparkle,
  Lightning,
  CheckCircle,
  ArrowRight,
  UsersThree,
  EnvelopeSimple,
  ChartLineUp,
  ShieldCheck,
  Tag,
  ChatCircleDots,
  LockKey,
  Database,
  CreditCard,
  Briefcase,
  Robot,
} from '@phosphor-icons/react';

// --- SILKY CINEMATIC FRAMER MOTION ANIMATION VARIANTS ---
const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(4px)' },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
    transition: { 
      duration: 1.05, 
      ease: [0.16, 1, 0.3, 1] 
    }
  }
};

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.16,
      delayChildren: 0.12
    }
  }
};

const heroScaleVariants: Variants = {
  hidden: { opacity: 0, y: 55, scale: 0.94, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { 
      duration: 1.3, 
      ease: [0.16, 1, 0.3, 1],
      delay: 0.2
    }
  }
};

// --- PREMIUM PHOSPHOR & HEROICONS (Ultra-sleek duotone & vector enterprise icons) ---
const ArrowRightIcon = () => (
  <ArrowRight weight="bold" className="w-4 h-4 ml-1.5 inline-block transition-transform group-hover:translate-x-1" />
);

const CheckIcon = ({ className = "w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" }: { className?: string }) => (
  <CheckCircle weight="fill" className={className} />
);

const ZapIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <Lightning weight="fill" className={className} />
);

const SparklesIcon = () => (
  <Sparkle weight="fill" className="w-4 h-4 text-amber-500 inline-block mr-1.5 animate-pulse" />
);

const UsersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <UsersThree weight="duotone" className={className} />
);

const MailIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <EnvelopeSimple weight="duotone" className={className} />
);

const ChartBarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <ChartLineUp weight="duotone" className={className} />
);

const ShieldCheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <ShieldCheck weight="duotone" className={className} />
);

const TagIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Tag weight="duotone" className={className} />
);

const MessageSquareIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <ChatCircleDots weight="duotone" className={className} />
);

const LockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <LockKey weight="duotone" className={className} />
);

const DatabaseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Database weight="duotone" className={className} />
);

const CreditCardIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <CreditCard weight="duotone" className={className} />
);

const BriefcaseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Briefcase weight="duotone" className={className} />
);

const BotIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <Robot weight="duotone" className={className} />
);

// --- SOCIAL MEDIA ICONS ---
const FacebookIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const XTwitterIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

export const LandingPage: React.FC = () => {
  // Backend API connection state
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // State for Live Sandbox Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'email-demo' | 'payroll'>('dashboard');
  const [demoState, setDemoState] = useState<'idle' | 'extracting' | 'validating' | 'completed'>('idle');
  const [selectedSampleEmail, setSelectedSampleEmail] = useState(0);

  // State for Interactive Pricing Calculator
  const [employeeCount, setEmployeeCount] = useState<number>(25);
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR'>('INR');

  // State for FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Check Backend Health on Mount
  useEffect(() => {
    apiClient.checkHealth()
      .then((res) => {
        if (res.success) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      })
      .catch(() => setApiStatus('offline'));
  }, []);

  const sampleEmails = [
    {
      sender: "rahul.sharma@company.com",
      subject: "Leave Request - Family Function",
      body: "Hi HR Team,\nI need leave from 10 September 2026 to 12 September 2026 due to a family function.\nRegards,\nRahul",
      type: "Casual Leave",
      dates: "Sep 10 - Sep 12 (3 days)",
      confidence: "96%"
    },
    {
      sender: "priya.patel@company.com",
      subject: "Urgent Sick Leave",
      body: "Hello HR,\nI am suffering from severe flu and won't be able to join work today and tomorrow (Sep 15 - Sep 16).\nThanks,\nPriya",
      type: "Sick Leave",
      dates: "Sep 15 - Sep 16 (2 days)",
      confidence: "98%"
    }
  ];

  const handleSimulateAI = async () => {
    setDemoState('extracting');
    const email = sampleEmails[selectedSampleEmail];
    
    try {
      await apiClient.sendInboundEmail({
        senderEmail: email.sender,
        subject: email.subject,
        body: email.body,
      });
      setDemoState('validating');
      setTimeout(() => {
        setDemoState('completed');
      }, 800);
    } catch {
      setTimeout(() => {
        setDemoState('validating');
        setTimeout(() => {
          setDemoState('completed');
        }, 1000);
      }, 1000);
    }
  };

  const getPerEmployeeRate = () => {
    if (currency === 'INR') return 650;
    if (currency === 'USD') return 8;
    return 7.5;
  };

  const getCurrencySymbol = () => {
    if (currency === 'INR') return '₹';
    if (currency === 'USD') return '$';
    return '€';
  };

  const calculateTotal = () => {
    return (employeeCount * getPerEmployeeRate()).toLocaleString();
  };

  const faqs = [
    {
      question: "What is PeoplePay360?",
      answer: "PeoplePay360 is an integrated HR & Payroll platform that converts natural-language employee emails into validated leave requests, keeps humans in control of approvals, and automates downstream payroll calculations."
    },
    {
      question: "Does AI make final leave approval decisions?",
      answer: "No. AI parses, validates, and recommends structured requests, but an authorized human HR manager retains 100% final authority to approve or refuse leave."
    },
    {
      question: "How does period-specific contract selection work?",
      answer: "When generating a payrun for a period (e.g. September 2026), PeoplePay360 automatically selects only the contract active during that exact validity window."
    },
    {
      question: "How does PeoplePay360 handle employee privacy?",
      answer: "We enforce strict role-based access control (RBAC), end-to-end data encryption, and auditable MCP tool permissions. Data is never shared or used to train public models."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-600 flex flex-col">
      
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
          <ZapIcon className="w-3 h-3 fill-current" /> EVENT
        </span>
        <span>We're presenting <strong>PeoplePay360</strong> at Odoo Grand Final Hackathon 2026!</span>
        <a href="#features" className="underline hover:text-orange-300 transition ml-1 hidden sm:inline">
          Explore AI Leave Automation →
        </a>
      </div>

      {/* 2. FLOATING NAVIGATION BAR */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-4 z-50 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-3 w-full"
      >
        <nav className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-full px-6 py-3 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md">
          
          {/* Logo */}
          <div className="flex items-center">
            <a href="#home">
              <img src="/logo.webp" alt="PeoplePay360" className="h-9 w-auto object-contain" />
            </a>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#home" className="text-orange-600 font-bold hover:text-orange-600 transition">Home</a>
            <a href="#benefits" className="hover:text-orange-600 transition">Benefits</a>
            <a href="#differentiators" className="hover:text-orange-600 transition">Why Us</a>
            <a href="#features" className="hover:text-orange-600 transition">Features</a>
            <a href="#pricing" className="hover:text-orange-600 transition">Pricing</a>
            <a href="#faq" className="hover:text-orange-600 transition">FAQ</a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/auth/login"
              className="inline-flex items-center justify-center px-4.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition border border-slate-200"
            >
              Sign In
            </Link>
            <Link
              to="/auth/login"
              className="group inline-flex items-center justify-center px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-600 rounded-full transition shadow-md shadow-orange-500/25"
            >
              <span>Get Started</span>
              <div className="w-4 h-4 ml-1.5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <ArrowRightIcon />
              </div>
            </Link>
          </div>
        </nav>
      </motion.header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow">
        
        {/* 3. HERO SECTION */}
        <section id="home" className="relative pt-12 pb-16 md:pt-16 md:pb-24 overflow-hidden hero-gradient-bg">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
          >
            
            {/* Tag Pill */}
            <motion.div variants={fadeInUpVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 mb-6 text-xs font-semibold text-orange-700 shadow-sm animate-pulse-slow">
              <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
              <span>AI Email-to-Workflow Leave & Payroll Engine</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 variants={fadeInUpVariants} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
              <span className="gradient-text-brand">PeoplePay360</span> — Transform Employee Emails Into <span className="underline decoration-orange-400/60 decoration-wavy">Automated Workflows</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeInUpVariants} className="mt-6 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
              Simulate real-world leave requests from natural-language emails, automate entity extraction, connect period-specific contracts to payroll, and maintain human authorization effortlessly.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUpVariants} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/auth/login"
                className="w-full sm:w-auto group inline-flex items-center justify-center px-7 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-600 rounded-full shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition duration-200"
              >
                <span>Sign In to Platform</span>
                <ArrowRightIcon />
              </Link>
              <a href="#agents" className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-full shadow-sm hover:shadow transition">
                <SparklesIcon />
                <span>Explore 5-Agent Architecture</span>
              </a>
            </motion.div>

            {/* Trust Highlights */}
            <motion.div variants={fadeInUpVariants} className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center"><CheckIcon /> 100% Human-in-the-Loop Control</span>
              <span className="flex items-center"><CheckIcon /> Gmail API + MCP Integration</span>
              <span className="flex items-center"><CheckIcon /> BullMQ Async Queues</span>
            </motion.div>
          </motion.div>

          {/* 4. LIVE INTERACTIVE DASHBOARD PREVIEW CONTAINER */}
          <motion.div 
            id="demo" 
            initial="hidden"
            animate="visible"
            variants={heroScaleVariants}
            className="mt-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="card-hero-glow rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden border border-slate-200">
              
              {/* Top Preview Control Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-200/80 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="ml-2 text-xs font-semibold text-slate-400">app.peoplepay360.com / workspace</span>
                  <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${apiStatus === 'online' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    {apiStatus === 'online' ? 'Backend Connected' : 'Local Mode'}
                  </span>
                </div>

                {/* Tab Switchers */}
                <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'dashboard' ? 'bg-white text-orange-600 shadow-sm font-bold' : 'hover:text-slate-900'}`}
                  >
                    <ChartBarIcon className="w-3.5 h-3.5" />
                    <span>Live Dashboard</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('email-demo')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'email-demo' ? 'bg-white text-orange-600 shadow-sm font-bold' : 'hover:text-slate-900'}`}
                  >
                    <ZapIcon className="w-3.5 h-3.5" />
                    <span>AI Email Sandbox</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('payroll')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'payroll' ? 'bg-white text-orange-600 shadow-sm font-bold' : 'hover:text-slate-900'}`}
                  >
                    <BriefcaseIcon className="w-3.5 h-3.5" />
                    <span>Payroll Engine</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: LIVE DASHBOARD PREVIEW MATCHING SCREENSHOT EXACTLY */}
              {activeTab === 'dashboard' && (
                <div className="bg-white/95 text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xl font-sans text-xs space-y-7 text-left">
                  
                  {/* Top Welcome Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                        Good afternoon, Mohit <span className="text-xl">👋</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Here's what's happening across your HR & payroll workspace.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-full shadow-2xs hover:bg-slate-50 transition">
                        View Reports
                      </button>
                      <button className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 rounded-full shadow-md shadow-orange-500/20 hover:opacity-95 transition flex items-center gap-1.5">
                        <span>+ New Payrun</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Top Stat KPI Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    {/* Card 1: Active Payruns */}
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 shadow-2xs flex items-center gap-3 hover:bg-slate-50 transition">
                      <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0">
                        <ZapIcon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Payruns</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">4</div>
                        <div className="text-[10px] text-slate-400 font-medium">4 total payruns</div>
                      </div>
                    </div>

                    {/* Card 2: Total Employees */}
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 shadow-2xs flex items-center gap-3 hover:bg-slate-50 transition">
                      <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                        <UsersIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Employees</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">42</div>
                        <div className="text-[10px] text-slate-400 font-medium">42 active</div>
                      </div>
                    </div>

                    {/* Card 3: High-Risk Flags */}
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 shadow-2xs flex items-center gap-3 hover:bg-slate-50 transition">
                      <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0">
                        <ShieldCheckIcon className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">High-Risk Flags</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">0</div>
                        <div className="text-[10px] text-slate-400 font-medium">0 compliance flags</div>
                      </div>
                    </div>

                    {/* Card 4: Avg. Attendance */}
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 shadow-2xs flex items-center gap-3 hover:bg-slate-50 transition">
                      <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                        <ChartBarIcon className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg. Attendance</div>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">98%</div>
                        <div className="text-[10px] text-slate-400 font-medium">across live contracts</div>
                      </div>
                    </div>

                  </div>

                  {/* Middle Grid: Left RATE TRENDS Chart & Right OUTCOMES Donut Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* RATE TRENDS Line Chart (8/12 span) */}
                    <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">RATE TRENDS</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">How open, click, leave, and payrun rates have moved across recent periods.</p>
                          </div>
                          <a href="#demo" className="text-orange-600 text-xs font-bold hover:underline shrink-0">
                            Full report →
                          </a>
                        </div>

                        {/* Chart Color Legends */}
                        <div className="flex items-center justify-end gap-4 text-[10px] font-bold text-slate-600 mt-3">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-cyan-500 rounded-full"></span> Leave %</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-amber-500 rounded-full"></span> Payroll %</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-orange-500 rounded-full"></span> Audit %</span>
                        </div>
                      </div>

                      {/* SVG Line Chart Graphic */}
                      <div className="relative h-44 w-full pt-2">
                        {/* Y Axis Gridlines */}
                        <div className="absolute inset-0 flex flex-col justify-between text-[9px] font-bold text-slate-300 pointer-events-none">
                          <div className="border-b border-slate-100 w-full flex justify-between"><span>100%</span></div>
                          <div className="border-b border-slate-100 w-full flex justify-between"><span>75%</span></div>
                          <div className="border-b border-slate-100 w-full flex justify-between"><span>50%</span></div>
                          <div className="border-b border-slate-100 w-full flex justify-between"><span>25%</span></div>
                          <div className="border-b border-slate-100 w-full flex justify-between"><span>0%</span></div>
                        </div>

                        {/* SVG Paths matching screenshot */}
                        <svg className="w-full h-full relative z-10 overflow-visible" viewBox="0 0 400 140" preserveAspectRatio="none">
                          {/* Orange Line (bottom) */}
                          <path d="M 0 135 L 130 135 L 260 135 L 400 132" fill="none" stroke="#FF5E1E" strokeWidth="2.5" strokeLinecap="round" />
                          {/* Amber Line (rising mid) */}
                          <path d="M 0 135 L 130 135 L 260 130 L 400 50" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                          {/* Cyan Line (steep curve to top right) */}
                          <path d="M 0 135 L 130 135 L 260 120 L 400 15" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </div>

                      {/* X Axis Labels */}
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400 pt-1">
                        <span>Period 1</span>
                        <span>Period 2</span>
                        <span>Period 3</span>
                        <span>Current Period</span>
                      </div>
                    </div>

                    {/* OUTCOMES Donut Chart (5/12 span) */}
                    <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                      <div>
                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">OUTCOMES</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Per-employee outcome breakdown across payruns.</p>
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        {/* Donut Chart Ring */}
                        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path strokeDasharray="66, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#06B6D4" strokeWidth="4.5" />
                            <path strokeDasharray="20, 100" strokeDashoffset="-66" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F59E0B" strokeWidth="4.5" />
                            <path strokeDasharray="10, 100" strokeDashoffset="-86" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#FF5E1E" strokeWidth="4.5" />
                            <path strokeDasharray="4, 100" strokeDashoffset="-96" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#94A3B8" strokeWidth="4.5" />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-xl font-extrabold text-slate-900 leading-none">42</span>
                            <span className="text-[9px] text-slate-400 font-semibold uppercase">delivered</span>
                          </div>
                        </div>

                        {/* Legend Table Breakdown */}
                        <div className="flex-1 space-y-2 text-[11px] font-semibold">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Pending Action
                            </span>
                            <span className="text-slate-400">2 <span className="text-[10px] text-slate-300 font-mono">5%</span></span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Leave Requested
                            </span>
                            <span className="text-slate-400">8 <span className="text-[10px] text-slate-300 font-mono">19%</span></span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Approved & Paid
                            </span>
                            <span className="text-slate-400">28 <span className="text-[10px] text-slate-300 font-mono">66%</span></span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <span className="w-2 h-2 rounded-full bg-slate-400"></span> No Action
                            </span>
                            <span className="text-slate-400">4 <span className="text-[10px] text-slate-300 font-mono">10%</span></span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Bottom Grid: ACTIVE PAYRUNS & RECENT ACTIVITY */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Active Payruns */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                      <div>
                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">ACTIVE PAYRUNS</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Currently sending, scheduled, or paused.</p>
                      </div>
                      <div className="h-16 flex items-center justify-center text-xs text-slate-400 italic bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                        No active payrun warnings. All 4 payruns synced.
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900">RECENT ACTIVITY</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Latest events from your HR workflow engine.</p>
                        </div>
                        <a href="#demo" className="text-orange-600 text-xs font-bold hover:underline">All logs →</a>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center">M</div>
                            <div>
                              <div className="font-bold text-slate-900">Mitul — leave approved</div>
                              <div className="text-[10px] text-slate-400">new again</div>
                            </div>
                          </div>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">+ Leave Approved</span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center">M</div>
                            <div>
                              <div className="font-bold text-slate-900">Mitul — email parsed</div>
                              <div className="text-[10px] text-slate-400">new again</div>
                            </div>
                          </div>
                          <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full">+ Parsed</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 2: AI EMAIL SANDBOX DEMO */}
              {activeTab === 'email-demo' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Interactive AI Email Processing Sandbox</h3>
                      <p className="text-xs text-slate-500">Test how Google Gemini + LangGraph convert raw emails into validated HR requests.</p>
                    </div>
                    <div className="flex gap-2">
                      {sampleEmails.map((_, idx) => (
                        <button 
                          key={idx}
                          onClick={() => { setSelectedSampleEmail(idx); setDemoState('idle'); }}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg border ${selectedSampleEmail === idx ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                        >
                          Sample Email #{idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left font-mono text-xs space-y-2">
                      <div className="text-slate-400 font-sans text-[11px] uppercase font-bold tracking-wider">Incoming Email Payload (Gmail API)</div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-800">
                        <div><strong className="text-slate-500">From:</strong> {sampleEmails[selectedSampleEmail].sender}</div>
                        <div><strong className="text-slate-500">Subject:</strong> {sampleEmails[selectedSampleEmail].subject}</div>
                        <hr className="my-2 border-slate-100" />
                        <div className="whitespace-pre-line text-slate-700 font-sans text-xs">{sampleEmails[selectedSampleEmail].body}</div>
                      </div>
                      <button 
                        onClick={handleSimulateAI}
                        disabled={demoState !== 'idle'}
                        className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-sans text-xs font-bold rounded-lg shadow-md hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <ZapIcon className="w-3.5 h-3.5" />
                        <span>{demoState === 'idle' ? 'Simulate AI Parsing & Workflow' : 'Processing...'}</span>
                      </button>
                    </div>

                    <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs space-y-3">
                      <div className="flex items-center justify-between text-slate-400 font-sans text-[11px] uppercase font-bold tracking-wider">
                        <span>LangGraph Agent State</span>
                        <span className="text-emerald-400">Zod Validated</span>
                      </div>

                      {demoState === 'idle' && (
                        <div className="h-40 flex items-center justify-center text-slate-500 italic">
                          Click "Simulate AI Parsing" to watch the 5 agents execute.
                        </div>
                      )}

                      {demoState === 'extracting' && (
                        <div className="h-40 flex flex-col items-center justify-center text-amber-400 space-y-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
                          <span>Agent 2 (Email Agent) Extracting Entities...</span>
                        </div>
                      )}

                      {demoState === 'validating' && (
                        <div className="h-40 flex flex-col items-center justify-center text-cyan-400 space-y-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                          <span>Agent 3 (Leave Agent) Checking Balances & Policy...</span>
                        </div>
                      )}

                      {demoState === 'completed' && (
                        <div className="space-y-2 font-mono text-[11px]">
                          <div className="text-emerald-400 font-bold">✓ Extraction & Business Validation Complete</div>
                          <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 overflow-x-auto">
{JSON.stringify({
  employee: sampleEmails[selectedSampleEmail].sender,
  leaveType: sampleEmails[selectedSampleEmail].type,
  dates: sampleEmails[selectedSampleEmail].dates,
  confidence: sampleEmails[selectedSampleEmail].confidence,
  status: "READY_FOR_HR_APPROVAL"
}, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PAYROLL ENGINE PREVIEW */}
              {activeTab === 'payroll' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Deterministic Salary Rule Engine</h3>
                      <p className="text-xs text-slate-500">Period-specific contract resolution & ordered rule execution.</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">Payrun #2026-09</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2 px-3">Rule Code</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Computation Formula</th>
                          <th className="py-2 px-3 text-right">Calculated Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">BASIC</td>
                          <td className="py-2.5 px-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">BASIC SALARY</span></td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">Contract Monthly Basic</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">$3,500.00</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">HRA</td>
                          <td className="py-2.5 px-3"><span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">ALLOWANCE</span></td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">40% of BASIC</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">+$1,400.00</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">CONVEYANCE</td>
                          <td className="py-2.5 px-3"><span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">ALLOWANCE</span></td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">Fixed Allowance Rate</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">+$250.00</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">PF_DEDUCTION</td>
                          <td className="py-2.5 px-3"><span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">DEDUCTION</span></td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">12% of BASIC (Statutory)</td>
                          <td className="py-2.5 px-3 text-right font-bold text-red-500">-$420.00</td>
                        </tr>
                        <tr className="bg-orange-50/60 font-bold">
                          <td className="py-3 px-3 text-slate-900">NET_SALARY</td>
                          <td className="py-3 px-3"><span className="bg-orange-200 text-orange-900 px-2 py-0.5 rounded text-[10px] font-bold">FINAL NET</span></td>
                          <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">Gross Earnings - Total Deductions</td>
                          <td className="py-3 px-3 text-right text-base text-orange-600 font-extrabold">$4,730.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </section>

        {/* 5. PROBLEM & SOLUTION COMPARISON CARDS (ULTRA-CLEAN & MODERN) */}
        <section id="benefits" className="py-16 md:py-24 bg-gradient-to-b from-[#FAF9F6] via-white to-white">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainerVariants}
            className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16"
          >
            
            {/* Header */}
            <motion.div variants={fadeInUpVariants} className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-100/80 text-orange-700 font-bold text-[11px] uppercase tracking-wider border border-orange-200/80">
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                <span>THE PAIN POINT</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Why Traditional HR Systems <span className="text-rose-500 underline decoration-rose-300 decoration-wavy">Break Down</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-normal">
                Manual email copying, miscalculated leave balances, and rigid contract dates create endless compliance risk.
              </p>
            </motion.div>

            {/* 2-Column Clean Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Legacy Manual HR Bottlenecks Card */}
              <motion.div 
                variants={fadeInUpVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-gradient-to-b from-rose-50/70 via-white to-slate-50/40 border border-rose-200/80 p-8 rounded-3xl shadow-sm hover:shadow-md transition space-y-6 text-left relative overflow-hidden group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-base shadow-2xs">
                    ✕
                  </div>
                  <span className="px-3 py-1 bg-rose-100/80 text-rose-800 text-[10px] font-bold uppercase tracking-wider rounded-full border border-rose-200">
                    High Risk
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950">Legacy Manual HR Bottlenecks</h3>
                  <p className="text-xs text-slate-500 mt-1">Fragmented tools and disconnected spreadsheets.</p>
                </div>

                <ul className="space-y-4 text-xs sm:text-sm text-slate-700 font-medium">
                  <li className="flex items-start gap-3 bg-white/80 p-3.5 rounded-2xl border border-rose-100/80 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                    <span>HR spends hours manually parsing leave details from emails into spreadsheets.</span>
                  </li>
                  <li className="flex items-start gap-3 bg-white/80 p-3.5 rounded-2xl border border-rose-100/80 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                    <span>Mid-month contract revisions cause incorrect salary & statutory tax calculations.</span>
                  </li>
                  <li className="flex items-start gap-3 bg-white/80 p-3.5 rounded-2xl border border-rose-100/80 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                    <span>Zero auditable validation between employee leave emails and final payslip deductions.</span>
                  </li>
                </ul>
              </motion.div>

              {/* The PeoplePay360 Solution Card */}
              <motion.div 
                variants={fadeInUpVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-gradient-to-b from-emerald-50/80 via-white to-slate-50/40 border border-emerald-200/80 p-8 rounded-3xl shadow-md hover:shadow-lg transition space-y-6 text-left relative overflow-hidden group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-base shadow-sm">
                    ✓
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-200">
                    100% Automated
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950">The PeoplePay360 Solution</h3>
                  <p className="text-xs text-slate-500 mt-1">Unified multi-agent workflow with human authorization control.</p>
                </div>

                <ul className="space-y-4 text-xs sm:text-sm text-slate-700 font-medium">
                  <li className="flex items-start gap-3 bg-white/90 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
                    <CheckIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Gemini 2.5 Flash automatically extracts intent, dates, and leave types into Zod schemas.</span>
                  </li>
                  <li className="flex items-start gap-3 bg-white/90 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
                    <CheckIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Period-specific validity window logic maps contract versions directly to payrun dates.</span>
                  </li>
                  <li className="flex items-start gap-3 bg-white/90 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
                    <CheckIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Human-in-the-loop review ensures 100% authorization control before execution.</span>
                  </li>
                </ul>
              </motion.div>

            </div>

            {/* Bottom Card Container: 5 Pill Cards for Vulnerabilities */}
            <motion.div 
              variants={fadeInUpVariants}
              className="bg-slate-50/70 p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-xl relative overflow-hidden text-center space-y-8"
            >
              
              {/* Subtle Ambient Mesh Glow inside card corners */}
              <div className="absolute top-0 left-0 w-48 h-48 bg-teal-200/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-200/30 rounded-full blur-3xl pointer-events-none"></div>

              {/* Card Title */}
              <h3 className="text-slate-900 font-extrabold text-base sm:text-lg tracking-tight relative z-10">
                Without regular AI leave automation, HR teams remain vulnerable to
              </h3>

              {/* 5 Pill Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
                
                {/* Pill 1 */}
                <motion.div whileHover={{ scale: 1.04, y: -2 }} className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-orange-300 hover:shadow-md transition flex flex-col items-center justify-center space-y-3 group">
                  <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <TagIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="font-bold text-slate-900 text-xs text-center">Manual Data Errors</span>
                </motion.div>

                {/* Pill 2 */}
                <motion.div whileHover={{ scale: 1.04, y: -2 }} className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-orange-300 hover:shadow-md transition flex flex-col items-center justify-center space-y-3 group">
                  <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <MailIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="font-bold text-slate-900 text-xs text-center">Unprocessed Emails</span>
                </motion.div>

                {/* Pill 3 */}
                <motion.div whileHover={{ scale: 1.04, y: -2 }} className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-orange-300 hover:shadow-md transition flex flex-col items-center justify-center space-y-3 group">
                  <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <LockIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="font-bold text-slate-900 text-xs text-center">Contract Mismatches</span>
                </motion.div>

                {/* Pill 4 */}
                <motion.div whileHover={{ scale: 1.04, y: -2 }} className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-orange-300 hover:shadow-md transition flex flex-col items-center justify-center space-y-3 group">
                  <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <DatabaseIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="font-bold text-slate-900 text-xs text-center">Payrun Audit Failures</span>
                </motion.div>

                {/* Pill 5 */}
                <motion.div whileHover={{ scale: 1.04, y: -2 }} className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-orange-300 hover:shadow-md transition flex flex-col items-center justify-center space-y-3 group">
                  <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CreditCardIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="font-bold text-slate-900 text-xs text-center">Salary Overpayments</span>
                </motion.div>

              </div>

              {/* Card Footer Warning */}
              <div className="pt-2 border-t border-slate-200/80 text-xs sm:text-sm font-medium text-slate-600 relative z-10">
                Manual spreadsheet tracking alone <span className="text-orange-600 font-extrabold">isn't enough.</span>
              </div>

            </motion.div>

          </motion.div>
        </section>

        {/* 6. KEY DIFFERENTIATORS (HIGH-IMPACT MODERN GLASSMORPHISM SECTION) */}
        <section id="differentiators" className="py-20 md:py-28 bg-[#0A0E1A] text-white relative overflow-hidden">
          
          {/* Ambient Mesh Background Glow Effects */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none"></div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainerVariants}
            className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16"
          >
            
            {/* Header */}
            <motion.div variants={fadeInUpVariants} className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[11px] uppercase tracking-wider border border-orange-500/30 shadow-md">
                <ZapIcon className="w-3.5 h-3.5 text-orange-400" />
                <span>WHY PEOPLEPAY360</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Built for <span className="gradient-text-brand">Precision, Compliance, & Speed</span>
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-normal">
                Engineered with enterprise-grade architecture for modern high-growth teams.
              </p>
            </motion.div>

            {/* 3 Glassmorphism Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Card 1: Validity Window Contracts */}
              <motion.div 
                variants={fadeInUpVariants}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 hover:border-orange-500/60 shadow-2xl transition-all duration-300 space-y-6 text-left group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
                  <LockIcon className="w-6 h-6 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-white group-hover:text-orange-400 transition">Validity Window Contracts</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Contracts have strict start and end dates. Payruns automatically detect and enforce the exact active contract matching the period.
                  </p>
                </div>

                {/* Mini Preview Widget */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/90 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Sep 2026 Payrun</span>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-md text-[10px] font-bold">
                    Contract v2.4 Active
                  </span>
                </div>
              </motion.div>

              {/* Card 2: MCP Tool-Based Execution */}
              <motion.div 
                variants={fadeInUpVariants}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 hover:border-amber-500/60 shadow-2xl transition-all duration-300 space-y-6 text-left group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
                  <DatabaseIcon className="w-6 h-6 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-white group-hover:text-amber-400 transition">MCP Tool-Based Execution</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Agents do not execute raw SQL queries. Every read and write operates through auditable MCP tools with strict parameters.
                  </p>
                </div>

                {/* Mini Preview Widget */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/90 space-y-1 text-left">
                  <div className="text-amber-400 font-mono font-bold text-xs">mcp.call_tool("calc_salary")</div>
                  <div className="text-slate-500 text-[10px] font-sans">✓ Zod schema validated & logged</div>
                </div>
              </motion.div>

              {/* Card 3: Deterministic Rule Engine */}
              <motion.div 
                variants={fadeInUpVariants}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 hover:border-cyan-500/60 shadow-2xl transition-all duration-300 space-y-6 text-left group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                  <CreditCardIcon className="w-6 h-6 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-white group-hover:text-cyan-400 transition">Deterministic Rule Engine</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Salary rules follow strict sequence numbers (Basic → Allowances → Deductions → Net Salary), preventing circular dependencies.
                  </p>
                </div>

                {/* Mini Preview Widget */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/90 flex items-center justify-between text-[11px] font-mono text-cyan-400 font-bold">
                  <span>1. BASIC</span>
                  <span className="text-slate-600">→</span>
                  <span>2. HRA</span>
                  <span className="text-slate-600">→</span>
                  <span>3. NET</span>
                </div>
              </motion.div>

            </div>

            {/* Bottom Architecture Highlights */}
            <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-400">
              <span className="flex items-center"><CheckIcon /> 100% Deterministic Engine</span>
              <span className="flex items-center"><CheckIcon /> Zero Hallucinations</span>
              <span className="flex items-center"><CheckIcon /> Auditable MCP Tools</span>
              <span className="flex items-center"><CheckIcon /> Role-Based Access Control</span>
            </div>

          </motion.div>
        </section>

        {/* 7. FEATURES BENTO GRID */}
        <section id="features" className="py-16 md:py-24 bg-slate-50/50">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-[11px] uppercase tracking-wider mb-4">
                <ZapIcon className="w-3 h-3" />
                <span>FEATURES</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Everything You <span className="gradient-text-brand">Need</span> to Build an Automated HR Engine
              </h2>
              <p className="mt-3 text-slate-600 text-sm sm:text-base">
                Connect employee master data, leave automation, contracts, payroll, and background notifications into one unified platform.
              </p>
            </div>

            {/* 4 Feature Bento Grid Cards Matching Screenshot 1 UI/UX Exactly */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              
              {/* Card 1: Natural-Language Email Intake (Orange Top Border Accent + Template List) */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/90 border-t-4 border-t-orange-500 shadow-md hover:shadow-xl transition-all duration-300 space-y-6 relative overflow-hidden group">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <MailIcon className="w-5 h-5 text-orange-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-950">Natural-Language Email Intake</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Receive employee leave emails via Gmail API. Automatically extract start dates, end dates, leave types, and reasons without manual typing.
                  </p>
                </div>

                {/* Inner Widget Matching Screenshot 1 Card 1 (Stacked Email Templates) */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-[10px] flex items-center justify-center">M</div>
                      <div>
                        <div className="font-bold text-slate-900">Rahul Sharma</div>
                        <div className="text-[10px] text-slate-400">Leave Sep 10-12 • Casual</div>
                      </div>
                    </div>
                    <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      CASUAL LEAVE
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 font-bold text-[10px] flex items-center justify-center">P</div>
                      <div>
                        <div className="font-bold text-slate-900">Priya Patel</div>
                        <div className="text-[10px] text-slate-400">Flu Leave Sep 15-16</div>
                      </div>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                      SICK LEAVE
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Employee & Contract Hub (Teal Top Border Accent + Avatar Magnifying Highlight) */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/90 border-t-4 border-t-teal-500 shadow-md hover:shadow-xl transition-all duration-300 space-y-6 relative overflow-hidden group">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <UsersIcon className="w-5 h-5 text-teal-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-950">Employee Management</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Import employees individually or in bulk, organize departments, create groups, and manage period contracts effortlessly.
                  </p>
                </div>

                {/* Inner Widget Matching Screenshot 1 Card 2 (Avatar Stack with Magnifying Glass Highlight) */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-center gap-3">
                  {/* Left Avatar Card */}
                  <div className="w-16 h-24 bg-white rounded-xl border border-slate-200/80 p-2 shadow-2xs flex flex-col items-center justify-center opacity-60">
                    <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs mb-1">A</div>
                    <div className="w-10 h-1.5 bg-slate-200 rounded-full"></div>
                  </div>

                  {/* Center Highlighted Avatar Card with Orange Magnifying Accent */}
                  <div className="w-20 h-28 bg-white rounded-2xl border-2 border-orange-500 p-2 shadow-lg flex flex-col items-center justify-center relative scale-105">
                    <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-extrabold text-sm mb-1.5 shadow-2xs">
                      M
                    </div>
                    <div className="w-12 h-2 bg-orange-500 rounded-full mb-1"></div>
                    <div className="w-8 h-1.5 bg-slate-200 rounded-full"></div>
                    
                    {/* Magnifying Glass Icon Overlay */}
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
                      <SparklesIcon />
                    </div>
                  </div>

                  {/* Right Avatar Card */}
                  <div className="w-16 h-24 bg-white rounded-xl border border-slate-200/80 p-2 shadow-2xs flex flex-col items-center justify-center opacity-60">
                    <div className="w-8 h-8 rounded-full bg-teal-200 flex items-center justify-center text-teal-800 font-bold text-xs mb-1">R</div>
                    <div className="w-10 h-1.5 bg-slate-200 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Card 3: Real-Time Operational Reporting (Teal Top Border Accent + KPI Stat Metric Boxes) */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/90 border-t-4 border-t-teal-500 shadow-md hover:shadow-xl transition-all duration-300 space-y-6 relative overflow-hidden group">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <ChartBarIcon className="w-5 h-5 text-teal-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-950">Real-Time Reporting</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Monitor campaign performance & payroll costs live with detailed aggregate dashboards and downloadable reports.
                  </p>
                </div>

                {/* Inner Widget Matching Screenshot 1 Card 3 (Reporting KPI Metric Boxes) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">TOTAL PAYROLL</span>
                    <div className="text-xl font-black text-slate-950 mt-1">$54,200</div>
                    <div className="text-[10px] font-semibold text-emerald-600 mt-0.5">↑ 12.4% vs last period</div>
                  </div>
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">ATTENDANCE HEALTH</span>
                    <div className="text-xl font-black text-emerald-600 mt-1">98.4%</div>
                    <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Optimal workforce</div>
                  </div>
                </div>
              </div>

              {/* Card 4: BullMQ Asynchronous Notifications (Orange Top Border Accent + Async Checklist) */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/90 border-t-4 border-t-orange-500 shadow-md hover:shadow-xl transition-all duration-300 space-y-6 relative overflow-hidden group">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <ZapIcon className="w-5 h-5 text-orange-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-950">Employee Tracking</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Track every employee's activity from leave request to payrun completion, so you know exactly where your workflow stands.
                  </p>
                </div>

                {/* Inner Widget Matching Screenshot 1 Card 4 (Checklist of Async Jobs) */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs font-medium">
                  {['Email Delivered & Parsed', 'HR Approval Queued', 'Payslips Generated'].map((item, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{item}</span>
                      <span className="text-emerald-600 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">✓ Ready</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 8. 5-AGENT AI SYSTEM SHOWCASE (MATCHING ATTACHED SCREENSHOT MASONRY LAYOUT EXACTLY) */}
        <section id="agents" className="py-20 md:py-28 bg-white">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-100/80 text-orange-700 font-bold text-[11px] uppercase tracking-wider border border-orange-200">
                <BotIcon className="w-3.5 h-3.5 text-orange-600" />
                <span>MULTI-AGENT ARCHITECTURE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
                What Makes Our 5 AI Agents <span className="gradient-text-brand">Different</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-normal">
                LangGraph manages state and routing while MCP provides auditable tools. AI assists — authorized humans retain 100% final approval authority.
              </p>
            </div>

            {/* Staggered 3-Column Bento Grid Matching Screenshot Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-start">
              
              {/* COLUMN 1: Agent 1 (Tall Card with Pill Chips) */}
              <div className="bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm hover:shadow-md transition space-y-6 flex flex-col justify-between h-full group">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <ZapIcon className="w-5 h-5 text-orange-600" />
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-slate-950 mb-2">HR Orchestrator Agent</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Acts as central traffic controller. Identifies intent, maintains conversation thread memory, and routes context to specialist sub-agents.
                    </p>
                  </div>

                  {/* Pill Tag Chips (Matching Screenshot Style) */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {['Intent Router', 'LangGraph State', 'Human-in-the-Loop', 'Memory Threads', 'Supervisor'].map((chip, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-white border border-slate-200/80 rounded-full text-[11px] font-semibold text-slate-700 shadow-2xs">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLUMN 2: Agent 2 & Agent 3 (Stacked 2 Cards) */}
              <div className="space-y-6">
                
                {/* Agent 2: Email Intelligence Agent */}
                <div className="bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm hover:shadow-md transition space-y-5 group">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <MailIcon className="w-5 h-5 text-orange-600" />
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-slate-950 mb-2">Email Intelligence Agent</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Converts unstructured employee emails into validated intent, dates, leave types, and reason schemas.
                    </p>
                  </div>

                  {/* Pill Tag Chips */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['Gmail API Intake', 'Zod Schema Validated', 'Confidence Score', 'Audit Logging'].map((chip, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-white border border-slate-200/80 rounded-full text-[11px] font-semibold text-slate-700 shadow-2xs">
                        {chip}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-200/60">
                    Strict validation ensures zero unparsed emails slip through.
                  </div>
                </div>

                {/* Agent 3: Leave Management Agent */}
                <div className="bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm hover:shadow-md transition space-y-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <ShieldCheckIcon className="w-5 h-5 text-orange-600" />
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-slate-950 mb-2">Leave Management Agent</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Validates leave requests against employee balance, schedules, overlap, and policy rules automatically.
                    </p>
                  </div>
                </div>

              </div>

              {/* COLUMN 3: Agent 4 & Agent 5 (Stacked 2 Cards) */}
              <div className="space-y-6">
                
                {/* Agent 4: Payroll Agent */}
                <div className="bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm hover:shadow-md transition space-y-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <BriefcaseIcon className="w-5 h-5 text-orange-600" />
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-slate-950 mb-2">Payroll Agent</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Inspects payslips, compares payroll periods, and explains deterministic salary rules without calculation errors.
                    </p>
                  </div>
                </div>

                {/* Agent 5: HR Analytics Agent */}
                <div className="bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm hover:shadow-md transition space-y-5 group">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <ChartBarIcon className="w-5 h-5 text-orange-600" />
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-slate-950 mb-2">HR Analytics Agent</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Translates natural-language questions into safe, read-only PostgreSQL reporting queries.
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-200/60">
                    Every analytics query is securely logged & stored for compliance auditing.
                  </div>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* 9. INTERACTIVE PRICING CALCULATOR SECTION */}
        <section id="pricing" className="py-16 md:py-24 hero-gradient-bg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-[11px] uppercase tracking-wider mb-4">
              <TagIcon className="w-3.5 h-3.5" />
              <span>PRICING</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
              Simple <span className="gradient-text-brand">per-employee</span> pricing
            </h2>
            <p className="mt-3 text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
              Pay only for the employees you onboard. Scale your team at any time, minimum 10 employees, billed annually.
            </p>

            <div className="mt-10 bg-white rounded-3xl p-6 sm:p-10 border border-orange-200 shadow-2xl max-w-2xl mx-auto text-left relative overflow-hidden">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SparklesIcon />
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base">PeoplePay360 Plan</span>
                </div>
                <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">
                  Per-employee
                </span>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-bold text-slate-900">Choose your team size</h3>
                <p className="text-xs text-slate-500 mt-0.5">{getCurrencySymbol()}{getPerEmployeeRate()} per employee / year • Minimum 10 employees • Scale anytime</p>

                <div className="mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Number of employees</span>
                    
                    <div className="flex items-center bg-white border border-slate-300 rounded-full px-2 py-1 shadow-2xs">
                      <button 
                        onClick={() => setEmployeeCount(Math.max(10, employeeCount - 5))}
                        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition"
                      >
                        -
                      </button>
                      <input 
                        type="number"
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(Math.max(10, parseInt(e.target.value) || 10))}
                        className="w-12 text-center text-xs font-bold text-slate-900 border-none focus:outline-none"
                      />
                      <button 
                        onClick={() => setEmployeeCount(employeeCount + 5)}
                        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <input 
                    type="range"
                    min="10"
                    max="500"
                    step="5"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(parseInt(e.target.value))}
                    className="w-full accent-orange-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>10 employees</span>
                    <span>500 employees</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Show prices in</div>
                  <div className="inline-flex bg-slate-100 p-1 rounded-full text-xs font-bold">
                    {(['INR', 'USD', 'EUR'] as const).map((curr) => (
                      <button
                        key={curr}
                        onClick={() => setCurrency(curr)}
                        className={`px-3 py-1 rounded-full transition ${currency === curr ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-3xl font-extrabold text-slate-950">
                    {getCurrencySymbol()}{calculateTotal()}
                    <span className="text-xs font-semibold text-slate-500 font-sans ml-1.5">/ year</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a href="#demo" className="flex-1 py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 text-center rounded-full transition border border-slate-200">
                  Get A Demo
                </a>
                <a href="#home" className="flex-1 py-3 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-center rounded-full shadow-md shadow-orange-500/25 transition">
                  Get Started →
                </a>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600">
                <div><span className="text-orange-500 font-bold">&lt;&gt;</span> All email parsing templates</div>
                <div><span className="text-orange-500 font-bold">&lt;&gt;</span> Unlimited payruns & payslips</div>
                <div><span className="text-orange-500 font-bold">&lt;&gt;</span> Real-time dashboards</div>
                <div><span className="text-orange-500 font-bold">&lt;&gt;</span> Period contract resolution</div>
                <div><span className="text-orange-500 font-bold">&lt;&gt;</span> 5-Agent AI engine</div>
                <div><span className="text-orange-500 font-bold">&lt;&gt;</span> Priority HR support</div>
              </div>

            </div>

          </div>
        </section>

        {/* 10. FREQUENTLY ASKED QUESTIONS SECTION */}
        <section id="faq" className="py-16 md:py-24 bg-white">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainerVariants}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <motion.div variants={fadeInUpVariants} className="lg:col-span-5 text-left space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-[11px] uppercase tracking-wider">
                  <MessageSquareIcon className="w-3.5 h-3.5" />
                  <span>FAQ</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                  Frequently Asked <span className="gradient-text-brand">Questions</span>
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Common questions about PeoplePay360's features, plans, and AI safety, answered to help you get started with confidence.
                </p>
                <a href="#demo" className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 rounded-full shadow-md hover:shadow-lg transition">
                  <span>Contact Us</span>
                  <ArrowRightIcon />
                </a>
              </motion.div>

              <div className="lg:col-span-7 space-y-3">
                {faqs.map((faq, index) => (
                  <motion.div 
                    key={index}
                    variants={fadeInUpVariants}
                    className="bg-slate-50 rounded-2xl border border-slate-200/90 overflow-hidden transition"
                  >
                    <button 
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between gap-2 hover:text-orange-600 transition"
                    >
                      <span>{faq.question}</span>
                      <span className={`w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-bold shadow-2xs transition-transform ${openFaq === index ? 'bg-orange-600 text-white rotate-180' : 'text-slate-500'}`}>
                        ↓
                      </span>
                    </button>
                    <AnimatePresence>
                      {openFaq === index && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

            </div>
          </motion.div>
        </section>

      </main>

      {/* 11. FOOTER MATCHING SCREENSHOT EXACTLY */}
      <footer className="bg-[#0A0E17] text-slate-400 text-xs relative overflow-hidden pt-16 pb-8 border-t border-slate-800">
        
        {/* Main Footer Container */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 pb-12 border-b border-slate-800/80">
            
            {/* Column 1: Brand & Subtitle */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center">
                <img src="/logo-footer.webp" alt="PeoplePay360" className="h-8 w-auto object-contain" />
              </div>
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed font-normal">
                PeoplePay360. Build your automated HR & Payroll workflow.
              </p>
            </div>

            {/* Column 2: Company */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Company</h4>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><a href="#home" className="hover:text-white transition">Home</a></li>
                <li><a href="#about" className="hover:text-white transition">About</a></li>
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><a href="#features" className="hover:text-white transition">AI Leave Simulation Guide</a></li>
                <li><a href="#agents" className="hover:text-white transition">Multi-Agent Architecture Topics</a></li>
                <li><a href="#demo" className="hover:text-white transition">Payroll Calculation Engine</a></li>
                <li><a href="#differentiators" className="hover:text-white transition">HR Security & Compliance</a></li>
              </ul>
            </div>

            {/* Column 4: Industries & Compliance */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Modules & Compliance</h4>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><a href="#features" className="hover:text-white transition">Employee Master Hub</a></li>
                <li><a href="#features" className="hover:text-white transition">Period Contracts</a></li>
                <li><a href="#features" className="hover:text-white transition">Attendance Tracking</a></li>
                <li><a href="#demo" className="hover:text-white transition">Salary Structures</a></li>
                <li><a href="#features" className="hover:text-white transition">BullMQ Queues</a></li>
              </ul>
            </div>

            {/* Column 5: Compare */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Compare</h4>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li><a href="#differentiators" className="hover:text-white transition">Best HR Automation Software</a></li>
                <li><a href="#differentiators" className="hover:text-white transition">Legacy HRMS Alternatives</a></li>
                <li><a href="#differentiators" className="hover:text-white transition">PeoplePay360 vs Manual HR</a></li>
                <li><a href="#differentiators" className="hover:text-white transition">PeoplePay360 vs Legacy Payroll</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar with Socials & Legal links */}
          <div className="pt-8 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
            
            {/* Left Social Icons & Copyright */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-slate-400">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white transition p-1 bg-slate-900 rounded border border-slate-800">
                  <FacebookIcon />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition p-1 bg-slate-900 rounded border border-slate-800">
                  <InstagramIcon />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition p-1 bg-slate-900 rounded border border-slate-800">
                  <XTwitterIcon />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition p-1 bg-slate-900 rounded border border-slate-800">
                  <LinkedInIcon />
                </a>
              </div>
              <div className="text-slate-500 text-[11px]">
                Copyright © 2026 PeoplePay360. All Rights Reserved. <br className="sm:hidden" />
                <span className="text-slate-600">Built for Odoo Grand Final Hackathon.</span>
              </div>
            </div>

            {/* Right Legal Links */}
            <div className="flex items-center gap-6 text-slate-400 font-medium text-xs">
              <a href="#home" className="hover:text-white transition">Terms of Service</a>
              <a href="#home" className="hover:text-white transition">Privacy Policy</a>
              <a href="#home" className="hover:text-white transition">Refund Policy</a>
            </div>

          </div>

        </div>

        {/* GIANT STYLIZED TEXT WATERMARK AT BOTTOM OF FOOTER */}
        <div className="w-full text-center pointer-events-none select-none overflow-hidden leading-none pt-4 opacity-15">
          <span className="text-[12vw] sm:text-[14vw] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-400 to-slate-800">
            PEOPLEPAY360
          </span>
        </div>

      </footer>

    </div>
  );
};
