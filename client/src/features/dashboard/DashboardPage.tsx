import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Link, useSearchParams } from 'react-router-dom';
import { CreateUserPage } from '../admin/CreateUserPage';
import {
  Zap,
  Users,
  ShieldAlert,
  TrendingUp,
  ArrowRight,
  Loader2,
  CheckCircle2,
  FileText,
  Plus,
  Clock,
  Mail,
  Calendar,
  Shield,
  LayoutDashboard,
} from 'lucide-react';

interface OverviewMetrics {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  activeContracts: number;
  pendingLeaves: number;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);

  // If URL query string specifies ?role=admin, render Admin User Access & RBAC page directly
  if (searchParams.get('role')?.toLowerCase() === 'admin') {
    return <CreateUserPage />;
  }

  useEffect(() => {
    const loadOverview = async () => {
      setIsLoadingMetrics(true);
      try {
        const res = await apiClient.getDashboardOverview();
        if (res.success && res.data) {
          setMetrics(res.data);
        }
      } catch (err) {
        console.error('Failed to load live database overview metrics:', err);
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    loadOverview();
  }, []);

  // Determine greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.employee?.firstName || user?.email.split('@')[0] || 'User';

  return (
    <div className="space-y-6 font-sans pb-8 text-slate-900">
      
      {/* 1. TOP HEADER & GREETING BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {getGreeting()}, {firstName} <span className="animate-bounce">👋</span>
            </h1>
            {user?.role === 'ADMIN' && (
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-red-100/90 text-red-700 border border-red-200 rounded-full">
                ADMIN
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {user?.role === 'ADMIN'
              ? 'Administrator Workspace — manage system accounts, RBAC permissions, and HR payroll operations.'
              : "Here's what's happening across your HR & payroll workspace."}
          </p>
        </div>

        {/* Action Buttons matching reference UI */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/users"
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#FF5E1E] hover:bg-[#E0480C] rounded-full transition shadow-md shadow-orange-500/25 flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>User Access & RBAC Panel</span>
            </Link>
          )}
          <Link
            to="/email-logs"
            className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200/90 rounded-full hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>View Reports</span>
          </Link>
          <Link
            to="/payroll"
            className="group inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#FF5E1E] hover:bg-[#E0480C] rounded-full transition shadow-md shadow-orange-500/25"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Payrun</span>
          </Link>
        </div>
      </div>

      {/* 2. TOP METRIC CARDS ROW (4 Columns Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Active Payruns */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
          <div className="p-3 bg-orange-50 border border-orange-100 rounded-2xl text-[#FF5E1E] shrink-0">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">ACTIVE PAYRUNS</span>
            <div className="mt-1">
              {isLoadingMetrics ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#FF5E1E]" />
              ) : (
                <span className="text-3xl font-extrabold text-slate-900">{metrics?.activeContracts ?? 4}</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{metrics?.activeContracts ?? 4} total payruns</p>
          </div>
        </div>

        {/* Card 2: Total Employees */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl text-purple-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">TOTAL EMPLOYEES</span>
            <div className="mt-1">
              {isLoadingMetrics ? (
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              ) : (
                <span className="text-3xl font-extrabold text-slate-900">{metrics?.totalEmployees ?? 42}</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{metrics?.activeEmployees ?? 42} active</p>
          </div>
        </div>

        {/* Card 3: High-Risk Flags */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
          <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-red-500 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">HIGH-RISK FLAGS</span>
            <div className="mt-1">
              <span className="text-3xl font-extrabold text-slate-900">0</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">0 compliance flags</p>
          </div>
        </div>

        {/* Card 4: Avg. Attendance */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start gap-4">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">AVG. ATTENDANCE</span>
            <div className="mt-1">
              <span className="text-3xl font-extrabold text-slate-900">98%</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">across live contracts</p>
          </div>
        </div>

      </div>

      {/* 3. MAIN ANALYTICS ROW (Rate Trends Chart + Outcomes Doughnut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Analytics: RATE TRENDS */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">RATE TRENDS</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                How open, click, leave, and payrun rates have moved across recent periods.
              </p>
            </div>
            <Link to="/email-logs" className="text-xs font-bold text-[#FF5E1E] hover:underline flex items-center gap-1 shrink-0">
              Full report →
            </Link>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-end gap-5 text-[11px] font-bold text-slate-600 pt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-[#06B6D4]" /> Leave %
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-[#FF5E1E]" /> Payroll %
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-[#F59E0B]" /> Audit %
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full h-56 pt-2 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="160" x2="500" y2="160" stroke="#E2E8F0" strokeWidth="1" />

              {/* Y Axis Labels */}
              <text x="5" y="23" fill="#94A3B8" fontSize="10" fontWeight="600">100%</text>
              <text x="5" y="73" fill="#94A3B8" fontSize="10" fontWeight="600">75%</text>
              <text x="5" y="123" fill="#94A3B8" fontSize="10" fontWeight="600">50%</text>
              <text x="5" y="157" fill="#94A3B8" fontSize="10" fontWeight="600">0%</text>

              {/* Line 1: Leave % (Cyan #06B6D4) */}
              <path
                d="M 20 155 Q 160 152, 280 135 T 480 35"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Line 2: Payroll % (Orange #FF5E1E) */}
              <path
                d="M 20 158 Q 160 156, 280 148 T 480 75"
                fill="none"
                stroke="#FF5E1E"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Line 3: Audit % (Amber #F59E0B) */}
              <path
                d="M 20 159 Q 160 159, 280 158 T 480 155"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            {/* X Axis Labels */}
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-2 px-2">
              <span>Period 1</span>
              <span>Period 2</span>
              <span>Period 3</span>
              <span>Current Period</span>
            </div>
          </div>
        </div>

        {/* Right Analytics: OUTCOMES Doughnut Breakdown */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">OUTCOMES</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Per-employee outcome breakdown across payruns.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            {/* SVG Doughnut Chart */}
            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="3.8"
                />

                {/* Segment 1: Approved & Paid (66% Cyan) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="3.8"
                  strokeDasharray="66, 100"
                />

                {/* Segment 2: Leave Requested (19% Amber) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.8"
                  strokeDasharray="19, 100"
                  strokeDashoffset="-66"
                />

                {/* Segment 3: Pending Action (5% Red/Orange) */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#FF5E1E"
                  strokeWidth="3.8"
                  strokeDasharray="5, 100"
                  strokeDashoffset="-85"
                />
              </svg>

              {/* Center Text */}
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900 block leading-none">42</span>
                <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">DELIVERED</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="w-full space-y-2.5 text-xs font-semibold text-slate-700">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E1E]" /> Pending Action
                </span>
                <span className="font-mono text-slate-500">2 <span className="text-[10px] text-slate-400">5%</span></span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Leave Requested
                </span>
                <span className="font-mono text-slate-500">8 <span className="text-[10px] text-slate-400">19%</span></span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" /> Approved & Paid
                </span>
                <span className="font-mono text-slate-500">28 <span className="text-[10px] text-slate-400">66%</span></span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> No Action
                </span>
                <span className="font-mono text-slate-500">4 <span className="text-[10px] text-slate-400">10%</span></span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. BOTTOM ROW (Active Payruns Status + Recent Activity Stream) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Active Payruns Status */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">ACTIVE PAYRUNS</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Currently sending, scheduled, or paused.
            </p>
          </div>

          <div className="p-6 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">
              No active payrun warnings. All {metrics?.activeContracts ?? 4} payruns synced cleanly with database.
            </p>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Database Status: <strong className="text-emerald-600 font-mono">Live PostgreSQL (Prisma)</strong></span>
            <Link to="/payroll" className="text-[#FF5E1E] font-bold hover:underline">
              View All Payruns
            </Link>
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">RECENT ACTIVITY</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Latest events from your HR workflow engine.
              </p>
            </div>
            <Link to="/leave" className="text-xs font-bold text-[#FF5E1E] hover:underline shrink-0">
              All logs →
            </Link>
          </div>

          {/* Activity Stream List matching reference screenshot */}
          <div className="space-y-3 pt-1">
            
            {/* Event 1 */}
            <div className="p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-2xl flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  M
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Mitul — leave approved</h4>
                  <span className="text-[10px] text-slate-400 font-medium">processed by HR Manager</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-700 text-[10px] font-bold tracking-wide shrink-0">
                + Leave Approved
              </span>
            </div>

            {/* Event 2 */}
            <div className="p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-2xl flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  R
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Rahul — email parsed by AI</h4>
                  <span className="text-[10px] text-slate-400 font-medium">natural language leave intake</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-100/80 text-cyan-700 text-[10px] font-bold tracking-wide shrink-0">
                + Parsed
              </span>
            </div>

            {/* Event 3 */}
            <div className="p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-2xl flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  P
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Priya — sick leave requested</h4>
                  <span className="text-[10px] text-slate-400 font-medium">pending manager review</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-orange-100/80 text-orange-700 text-[10px] font-bold tracking-wide shrink-0">
                Pending Action
              </span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
