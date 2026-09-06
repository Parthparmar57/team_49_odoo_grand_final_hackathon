import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { PageHeader, Table, Tr, Td, Button, LoadingPage, Alert, Modal, Input, Select, Card, PayrunStatusBadge } from '../../components/ui';
import { Plus, Play, CheckCircle, DollarSign, Loader2, ChevronRight, Search, Filter, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function PayrollPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isPayrollUser = user?.role === 'HR_PAYROLL_USER';
  const navigate = useNavigate();
  const [payruns, setPayruns] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'payruns' | 'payslips'>('payruns');
  const [allPayslips, setAllPayslips] = useState<any[]>([]);
  const [payslipSearch, setPayslipSearch] = useState('');
  const [payslipStructureFilter, setPayslipStructureFilter] = useState('');
  const [payslipStatusFilter, setPayslipStatusFilter] = useState('');
  const [payrunSearch, setPayrunSearch] = useState('');
  const [payrunStatusFilter, setPayrunStatusFilter] = useState('');
  const [newForm, setNewForm] = useState({
    payrunRef: '', name: '', salaryStructureId: '', periodStart: '', periodEnd: '',
  });

  const load = async () => {
    const [prRes, strRes, empRes, deptRes, psRes] = await Promise.all([
      api.payroll.payruns(),
      api.payroll.structures(),
      api.employees.list({ limit: '500', status: 'ACTIVE' }),
      api.departments.list(),
      api.payroll.payslips(),
    ]);
    if (prRes.success) setPayruns(prRes.data || []);
    if (strRes.success) setStructures(strRes.data || []);
    if (empRes.success) {
      const activeEmps = empRes.data?.employees || empRes.data || [];
      setEmployeesList(activeEmps);
      setSelectedEmployeeIds(activeEmps.map((e: any) => e.id));
    }
    if (deptRes.success) setDepartments(deptRes.data || []);
    if (psRes.success) setAllPayslips(psRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleOpenWizard = () => {
    setWizardStep(1);
    setNewForm({ payrunRef: `PR-${Date.now().toString().slice(-6)}`, name: '', salaryStructureId: '', periodStart: '', periodEnd: '' });
    setSelectedEmployeeIds(employeesList.map(e => e.id));
    setShowNew(true);
  };

  const handleCreate = async () => {
    setSaving(true);
    const payload: any = {
      ...newForm,
      employeeIds: selectedEmployeeIds,
    };
    if (!payload.salaryStructureId) delete payload.salaryStructureId;
    const res = await api.payroll.createPayrun(payload);
    setSaving(false);
    if (res.success) {
      toast.success('Payrun batch created successfully');
      setShowNew(false);
      navigate(`/payroll/payruns/${res.data.id}`);
    } else {
      const msg = res.error?.message || 'Failed to create payrun';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleAction = async (id: string, action: 'compute' | 'validate' | 'pay') => {
    const fns = { compute: api.payroll.computePayrun, validate: api.payroll.validatePayrun, pay: api.payroll.markPaid };
    const res = await fns[action](id);
    if (res.success) {
      const labels = { compute: 'Payrun computed', validate: 'Payrun validated', pay: 'Payrun marked as paid' };
      toast.success(labels[action]);
      load();
    } else {
      const msg = res.error?.message || `Failed to ${action}`;
      setError(msg);
      toast.error(msg);
    }
  };

  const filteredStaff = employeesList.filter(e => {
    const nameMatches = `${e.firstName} ${e.lastName} ${e.employeeNumber}`.toLowerCase().includes(empSearch.toLowerCase());
    const deptMatches = !empDeptFilter || e.departmentId === empDeptFilter || e.department?.id === empDeptFilter;
    return nameMatches && deptMatches;
  });

  const filteredPayruns = useMemo(() => {
    return payruns.filter(pr => {
      const q = payrunSearch.toLowerCase().trim();
      const name = (pr.name || '').toLowerCase();
      const ref = (pr.payrunRef || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || ref.includes(q);
      const matchesStatus = !payrunStatusFilter || pr.status === payrunStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payruns, payrunSearch, payrunStatusFilter]);

  const hasPayrunActiveFilters = Boolean(payrunSearch || payrunStatusFilter);

  const clearPayrunFilters = () => {
    setPayrunSearch('');
    setPayrunStatusFilter('');
  };

  const filteredPayslips = useMemo(() => {
    return allPayslips.filter(ps => {
      const searchLower = payslipSearch.toLowerCase().trim();
      const empName = `${ps.employee?.firstName || ''} ${ps.employee?.lastName || ''}`.toLowerCase();
      const empNum = (ps.employee?.employeeNumber || '').toLowerCase();
      const ref = (ps.number || ps.payslipRef || ps.id || '').toLowerCase();
      const structName = (ps.contract?.salaryStructure?.name || ps.salaryStructure?.name || '').toLowerCase();

      const matchesSearch =
        !searchLower ||
        empName.includes(searchLower) ||
        empNum.includes(searchLower) ||
        ref.includes(searchLower) ||
        structName.includes(searchLower);

      const matchesStructure =
        !payslipStructureFilter ||
        ps.contract?.salaryStructureId === payslipStructureFilter ||
        ps.salaryStructureId === payslipStructureFilter;

      const matchesStatus = !payslipStatusFilter || ps.status === payslipStatusFilter;

      return matchesSearch && matchesStructure && matchesStatus;
    });
  }, [allPayslips, payslipSearch, payslipStructureFilter, payslipStatusFilter]);

  const toggleSelectAll = () => {
    if (selectedEmployeeIds.length === filteredStaff.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(filteredStaff.map(e => e.id));
    }
  };

  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll & Payslips" subtitle="Batch salary calculation, validation, and disbursement engine">
        <Button variant="secondary" onClick={() => navigate('/payroll/structures')}>
          Salary Structures & Rules
        </Button>
        {!isPayrollUser && (
          <Button onClick={handleOpenWizard}>
            <Plus size={16} /> New Payrun Batch
          </Button>
        )}
      </PageHeader>

      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('payruns')}
          className={`pb-3 font-extrabold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'payruns' ? 'border-[#FF5E1E] text-[#FF5E1E]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payrun Batches ({payruns.length})
        </button>
        <button
          onClick={() => setActiveTab('payslips')}
          className={`pb-3 font-extrabold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'payslips' ? 'border-[#FF5E1E] text-[#FF5E1E]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Dedicated Payslips List View ({allPayslips.length})
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Draft', count: payruns.filter(p => p.status === 'DRAFT').length, color: 'bg-slate-50 text-slate-700 border-slate-200' },
          { label: 'Computed', count: payruns.filter(p => p.status === 'COMPUTED').length, color: 'bg-sky-50 text-sky-700 border-sky-200' },
          { label: 'Validated', count: payruns.filter(p => p.status === 'VALIDATED').length, color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { label: 'Paid', count: payruns.filter(p => p.status === 'PAID').length, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        ].map(s => (
          <Card key={s.label} className={`p-4 border ${s.color}`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">{s.label} Payruns</p>
            <p className="text-2xl font-extrabold mt-1">{s.count}</p>
          </Card>
        ))}
      </div>

      {error && <Alert message={error} />}

      {structures.length > 0 && activeTab === 'payruns' && (
        <Card className="p-5 border border-slate-200/80">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">Configured Salary Structures</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {structures.map(str => (
              <div key={str.id} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-slate-900 font-bold text-sm">{str.name}</span>
                  <span className="text-xs font-mono font-bold text-[#FF5E1E] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">{str.code}</span>
                </div>
                <p className="text-slate-500 text-xs mt-1">{str.rules?.length || str._count?.rules || 0} Salary Rules (BASIC, HRA, PF, TAX)</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading ? <LoadingPage /> : activeTab === 'payruns' ? (
        <div className="space-y-4">
          {/* Payrun Batches Search & Filter Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search payrun batch by name or reference number..."
                  value={payrunSearch}
                  onChange={e => setPayrunSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF5E1E] focus:bg-white transition-all placeholder:text-slate-400"
                />
                {payrunSearch && (
                  <button
                    onClick={() => setPayrunSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Filter size={14} className="text-slate-400" />
                  <select
                    value={payrunStatusFilter}
                    onChange={e => setPayrunStatusFilter(e.target.value)}
                    className="bg-transparent text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="COMPUTED">Computed</option>
                    <option value="VALIDATED">Validated</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>

                {hasPayrunActiveFilters && (
                  <button
                    onClick={clearPayrunFilters}
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-[#FF5E1E] bg-slate-100 hover:bg-orange-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Counter Summary */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mt-3 pt-3 border-t border-slate-100">
              <span>Showing <strong className="text-slate-900">{filteredPayruns.length}</strong> of <strong className="text-slate-900">{payruns.length}</strong> payrun batches</span>
              {hasPayrunActiveFilters && (
                <span className="text-[#FF5E1E] font-bold">Filtered Results</span>
              )}
            </div>
          </div>

          <Table
            headers={['Payrun Ref', 'Period', 'Payslips', 'Total Gross', 'Total Net', 'Status', 'Actions']}
            empty={filteredPayruns.length === 0}
          >
            {filteredPayruns.map(pr => (
              <Tr key={pr.id} onClick={() => navigate(`/payroll/payruns/${pr.id}`)}>
                <Td>
                  <div className="text-slate-900 font-extrabold">{pr.name}</div>
                  <div className="text-xs font-mono text-[#FF5E1E] font-bold">{pr.payrunRef}</div>
                </Td>
                <Td className="text-xs font-medium text-slate-600">
                  {new Date(pr.periodStart).toLocaleDateString()} — {new Date(pr.periodEnd).toLocaleDateString()}
                </Td>
                <Td className="font-bold text-slate-800">{pr.totalEmployees || pr.payslips?.length || 0}</Td>
                <Td className="font-semibold text-slate-700">₹{(pr.totalGross || 0).toLocaleString()}</Td>
                <Td className="font-extrabold text-emerald-700">₹{(pr.totalNet || 0).toLocaleString()}</Td>
                <Td><PayrunStatusBadge status={pr.status} /></Td>
                <Td>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {pr.status === 'DRAFT' && (
                      <button onClick={() => handleAction(pr.id, 'compute')} className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                        <Play size={12} /> Compute
                      </button>
                    )}
                    {pr.status === 'COMPUTED' && !isPayrollUser && (
                      <button onClick={() => handleAction(pr.id, 'validate')} className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                        <CheckCircle size={12} /> Validate
                      </button>
                    )}
                    {pr.status === 'VALIDATED' && !isPayrollUser && (
                      <button onClick={() => handleAction(pr.id, 'pay')} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                        <DollarSign size={12} /> Mark Paid
                      </button>
                    )}
                    <button onClick={() => navigate(`/payroll/payruns/${pr.id}`)} className="p-1.5 text-slate-400 hover:text-slate-900 rounded cursor-pointer">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Payslip Search & Filter Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search payslips by employee name, EMP ID, or payslip #..."
                  value={payslipSearch}
                  onChange={e => setPayslipSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF5E1E] focus:bg-white transition-all placeholder:text-slate-400"
                />
                {payslipSearch && (
                  <button
                    onClick={() => setPayslipSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Structure Filter Dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Filter size={14} className="text-slate-400" />
                  <select
                    value={payslipStructureFilter}
                    onChange={e => setPayslipStructureFilter(e.target.value)}
                    className="bg-transparent text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="">All Salary Structures</option>
                    {structures.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter Dropdown */}
                <select
                  value={payslipStatusFilter}
                  onChange={e => setPayslipStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="COMPUTED">Computed</option>
                  <option value="DRAFT">Draft</option>
                  <option value="VALIDATED">Validated</option>
                </select>

                {/* Clear Filters Button */}
                {(payslipSearch || payslipStructureFilter || payslipStatusFilter) && (
                  <button
                    onClick={() => {
                      setPayslipSearch('');
                      setPayslipStructureFilter('');
                      setPayslipStatusFilter('');
                    }}
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-[#FF5E1E] bg-slate-100 hover:bg-orange-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Results Count Summary */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mt-3 pt-3 border-t border-slate-100">
              <span>Showing <strong className="text-slate-900">{filteredPayslips.length}</strong> of <strong className="text-slate-900">{allPayslips.length}</strong> total payslips</span>
              {(payslipSearch || payslipStructureFilter || payslipStatusFilter) && (
                <span className="text-[#FF5E1E] font-bold">Filtered Results</span>
              )}
            </div>
          </div>

          <Table
            headers={['Payslip #', 'Employee', 'Structure', 'Period', 'Gross Salary', 'Total Deductions', 'Net Salary', 'PDF']}
            empty={filteredPayslips.length === 0}
          >
            {filteredPayslips.map(ps => (
              <Tr key={ps.id}>
                <Td className="font-mono text-xs font-bold text-[#FF5E1E]">{ps.number || ps.payslipRef || ps.id.slice(0, 8)}</Td>
                <Td>
                  <div className="font-extrabold text-slate-900">{ps.employee?.firstName} {ps.employee?.lastName}</div>
                  <div className="text-xs text-slate-400 font-mono">{ps.employee?.employeeNumber}</div>
                </Td>
                <Td className="text-xs font-semibold text-slate-700">{ps.contract?.salaryStructure?.name || ps.salaryStructure?.name || 'Regular Salary'}</Td>
                <Td className="text-xs text-slate-500 font-medium">{new Date(ps.periodStart).toLocaleDateString()} — {new Date(ps.periodEnd).toLocaleDateString()}</Td>
                <Td className="font-semibold text-slate-800">₹{(ps.grossSalary || 0).toLocaleString()}</Td>
                <Td className="text-red-600 font-semibold">-₹{(ps.totalDeductions || 0).toLocaleString()}</Td>
                <Td className="font-extrabold text-emerald-700">₹{(ps.netSalary || 0).toLocaleString()}</Td>
                <Td>
                  <a
                    href={`/api/payroll/payslips/${ps.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-white hover:bg-orange-50 text-slate-700 hover:text-[#FF5E1E] border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1"
                  >
                    PDF
                  </a>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title={`Payrun Setup Wizard — Step ${wizardStep} of 2`}>
        {wizardStep === 1 ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-medium border-b border-slate-100 pb-2">
              Define payroll batch scope, reference code, structure override, and execution period.
            </p>
            <Input
              label="Payrun Name *"
              value={newForm.name}
              onChange={e => setNewForm({ ...newForm, name: e.target.value })}
              placeholder="e.g. September 2026 Regular Payroll"
              required
            />
            <Input
              label="Reference Code"
              value={newForm.payrunRef}
              onChange={e => setNewForm({ ...newForm, payrunRef: e.target.value })}
              placeholder="PR-2026-09"
            />
            <Select
              label="Salary Structure Scope"
              value={newForm.salaryStructureId}
              onChange={e => setNewForm({ ...newForm, salaryStructureId: e.target.value })}
            >
              <option value="">Default (Auto-resolve from Employee Contracts)</option>
              {structures.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Period Start *"
                type="date"
                value={newForm.periodStart}
                onChange={e => setNewForm({ ...newForm, periodStart: e.target.value })}
                required
              />
              <Input
                label="Period End *"
                type="date"
                value={newForm.periodEnd}
                onChange={e => setNewForm({ ...newForm, periodEnd: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button
                onClick={() => setWizardStep(2)}
                disabled={!newForm.name || !newForm.periodStart || !newForm.periodEnd}
              >
                Continue to Staff Selection <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-medium border-b border-slate-100 pb-2">
              Filter and select eligible employees to include in this payroll batch processing.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Search staff name or #..."
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
              />
              <select
                value={empDeptFilter}
                onChange={e => setEmpDeptFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs font-bold">
              <span>{selectedEmployeeIds.length} of {filteredStaff.length} employees selected</span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-[#FF5E1E] hover:underline cursor-pointer"
              >
                {selectedEmployeeIds.length === filteredStaff.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2">
              {filteredStaff.map(emp => {
                const isSelected = selectedEmployeeIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleEmployee(emp.id)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                      isSelected ? 'bg-orange-50/60 border-orange-200 text-slate-900' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-[#FF5E1E] focus:ring-[#FF5E1E]"
                      />
                      <span className="font-bold">{emp.firstName} {emp.lastName}</span>
                      <span className="text-slate-400 font-mono">({emp.employeeNumber})</span>
                    </div>
                    <span className="text-slate-500 font-medium">{emp.department?.name || 'General'}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setWizardStep(1)}>
                ← Back to Scope
              </Button>
              <Button onClick={handleCreate} disabled={saving || selectedEmployeeIds.length === 0}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {saving ? 'Initializing...' : `Create Payrun (${selectedEmployeeIds.length} Staff)`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
