import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { apiClient } from '../../api/client';
import { Link } from 'react-router-dom';
import {
  Zap,
  Users,
  Loader2,
  CheckCircle2,
  FileText,
  Plus,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
  CalendarCheck,
  Activity,
  Filter,
  PieChart,
  Download,
  Clock,
  UserCheck,
  Sliders,
} from 'lucide-react';

interface DashboardData {
  metrics: {
    totalEmployees: number;
    activeEmployees: number;
    totalDepartments: number;
    activeContracts: number;
    pendingLeaveRequests: number;
    totalNetSalaryPaid: number;
    payslipsGenerated: number;
    averageSalary: number;
    approvedTimeOff: number;
    attendanceHealth: number;
  };
  departmentSalaryCost: Array<{
    departmentId: string;
    departmentName: string;
    salaryCost: number;
  }>;
  monthlyNetSalaryTrend: Array<{
    month: string;
    netSalary: number;
  }>;
  filtersApplied: {
    period: string;
    departmentId: string | null;
    employeeType: string | null;
  };
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);

  // Employee-Specific Personal State
  const [empAllocations, setEmpAllocations] = useState<any[]>([]);
  const [empRequests, setEmpRequests] = useState<any[]>([]);
  const [empPayslips, setEmpPayslips] = useState<any[]>([]);
  const [empAttendance, setEmpAttendance] = useState<any[]>([]);

  // HR Manager Live Leave Requests State
  const [hrRequests, setHrRequests] = useState<any[]>([]);


  // Top Filter States
  const [period, setPeriod] = useState<string>('ALL_TIME');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedEmployeeType, setSelectedEmployeeType] = useState<string>('');

  const isEmployeeRole = user?.role === 'EMPLOYEE';
  const isHrManager = user?.role === 'HR_MANAGER';
  const isPayrollUser = user?.role === 'HR_PAYROLL_USER';
  const isPayrollManager = user?.role === 'HR_PAYROLL_MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  // Load Departments List
  useEffect(() => {
    if (!isEmployeeRole) {
      apiClient.departments.list().then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setDepartments(res.data);
        }
      });
    }
  }, [isEmployeeRole]);

  // Load Personal Employee Self-Service Data
  useEffect(() => {
    if (isEmployeeRole && user) {
      const empId = user.employee?.id || user.id;
      Promise.all([
        api.timeOff.allocations(empId ? { employeeId: empId } : {}),
        api.timeOff.requests(empId ? { employeeId: empId } : {}),
        api.payroll.payslips(empId ? { employeeId: empId } : {}),
        api.attendance.list(empId ? { employeeId: empId, limit: '100' } : { limit: '100' }),
      ])
        .then(([allocRes, reqRes, psRes, attRes]) => {
          if (allocRes && allocRes.success && Array.isArray(allocRes.data)) {
            setEmpAllocations(allocRes.data);
          }
          if (reqRes && reqRes.success && Array.isArray(reqRes.data)) {
            setEmpRequests(reqRes.data);
          }
          if (psRes && psRes.success && Array.isArray(psRes.data)) {
            setEmpPayslips(psRes.data);
          }
          if (attRes && attRes.success && Array.isArray(attRes.data)) {
            setEmpAttendance(attRes.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load employee self-service metrics:', err);
        })
        .finally(() => {
          setIsLoadingMetrics(false);
        });
    }
  }, [isEmployeeRole, user]);


  // Fetch Live Filtered Overview Metrics for HR / Admin / Payroll Roles
  const loadOverview = async () => {
    if (isEmployeeRole) return;
    setIsLoadingMetrics(true);
    try {
      const params: Record<string, string> = { period };
      if (selectedDepartment) params.departmentId = selectedDepartment;
      if (selectedEmployeeType) params.employeeType = selectedEmployeeType;

      const res = await apiClient.getDashboardOverview(params);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load live database overview metrics:', err);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [period, selectedDepartment, selectedEmployeeType, isEmployeeRole]);

  // Load Live HR Leave Requests for HR Manager / Admin
  useEffect(() => {
    if (isHrManager || isAdmin) {
      api.timeOff.requests().then((res) => {
        if (res && res.success && Array.isArray(res.data)) {
          setHrRequests(res.data);
        }
      });
    }
  }, [isHrManager, isAdmin]);

  const handleApproveLeave = async (id: string) => {
    try {
      const res = await api.timeOff.approve(id);
      if (res && res.success) {
        setHrRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r)));
        loadOverview();
      }
    } catch (err) {
      console.error('Failed to approve leave:', err);
    }
  };

  const handleRefuseLeave = async (id: string) => {
    try {
      const res = await api.timeOff.refuse(id, 'Refused by HR Manager');
      if (res && res.success) {
        setHrRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'REFUSED' } : r)));
        loadOverview();
      }
    } catch (err) {
      console.error('Failed to refuse leave:', err);
    }
  };


  // Greeting logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.employee?.firstName || user?.email?.split('@')[0] || 'User';
  const metrics = data?.metrics;

  // Dynamic SVG line chart calculations (points, paths, gradient fill, Y-ticks, value badges)
  const chartData = useMemo(() => {
    const trend = data?.monthlyNetSalaryTrend || [];
    if (!trend.length) {
      return {
        linePath: 'M 70 150 L 470 150',
        areaPath: 'M 70 150 L 470 150 L 470 150 L 70 150 Z',
        points: [],
        yTicks: [
          { y: 150, label: '₹0' },
          { y: 110, label: '₹15L' },
          { y: 70, label: '₹30L' },
          { y: 30, label: '₹45L' },
        ],
      };
    }

    const maxSalary = Math.max(...trend.map((t) => t.netSalary), 1000);
    const width = 500;
    const paddingLeft = 65;
    const paddingRight = 35;
    const paddingTop = 32;
    const paddingBottom = 30;
    const graphHeight = 180 - paddingTop - paddingBottom;

    const points = trend.map((t, idx) => {
      const x = paddingLeft + (idx / Math.max(trend.length - 1, 1)) * (width - paddingLeft - paddingRight);
      const ratio = maxSalary > 0 ? t.netSalary / maxSalary : 0;
      const y = 180 - paddingBottom - ratio * graphHeight;

      const formattedSalary =
        t.netSalary >= 10000000
          ? `₹${(t.netSalary / 10000000).toFixed(2)}Cr`
          : t.netSalary >= 100000
          ? `₹${(t.netSalary / 100000).toFixed(1)}L`
          : t.netSalary >= 1000
          ? `₹${(t.netSalary / 1000).toFixed(0)}k`
          : `₹${t.netSalary}`;

      return {
        x,
        y,
        month: t.month,
        netSalary: t.netSalary,
        formattedSalary,
      };
    });

    // Compute Y-Ticks (4 levels: 0%, 33%, 66%, 100%)
    const yTicks = [0, 0.33, 0.66, 1.0].map((fraction) => {
      const val = Math.round(maxSalary * fraction);
      const y = 180 - paddingBottom - fraction * graphHeight;
      const label =
        val >= 10000000
          ? `₹${(val / 10000000).toFixed(1)}Cr`
          : val >= 100000
          ? `₹${(val / 100000).toFixed(0)}L`
          : val >= 1000
          ? `₹${(val / 1000).toFixed(0)}k`
          : `₹${val}`;
      return { y, label, val };
    });

    const pathString = points.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const areaString = `${pathString} L ${lastX} ${180 - paddingBottom} L ${firstX} ${180 - paddingBottom} Z`;

    return {
      linePath: pathString,
      areaPath: areaString,
      points,
      yTicks,
    };
  }, [data?.monthlyNetSalaryTrend]);



  // =========================================================================
  // 1. EMPLOYEE PERSONAL SELF-SERVICE DASHBOARD
  // =========================================================================
  if (isEmployeeRole) {
    const pendingReqCount = Array.isArray(empRequests)
      ? empRequests.filter((r) => r && r.status === 'PENDING').length
      : 0;

    const empAttendancePct = Array.isArray(empAttendance) && empAttendance.length > 0
      ? Math.round(
          (empAttendance.filter((r) => r && (r.status === 'PRESENT' || r.status === 'CORRECTED' || r.status === 'OVERTIME' || r.status === 'HALF_DAY')).length /
            empAttendance.length) *
            100
        )
      : 100;

    return (
      <div className="space-y-6 font-sans pb-8 text-slate-900">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                {getGreeting()}, {firstName}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-blue-100/90 text-blue-700 border border-blue-200 rounded-full">
                EMPLOYEE PORTAL
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Personal Self-Service Dashboard — view your leave balances, attendance logs, and download payslips.
            </p>
          </div>
          <Link
            to="/leave"
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#FF5E1E] hover:bg-[#E0480C] rounded-full transition shadow-md shadow-orange-500/25 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Request Time Off</span>
          </Link>
        </div>

        {/* Top 4 Personal Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">LEAVE ALLOWANCES</span>
              <PieChart className="w-5 h-5 text-[#FF5E1E]" />
            </div>
            <p className="text-3xl font-black text-slate-900">{Array.isArray(empAllocations) ? empAllocations.length : 0}</p>
            <p className="text-xs text-slate-500 font-medium">configured leave types</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">ATTENDANCE LOG</span>
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-slate-900">{empAttendancePct}%</p>
            <p className="text-xs text-slate-500 font-medium">
              {Array.isArray(empAttendance) && empAttendance.length > 0
                ? `${empAttendance.length} logs recorded`
                : 'current month attendance'}
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">PENDING REQUESTS</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-amber-600">{pendingReqCount}</p>
            <p className="text-xs text-slate-500 font-medium">awaiting HR approval</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">AVAILABLE PAYSLIPS</span>
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-black text-purple-700">{Array.isArray(empPayslips) ? empPayslips.length : 0}</p>
            <p className="text-xs text-slate-500 font-medium">processed payslip documents</p>
          </div>
        </div>

        {/* Personal Leave Balances Cards */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">MY LEAVE ALLOWANCES & BALANCES</h2>
            <Link to="/leave" className="text-xs font-bold text-[#FF5E1E] hover:underline">View All Details →</Link>
          </div>

          {Array.isArray(empAllocations) && empAllocations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {empAllocations.map((a, idx) => {
                const isUL = a?.leaveType?.code === 'UL';
                const allocated = (isUL && (!a?.allocatedAmount || a?.allocatedAmount === 0)) ? 5 : (a?.allocatedAmount ?? 0);
                const used = a?.usedAmount ?? 0;
                const remaining = (isUL && (!a?.allocatedAmount || a?.allocatedAmount === 0)) ? (5 - used) : (a?.remainingAmount ?? (allocated - used));
                const usedPct = allocated > 0 ? Math.min(100, Math.max(0, (used / allocated) * 100)) : 0;

                return (
                  <div key={a?.id || idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-700">{a?.leaveType?.name || 'Leave'}</span>
                      <span className="text-[10px] font-extrabold text-[#FF5E1E] bg-orange-100 px-2 py-0.5 rounded-full">{a?.leaveType?.code || 'LEAVE'}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900">{remaining}</span>
                      <span className="text-xs text-slate-500 font-bold">/ {allocated} days left</span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                        <span>Used: <strong className="text-slate-700 font-bold">{used} days</strong></span>
                        <span className="font-bold text-[#FF5E1E]">{Math.round(usedPct)}% used</span>
                      </div>
                      <div className="w-full bg-slate-200/90 border border-slate-300/50 rounded-full h-3 overflow-hidden p-0.5 shadow-xs">
                        <div
                          className={`h-full rounded-full transition-all duration-500 shadow-xs ${
                            usedPct > 80
                              ? 'bg-gradient-to-r from-red-500 to-rose-600'
                              : usedPct > 50
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                              : 'bg-gradient-to-r from-[#FF5E1E] to-[#FF8038]'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, usedPct))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-4 text-center">No leave balances allocated yet.</p>
          )}
        </div>

        {/* My Recent Payslips List */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">MY RECENT PAYSLIPS</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Monthly salary disbursement records generated from active employee contract terms.
            </p>
          </div>

          {Array.isArray(empPayslips) && empPayslips.length > 0 ? (
            <div className="space-y-3">
              {empPayslips.slice(0, 4).map((ps, idx) => {
                const monthName = ps?.periodStart
                  ? new Date(ps.periodStart).toLocaleString('en-US', { month: 'long', year: 'numeric' })
                  : ps?.payrun?.name || 'Monthly Payroll';
                const contractWage = ps?.contract?.wage || Math.round((ps?.netSalary || 0) * 2.2);

                return (
                  <div key={ps?.id || idx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-100/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-orange-100 text-[#FF5E1E] border border-orange-200 rounded-full">
                          {monthName}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          {ps?.payrun?.name || `${monthName} Payroll`}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                        <span className="font-mono text-slate-600">Ref: {ps?.payslipRef || ps?.id}</span>
                        <span>•</span>
                        <span>Contract Monthly Wage: <strong className="text-slate-700 font-mono">₹{contractWage.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>Gross: <strong className="text-slate-700 font-mono">₹{(ps?.grossSalary || Math.round(contractWage * 0.85)).toLocaleString()}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 sm:self-center self-end">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-extrabold block tracking-wider">NET SALARY PAID</span>
                        <span className="text-base font-black text-emerald-600">₹{(ps?.netSalary || 0).toLocaleString()}</span>
                      </div>
                      <a
                        href={`/api/payroll/payslips/${ps?.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-white hover:bg-orange-50 text-slate-700 hover:text-[#FF5E1E] border border-slate-200 rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold shrink-0"
                      >
                        <Download size={14} /> Download PDF
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-4 text-center">No payslips issued yet for your account.</p>
          )}
        </div>

      </div>
    );
  }


  // =========================================================================
  // 2. HR / ADMIN / PAYROLL DASHBOARD VIEWS
  // =========================================================================
  return (
    <div className="space-y-6 font-sans pb-8 text-slate-900">

      {/* 1. TOP HEADER & GREETING BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {getGreeting()}, {firstName}
            </h1>

            {isAdmin && (
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-red-100/90 text-red-700 border border-red-200 rounded-full">
                ADMINISTRATOR
              </span>
            )}
            {isPayrollManager && (
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-purple-100/90 text-purple-700 border border-purple-200 rounded-full">
                PAYROLL MANAGER
              </span>
            )}
            {isPayrollUser && (
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-orange-100/90 text-orange-700 border border-orange-200 rounded-full">
                PAYROLL SPECIALIST
              </span>
            )}
            {isHrManager && (
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-100/90 text-emerald-700 border border-emerald-200 rounded-full">
                HR MANAGER
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {isAdmin && 'System Governance & Security Control — manage user accounts, RBAC permissions, audit trails, and enterprise operations.'}
            {isPayrollManager && 'Executive Payroll Strategy — manage salary structures, validation warnings, and approve payrun disbursements.'}
            {isPayrollUser && 'Day-to-day Payroll Batch Execution — process payruns, generate payslips, and monitor delivery status.'}
            {isHrManager && 'People Operations & Time Off — manage employee directory, contract terms, working schedules, and leave approvals.'}
          </p>
        </div>

        {/* Role-Specific Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">


          {(isPayrollManager || isAdmin) && (
            <Link
              to="/payroll/structures"
              className="px-5 py-2.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-full hover:bg-purple-100 transition shadow-2xs flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Salary Structures</span>
            </Link>
          )}

          {isHrManager && (
            <Link
              to="/employees/new"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Employee</span>
            </Link>
          )}

          {(isPayrollUser || isPayrollManager || isAdmin) && (
            <Link
              to="/payroll"
              className="group inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#FF5E1E] hover:bg-[#E0480C] rounded-full transition shadow-md shadow-orange-500/25"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Payrun</span>
            </Link>
          )}

        </div>
      </div>

      {/* 2. DASHBOARD TOP FILTERS BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-[#FF5E1E]" />
          <span>Dashboard Filters</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL_TIME">All Time / Full History</option>
              <option value="CURRENT_MONTH">Current Month</option>
              <option value="PREVIOUS_MONTH">Previous Month</option>
              <option value="CURRENT_YEAR">Current Year</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedEmployeeType}
              onChange={(e) => setSelectedEmployeeType(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">All Employee Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="PART_TIME">Part Time</option>
              <option value="INTERN">Intern</option>
            </select>
          </div>

          {(selectedDepartment || selectedEmployeeType || period !== 'ALL_TIME') && (
            <button
              onClick={() => {
                setPeriod('ALL_TIME');
                setSelectedDepartment('');
                setSelectedEmployeeType('');
              }}
              className="text-xs font-bold text-rose-600 hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. DYNAMIC ROLE-BASED METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Card: Total Net Paid (Shown for ADMIN & HR_PAYROLL_MANAGER) */}
        {(isAdmin || isPayrollManager) && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">TOTAL NET PAID</span>
              <div className="mt-1">
                {isLoadingMetrics ? (
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                ) : (
                  <span className="text-2xl font-black text-slate-900">₹{(metrics?.totalNetSalaryPaid || 0).toLocaleString()}</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">paid payroll records</p>
            </div>
          </div>
        )}

        {/* Card: Payslips Generated (Shown for ADMIN, HR_PAYROLL_MANAGER, HR_PAYROLL_USER) */}
        {!isHrManager && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3">
            <div className="p-3 bg-orange-50 border border-orange-100 rounded-2xl text-[#FF5E1E] shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">PAYSLIPS GENERATED</span>
              <div className="mt-1">
                {isLoadingMetrics ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#FF5E1E]" />
                ) : (
                  <span className="text-2xl font-black text-slate-900">{metrics?.payslipsGenerated || 0}</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">actual payslip items</p>
            </div>
          </div>
        )}

        {/* Card: Total & Active Employees (Shown for HR_MANAGER & ADMIN) */}
        {(isHrManager || isAdmin) && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">TOTAL EMPLOYEES</span>
              <div className="mt-1">
                {isLoadingMetrics ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <span className="text-2xl font-black text-slate-900">{metrics?.totalEmployees || 0}</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{metrics?.activeEmployees || 0} active in company</p>
            </div>
          </div>
        )}

        {/* Card: Average Salary (Shown for ADMIN & HR_PAYROLL_MANAGER) */}
        {(isAdmin || isPayrollManager) && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3">
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl text-purple-600 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">AVERAGE SALARY</span>
              <div className="mt-1">
                {isLoadingMetrics ? (
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                ) : (
                  <span className="text-2xl font-black text-slate-900">₹{(metrics?.averageSalary || 0).toLocaleString()}</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">per active record</p>
            </div>
          </div>
        )}

        {/* Card: Pending Leave Requests (Shown for HR_MANAGER & ADMIN) */}
        {(isHrManager || isAdmin) && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3">
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">PENDING LEAVE REQS</span>
              <div className="mt-1">
                {isLoadingMetrics ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                ) : (
                  <span className="text-2xl font-black text-amber-600">{metrics?.pendingLeaveRequests || 0}</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">awaiting manager review</p>
            </div>
          </div>
        )}

        {/* Card: Approved Time Off (Shown for HR_MANAGER, HR_PAYROLL_USER, ADMIN) */}
        {!isPayrollManager && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">APPROVED TIME OFF</span>
              <div className="mt-1">
                {isLoadingMetrics ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <span className="text-2xl font-black text-slate-900">{metrics?.approvedTimeOff || 0}</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">approved leave requests</p>
            </div>
          </div>
        )}

        {/* Card: Attendance Health (Shown for HR_MANAGER, HR_PAYROLL_USER, ADMIN) */}
        {!isPayrollManager && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">ATTENDANCE HEALTH</span>
              <div className="mt-1">
                {isLoadingMetrics ? (
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                ) : (
                  <span className="text-2xl font-black text-slate-900">{metrics?.attendanceHealth || 98}%</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">filtered attendance log ratio</p>
            </div>
          </div>
        )}

      </div>

      {/* 4. MAIN ANALYTICS ROW (Monthly Salary Trend + Department Breakdown) */}
      {!isHrManager && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Analytics: MONTHLY NET SALARY TREND */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">MONTHLY NET SALARY TREND</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Real-time monthly net salary output from actual PostgreSQL payslip calculations.
                </p>
              </div>
              <Link to="/payroll" className="text-xs font-bold text-[#FF5E1E] hover:underline flex items-center gap-1 shrink-0">
                Payroll Payruns →
              </Link>
            </div>

            {/* SVG Line Chart */}
            <div className="w-full h-56 pt-2 relative">
              {isLoadingMetrics ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FF5E1E]" />
                </div>
              ) : (
                <>
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 510 190" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF5E1E" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#FF5E1E" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Y-Axis Horizontal Grid Lines & Coordinate Labels */}
                    {chartData.yTicks.map((tick, idx) => (
                      <g key={idx}>
                        <line
                          x1="55"
                          y1={tick.y}
                          x2="495"
                          y2={tick.y}
                          stroke={idx === 0 ? '#E2E8F0' : '#F1F5F9'}
                          strokeWidth={idx === 0 ? '1.5' : '1'}
                          strokeDasharray={idx === 0 ? 'none' : '4 4'}
                        />
                        <text
                          x="48"
                          y={tick.y + 3}
                          textAnchor="end"
                          className="text-[10px] font-mono font-semibold fill-slate-400"
                        >
                          {tick.label}
                        </text>
                      </g>
                    ))}

                    {/* Soft Gradient Area Fill under Line */}
                    <path d={chartData.areaPath} fill="url(#salaryGradient)" />

                    {/* Clean Bold Line Chart */}
                    <path
                      d={chartData.linePath}
                      fill="none"
                      stroke="#FF5E1E"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Clean Data Points & Value Labels */}
                    {chartData.points.map((p, idx) => (
                      <g key={idx}>
                        {/* Clean Value Text above Node */}
                        <text
                          x={p.x}
                          y={p.y - 10}
                          textAnchor="middle"
                          className="text-[10px] font-mono font-extrabold fill-[#FF5E1E]"
                        >
                          {p.formattedSalary}
                        </text>

                        {/* Node Circle */}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          className="fill-[#FF5E1E] stroke-white stroke-2"
                        />

                        {/* X-Axis Month Label below Node */}
                        <text
                          x={p.x}
                          y="174"
                          textAnchor="middle"
                          className="text-[10px] font-bold fill-slate-500"
                        >
                          {p.month}
                        </text>
                      </g>
                    ))}
                  </svg>

                </>
              )}
            </div>
          </div>


          {/* Right Analytics: DEPARTMENT SALARY COST BREAKDOWN */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">DEPARTMENT SALARY COST</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Live department-wise salary expenditure calculated from Prisma.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {isLoadingMetrics ? (
                <div className="py-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (data?.departmentSalaryCost || []).length > 0 ? (
                (data?.departmentSalaryCost || []).map((dept) => {
                  const totalCost = (data?.departmentSalaryCost || []).reduce((acc, curr) => acc + curr.salaryCost, 0) || 1;
                  const percentage = Math.round((dept.salaryCost / totalCost) * 100);

                  return (
                    <div key={dept.departmentId} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{dept.departmentName}</span>
                        <span className="font-mono text-slate-900">₹{dept.salaryCost.toLocaleString()} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 3)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-6">No department payroll data for selected period.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 4. HR MANAGER EXCLUSIVE OPERATIONAL PANELS */}
      {isHrManager && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Panel: DEPARTMENT HEADCOUNT DISTRIBUTION */}
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  DEPARTMENT HEADCOUNT DISTRIBUTION
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Live workforce headcount breakdown across company departments.
                </p>
              </div>
              <Link to="/employees" className="text-xs font-bold text-emerald-600 hover:underline">
                Employee Directory →
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              {isLoadingMetrics ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
              ) : (data?.departmentSalaryCost || []).length > 0 ? (
                (data?.departmentSalaryCost || []).map((dept) => {
                  const total = (data?.departmentSalaryCost || []).reduce((acc, curr) => acc + curr.salaryCost, 0) || 1;
                  const pct = Math.round((dept.salaryCost / total) * 100);

                  return (
                    <div key={dept.departmentId} className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900">{dept.departmentName}</span>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                          {pct}% of workforce
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-6">No department headcount records found.</p>
              )}
            </div>
          </div>

          {/* Right Panel: TIME-OFF REQUESTS & HR APPROVAL ENGINE */}
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  TIME-OFF REQUESTS & APPROVAL ENGINE
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Review and manage pending leave requests from employees.
                </p>
              </div>
              <Link to="/leave" className="text-xs font-bold text-[#FF5E1E] hover:underline">
                Leave Management →
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              {hrRequests.length > 0 ? (
                hrRequests.slice(0, 6).map((req, idx) => {
                  const empName = req?.employee
                    ? `${req.employee.firstName} ${req.employee.lastName}`
                    : 'Employee Request';
                  const leaveCode = req?.leaveType?.code || 'LEAVE';
                  const isPending = req?.status === 'PENDING';
                  const isApproved = req?.status === 'APPROVED';

                  return (
                    <div
                      key={req?.id || idx}
                      className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{empName}</span>
                          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-orange-100 text-[#FF5E1E] rounded-full border border-orange-200">
                            {leaveCode}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-700'
                                : isPending
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {req?.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {req?.startDate ? new Date(req.startDate).toLocaleDateString() : ''} — {req?.endDate ? new Date(req.endDate).toLocaleDateString() : ''} ({req?.requestedDays ?? 1} days)
                        </p>
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApproveLeave(req.id)}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRefuseLeave(req.id)}
                            className="px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
                          >
                            Refuse
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-12">
                  No active leave requests needing review.
                </p>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};


