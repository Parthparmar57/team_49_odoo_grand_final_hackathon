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
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'HR_PAYROLL_MANAGER':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'HR_MANAGER':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'HR_PAYROLL_USER':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-lg border ${getRoleBadgeColor(
                  user?.role
                )}`}
              >
                {user?.role.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" /> Live DB Connected
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-orange-400">{empName}</span> 👋
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              You are signed in to <strong className="text-slate-200">PeoplePay360</strong>. Live database synchronization is active. Access authorized HR modules, review leave workflows, and run payroll below.
            </p>
          </div>

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/users/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl text-xs shadow-lg shadow-orange-500/20 transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Provision New User
            </Link>
          )}
        </div>
      </div>

      {/* Real Live Database Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Headcount */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Headcount</span>
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoadingMetrics ? (
              <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
            ) : (
              <p className="text-3xl font-extrabold text-white">
                {metrics?.totalEmployees ?? 0}
              </p>
            )}
          </div>
          <p className="text-[11px] text-teal-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {metrics?.activeEmployees ?? 0} Active Status
          </p>
        </div>

        {/* Pending Leaves */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Leaves</span>
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoadingMetrics ? (
              <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
            ) : (
              <p className="text-3xl font-extrabold text-white">
                {metrics?.pendingLeaves ?? 0}
              </p>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Live requests awaiting HR action</p>
        </div>

        {/* Active Contracts */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Contracts</span>
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoadingMetrics ? (
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            ) : (
              <p className="text-3xl font-extrabold text-white">
                {metrics?.activeContracts ?? 0}
              </p>
            )}
          </div>
          <p className="text-[11px] text-purple-300 mt-1">Verified PostgreSQL Contracts</p>
        </div>

        {/* Departments */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Departments</span>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoadingMetrics ? (
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            ) : (
              <p className="text-3xl font-extrabold text-white">
                {metrics?.totalDepartments ?? 0}
              </p>
            )}
          </div>
          <p className="text-[11px] text-amber-300 mt-1">Configured Org Units</p>
        </div>
      </div>

      {/* Role Capabilities Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-400" /> Authorized Role Permissions & Access Control
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Your account <span className="text-white font-mono font-bold">({user?.email})</span> is mapped to role{' '}
            <span className="text-orange-400 font-bold uppercase">{user?.role}</span> in PostgreSQL. Both frontend UI route guards and backend Express authorization middleware validate every request against the database.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Leave & Attendance</h4>
                <p className="text-[11px] text-slate-400">Submit requests & view schedule allocations</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Payslips & Payroll</h4>
                <p className="text-[11px] text-slate-400">View detailed salary slips & deduction breakdowns</p>
              </div>
            </div>

            <div className={`p-3.5 bg-slate-950/80 border rounded-2xl flex items-start gap-3 ${user?.role === 'ADMIN' ? 'border-orange-500/30' : 'border-slate-800 opacity-60'}`}>
              {user?.role === 'ADMIN' ? (
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-xs font-bold text-white">User Provisioning (Admin)</h4>
                <p className="text-[11px] text-slate-400">
                  {user?.role === 'ADMIN' ? 'Authorized to create & manage system accounts' : 'Requires Admin Role'}
                </p>
              </div>
            </div>

            <div className={`p-3.5 bg-slate-950/80 border rounded-2xl flex items-start gap-3 ${['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'].includes(user?.role || '') ? 'border-teal-500/30' : 'border-slate-800 opacity-60'}`}>
              {['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'].includes(user?.role || '') ? (
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-xs font-bold text-white">HR Approvals</h4>
                <p className="text-[11px] text-slate-400">Approve/refuse pending employee leave requests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" /> Platform Quick Actions
            </h3>
            <p className="text-slate-400 text-xs mb-4">Perform actions in real-time.</p>

            <div className="space-y-2.5">
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin/users/new"
                  className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/40 rounded-xl text-xs font-semibold text-white transition-all group"
                >
                  <span className="flex items-center gap-2 text-orange-400">
                    <UserPlus className="w-4 h-4" /> Create User Account
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                </Link>
              )}

              <Link
                to="/leave"
                className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 rounded-xl text-xs font-semibold text-white transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-400" /> Request / View Time Off
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/payroll"
                className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 rounded-xl text-xs font-semibold text-white transition-all group"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-400" /> Salary Structure & Payslips
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            Database Status: Live Connected (PostgreSQL via Prisma)
          </div>
        </div>
      </div>
    </div>
  );
};
