import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { Button, LoadingPage, Alert, Card, PayrunStatusBadge, Badge } from '../../components/ui';
import { ArrowLeft, Play, CheckCircle, DollarSign, Download, Send, AlertTriangle, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function PayrunDetail() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isPayrollUser = user?.role === 'HR_PAYROLL_USER';
  const { id } = useParams();
  const navigate = useNavigate();
  const [payrun, setPayrun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);

  // Search & Filter state for dedicated payrun payslips list
  const [searchQuery, setSearchQuery] = useState('');
  const [structureFilter, setStructureFilter] = useState('');
  const [salaryRangeFilter, setSalaryRangeFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const load = () => {
    setLoading(true);
    setError('');
    api.payroll.getPayrun(id!)
      .then(res => {
        if (res.success && res.data) {
          setPayrun(res.data);
        } else {
          const msg = res.error?.message || 'Payrun not found';
          setError(msg);
          toast.error(msg);
        }
        setLoading(false);
      })
      .catch(err => {
        const msg = err?.message || 'Failed to load payrun details';
        setError(msg);
        toast.error(msg);
        setLoading(false);
      });
  };

  // ALL HOOKS AT TOP LEVEL (NO EARLY RETURNS BEFORE HOOKS)
  useEffect(() => { load(); }, [id]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, structureFilter, salaryRangeFilter]);

  // Unique salary structures in this payrun
  const uniqueStructures = useMemo(() => {
    if (!payrun?.payslips || !Array.isArray(payrun.payslips)) return [];
    const map = new Map<string, string>();
    payrun.payslips.forEach((ps: any) => {
      const name = ps?.contract?.salaryStructure?.name || ps?.salaryStructure?.name || 'Standard';
      const structId = ps?.contract?.salaryStructureId || ps?.salaryStructureId || name;
      if (structId && name) {
        if (!map.has(structId)) map.set(structId, name);
      }
    });
    return Array.from(map.entries()).map(([structId, name]) => ({ id: structId, name }));
  }, [payrun]);

  const filteredPayslips = useMemo(() => {
    if (!payrun?.payslips || !Array.isArray(payrun.payslips)) return [];
    return payrun.payslips.filter((ps: any) => {
      if (!ps) return false;
      const q = (searchQuery || '').toLowerCase().trim();
      const empName = `${ps.employee?.firstName || ''} ${ps.employee?.lastName || ''}`.toLowerCase();
      const empNum = (ps.employee?.employeeNumber || '').toLowerCase();
      const ref = (ps.number || ps.payslipRef || ps.id || '').toLowerCase();
      const structName = (ps.contract?.salaryStructure?.name || ps.salaryStructure?.name || '').toLowerCase();

      const matchesSearch = !q || empName.includes(q) || empNum.includes(q) || ref.includes(q) || structName.includes(q);

      const matchesStructure =
        !structureFilter ||
        (structName && structName.toLowerCase() === structureFilter.toLowerCase()) ||
        ps.contract?.salaryStructureId === structureFilter ||
        ps.salaryStructureId === structureFilter;

      let matchesSalaryRange = true;
      const net = Number(ps.netSalary || 0);
      if (salaryRangeFilter === 'HIGH') matchesSalaryRange = net >= 50000;
      else if (salaryRangeFilter === 'MID') matchesSalaryRange = net >= 25000 && net < 50000;
      else if (salaryRangeFilter === 'LOW') matchesSalaryRange = net < 25000;

      return matchesSearch && matchesStructure && matchesSalaryRange;
    });
  }, [payrun, searchQuery, structureFilter, salaryRangeFilter]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredPayslips.length / pageSize) || 1;
  }, [filteredPayslips, pageSize]);

  const paginatedPayslips = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayslips.slice(start, start + pageSize);
  }, [filteredPayslips, currentPage, pageSize]);

  const hasActiveFilters = Boolean(searchQuery || structureFilter || salaryRangeFilter);

  const clearFilters = () => {
    setSearchQuery('');
    setStructureFilter('');
    setSalaryRangeFilter('');
  };

  const handleAction = async (action: 'compute' | 'validate' | 'pay') => {
    const fns = { compute: api.payroll.computePayrun, validate: api.payroll.validatePayrun, pay: api.payroll.markPaid };
    const res = await fns[action](id!);
    if (res.success) {
      const labels = { compute: 'Payrun computed successfully', validate: 'Payrun validated successfully', pay: 'Payrun marked as paid' };
      toast.success(labels[action]);
      load();
    } else {
      const msg = res.error?.message || `Failed to ${action}`;
      toast.error(msg);
    }
  };

  const handleSendPayslips = async () => {
    setSendingEmails(true);
    try {
      const res = await api.payroll.sendPayrunEmails(id!);
      if (res.success) {
        toast.success(res.data?.message || `Payslips dispatched successfully to ${payrun?.payslips?.length || 0} employees`);
      } else {
        toast.error(res.error?.message || 'Failed to dispatch payslip emails');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to dispatch payslip emails');
    } finally {
      setSendingEmails(false);
    }
  };

  const formatDate = (d: any) => {
    if (!d) return '—';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString();
  };

  const formatCurrency = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  // CONDITIONAL RENDERS ONLY AFTER ALL HOOKS HAVE BEEN CALLED AT THE TOP LEVEL
  if (loading) return <LoadingPage />;
  if (error || !payrun) {
    return (
      <div className="space-y-4 p-6 bg-white rounded-3xl border border-slate-200/80 m-4 shadow-sm">
        <Alert message={error || 'Payrun details could not be loaded or payrun not found.'} />
        <Button onClick={() => navigate('/payroll')}>
          <ArrowLeft size={16} /> Back to Payruns
        </Button>
      </div>
    );
  }

  // Audit warnings for pre-finalization checks
  const warningsList: string[] = [];
  if (Array.isArray(payrun.warnings)) {
    payrun.warnings.forEach((w: any) => {
      if (typeof w === 'string' && w.trim()) {
        warningsList.push(w.trim());
      } else if (w && typeof w === 'object') {
        const msg = w.message || w.warning || w.description;
        if (msg && typeof msg === 'string') warningsList.push(msg);
      }
    });
  }

  // Pre-finalization bank details validation check
  if (Array.isArray(payrun.payslips)) {
    payrun.payslips.forEach((ps: any) => {
      const emp = ps?.employee || {};
      if (emp && (!emp.bankName || !emp.accountNumber)) {
        const name = `${emp.firstName || 'Employee'} ${emp.lastName || ''}`.trim();
        warningsList.push(`Missing bank details for ${name} (${emp.employeeNumber || 'Emp'})`);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/payroll')} className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded-xl transition-all">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">{payrun.name}</h1>
              <PayrunStatusBadge status={payrun.status} />
            </div>
            <p className="text-slate-500 text-xs font-mono font-medium mt-1">
              {formatDate(payrun.periodStart)} — {formatDate(payrun.periodEnd)} · Ref: {payrun.payrunRef}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {payrun.status === 'DRAFT' && (
            <Button onClick={() => handleAction('compute')} variant="secondary">
              <Play size={16} className="text-[#FF5E1E]" /> Compute Batch
            </Button>
          )}
          {payrun.status === 'COMPUTED' && !isPayrollUser && (
            <Button onClick={() => handleAction('validate')}>
              <CheckCircle size={16} /> Validate Batch
            </Button>
          )}
          {payrun.status === 'VALIDATED' && !isPayrollUser && (
            <Button onClick={() => handleAction('pay')}>
              <DollarSign size={16} /> Mark All Paid
            </Button>
          )}
          {(payrun.status === 'VALIDATED' || payrun.status === 'PAID') && !isPayrollUser && (
            <Button variant="secondary" onClick={handleSendPayslips} disabled={sendingEmails}>
              <Send size={16} className="text-sky-600" />
              {sendingEmails ? 'Dispatching...' : 'Send Payslips'}
            </Button>
          )}
        </div>
      </div>

      {/* Warnings & Pre-Finalization Highlights */}
      {warningsList.length > 0 && (
        <Card className="p-4 border border-amber-300 bg-amber-50/70 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-amber-900">Pre-Finalization Warnings Detected ({warningsList.length})</h3>
              <ul className="text-xs text-amber-800 space-y-1 list-disc pl-4 font-medium">
                {warningsList.slice(0, 5).map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
                {warningsList.length > 5 && <li>...and {warningsList.length - 5} more item(s)</li>}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-200/80">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Employees Processed</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{payrun.payslips?.length ?? payrun._count?.payslips ?? payrun.totalEmployees ?? 0}</p>
        </Card>
        <Card className="p-5 border border-slate-200/80">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Basic Wages</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">₹{formatCurrency(payrun.totalBasic)}</p>
        </Card>
        <Card className="p-5 border border-slate-200/80">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Gross Salary</p>
          <p className="text-3xl font-extrabold text-[#FF5E1E] mt-1">₹{formatCurrency(payrun.totalGross)}</p>
        </Card>
        <Card className="p-5 border border-slate-200/80 bg-emerald-50/50 border-emerald-200/80">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Net Disbursement</p>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">₹{formatCurrency(payrun.totalNet)}</p>
        </Card>
      </div>

      {/* Generated Payslips */}
      <Card className="p-6 border border-slate-200/80">
        <h2 className="text-base font-extrabold text-slate-900 mb-4 border-b border-slate-100 pb-3">
          Generated Employee Payslips ({payrun.payslips?.length || 0})
        </h2>

        {payrun.payslips?.length ? (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search payslip by employee name, ID, or reference number..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF5E1E] transition-all placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Salary Structure Filter */}
                  {uniqueStructures.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2">
                      <Filter size={14} className="text-slate-400" />
                      <select
                        value={structureFilter}
                        onChange={e => setStructureFilter(e.target.value)}
                        className="bg-transparent text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="">All Structures</option>
                        {uniqueStructures.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Net Salary Range Filter */}
                  <select
                    value={salaryRangeFilter}
                    onChange={e => setSalaryRangeFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="">All Salary Ranges</option>
                    <option value="HIGH">High Net (≥ ₹50,000)</option>
                    <option value="MID">Mid Net (₹25,000 - ₹50,000)</option>
                    <option value="LOW">Low Net (&lt; ₹25,000)</option>
                  </select>

                  {/* Clear Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-[#FF5E1E] bg-slate-100 hover:bg-orange-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Counter Summary */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-2 border-t border-slate-200/60">
                <span>Showing <strong className="text-slate-900">{paginatedPayslips.length}</strong> of <strong className="text-slate-900">{filteredPayslips.length}</strong> filtered payslips ({payrun.payslips.length} total)</span>
                {hasActiveFilters && (
                  <span className="text-[#FF5E1E] font-bold">Filtered Results</span>
                )}
              </div>
            </div>

            {paginatedPayslips.length === 0 ? (
              <p className="text-slate-500 text-xs font-medium py-6 text-center">No generated payslips match the selected search & filter criteria.</p>
            ) : (
              paginatedPayslips.map((ps: any, index: number) => (
                <div key={ps.id || index} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-extrabold text-base">
                          {ps.employee?.firstName || 'Employee'} {ps.employee?.lastName || ''}
                        </span>
                        <span className="text-slate-500 text-xs font-mono">({ps.employee?.employeeNumber || 'Emp'})</span>
                        <Badge variant="info">{ps.contract?.salaryStructure?.name || ps.salaryStructure?.name || 'Standard'}</Badge>
                      </div>
                      <p className="text-slate-500 text-xs font-mono mt-0.5">{ps.number || ps.payslipRef || ps.id}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-500 font-medium">
                          Gross: ₹{formatCurrency(ps.grossSalary)} · Deductions: ₹{formatCurrency(ps.totalDeductions)}
                        </div>
                        <div className="text-base font-extrabold text-emerald-700">Net: ₹{formatCurrency(ps.netSalary)}</div>
                      </div>
                      <a
                        href={`/api/payroll/payslips/${ps.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white hover:bg-orange-50 text-slate-700 hover:text-[#FF5E1E] border border-slate-200 rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Download size={14} /> PDF
                      </a>
                    </div>
                  </div>

                  {/* Breakdown line items */}
                  {Array.isArray(ps.lines) && ps.lines.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                      {ps.lines.map((line: any, lIdx: number) => (
                        <div key={line.id || lIdx} className="bg-white p-2 rounded-lg border border-slate-200/60">
                          <span className="text-slate-500 font-medium block truncate">{line.name || line.code || 'Line'}</span>
                          <span className={`font-extrabold ${line.category === 'DEDUCTION' ? 'text-red-600' : 'text-slate-900'}`}>
                            {line.category === 'DEDUCTION' ? '-' : ''}₹{formatCurrency(Math.abs(Number(line.total || line.amount || 0)))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <span className="text-xs text-slate-500 font-medium">
                  Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No payslips calculated yet. Click "Compute Batch" above to process employee contracts.</p>
        )}
      </Card>
    </div>
  );
}
