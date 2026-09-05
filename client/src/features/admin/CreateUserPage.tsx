import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { UserRole, AccountStatus, EmployeeSummary, User } from '../../types/auth';
import {
  UserPlus,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Search,
  RefreshCw,
  Edit2,
  Key,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const CreateUserPage: React.FC = () => {
  const { user: currentUser, adminCreateUser } = useAuth();
  const [searchParams] = useSearchParams();

  // Initial params from URL e.g. /dashboard?role=admin or /admin/users?page=1
  const initialRoleParam = (searchParams.get('role') || 'ALL').toUpperCase();

  // Form State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [status, setStatus] = useState<AccountStatus>('ACTIVE');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [customPassword, setCustomPassword] = useState('');

  // Data & Filter & Pagination State
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [existingUsers, setExistingUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(initialRoleParam);
  
  // Pagination variables
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [limit, setLimit] = useState<number>(Number(searchParams.get('limit')) || 5);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success & Error State
  const [successData, setSuccessData] = useState<{ user: User; tempPassword?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load employee dropdown list once
  const fetchEmployees = async () => {
    try {
      const empRes = await apiClient.getEmployees();
      if (empRes.success && empRes.data) {
        const empList = Array.isArray(empRes.data)
          ? empRes.data
          : (empRes.data as any).employees || [];
        setEmployees(empList);
      }
    } catch (err) {
      console.error('Failed to load employee list:', err);
    }
  };

  // Dynamic paginated users fetch from PostgreSQL backend
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const userRes = await apiClient.getAdminUsers({
        page,
        limit,
        search: searchQuery,
        role: roleFilter,
      });

      if (userRes.success && userRes.data) {
        const usersList = Array.isArray(userRes.data)
          ? userRes.data
          : (userRes.data as any).users || [];
        setExistingUsers(usersList);

        const pg = userRes.pagination || (userRes.data as any)?.pagination;
        if (pg) {
          setTotalCount(pg.total);
          setTotalPages(pg.totalPages);
        } else {
          setTotalCount(usersList.length);
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, roleFilter]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Trigger paginated fetch when page, limit, search or role filter updates
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 whenever search query or role filter changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleRoleFilterChange = (val: string) => {
    setRoleFilter(val);
    setPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Reset form to New User mode
  const handleNewUser = () => {
    setSelectedUser(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setSelectedEmployeeId('');
    setCustomPassword('');
    setRole('EMPLOYEE');
    setStatus('ACTIVE');
    setError(null);
    setSuccessData(null);
  };

  // Populate form when a user row is selected
  const handleSelectUserToEdit = (u: User) => {
    setSelectedUser(u);
    setError(null);
    setSuccessData(null);
    
    setEmail(u.email);
    setRole(u.role);
    setStatus('ACTIVE');

    if (u.employee) {
      setFirstName(u.employee.firstName);
      setLastName(u.employee.lastName);
      setSelectedEmployeeId(u.employee.id);
    } else {
      const parts = u.email.split('@')[0].split('.');
      setFirstName(parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'User');
      setLastName(parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : '');
      setSelectedEmployeeId('');
    }
  };

  // When an employee is selected from dropdown, auto-fill name & email
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

    // Prevent self-role elevation check
    if (selectedUser && currentUser && selectedUser.id === currentUser.id && selectedUser.role !== role) {
      setError('Security Rule Violation: Users must not be able to assign or elevate their own roles.');
      return;
    }

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
      handleNewUser();

      // Refresh data
      fetchUsers();
    } else {
      setError(result.error || 'Failed to save user account. Please check form inputs.');
    }
  };

  // Role Badge Styling helper
  const getRoleBadgeColor = (r: UserRole) => {
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

  const rolesOptions: { value: UserRole; label: string; desc: string }[] = [
    { value: 'EMPLOYEE', label: 'Employee', desc: 'Self-service portal access for leaves & payslips' },
    { value: 'HR_MANAGER', label: 'HR Manager', desc: 'Leave approvals & employee profile management' },
    { value: 'HR_PAYROLL_USER', label: 'HR Payroll User', desc: 'Payroll calculation viewer & payslip generator' },
    { value: 'HR_PAYROLL_MANAGER', label: 'HR Payroll Manager', desc: 'Full payrun execution & salary structure control' },
    { value: 'ADMIN', label: 'Admin', desc: 'Full system administrative & RBAC permissions' },
  ];

  const isEditingSelf = Boolean(selectedUser && currentUser && selectedUser.id === currentUser.id);

  return (
    <div className="w-full space-y-6 font-sans pb-12 text-slate-900">
      
      {/* 1. TOP HEADER & RBAC TITLE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-50 border border-orange-100 rounded-2xl text-[#FF5E1E]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-orange-100/80 text-[#FF5E1E] border border-orange-200/80 rounded-full">
                ADMIN ONLY
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage user accounts, roles, access permissions, and employee mappings across PeoplePay360.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-2xs text-[#1E293B] focus:outline-none"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FF5E1E]' : ''}`} />
          </button>
          <button
            onClick={handleNewUser}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#FF5E1E] hover:bg-[#E0480C] rounded-full transition shadow-md shadow-orange-500/25 flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ New User</span>
          </button>
        </div>
      </div>

      {/* LOGIN / USER ACCESS NOTE CARD (MATCHING SPECIFICATION IMAGE) */}
      <div className="bg-[#121316] text-[#F3F4F6] p-6 rounded-3xl border border-amber-500/30 shadow-lg relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-sm tracking-wider uppercase font-semibold border-b border-amber-500/20 pb-2">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>LOGIN / USER ACCESS NOTE</span>
          </div>

          <ul className="space-y-2 text-xs font-medium text-slate-200 list-disc list-inside leading-relaxed">
            <li className="marker:text-amber-400">
              In the ERP flow. User accounts are created by an Admin.
            </li>
            <li className="marker:text-amber-400">
              When creating a user, link the account to the relevant employee and assign one or more roles.
            </li>
            <li className="marker:text-amber-400">
              Roles control which modules, records and actions become available after login.
            </li>
            <li className="marker:text-amber-400">
              Users must not be able to assign or elevate their own roles.
            </li>
            <li className="marker:text-amber-400">
              Password reset, invitations, SSO, etc. can be added as enhancements.
            </li>
          </ul>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN RBAC LAYOUT (MATCHING REFERENCE UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: USER ACCOUNTS TABLE (7 Columns - 60%) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
            
            {/* Top Toolbar (New User button + Search + Role Filter) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative w-full sm:flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search users, employees or email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5E1E]/40 focus:border-[#FF5E1E] transition-all"
                />
              </div>

              {/* Role Filter Dropdown */}
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
                <select
                  value={roleFilter}
                  onChange={(e) => handleRoleFilterChange(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5E1E]/40 cursor-pointer"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="HR_PAYROLL_MANAGER">Payroll Manager</option>
                  <option value="HR_PAYROLL_USER">Payroll User</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>
            </div>

            {/* User Data Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Work Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#FF5E1E] mb-2" />
                        Loading PostgreSQL User Accounts...
                      </td>
                    </tr>
                  ) : existingUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No user accounts match your search query.
                      </td>
                    </tr>
                  ) : (
                    existingUsers.map((u) => {
                      const isSelected = selectedUser?.id === u.id;
                      const empNameDisplay = u.employee
                        ? `${u.employee.firstName} ${u.employee.lastName}`
                        : 'Unmapped';

                      return (
                        <tr
                          key={u.id}
                          onClick={() => handleSelectUserToEdit(u)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-orange-50/80 font-semibold text-slate-900'
                              : 'hover:bg-slate-50/80 text-slate-700'
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF5E1E] to-amber-500 text-white font-extrabold text-[10px] flex items-center justify-center shadow-2xs">
                                {empNameDisplay.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="line-clamp-1">{empNameDisplay}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {u.employee ? (
                              <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[11px]">
                                {u.employee.designation || 'Mapped'}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">None</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-md border ${getRoleBadgeColor(
                                u.role
                              )}`}
                            >
                              {u.role.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                              Active
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectUserToEdit(u);
                              }}
                              className="p-1.5 text-slate-400 hover:text-[#FF5E1E] hover:bg-orange-50 rounded-lg transition"
                              title="Edit Permissions"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* DYNAMIC BACKEND PAGINATION CONTROLS BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <span>
                  Showing <strong className="text-slate-900">{totalCount > 0 ? (page - 1) * limit + 1 : 0}</strong> to{' '}
                  <strong className="text-slate-900">{Math.min(page * limit, totalCount)}</strong> of{' '}
                  <strong className="text-slate-900">{totalCount}</strong> users
                </span>
                
                {/* Page size limit selector */}
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[11px] text-slate-400 font-medium">Rows:</span>
                  <select
                    value={limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5E1E]/30 cursor-pointer"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Page Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-slate-700 font-semibold flex items-center gap-1 px-3 cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={`w-7 h-7 rounded-xl text-xs font-extrabold transition flex items-center justify-center cursor-pointer ${
                        page === pNum
                          ? 'bg-[#FF5E1E] text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-slate-700 font-semibold flex items-center gap-1 px-3 cursor-pointer shadow-2xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium italic pt-1">
              * User accounts are separate from Employee records, but should be linked to an employee for access and ownership.
            </p>

          </div>
        </div>

        {/* RIGHT COLUMN: CREATE / EDIT USER DRAWER PANEL (5 Columns - 40%) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative">
            
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {selectedUser ? 'Edit User Access' : 'Create / Edit User'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedUser ? `Editing: ${selectedUser.email}` : 'Open on New User'}
                </p>
              </div>
              {selectedUser && (
                <button
                  onClick={handleNewUser}
                  className="text-xs font-bold text-[#FF5E1E] hover:underline"
                >
                  + New User
                </button>
              )}
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-600 text-xs leading-relaxed animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {/* Success Notification */}
            {successData && (
              <div className="mb-5 p-4 bg-teal-50 border border-teal-200 rounded-2xl text-teal-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-teal-900">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" /> User Access Saved Successfully!
                </div>
                {successData.tempPassword && (
                  <div className="mt-2 p-2.5 bg-white border border-teal-200 rounded-xl font-mono text-[11px]">
                    <span className="text-slate-500">Temp Password: </span>
                    <strong className="text-slate-900">{successData.tempPassword}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Employee Mapping Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Employee *
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="w-full px-4 py-3 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5E1E]/40 focus:border-[#FF5E1E] transition-all cursor-pointer"
                >
                  <option value="">Select employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeNumber || emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Work Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@company.com"
                    className="w-full px-5 py-3 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5E1E]/40 focus:border-[#FF5E1E] transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Full Name (First & Last) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF5E1E]/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF5E1E]/40"
                  />
                </div>
              </div>

              {/* Roles Selection (Radio Options List matching screenshot) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Roles *
                  </label>
                  {isEditingSelf && (
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Cannot Elevate Own Role
                    </span>
                  )}
                </div>
                {isEditingSelf && (
                  <p className="text-[11px] text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/70 font-medium">
                    🔒 <strong>Security Policy:</strong> Users must not be able to assign or elevate their own roles.
                  </p>
                )}
                <div className="space-y-2 bg-slate-50/70 p-3.5 border border-slate-200/80 rounded-2xl">
                  {rolesOptions.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                        isEditingSelf ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        role === r.value
                          ? 'bg-white border-[#FF5E1E] shadow-2xs text-slate-900 font-bold'
                          : 'border-transparent text-slate-600 hover:bg-white/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        value={r.value}
                        checked={role === r.value}
                        disabled={isEditingSelf}
                        onChange={() => setRole(r.value)}
                        className="mt-0.5 accent-[#FF5E1E] cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{r.label}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{r.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Account Status Pill */}
              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-bold text-slate-700">Account Status</label>
                <button
                  type="button"
                  onClick={() => setStatus(status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  {status}
                </button>
              </div>

              {/* Optional Custom Password */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-700">
                  Custom Password (Optional)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Leave empty for auto-generated password"
                    className="w-full px-5 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5E1E]/40"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Submit Button matching reference UI */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-full text-xs font-bold text-white bg-[#FF5E1E] hover:bg-[#E0480C] active:scale-[0.99] transition shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Access Permissions...</span>
                    </>
                  ) : (
                    <span>Create User / Save Access</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>

    </div>
  );
};
