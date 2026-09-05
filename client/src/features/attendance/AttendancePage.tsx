import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Table, Tr, Td, Button, Badge, LoadingPage, Alert, Modal, Input } from '../../components/ui';
import { Edit, Loader2 } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg] = useState('');
  const [correctModal, setCorrectModal] = useState<{ open: boolean; record: any }>({ open: false, record: null });
  const [correctForm, setCorrectForm] = useState({ checkIn: '', checkOut: '', correctionReason: '' });
  const [correcting, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    const params: Record<string, string> = {};
    const empId = searchParams.get('employeeId');
    if (empId) params.employeeId = empId;
    if (filterStatus) params.status = filterStatus;
    const res = await api.attendance.list(params);
    if (res.success) setRecords(res.data || []);
    else setError(res.error?.message || 'Failed to load attendance');
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleCorrect = async () => {
    setSaving(true);
    const res = await api.attendance.correct(correctModal.record.id, {
      checkIn: correctForm.checkIn ? new Date(correctForm.checkIn).toISOString() : undefined,
      checkOut: correctForm.checkOut ? new Date(correctForm.checkOut).toISOString() : undefined,
      correctionReason: correctForm.correctionReason,
      status: 'CORRECTED',
    });
    setSaving(false);
    if (res.success) { setCorrectModal({ open: false, record: null }); load(); }
    else setError(res.error?.message || 'Failed to correct record');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance Logs" subtitle={`${records.length} biometric daily logs and exception records`}>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Biometric Kiosk Synced
          </span>
        </div>
      </PageHeader>

      {actionMsg && <Alert message={actionMsg} variant={actionMsg.includes('✅') ? 'success' : 'error'} />}
      {error && <Alert message={error} />}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#FF5E1E]"
        >
          <option value="">All Statuses</option>
          <option value="PRESENT">Present</option>
          <option value="ABSENT">Absent</option>
          <option value="HALF_DAY">Half Day</option>
          <option value="CORRECTED">Corrected</option>
        </select>
      </div>

      {loading ? <LoadingPage /> : (
        <Table
          headers={['Employee', 'Date', 'Check In', 'Check Out', 'Worked Hours', 'Overtime', 'Status', 'Actions']}
          empty={records.length === 0}
        >
          {records.map(r => (
            <Tr key={r.id}>
              <Td>
                <div className="text-slate-900 font-bold">{r.employee?.firstName} {r.employee?.lastName}</div>
                <div className="text-slate-500 text-xs font-mono">{r.employee?.employeeNumber}</div>
              </Td>
              <Td className="font-semibold text-slate-800">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</Td>
              <Td className="text-xs font-mono text-emerald-700">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Td>
              <Td className="text-xs font-mono text-amber-700">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Td>
              <Td className="font-extrabold text-slate-900">{r.workedHours ? `${r.workedHours.toFixed(1)} hrs` : 'In Progress'}</Td>
              <Td className="text-xs font-medium text-slate-500">{r.overtimeHours ? `+${r.overtimeHours.toFixed(1)} hrs` : '—'}</Td>
              <Td>
                <Badge variant={r.status === 'PRESENT' ? 'success' : r.status === 'CORRECTED' ? 'purple' : r.status === 'HALF_DAY' ? 'warning' : 'danger'}>
                  {r.status}
                </Badge>
              </Td>
              <Td>
                {['ADMIN', 'HR_MANAGER'].includes(user?.role || '') && (
                  <button
                    onClick={() => {
                      setCorrectModal({ open: true, record: r });
                      setCorrectForm({
                        checkIn: r.checkIn ? r.checkIn.slice(0, 16) : '',
                        checkOut: r.checkOut ? r.checkOut.slice(0, 16) : '',
                        correctionReason: '',
                      });
                    }}
                    className="p-1.5 text-slate-500 hover:text-[#FF5E1E] hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* Correction Modal */}
      <Modal open={correctModal.open} onClose={() => setCorrectModal({ open: false, record: null })} title="Correct Attendance Record">
        <div className="space-y-4">
          <Input label="Check In Time" type="datetime-local" value={correctForm.checkIn} onChange={e => setCorrectForm({ ...correctForm, checkIn: e.target.value })} />
          <Input label="Check Out Time" type="datetime-local" value={correctForm.checkOut} onChange={e => setCorrectForm({ ...correctForm, checkOut: e.target.value })} />
          <Input label="Correction Reason *" value={correctForm.correctionReason} onChange={e => setCorrectForm({ ...correctForm, correctionReason: e.target.value })} placeholder="e.g. Employee forgot to punch in" required />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setCorrectModal({ open: false, record: null })}>Cancel</Button>
            <Button onClick={handleCorrect} disabled={correcting || !correctForm.correctionReason}>
              {correcting ? <Loader2 size={16} className="animate-spin" /> : null}
              {correcting ? 'Saving...' : 'Submit Correction'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
