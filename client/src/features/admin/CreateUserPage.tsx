import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { UserRole, AccountStatus, EmployeeSummary, User } from '../../types/auth';
import {
  UserPlus,
  Mail,
  User as UserIcon,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Briefcase,
  BadgeCheck,
  RefreshCw,
  Key,
} from 'lucide-react';

export const CreateUserPage: React.FC = () => {
  const { adminCreateUser } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [status, setStatus] = useState<AccountStatus>('ACTIVE');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [customPassword, setCustomPassword] = useState('');

  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [existingUsers, setExistingUsers] = useState<User[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [successData, setSuccessData] = useState<{ user: User; tempPassword?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch employees list and current users list
  const fetchData = async () => {
    setIsLoadingEmployees(true);
    try {
      const [empRes, userRes] = await Promise.all([
        apiClient.getEmployees(),
        apiClient.getAdminUsers(),
      ]);

      if (empRes.success && empRes.data) {
        const empList = Array.isArray(empRes.data)
          ? empRes.data
          : (empRes.data as any).employees || [];
        setEmployees(empList);
      }


      if (userRes.success && userRes.data) {
        setExistingUsers(userRes.data);
      }
    } catch (err) {
      console.error('Failed to load employee/user data:', err);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When an employee is selected, auto-fill full name and email if empty
  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (!empId) return;

    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setFirstName(emp.firstName);
      setLastName(emp.lastName);
      setEmail(emp.email);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessData(null);

    if (!firstName || !lastName) {
      setError('Full name (first and last name) is required.');
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await adminCreateUser({
      firstName,
      lastName,
      email,
      role,
      status,
      employeeId: selectedEmployeeId || null,
      password: customPassword || undefined,
    });
    setIsSubmitting(false);

    if (result.success && result.user) {
      setSuccessData({
        user: result.user,
        tempPassword: result.tempPassword,
      });

      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setSelectedEmployeeId('');
      setCustomPassword('');
      setRole('EMPLOYEE');
      setStatus('ACTIVE');

      // Refresh list
      fetchData();
    } else {
      setError(result.error || 'Failed to create user. Please check form values.');
    }
  };

  const getRoleBadgeColor = (r: UserRole) => {
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
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center text-orange-400 shadow-inner">
            <UserPlus className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin User Provisioning</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Create and manage user credentials, roles, and employee mappings across PeoplePay360.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> Admin Only Route
          </span>
          <button
            onClick={fetchData}
            disabled={isLoadingEmployees}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingEmployees ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-orange-400" /> New User Profile Details
            </h2>
            <p className="text-slate-400 text-xs mb-6">
              Fill in employee identity and select role permissions to generate user access.
            </p>

            {error && (
              <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 text-xs leading-relaxed">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {successData && (
              <div className="mb-6 p-5 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-teal-200">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" /> User Account Successfully Created!
                </div>
                <p>
                  User <span className="font-semibold text-white">{successData.user.email}</span> has been provisioned with role{' '}
                  <span className="font-mono text-orange-400 uppercase">{successData.user.role}</span>.
                </p>
                {successData.tempPassword && (
                  <div className="mt-2 p-3 bg-slate-950/80 border border-teal-500/30 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-400" /> Initial Password:
                    </span>
                    <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                      {successData.tempPassword}
                    </span>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Optional Link to Employee */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Link to Employee Master Record (Optional)</span>
                  {isLoadingEmployees && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="block w-full py-3 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                >
                  <option value="">-- Create Standalone User (or select existing Employee) --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeNumber}) - {emp.designation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="block w-full py-3 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="block w-full py-3 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Work Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.doe@company.com"
                    className="block w-full pl-10 pr-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Select Role & Account Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Assign Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="block w-full py-3 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="HR_PAYROLL_USER">HR Payroll User</option>
                    <option value="HR_PAYROLL_MANAGER">HR Payroll Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Account Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AccountStatus)}
                    className="block w-full py-3 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Password Option */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Initial Password</span>
                  <span className="text-slate-500 font-normal lowercase text-xs">Defaults to Welcome@123 if blank</span>
                </label>
                <input
                  type="password"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Set initial password (optional)"
                  className="block w-full py-3 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 text-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Provisioning User...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" /> Create User Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Existing System Users Side Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-base">Active System Users</h3>
              </div>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-mono font-bold">
                {existingUsers.length} Users
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
              {existingUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No registered users found. Fill out the form to create your first user.
                </div>
              ) : (
                existingUsers.map((u) => {
                  const empName = u.employee
                    ? `${u.employee.firstName} ${u.employee.lastName}`
                    : 'System Account';
                  const designation = u.employee?.designation || u.role;

                  return (
                    <div
                      key={u.id}
                      className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-all flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{empName}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border ${getRoleBadgeColor(
                              u.role
                            )}`}
                          >
                            {u.role.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs font-mono">{u.email}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <Briefcase className="w-3 h-3" />
                          <span>{designation}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                        <BadgeCheck className="w-3 h-3" /> Active
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
