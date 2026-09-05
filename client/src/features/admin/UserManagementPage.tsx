import React, { useState, useEffect } from 'react';
import { PageHeader, Table, Tr, Td, Button, LoadingPage, Alert, Modal, Input, Select, Card, Badge } from '../../components/ui';
import { UserPlus, Search, RefreshCw, Loader2 } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const UserManagementPage: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Updating status per user
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // New User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    role: 'EMPLOYEE',
    employeeId: '',
    firstName: '',
    lastName: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, empRes] = await Promise.all([
        api.getAdminUsers({ limit: 500 }),
        api.getEmployees(),
      ]);

      if (usersRes.success && usersRes.data) {
        const list = Array.isArray(usersRes.data)
          ? usersRes.data
          : Array.isArray(usersRes.data.users)
          ? usersRes.data.users
          : [];
        setUsers(list);
      } else {
        setUsers([]);
        setError(usersRes.error?.message || 'Failed to load users');
      }

      if (empRes.success && empRes.data) {
        const empList = Array.isArray(empRes.data)
          ? empRes.data
          : Array.isArray(empRes.data.employees)
          ? empRes.data.employees
          : [];
        setEmployees(empList);
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.updateAdminUser(userId, { role: newRole });
      if (res.success) {
        setSuccessMsg(`User role updated to ${newRole}`);
        setTimeout(() => setSuccessMsg(''), 3000);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        setError(res.error?.message || 'Failed to update role');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleEmployeeLink = async (userId: string, employeeId: string) => {
    setUpdatingUserId(userId);
    setError('');
    try {
      const targetEmpId = employeeId === 'UNLINK' ? null : employeeId;
      const res = await api.updateAdminUser(userId, { employeeId: targetEmpId });
      if (res.success) {
        setSuccessMsg('Employee linkage updated successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
        await loadData();
      } else {
        setError(res.error?.message || 'Failed to link employee');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to link employee');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserForm.email.trim())) {
      const msg = 'Please enter a valid email address (e.g. user@peoplepay360.com)';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (newUserForm.password && newUserForm.password.length < 6) {
      const msg = 'Password must be at least 6 characters long';
      setError(msg);
      toast.error(msg);
      return;
    }

    setCreating(true);
    setError('');

    try {
      const payload: any = {
        email: newUserForm.email.trim(),
        role: newUserForm.role,
        ...(newUserForm.password && { password: newUserForm.password }),
        ...(newUserForm.employeeId && { employeeId: newUserForm.employeeId }),
        ...(newUserForm.firstName && { firstName: newUserForm.firstName }),
        ...(newUserForm.lastName && { lastName: newUserForm.lastName }),
      };

      const res = await api.adminCreateUser(payload);
      if (res.success) {
        const msg = res.data?.message || 'User created successfully!';
        setSuccessMsg(msg);
        toast.success(msg);
        setTimeout(() => setSuccessMsg(''), 4000);
        setShowCreateModal(false);
        setNewUserForm({
          email: '',
          password: '',
          role: 'EMPLOYEE',
          employeeId: '',
          firstName: '',
          lastName: '',
        });
        await loadData();
      } else {
        const errMsg = res.error?.message || 'Failed to create user';
        setError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Error creating user account';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="danger">ADMIN</Badge>;
      case 'HR_PAYROLL_MANAGER':
        return <Badge variant="purple">HR PAYROLL MANAGER</Badge>;
      case 'HR_PAYROLL_USER':
        return <Badge variant="info">HR PAYROLL USER</Badge>;
      case 'HR_MANAGER':
        return <Badge variant="orange">HR MANAGER</Badge>;
      default:
        return <Badge variant="default">EMPLOYEE</Badge>;
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter((u) => {
    const empName = u.employee
      ? `${u.employee.firstName} ${u.employee.lastName}`
      : '';
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      empName.toLowerCase().includes(search.toLowerCase());

    if (roleFilter === 'ALL') return matchesSearch;
    return matchesSearch && u.role === roleFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Admin User & Role Provisioning"
        subtitle="Manage platform accounts, security permissions, RBAC roles, and staff linkages"
      >
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus size={16} /> Create System User
        </Button>
      </PageHeader>

      {/* Role Distribution Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'ALL USERS', count: users.length, role: 'ALL', color: 'border-slate-200 text-slate-800' },
          { label: 'ADMIN', count: users.filter((u) => u.role === 'ADMIN').length, role: 'ADMIN', color: 'border-red-200 text-red-700 bg-red-50/50' },
          { label: 'PAYROLL MGR', count: users.filter((u) => u.role === 'HR_PAYROLL_MANAGER').length, role: 'HR_PAYROLL_MANAGER', color: 'border-purple-200 text-purple-700 bg-purple-50/50' },
          { label: 'PAYROLL USER', count: users.filter((u) => u.role === 'HR_PAYROLL_USER').length, role: 'HR_PAYROLL_USER', color: 'border-indigo-200 text-indigo-700 bg-indigo-50/50' },
          { label: 'HR MANAGER', count: users.filter((u) => u.role === 'HR_MANAGER').length, role: 'HR_MANAGER', color: 'border-orange-200 text-orange-700 bg-orange-50/50' },
        ].map((item) => (
          <Card
            key={item.role}
            className={`p-3.5 border text-center cursor-pointer transition-all ${item.color} ${roleFilter === item.role ? 'ring-2 ring-[#FF5E1E] shadow-sm' : ''
              }`}
            onClick={() => setRoleFilter(item.role)}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">{item.label}</p>
            <p className="text-2xl font-extrabold mt-0.5">{item.count}</p>
          </Card>
        ))}
      </div>

      {error && <Alert message={error} variant="error" />}
      {successMsg && <Alert message={successMsg} variant="success" />}

      {/* Controls Bar */}
      <Card className="p-4 border border-slate-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search user by email or employee name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#FF5E1E] focus:ring-1 focus:ring-[#FF5E1E]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw size={14} /> Refresh List
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      {loading ? (
        <LoadingPage />
      ) : (
        <Table
          headers={['User Email', 'Linked Employee', 'Current RBAC Role', 'Role Modifier', 'Created Date']}
          empty={filteredUsers.length === 0}
        >
          {filteredUsers.map((user) => {
            const emp = user.employee;
            const isUpdating = updatingUserId === user.id;

            return (
              <Tr key={user.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-extrabold text-xs">
                      {user.email.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">{user.email}</div>
                      <div className="text-[10px] font-mono text-slate-400">ID: {user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </Td>

                <Td>
                  {emp ? (
                    <div>
                      <div className="font-bold text-slate-800">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">{emp.designation || emp.employeeNumber}</div>
                    </div>
                  ) : (
                    <select
                      className="bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 rounded-lg px-2 py-1 focus:outline-none"
                      onChange={(e) => handleEmployeeLink(user.id, e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        ⚠️ Link Employee Record...
                      </option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} ({e.employeeNumber})
                        </option>
                      ))}
                    </select>
                  )}
                </Td>

                <Td>{getRoleBadge(user.role)}</Td>

                <Td>
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      disabled={isUpdating}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#FF5E1E] transition-colors"
                    >
                      <option value="EMPLOYEE">EMPLOYEE (Standard Staff)</option>
                      <option value="HR_MANAGER">HR_MANAGER (Core HR)</option>
                      <option value="HR_PAYROLL_USER">HR_PAYROLL_USER (Payroll Entry)</option>
                      <option value="HR_PAYROLL_MANAGER">HR_PAYROLL_MANAGER (Payroll Lead)</option>
                      <option value="ADMIN">ADMIN (Full Superuser)</option>
                    </select>

                    {isUpdating && <Loader2 size={14} className="animate-spin text-[#FF5E1E]" />}
                  </div>
                </Td>

                <Td className="text-xs text-slate-500 font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </Td>
              </Tr>
            );
          })}
        </Table>
      )}

      {/* Modal to Create System User */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create System User Account">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Work Email Address *"
            type="email"
            placeholder="user@peoplepay360.com"
            value={newUserForm.email}
            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
            error={newUserForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserForm.email.trim()) ? 'Must be a valid email address' : ''}
            hint="Primary company email address"
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={newUserForm.password}
            onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
            error={newUserForm.password && newUserForm.password.length < 6 ? 'Password must be at least 6 characters' : ''}
            hint="Minimum 6 characters (defaults to Welcome@123 if blank)"
          />

          <Select
            label="Assign Security Role *"
            value={newUserForm.role}
            onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
          >
            <option value="EMPLOYEE">EMPLOYEE (Self-service payslips & leaves)</option>
            <option value="HR_MANAGER">HR_MANAGER (Employees & Contracts)</option>
            <option value="HR_PAYROLL_USER">HR_PAYROLL_USER (Read structures, write payruns)</option>
            <option value="HR_PAYROLL_MANAGER">HR_PAYROLL_MANAGER (Full Payroll CRUD & Validation)</option>
            <option value="ADMIN">ADMIN (System Administrator)</option>
          </Select>

          <Select
            label="Link Existing Employee Record"
            value={newUserForm.employeeId}
            onChange={(e) => setNewUserForm({ ...newUserForm, employeeId: e.target.value })}
          >
            <option value="">Auto-create or match by Email</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.email})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="John"
              value={newUserForm.firstName}
              onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={newUserForm.lastName}
              onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 size={16} className="animate-spin" /> : null}
              {creating ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default UserManagementPage;
