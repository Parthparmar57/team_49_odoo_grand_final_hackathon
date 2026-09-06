import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { PageHeader, Table, Tr, Td, Button, Badge, LoadingPage, Alert, Modal, Input } from '../../components/ui';
import { Loader2, LogIn, LogOut, Video } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg] = useState('');
  const [correctModal, setCorrectModal] = useState<{ open: boolean; record: any }>({ open: false, record: null });
  const [correctForm, setCorrectForm] = useState({ checkIn: '', checkOut: '', correctionReason: '' });
  const [correcting, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [liveLaunching, setLiveLaunching] = useState(false);

  const sortAttendanceLogs = (data: any[]) => {
    return [...data].sort((a, b) => {
      const getTs = (item: any) => {
        if (item.checkIn) {
          const t = new Date(item.checkIn).getTime();
          if (!isNaN(t)) return t;
        }
        if (item.date && item.checkInTime) {
          const t = new Date(`${item.date} ${item.checkInTime}`).getTime();
          if (!isNaN(t)) return t;
        }
        if (item.createdAt) {
          const t = new Date(item.createdAt).getTime();
          if (!isNaN(t)) return t;
        }
        if (item.date) {
          const t = new Date(item.date).getTime();
          if (!isNaN(t)) return t;
        }
        return 0;
      };
      const tsA = getTs(a);
      const tsB = getTs(b);
      if (tsB !== tsA) return tsB - tsA;
      return (b.id || '').localeCompare(a.id || '');
    });
  };

  const load = async () => {
    try {
      const bioRes = await api.attendance.getBiometricLogs();
      if (bioRes.success && bioRes.data && bioRes.data.length > 0) {
        setRecords(sortAttendanceLogs(bioRes.data));
      } else {
        const params: Record<string, string> = {};
        const empId = searchParams.get('employeeId');
        if (empId) params.employeeId = empId;
        if (filterStatus) params.status = filterStatus;
        const res = await api.attendance.list(params);
        if (res.success && res.data) {
          setRecords(sortAttendanceLogs(res.data));
        }
      }
    } catch (_) { }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filterStatus]);

  // Real-time live polling every 1 second (1000ms) for instant on-screen updates
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const bioRes = await api.attendance.getBiometricLogs();
        if (isMounted && bioRes.success && bioRes.data && Array.isArray(bioRes.data)) {
          const sorted = sortAttendanceLogs(bioRes.data);
          setRecords(prev => {
            const prevStr = JSON.stringify(prev);
            const nextStr = JSON.stringify(sorted);
            if (prevStr !== nextStr) {
              return sorted;
            }
            return prev;
          });
        }
      } catch (_) { }
    }, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Strict user-wise filtering: if logged in as an EMPLOYEE, show ONLY their own entries!
  const displayedRecords = useMemo(() => {
    let result = records;

    if (user?.role === 'EMPLOYEE') {
      const userEmpNum = (user.employee?.employeeNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const userEmail = (user.employee?.email || user.email || '').toLowerCase();
      const userFirstName = (user.employee?.firstName || '').toLowerCase();

      result = result.filter(r => {
        const recEmpNum = (r.employeeNumber || r.employee?.employeeNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const recEmail = (r.email || r.employee?.email || '').toLowerCase();
        const recName = (r.name || `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`).toLowerCase();

        if (userEmpNum && recEmpNum && (userEmpNum === recEmpNum || recEmpNum.includes(userEmpNum) || userEmpNum.includes(recEmpNum))) return true;
        if (userEmail && recEmail && userEmail === recEmail) return true;
        if (userFirstName && recName.includes(userFirstName)) return true;

        return false;
      });
    }

    if (filterStatus) {
      result = result.filter(r => r.status === filterStatus);
    }

    return result;
  }, [records, user, filterStatus]);

  const toggleLiveAttendance = async () => {
    if (!liveMode) {
      setLiveLaunching(true);
      try {
        await api.attendance.launchCamera();
        toast.success('Live AI Biometric Camera launched! Press [C] to Check-In, [O] to Check-Out.');
      } catch {
        // Continue even if launcher command has background handler
      }
      setLiveLaunching(false);
      setLiveMode(true);
      load();
    } else {
      setLiveMode(false);
      toast.info('Switched to Standard Attendance mode');
      load();
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.attendance.checkIn();
      if (res.success) {
        toast.success('Successfully checked in for today!');
        load();
      } else {
        const msg = res.error?.message || 'Check-in failed';
        toast.error(msg);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Check-in error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await api.attendance.checkOut();
      if (res.success) {
        toast.success('Successfully checked out for today!');
        load();
      } else {
        const msg = res.error?.message || 'Check-out failed';
        toast.error(msg);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Check-out error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCorrect = async () => {
    setSaving(true);
    const res = await api.attendance.correct(correctModal.record.id, {
      checkIn: correctForm.checkIn ? new Date(correctForm.checkIn).toISOString() : undefined,
      checkOut: correctForm.checkOut ? new Date(correctForm.checkOut).toISOString() : undefined,
      correctionReason: correctForm.correctionReason,
      status: 'CORRECTED',
    });
    setSaving(false);
    if (res.success) {
      toast.success('Attendance record corrected successfully');
      setCorrectModal({ open: false, record: null });
      load();
    } else {
      const msg = res.error?.message || 'Failed to correct record';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={user?.role === 'EMPLOYEE' ? `My Attendance Logs (${user.employee?.firstName || 'Employee'})` : 'Attendance Logs'}
        subtitle={
          user?.role === 'EMPLOYEE'
            ? `${displayedRecords.length} biometric records for ${user.employee?.firstName || ''} ${user.employee?.lastName || ''} (${user.employee?.employeeNumber || 'EMP-001'}) • 🟢 Live Sync Active`
            : `${displayedRecords.length} biometric daily logs and exception records • 🟢 Live Sync Active (1s)`
        }
      >
        <div className="flex items-center gap-3">
          {/* Live Attendance Button: Left side of Check In */}
          <button
            onClick={toggleLiveAttendance}
            disabled={liveLaunching}
            className={`px-4 py-2 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${liveMode
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white'
              }`}
          >
            {liveLaunching ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Video size={14} className={liveMode ? 'animate-pulse text-amber-200' : 'text-emerald-200'} />
            )}
            {liveMode ? 'Exit Live Mode' : 'Live Attendance'}
          </button>

          {/* Hide Check In & Check Out buttons when Live Attendance is active */}
          {!liveMode && (
            <>
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                Check In
              </button>
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                Check Out
              </button>
            </>
          )}
        </div>
      </PageHeader>

      {liveMode && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-between text-xs text-emerald-800 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span><strong>Live AI Biometrics Active:</strong> OpenCV camera pipeline is running. Press <strong>[C]</strong> in the camera window to Check-In, or <strong>[O]</strong> to Check-Out. Logs sync in real-time.</span>
          </div>
          <button
            onClick={toggleLiveAttendance}
            className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            Stop Live Mode
          </button>
        </div>
      )}

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
          empty={displayedRecords.length === 0}
        >
          {displayedRecords.map(r => (
            <Tr key={r.id}>
              <Td>
                <div className="text-slate-900 font-bold">
                  {r.employee?.firstName ? `${r.employee.firstName} ${r.employee.lastName || ''}` : r.name || 'Employee'}
                </div>
                <div className="text-slate-500 text-xs font-mono">{r.employee?.employeeNumber || r.employeeNumber || '—'}</div>
              </Td>
              <Td className="font-semibold text-slate-800">
                {r.date ? (r.date.includes('T') ? new Date(r.date).toLocaleDateString() : r.date) : '—'}
              </Td>
              <Td className="text-xs font-mono font-semibold text-emerald-700">
                {r.checkInTime ? (
                  r.checkInTime
                ) : r.checkIn ? (
                  new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                ) : (
                  <span className="text-slate-300 font-mono text-xs">—</span>
                )}
              </Td>
              <Td className="text-xs font-mono font-semibold text-amber-700">
                {r.checkOutTime ? (
                  r.checkOutTime
                ) : r.checkOut ? (
                  new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                ) : (
                  <span className="text-slate-300 font-mono text-xs">—</span>
                )}
              </Td>
              <Td className="font-extrabold text-slate-900">
                {!r.checkOut && !r.checkOutTime && (r.checkIn || r.checkInTime) ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                    ⏳ In Progress
                  </span>
                ) : (() => {
                  let diffSec = 0;
                  if (r.checkIn && r.checkOut) {
                    const ci = new Date(r.checkIn).getTime();
                    const co = new Date(r.checkOut).getTime();
                    if (!isNaN(ci) && !isNaN(co) && co >= ci) {
                      diffSec = Math.round((co - ci) / 1000);
                    }
                  }
                  if (diffSec === 0 && r.checkInTime && r.checkOutTime && r.date) {
                    const ci = new Date(`${r.date} ${r.checkInTime}`).getTime();
                    const co = new Date(`${r.date} ${r.checkOutTime}`).getTime();
                    if (!isNaN(ci) && !isNaN(co) && co >= ci) {
                      diffSec = Math.round((co - ci) / 1000);
                    }
                  }
                  if (diffSec > 0 && diffSec < 60) {
                    return `${diffSec} sec`;
                  }
                  if (diffSec >= 60 && diffSec < 3600) {
                    return `${Math.round(diffSec / 60)} min`;
                  }
                  const hrs = Number(r.workedHours ?? 0);
                  if (hrs >= 0.1) {
                    return `${hrs.toFixed(1)} hrs`;
                  }
                  if (hrs > 0) {
                    return `${hrs.toFixed(2)} hrs`;
                  }
                  return '0.0 hrs';
                })()}
              </Td>
              <Td className="text-xs font-medium">
                {r.overtimeHours && Number(r.overtimeHours) > 0 ? (
                  <span className="text-emerald-600 font-bold">+{Number(r.overtimeHours).toFixed(1)} hrs</span>
                ) : (
                  <span className="text-slate-300 font-mono text-xs">—</span>
                )}
              </Td>
              <Td>
                <Badge variant={r.status === 'PRESENT' ? 'success' : r.status === 'CORRECTED' ? 'purple' : r.status === 'HALF_DAY' ? 'warning' : 'danger'}>
                  {r.status || 'PRESENT'}
                </Badge>
              </Td>
              <Td>
                <span className="text-slate-300 font-mono text-xs">—</span>
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
