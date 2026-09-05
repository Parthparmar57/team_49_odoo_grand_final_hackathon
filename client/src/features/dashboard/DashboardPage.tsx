import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Users,
  Calendar,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Activity,
  Building2,
  FileCheck,
  Loader2,
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
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);

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

  const empName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : user?.email.split('@')[0] || 'User';

  const getRoleBadgeColor = (r?: string) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HR_PAYROLL_MANAGER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'HR_MANAGER':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'HR_PAYROLL_USER':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-400/20 via-teal-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 text-[11px] font-extrabold uppercase rounded-lg border ${getRoleBadgeColor(
                  user?.role
                )}`}
              >
                {user?.role?.replace(/_/g, ' ') || 'USER'}
              </span>
              <span className="text-xs text-emerald-700 font-mono font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live DB Connected
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, <span className="text-[#FF5E1E]">{empName}</span> 👋
            </h1>
            <p className="text-slate-600 text-sm max-w-xl">
              You are signed in to <strong className="text-slate-900">PeoplePay360</strong>. Live database synchronization is active. Access authorized HR modules, review leave workflows, and run payroll below.
            </p>
          </div>

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/users/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#FF5E1E] hover:bg-[#E0480C] text-white font-bold rounded-2xl text-xs shadow-md shadow-orange-500/20 transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Provision New User
            </Link>
          )}
        </div>
      </div>

      {/* Database Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Headcount */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Headcount</span>
            <div className="p-2.5 bg-orange-50 border border-orange-200/80 rounded-xl text-[#FF5E1E]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoadingMetrics ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#FF5E1E]" />
            ) : (
              <p className="text-3xl font-extrabold text-slate-900">
                {metrics?.totalEmployees ?? 0}
              </p>
            )}
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {metrics?.activeEmployees ?? 0} Active Status
          </p>
        </div>

        {/* Pending Leaves */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Leaves</span>
            <div className="p-2.5 bg-teal-50 border border-teal-200/80 rounded-xl text-teal-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoadingMetrics ? (
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            ) : (
              <p className="text-3xl font-extrabold text-slate-900">
                {metrics?.pendingLeaves ?? 0}
              </p>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Live requests awaiting HR action</p>
        </div>

        {/* Active Contracts */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Contracts</span>
            <div className="p-2.5 bg-purple-50 border border-purple-200/80 rounded-xl text-purple-600">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoadingMetrics ? (
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            ) : (
              <p className="text-3xl font-extrabold text-slate-900">
                {metrics?.activeContracts ?? 0}
              </p>
            )}
          </div>
          <p className="text-[11px] text-purple-700 font-medium mt-1">Verified PostgreSQL Contracts</p>
        </div>

        {/* Departments */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Departments</span>
            <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoadingMetrics ? (
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            ) : (
              <p className="text-3xl font-extrabold text-slate-900">
                {metrics?.totalDepartments ?? 0}
              </p>
            )}
          </div>
          <p className="text-[11px] text-amber-700 font-medium mt-1">Configured Org Units</p>
        </div>
      </div>

      {/* Role Capabilities & Quick Links Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FF5E1E]" /> Authorized Role Permissions & Access Control
          </h3>
          <p className="text-slate-600 text-xs leading-relaxed font-medium">
            Your account <span className="text-slate-900 font-mono font-bold">({user?.email})</span> is mapped to role{' '}
            <span className="text-[#FF5E1E] font-bold uppercase">{user?.role}</span> in PostgreSQL. Both frontend UI route guards and backend Express authorization middleware validate every request.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Leave & Attendance</h4>
                <p className="text-[11px] text-slate-500 font-medium">Submit requests & view schedule allocations</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Payslips & Payroll</h4>
                <p className="text-[11px] text-slate-500 font-medium">View detailed salary slips & deduction breakdowns</p>
              </div>
            </div>

            <div className={`p-3.5 bg-slate-50/80 border rounded-2xl flex items-start gap-3 ${user?.role === 'ADMIN' ? 'border-orange-200' : 'border-slate-200 opacity-60'}`}>
              {user?.role === 'ADMIN' ? (
                <CheckCircle2 className="w-4 h-4 text-[#FF5E1E] shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-xs font-bold text-slate-900">User Provisioning (Admin)</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {user?.role === 'ADMIN' ? 'Authorized to create & manage system accounts' : 'Requires Admin Role'}
                </p>
              </div>
            </div>

            <div className={`p-3.5 bg-slate-50/80 border rounded-2xl flex items-start gap-3 ${['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'].includes(user?.role || '') ? 'border-teal-200' : 'border-slate-200 opacity-60'}`}>
              {['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'].includes(user?.role || '') ? (
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-xs font-bold text-slate-900">HR Approvals</h4>
                <p className="text-[11px] text-slate-500 font-medium">Approve/refuse pending employee leave requests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" /> Platform Quick Actions
            </h3>
            <p className="text-slate-500 text-xs mb-4 font-medium">Perform actions in real-time.</p>

            <div className="space-y-2.5">
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin/users/new"
                  className="w-full flex items-center justify-between p-3 bg-orange-50/80 hover:bg-orange-100/80 border border-orange-200/80 rounded-xl text-xs font-bold text-[#FF5E1E] transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Create User Account
                  </span>
                  <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-all" />
                </Link>
              )}

              <Link
                to="/leave"
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" /> Request / View Time Off
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/payroll"
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 transition-all group"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" /> Salary Structure & Payslips
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium text-center">
            Database Status: Live Connected (PostgreSQL via Prisma)
          </div>
        </div>
      </div>
    </div>
  );
};
