import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Table, Tr, Td, Button, Badge, LoadingPage, Alert, Modal, Input } from '../../components/ui';
import { Edit, Loader2, LogIn, LogOut, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function AttendancePage() {
  const { toast } = useToast();
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
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(100);
  const [pagination, setPagination] = useState<{ total: number; page: number; limit: number; totalPages: number }>({
    total: 0,
    page: 1,
    limit: 100,
    totalPages: 1,
  });

  const load = async (targetPage = page, targetLimit = limit, targetStatus = filterStatus) => {
    setLoading(true);
    setError('');
    const params: Record<string, string> = {
      page: targetPage.toString(),
      limit: targetLimit.toString(),
    };
    const empId = searchParams.get('employeeId') || (user?.role === 'EMPLOYEE' ? (user.employee?.id || user.id) : undefined);
    if (empId) params.employeeId = empId;
    if (targetStatus) params.status = targetStatus;

    try {
      const res = await api.attendance.list(params);
      if (res.success) {
        setRecords(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        } else {
          const totalRecs = (res.data || []).length;
          setPagination({
            total: totalRecs,
            page: targetPage,
            limit: targetLimit,
            totalPages: Math.ceil(totalRecs / targetLimit) || 1,
          });
        }
      } else {
        const msg = res.error?.message || 'Failed to load attendance logs';
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to connect to server';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, limit, filterStatus);
  }, [page, limit, filterStatus]);

  const handleFilterStatusChange = (newStatus: string) => {
    setFilterStatus(newStatus);
    setPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.attendance.checkIn();
      if (res.success) {
        toast.success('Successfully checked in for today!');
        load(1, limit, filterStatus);
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
        load(1, limit, filterStatus);
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
      load(page, limit, filterStatus);
    } else {
      const msg = res.error?.message || 'Failed to correct record';
      setError(msg);
      toast.error(msg);
    }
  };

  // Helper calculation for display bounds
  const startRange = pagination.total > 0 ? (page - 1) * limit + 1 : 0;
  const endRange = Math.min(page * limit, pagination.total);

  // Generate compact page numbers list (e.g. 1 2 3 ... 185)
  const renderPageNumbers = () => {
    const totalPages = pagination.totalPages;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Attendance Logs"
        subtitle={
          pagination.total > 0
            ? `Showing records ${startRange.toLocaleString()}–${endRange.toLocaleString()} of ${pagination.total.toLocaleString()} total biometric logs`
            : 'Biometric daily logs and exception records'
        }
      >
        <div className="flex items-center gap-3">
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
        </div>
      </PageHeader>

      {actionMsg && <Alert message={actionMsg} variant={actionMsg.includes('✅') ? 'success' : 'error'} />}
      {error && <Alert message={error} />}

      {/* Filter and Page Size Toolbar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => handleFilterStatusChange(e.target.value)}
            className="bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#FF5E1E] focus:bg-white transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="CORRECTED">Corrected</option>
          </select>
        </div>

        {/* Rows per page selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rows per page:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[25, 50, 100, 250].map((pageSize) => (
              <button
                key={pageSize}
                onClick={() => handleLimitChange(pageSize)}
                className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  limit === pageSize
                    ? 'bg-white text-[#FF5E1E] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {pageSize}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingPage />
      ) : (
        <Table
          headers={['Employee', 'Date', 'Check In', 'Check Out', 'Worked Hours', 'Overtime', 'Status', 'Actions']}
          empty={records.length === 0}
        >
          {records.map((r) => (
            <Tr key={r.id}>
              <Td>
                <div className="text-slate-900 font-bold">
                  {r.employee?.firstName} {r.employee?.lastName}
                </div>
                <div className="text-slate-500 text-xs font-mono">{r.employee?.employeeNumber}</div>
              </Td>
              <Td className="font-semibold text-slate-800">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</Td>
              <Td className="text-xs font-mono text-emerald-700">
                {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </Td>
              <Td className="text-xs font-mono text-amber-700">
                {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </Td>
              <Td className="font-extrabold text-slate-900">
                {r.workedHours ? `${r.workedHours.toFixed(1)} hrs` : 'In Progress'}
              </Td>
              <Td className="text-xs font-medium text-slate-500">
                {r.overtimeHours ? `+${r.overtimeHours.toFixed(1)} hrs` : '—'}
              </Td>
              <Td>
                <Badge
                  variant={
                    r.status === 'PRESENT'
                      ? 'success'
                      : r.status === 'CORRECTED'
                      ? 'purple'
                      : r.status === 'HALF_DAY'
                      ? 'warning'
                      : 'danger'
                  }
                >
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
                    className="p-1.5 text-slate-500 hover:text-[#FF5E1E] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit size={16} />
                  </button>
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* Pagination Controls Bar */}
      {pagination.totalPages > 1 && (
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-semibold text-slate-600">
            Page <span className="font-extrabold text-slate-900">{page}</span> of{' '}
            <span className="font-extrabold text-slate-900">{pagination.totalPages}</span>{' '}
            <span className="text-slate-400">({pagination.total.toLocaleString()} total records)</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* First Page */}
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:text-[#FF5E1E] hover:border-orange-300 disabled:opacity-40 disabled:hover:text-slate-600 disabled:hover:border-slate-200 transition cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-[#FF5E1E] hover:border-orange-300 disabled:opacity-40 disabled:hover:text-slate-700 disabled:hover:border-slate-200 transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={15} /> Prev
            </button>

            {/* Numeric Page Buttons */}
            {renderPageNumbers().map((pNum, idx) => {
              if (pNum === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 text-xs font-bold text-slate-400">
                    ...
                  </span>
                );
              }

              const pVal = pNum as number;
              const isActive = pVal === page;

              return (
                <button
                  key={pVal}
                  onClick={() => setPage(pVal)}
                  className={`min-w-[32px] h-8 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                    isActive
                      ? 'bg-[#FF5E1E] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:border-orange-300 hover:text-[#FF5E1E]'
                  }`}
                >
                  {pVal}
                </button>
              );
            })}

            {/* Next Page */}
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-[#FF5E1E] hover:border-orange-300 disabled:opacity-40 disabled:hover:text-slate-700 disabled:hover:border-slate-200 transition flex items-center gap-1 cursor-pointer"
            >
              Next <ChevronRight size={15} />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setPage(pagination.totalPages)}
              disabled={page >= pagination.totalPages}
              className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:text-[#FF5E1E] hover:border-orange-300 disabled:opacity-40 disabled:hover:text-slate-600 disabled:hover:border-slate-200 transition cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      <Modal
        open={correctModal.open}
        onClose={() => setCorrectModal({ open: false, record: null })}
        title="Correct Attendance Record"
      >
        <div className="space-y-4">
          <Input
            label="Check In Time"
            type="datetime-local"
            value={correctForm.checkIn}
            onChange={(e) => setCorrectForm({ ...correctForm, checkIn: e.target.value })}
          />
          <Input
            label="Check Out Time"
            type="datetime-local"
            value={correctForm.checkOut}
            onChange={(e) => setCorrectForm({ ...correctForm, checkOut: e.target.value })}
          />
          <Input
            label="Correction Reason *"
            value={correctForm.correctionReason}
            onChange={(e) => setCorrectForm({ ...correctForm, correctionReason: e.target.value })}
            placeholder="e.g. Employee forgot to punch in"
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setCorrectModal({ open: false, record: null })}>
              Cancel
            </Button>
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
