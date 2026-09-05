import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { Button, Input, Select, Alert, LoadingPage, Card } from '../../components/ui';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ContractForm() {
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    contractRef: '',
    employeeId: '',
    departmentId: '',
    scheduleId: '',
    salaryStructureId: '',
    wage: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    notes: '',
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      api.employees.list({ limit: '200' }),
      api.departments.list(),
      api.schedules.list(),
      api.payroll.structures(),
    ]).then(([empRes, deptRes, schedRes, strucRes]) => {
      const emps = empRes.success ? (empRes.data?.employees || empRes.data || []) : [];
      const depts = deptRes.success ? (Array.isArray(deptRes.data) ? deptRes.data : []) : [];
      const scheds = schedRes.success ? (Array.isArray(schedRes.data) ? schedRes.data : []) : [];
      const strucs = strucRes.success ? (Array.isArray(strucRes.data) ? strucRes.data : []) : [];

      setEmployees(emps);
      setDepartments(depts);
      setSchedules(scheds);
      setStructures(strucs);

      // Pre-select defaults for new contracts
      if (!isEdit) {
        setForm((f) => ({
          ...f,
          contractRef: f.contractRef || `CIN/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
          salaryStructureId: f.salaryStructureId || (strucs.length > 0 ? strucs[0].id : ''),
        }));
      }
    });

    if (isEdit) {
      api.contracts.get(id!).then((res) => {
        if (res.success && res.data) {
          const c = res.data;
          setForm({
            contractRef: c.contractRef || '',
            employeeId: c.employeeId || '',
            departmentId: c.departmentId || '',
            scheduleId: c.scheduleId || '',
            salaryStructureId: c.salaryStructureId || '',
            wage: String(c.wage || ''),
            startDate: c.startDate ? c.startDate.split('T')[0] : '',
            endDate: c.endDate ? c.endDate.split('T')[0] : '',
            status: c.status || 'ACTIVE',
            notes: c.notes || '',
          });
        } else {
          setError(res.error?.message || 'Failed to load contract');
        }
        setPageLoading(false);
      });
    }
  }, [id, isEdit]);

  // When Employee is selected, auto-fill department and schedule if empty
  const handleEmployeeSelect = (empId: string) => {
    const selectedEmp = employees.find((e) => e.id === empId);
    setForm((f) => ({
      ...f,
      employeeId: empId,
      departmentId: selectedEmp?.departmentId || f.departmentId,
      scheduleId: selectedEmp?.scheduleId || f.scheduleId,
    }));
  };

  const set = (field: string) => (e: any) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Real-time inline field error helpers
  const refErr = form.contractRef && form.contractRef.trim().length < 3 ? 'Contract reference must be at least 3 characters' : '';
  const wageErr = form.wage && (isNaN(parseFloat(form.wage)) || parseFloat(form.wage) <= 0) ? 'Base wage must be a positive number' : '';
  const endDateErr = form.startDate && form.endDate && form.endDate < form.startDate ? 'End date cannot be earlier than start date' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.contractRef || form.contractRef.trim().length < 3) {
      const msg = 'Contract reference is required (e.g. CON/2026/001)';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!form.employeeId) {
      const msg = 'Please select an employee';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!form.wage || isNaN(parseFloat(form.wage)) || parseFloat(form.wage) <= 0) {
      const msg = 'Monthly Base Wage must be a positive numeric amount';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!form.startDate) {
      const msg = 'Start Date is required';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (form.endDate && form.endDate < form.startDate) {
      const msg = 'End date cannot be earlier than start date';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!form.salaryStructureId) {
      const msg = 'Please select a Salary Structure';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    const payload: any = {
      ...form,
      wage: parseFloat(form.wage),
    };
    if (!payload.endDate) delete payload.endDate;
    if (!payload.departmentId) delete payload.departmentId;
    if (!payload.scheduleId) delete payload.scheduleId;
    if (!payload.salaryStructureId) delete payload.salaryStructureId;

    const res = isEdit
      ? await api.contracts.update(id!, payload)
      : await api.contracts.create(payload);

    setLoading(false);
    if (res.success) {
      const msg = isEdit ? 'Contract updated successfully!' : 'Contract created successfully!';
      setSuccess(msg);
      toast.success(msg);
      setTimeout(() => navigate('/contracts'), 1200);
    } else {
      const errMsg = res.error?.message || 'Failed to save contract';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  if (pageLoading) return <div className="p-6"><LoadingPage /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/contracts')} className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{isEdit ? 'Edit Contract' : 'Create New Contract'}</h1>
          <p className="text-slate-500 text-sm font-medium">Define employment terms, wages, and salary structure</p>
        </div>
      </div>

      {error && <Alert message={error} />}
      {success && <Alert message={success} variant="success" />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-slate-900 font-extrabold text-base mb-4 border-b border-slate-100 pb-3">Contract Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contract Reference *"
              value={form.contractRef}
              onChange={set('contractRef')}
              error={refErr}
              hint="Unique contract code (e.g. CIN/123/411)"
              placeholder="CIN/123/411"
              required
            />
            <Select
              label="Employee *"
              value={form.employeeId}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
              required
              disabled={isEdit}
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeNumber})
                </option>
              ))}
            </Select>
            <Input
              label="Monthly Base Wage (₹) *"
              type="number"
              step="0.01"
              value={form.wage}
              onChange={set('wage')}
              error={wageErr}
              hint="Base monthly salary amount"
              placeholder="50000"
              required
            />
            <Select label="Status" value={form.status} onChange={set('status')}>
              {['DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Input
              label="Start Date *"
              type="date"
              value={form.startDate}
              onChange={set('startDate')}
              hint="Effective start date of contract"
              required
            />
            <Input
              label="End Date (Leave blank if ongoing)"
              type="date"
              value={form.endDate}
              onChange={set('endDate')}
              error={endDateErr}
              hint="Contract end date (leave empty if ongoing)"
            />
            <Select label="Department" value={form.departmentId} onChange={set('departmentId')}>
              <option value="">Auto-fill from Employee</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Select label="Working Schedule" value={form.scheduleId} onChange={set('scheduleId')}>
              <option value="">None</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Select label="Salary Structure *" value={form.salaryStructureId} onChange={set('salaryStructureId')} required>
              <option value="">Select Salary Structure</option>
              {structures.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </Select>
          </div>

          <div className="mt-4">
            <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Notes / Employment Terms</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-[#FF5E1E] focus:ring-1 focus:ring-[#FF5E1E] transition-colors mt-1"
              placeholder="Enter special contract notes or terms..."
            />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={() => navigate('/contracts')}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Saving...' : 'Save Contract'}
          </Button>
        </div>
      </form>
    </div>
  );
}
