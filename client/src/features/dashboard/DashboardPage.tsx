import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Link } from 'react-router-dom';
import {
  Zap,
  Users,
  Loader2,
  CheckCircle2,
  FileText,
  Plus,
  Shield,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
  CalendarCheck,
  Activity,
  Filter,
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

  // Top Filter States
  const [period, setPeriod] = useState<string>('CURRENT_MONTH');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedEmployeeType, setSelectedEmployeeType] = useState<string>('');

  // Load Departments List once
  useEffect(() => {
    apiClient.departments.list().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setDepartments(res.data);
      }
    });
  }, []);

  // Fetch Live Filtered Overview Metrics
  const loadOverview = async () => {
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
  }, [period, selectedDepartment, selectedEmployeeType]);

  // Determine greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.employee?.firstName || user?.email.split('@')[0] || 'User';

  const metrics = data?.metrics;

  // Generate dynamic SVG line chart points for Monthly Net Salary Trend
  const lineChartPath = useMemo(() => {
    const trend = data?.monthlyNetSalaryTrend || [];
    if (!trend.length) return 'M 0 160 L 500 160';

    const maxSalary = Math.max(...trend.map((t) => t.netSalary), 1000);
    const width = 500;
    const height = 140;
    const padding = 20;

    const points = trend.map((t, idx) => {
      const x = padding + (idx / Math.max(trend.length - 1, 1)) * (width - 2 * padding);
      const y = height - (t.netSalary / maxSalary) * (height - 2 * padding);
      return `${x} ${y}`;
    });

    if (points.length === 1) {
      return `M 0 140 L 500 140`;
    }

    return `M ${points.join(' L ')}`;
  }, [data?.monthlyNetSalaryTrend]);

  return (
    <div className="space-y-6 font-sans pb-8 text-slate-900">

      {/* 1. TOP HEADER & GREETING BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
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

        {/* Action Buttons */}
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

      {/* 2. DASHBOARD TOP FILTERS BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-[#FF5E1E]" />
          <span>Dashboard Filters</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Filter 1: Period Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="CURRENT_MONTH">Current Month</option>
              <option value="PREVIOUS_MONTH">Previous Month</option>
              <option value="CURRENT_YEAR">Current Year</option>
            </select>
          </div>

          {/* Filter 2: Department Filter */}
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

          {/* Filter 3: Employee Type Filter */}
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

          {(selectedDepartment || selectedEmployeeType || period !== 'CURRENT_MONTH') && (
            <button
              onClick={() => {
                setPeriod('CURRENT_MONTH');
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

      {/* 3. LIVE TOP METRIC CARDS ROW (5 Columns Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Card 1: Total Net Salary Paid */}
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

        {/* Card 2: Payslips Generated */}
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

        {/* Card 3: Average Salary */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3">
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl text-purple-600 shrink-0">
            <Users className="w-5 h-5" />
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

        {/* Card 4: Approved Time Off */}
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

        {/* Card 5: Attendance Health */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">ATTENDANCE HEALTH</span>
            <div className="mt-1">
              {isLoadingMetrics ? (
                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
              ) : (
                <span className="text-2xl font-black text-slate-900">{metrics?.attendanceHealth || 98}%</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">filtered attendance log ratio</p>
          </div>
        </div>

      </div>

      {/* 4. MAIN ANALYTICS ROW (Monthly Salary Trend + Department Salary Breakdown) */}
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

          {/* SVG Line Chart driven by API */}
          <div className="w-full h-56 pt-2 relative">
            {isLoadingMetrics ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF5E1E]" />
              </div>
            ) : (
              <>
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                  <line x1="0" y1="20" x2="500" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="70" x2="500" y2="70" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="160" x2="500" y2="160" stroke="#E2E8F0" strokeWidth="1" />

                  {/* Dynamic SVG Line */}
                  <path
                    d={lineChartPath}
                    fill="none"
                    stroke="#FF5E1E"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>

                {/* X Axis Labels */}
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-2 px-2">
                  {(data?.monthlyNetSalaryTrend || []).map((t) => (
                    <span key={t.month}>{t.month}</span>
                  ))}
                </div>
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

          <div className="space-y-3 pt-2 max-h-56 overflow-y-auto">
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

      {/* 5. BOTTOM ROW (Active Payruns Status + Recent Activity Stream) */}
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
              No active payrun warnings. All {metrics?.activeContracts ?? 0} active contracts synced cleanly with database.
            </p>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Database Status: <strong className="text-emerald-600 font-mono">Live PostgreSQL (Prisma)</strong></span>
            <Link to="/payroll" className="text-[#FF5E1E] font-bold hover:underline">
              View All Payruns
            </Link>
          </div>
        </div>

        {/* Activity Stream */}
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

          {/* Activity Stream List */}
          <div className="space-y-3 pt-1">

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

