import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Table, Tr, Td, Button, LoadingPage, Alert, Modal, Select, Input, LeaveStatusBadge } from '../../components/ui';
import { Plus, Check, X, Loader2, Calendar, PieChart, Search, Filter } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function TimeOffPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId');

  const [requests, setRequests] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [refuseModal, setRefuseModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [saving, setSaving] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'requests'>('summary');
  const [summarySearch, setSummarySearch] = useState('');

  // Search & Filter state for Leave Requests tab
  const [requestSearch, setRequestSearch] = useState('');
  const [requestTypeFilter, setRequestTypeFilter] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('');
  const [newForm, setNewForm] = useState({
    leaveTypeId: '', startDate: '', endDate: '', reason: '', employeeId: employeeIdParam || '',
  });
  const [employees, setEmployees] = useState<any[]>([]);

  const load = async () => {
    const currentEmpId = employeeIdParam || (user?.role === 'EMPLOYEE' ? (user.employee?.id || user.id) : undefined);
    const params = currentEmpId ? { employeeId: currentEmpId } : undefined;
    const [reqRes, typeRes, allocRes] = await Promise.all([
      api.timeOff.requests(params),
      api.timeOff.types(),
      api.timeOff.allocations(params),
    ]);
    if (reqRes.success) setRequests(reqRes.data || []);
    if (typeRes.success) setTypes(typeRes.data || []);
    if (allocRes.success) setAllocations(allocRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (user?.role !== 'EMPLOYEE') {
      api.employees.list({ limit: '200' }).then(res => {
        if (res.success) setEmployees(res.data?.employees || res.data || []);
      });
    }
  }, [employeeIdParam, user]);

  const handleCreate = async () => {
    setSaving(true);
    const payload = { ...newForm };
    if (user?.role === 'EMPLOYEE') {
      payload.employeeId = user.employee?.id || user.id || '';
    }
    const res = await api.timeOff.createRequest(payload);
    setSaving(false);
    if (res.success) {
      toast.success('Leave request submitted successfully');
      setShowNew(false);
      load();
    } else {
      const msg = res.error?.message || 'Failed to create request';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleApprove = async (id: string) => {
    const res = await api.timeOff.approve(id);
    if (res.success) {
      toast.success('Leave request approved successfully');
      load();
    } else {
      const msg = res.error?.message || 'Failed to approve';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleRefuse = async () => {
    setSaving(true);
    const res = await api.timeOff.refuse(refuseModal.id, refuseReason);
    setSaving(false);
    if (res.success) {
      toast.success('Leave request refused');
      setRefuseModal({ open: false, id: '' });
      setRefuseReason('');
      load();
    } else {
      const msg = res.error?.message || 'Failed to refuse';
      setError(msg);
      toast.error(msg);
    }
  };

  // Group allocations by Employee for the Summary View
  const groupedAllocations = useMemo(() => {
    const map = new Map<string, { employee: any; balances: any[] }>();
    allocations.forEach(a => {
      const emp = a.employee || {};
      const empId = emp.id || a.employeeId || 'unknown';
      if (!map.has(empId)) {
        map.set(empId, { employee: emp, balances: [] });
      }
      map.get(empId)!.balances.push(a);
    });
    return Array.from(map.values());
  }, [allocations]);

  const filteredGroupedAllocations = useMemo(() => {
    if (!summarySearch) return groupedAllocations;
    const q = summarySearch.toLowerCase();
    return groupedAllocations.filter(g => {
      const name = `${g.employee?.firstName || ''} ${g.employee?.lastName || ''}`.toLowerCase();
      const num = (g.employee?.employeeNumber || '').toLowerCase();
      const dept = (g.employee?.department?.name || '').toLowerCase();
      const desg = (g.employee?.designation || '').toLowerCase();
      return name.includes(q) || num.includes(q) || dept.includes(q) || desg.includes(q);
    });
  }, [groupedAllocations, summarySearch]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const q = requestSearch.toLowerCase().trim();
      const empName = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.toLowerCase();
      const empNum = (r.employee?.employeeNumber || '').toLowerCase();
      const typeName = (r.leaveType?.name || '').toLowerCase();
      const typeCode = (r.leaveType?.code || '').toLowerCase();
      const reason = (r.reason || '').toLowerCase();

      const matchesSearch = !q || empName.includes(q) || empNum.includes(q) || typeName.includes(q) || typeCode.includes(q) || reason.includes(q);
      const matchesType = !requestTypeFilter || r.leaveType?.code === requestTypeFilter || r.leaveTypeId === requestTypeFilter;
      const matchesStatus = !requestStatusFilter || r.status === requestStatusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [requests, requestSearch, requestTypeFilter, requestStatusFilter]);

  const hasActiveRequestFilters = Boolean(requestSearch || requestTypeFilter || requestStatusFilter);

  const clearRequestFilters = () => {
    setRequestSearch('');
    setRequestTypeFilter('');
    setRequestStatusFilter('');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Management" subtitle="Leave allocations, requests, and HR approval workflow">
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> Request Time Off
        </Button>
      </PageHeader>

      {error && <Alert message={error} />}

      {/* Top Navigation Toggle */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-3 font-extrabold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'summary'
              ? 'border-[#FF5E1E] text-[#FF5E1E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PieChart size={18} />
          Leave Balance Summary
          <span className="ml-1 bg-orange-100 text-[#FF5E1E] text-xs px-2.5 py-0.5 rounded-full font-bold">
            {groupedAllocations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 font-extrabold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'requests'
              ? 'border-[#FF5E1E] text-[#FF5E1E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={18} />
          Leave Requests
          <span className="ml-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
            {requests.length}
          </span>
        </button>
      </div>

      {loading ? (
        <LoadingPage />
      ) : activeTab === 'summary' ? (
        /* Leave Balance Summary View */
        (user?.role === 'EMPLOYEE' || filteredGroupedAllocations.length === 1) ? (
          /* Dedicated Employee Self-Service Full-Width Layout */
          <div className="space-y-6">
            {filteredGroupedAllocations.slice(0, 1).map(group => {
              const emp = group.employee || user?.employee || {};
              const totalRemaining = group.balances.reduce((acc: number, b: any) => {
                const isUL = b.leaveType?.code === 'UL';
                const allocated = (isUL && (!b.allocatedAmount || b.allocatedAmount === 0)) ? 5 : (b.allocatedAmount ?? 0);
                const used = b.usedAmount ?? 0;
                const rem = (isUL && (!b.allocatedAmount || b.allocatedAmount === 0)) ? (5 - used) : (b.remainingAmount ?? (allocated - used));
                return acc + rem;
              }, 0);
              const totalAllocated = group.balances.reduce((acc: number, b: any) => {
                const isUL = b.leaveType?.code === 'UL';
                const allocated = (isUL && (!b.allocatedAmount || b.allocatedAmount === 0)) ? 5 : (b.allocatedAmount ?? 0);
                return acc + allocated;
              }, 0);

              return (
                <div key={emp.id || 'employee-summary'} className="space-y-6">
                  {/* Full-Width Grid for All Leave Balances */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {group.balances.map(a => {
                      const isUL = a.leaveType?.code === 'UL';
                      const allocated = (isUL && (!a.allocatedAmount || a.allocatedAmount === 0)) ? 5 : (a.allocatedAmount ?? 0);
                      const used = a.usedAmount ?? 0;
                      const remaining = (isUL && (!a.allocatedAmount || a.allocatedAmount === 0)) ? (5 - used) : (a.remainingAmount ?? (allocated - used));
                      const pct = allocated > 0 ? Math.min(100, Math.max(0, (used / allocated) * 100)) : 0;

                      return (
                        <div key={a.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:border-orange-300 transition-all space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-sm">{a.leaveType?.name}</span>
                            <span className="text-xs font-extrabold text-[#FF5E1E] bg-orange-100 px-2 py-0.5 rounded-full">
                              {a.leaveType?.code}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-1 pt-1">
                            <span className="text-3xl font-black text-slate-900">{remaining}</span>
                            <span className="text-xs text-slate-500 font-bold">/ {allocated} days left</span>
                          </div>

                          <div className="space-y-2 pt-1">
                            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                              <span>Used: <strong className="text-slate-700 font-bold">{used} days</strong></span>
                              <span className="font-bold text-[#FF5E1E]">{Math.round(pct)}% used</span>
                            </div>
                            <div className="w-full bg-slate-100 border border-slate-200/90 rounded-full h-3 overflow-hidden p-0.5 shadow-xs">
                              <div
                                className={`h-full rounded-full transition-all duration-500 shadow-xs ${
                                  pct > 80
                                    ? 'bg-gradient-to-r from-red-500 to-rose-600'
                                    : pct > 50
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                    : 'bg-gradient-to-r from-[#FF5E1E] to-[#FF8038]'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Multi-Employee Admin/HR Manager View */
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Showing Leave Balances ({filteredGroupedAllocations.length} Employees)
              </h2>
              <div className="relative min-w-[260px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={summarySearch}
                  onChange={e => setSummarySearch(e.target.value)}
                  placeholder="Filter employee or department..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#FF5E1E] focus:ring-1 focus:ring-[#FF5E1E] shadow-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGroupedAllocations.map(group => {
                const emp = group.employee;
                return (
                  <div
                    key={emp.id || Math.random()}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-orange-300 transition-all space-y-4"
                  >
                    <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF5E1E] to-[#FF8038] flex items-center justify-center flex-shrink-0 shadow-xs">
                        <span className="text-white text-sm font-extrabold">
                          {emp.firstName?.[0]}{emp.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-slate-900 font-extrabold text-sm truncate">
                            {emp.firstName} {emp.lastName}
                          </h3>
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {emp.employeeNumber || 'EMP'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs font-medium truncate mt-0.5">
                          {emp.designation || 'Staff'} · <span className="text-slate-700 font-bold">{emp.department?.name || 'General'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {group.balances.map(a => (
                        <div key={a.id} className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 truncate">{a.leaveType?.name}</span>
                            <span className="text-[10px] font-extrabold text-[#FF5E1E] bg-orange-100/80 px-1.5 py-0.5 rounded">
                              {a.leaveType?.code}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-extrabold text-slate-900">
                              {a.remainingAmount ?? (a.allocatedAmount - a.usedAmount)}
                            </span>
                            <span className="text-[11px] text-slate-500 font-bold">
                              / {a.allocatedAmount} {a.leaveType?.unit?.toLowerCase() || 'days'} left
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 border border-slate-200/80 rounded-full h-2 overflow-hidden p-0.5 shadow-2xs">
                            <div
                              className="bg-gradient-to-r from-[#FF5E1E] to-[#FF8038] h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  a.allocatedAmount ? (a.usedAmount / a.allocatedAmount) * 100 : 0
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        /* Leave Requests View */
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search leave requests by employee, ID, leave type, or reason..."
                  value={requestSearch}
                  onChange={e => setRequestSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF5E1E] focus:bg-white transition-all placeholder:text-slate-400"
                />
                {requestSearch && (
                  <button
                    onClick={() => setRequestSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Leave Type Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Filter size={14} className="text-slate-400" />
                  <select
                    value={requestTypeFilter}
                    onChange={e => setRequestTypeFilter(e.target.value)}
                    className="bg-transparent text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="">All Leave Types</option>
                    {types.map(t => (
                      <option key={t.id} value={t.code}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <select
                  value={requestStatusFilter}
                  onChange={e => setRequestStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REFUSED">Refused</option>
                </select>

                {/* Clear Button */}
                {hasActiveRequestFilters && (
                  <button
                    onClick={clearRequestFilters}
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-[#FF5E1E] bg-slate-100 hover:bg-orange-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Counter Summary */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mt-3 pt-3 border-t border-slate-100">
              <span>Showing <strong className="text-slate-900">{filteredRequests.length}</strong> of <strong className="text-slate-900">{requests.length}</strong> leave requests</span>
              {hasActiveRequestFilters && (
                <span className="text-[#FF5E1E] font-bold">Filtered Results</span>
              )}
            </div>
          </div>

          <Table
            headers={['Employee', 'Type', 'Period', 'Duration', 'Reason', 'Status', 'Actions']}
            empty={filteredRequests.length === 0}
          >
            {filteredRequests.map(r => (
              <Tr key={r.id}>
                <Td>
                  <div className="text-slate-900 font-bold">{r.employee?.firstName} {r.employee?.lastName}</div>
                  <div className="text-slate-500 text-xs font-mono">{r.employee?.employeeNumber}</div>
                </Td>
                <Td><span className="font-semibold text-slate-800">{r.leaveType?.name}</span></Td>
                <Td className="text-xs font-medium text-slate-600">
                  {new Date(r.startDate).toLocaleDateString()} — {new Date(r.endDate).toLocaleDateString()}
                </Td>
                <Td className="font-extrabold text-slate-900">{r.duration} days</Td>
                <Td className="text-xs text-slate-500 max-w-xs truncate">{r.reason || '—'}</Td>
                <Td><LeaveStatusBadge status={r.status} /></Td>
                <Td>
                  {r.status === 'PENDING' && ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'].includes(user?.role || '') && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(r.id)} className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                        <Check size={14} /> Approve
                      </button>
                      <button onClick={() => setRefuseModal({ open: true, id: r.id })} className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                        <X size={14} /> Refuse
                      </button>
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      )}

      {/* New Request Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Leave Request">
        <div className="space-y-4">
          {user?.role !== 'EMPLOYEE' && (
            <Select label="Employee *" value={newForm.employeeId} onChange={e => setNewForm({ ...newForm, employeeId: e.target.value })} required>
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNumber})</option>)}
            </Select>
          )}

          <Select label="Leave Type *" value={newForm.leaveTypeId} onChange={e => setNewForm({ ...newForm, leaveTypeId: e.target.value })} required>
            <option value="">Select Type</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date *" type="date" value={newForm.startDate} onChange={e => setNewForm({ ...newForm, startDate: e.target.value })} required />
            <Input label="End Date *" type="date" value={newForm.endDate} onChange={e => setNewForm({ ...newForm, endDate: e.target.value })} required />
          </div>

          <Input label="Reason / Notes" value={newForm.reason} onChange={e => setNewForm({ ...newForm, reason: e.target.value })} placeholder="Reason for time off request..." />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !newForm.leaveTypeId || !newForm.startDate || !newForm.endDate}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Refuse Modal */}
      <Modal open={refuseModal.open} onClose={() => setRefuseModal({ open: false, id: '' })} title="Refuse Leave Request">
        <div className="space-y-4">
          <Input label="Refusal Reason *" value={refuseReason} onChange={e => setRefuseReason(e.target.value)} placeholder="Provide reason for refusal..." required />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setRefuseModal({ open: false, id: '' })}>Cancel</Button>
            <Button variant="danger" onClick={handleRefuse} disabled={saving || refuseReason.trim().length < 3}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? 'Refusing...' : 'Confirm Refusal'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
