import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Table, Tr, Td, Button, LoadingPage, Alert, Modal, Select, Input, LeaveStatusBadge, Card } from '../../components/ui';
import { Plus, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function TimeOffPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [refuseModal, setRefuseModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [saving, setSaving] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');
  const [newForm, setNewForm] = useState({
    leaveTypeId: '', startDate: '', endDate: '', reason: '', employeeId: '',
  });
  const [employees, setEmployees] = useState<any[]>([]);

  const load = async () => {
    const [reqRes, typeRes, allocRes] = await Promise.all([
      api.timeOff.requests(),
      api.timeOff.types(),
      api.timeOff.allocations(),
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
  }, []);

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


  return (
    <div className="space-y-6">
      <PageHeader title="Leave Management" subtitle="Leave allocations, requests, and HR approval workflow">
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> Request Time Off
        </Button>
      </PageHeader>

      {error && <Alert message={error} />}

      {/* Allocations Summary */}
      {allocations.length > 0 && (
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">Leave Balance Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allocations.map(a => (
              <Card key={a.id} className="p-5 border border-slate-200/80 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">{a.leaveType?.name}</span>
                  <span className="text-xs font-bold text-[#FF5E1E] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">{a.leaveType?.code}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">{a.remainingAmount ?? (a.allocatedAmount - a.usedAmount)}</span>
                  <span className="text-xs text-slate-500 font-bold">/ {a.allocatedAmount} {a.leaveType?.unit?.toLowerCase() || 'days'} left</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-[#FF5E1E] h-full rounded-full"
                    style={{ width: `${Math.min(100, ((a.usedAmount / a.allocatedAmount) * 100))}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Requests Table */}
      {loading ? <LoadingPage /> : (
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">Leave Requests</h2>
          <Table
            headers={['Employee', 'Type', 'Period', 'Duration', 'Reason', 'Status', 'Actions']}
            empty={requests.length === 0}
          >
            {requests.map(r => (
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
                  {r.status === 'PENDING' && ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'].includes(user?.role || '') && (
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
