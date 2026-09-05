import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { Button, Input, Select, Alert, LoadingPage, Card } from '../../components/ui';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    employeeNumber: '', designation: '', joiningDate: '',
    employmentType: 'FULL_TIME', status: 'ACTIVE',
    departmentId: '', scheduleId: '', managerId: '',
    address: '', emergencyContact: '', taxId: '',
    bankName: '', accountNumber: '', ifscCode: '',
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      api.departments.list(),
      api.schedules.list(),
      api.employees.list({ limit: '100' }),
    ]).then(([deptRes, schedRes, empRes]) => {
      if (deptRes.success) setDepartments(deptRes.data || []);
      if (schedRes.success) setSchedules(schedRes.data || []);
      if (empRes.success) setEmployees((empRes.data?.employees || empRes.data || []).filter((e: any) => e.id !== id));
    });

    if (isEdit) {
      api.employees.get(id!).then(res => {
        if (res.success && res.data) {
          const e = res.data;
          setForm({
            firstName: e.firstName || '',
            lastName: e.lastName || '',
            email: e.email || '',
            phone: e.phone || '',
            employeeNumber: e.employeeNumber || '',
            designation: e.designation || '',
            joiningDate: e.joiningDate ? e.joiningDate.split('T')[0] : '',
            employmentType: e.employmentType || 'FULL_TIME',
            status: e.status || 'ACTIVE',
            departmentId: e.departmentId || '',
            scheduleId: e.scheduleId || '',
            managerId: e.managerId || '',
            address: e.address || '',
            emergencyContact: e.emergencyContact || '',
            taxId: e.taxId || '',
            bankName: e.bankName || '',
            accountNumber: e.accountNumber || '',
            ifscCode: e.ifscCode || '',
          });
        } else setError(res.error?.message || 'Failed to load employee');
        setPageLoading(false);
      });
    }
  }, [id, isEdit]);

  const set = (field: string) => (e: any) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(''); setSuccess('');

    const payload = { ...form };
    if (!payload.scheduleId) delete (payload as any).scheduleId;
    if (!payload.managerId) delete (payload as any).managerId;

    const res = isEdit
      ? await api.employees.update(id!, payload)
      : await api.employees.create(payload);

    setLoading(false);
    if (res.success) {
      setSuccess(isEdit ? 'Employee updated successfully' : 'Employee created successfully');
      setTimeout(() => navigate('/employees'), 1200);
    } else {
      setError(res.error?.message || 'Failed to save employee');
    }
  };

  if (pageLoading) return <div className="p-6"><LoadingPage /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/employees')} className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{isEdit ? 'Edit Employee' : 'Add New Employee'}</h1>
          <p className="text-slate-500 text-sm font-medium">Fill in the essential employee details below</p>
        </div>
      </div>

      {error && <Alert message={error} />}
      {success && <Alert message={success} variant="success" />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <Card className="p-6">
          <h2 className="text-slate-900 font-extrabold text-base mb-4 border-b border-slate-100 pb-3">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name *" value={form.firstName} onChange={set('firstName')} required />
            <Input label="Last Name *" value={form.lastName} onChange={set('lastName')} required />
            <Input label="Email *" type="email" value={form.email} onChange={set('email')} required />
            <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+91..." />
            <Input label="Address" value={form.address} onChange={set('address')} />
            <Input label="Emergency Contact" value={form.emergencyContact} onChange={set('emergencyContact')} />
          </div>
        </Card>

        {/* Work Info */}
        <Card className="p-6">
          <h2 className="text-slate-900 font-extrabold text-base mb-4 border-b border-slate-100 pb-3">Work Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Employee Number *" value={form.employeeNumber} onChange={set('employeeNumber')} required />
            <Input label="Designation *" value={form.designation} onChange={set('designation')} required />
            <Input label="Joining Date *" type="date" value={form.joiningDate} onChange={set('joiningDate')} required />
            <Select label="Employment Type" value={form.employmentType} onChange={set('employmentType')}>
              {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'].map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </Select>
            <Select label="Status" value={form.status} onChange={set('status')}>
              {['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </Select>
            <Select label="Department *" value={form.departmentId} onChange={set('departmentId')} required>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Select label="Working Schedule" value={form.scheduleId} onChange={set('scheduleId')}>
              <option value="">None</option>
              {schedules.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select label="Manager" value={form.managerId} onChange={set('managerId')}>
              <option value="">None</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </Select>
          </div>
        </Card>

        {/* Financial Info */}
        <Card className="p-6">
          <h2 className="text-slate-900 font-extrabold text-base mb-4 border-b border-slate-100 pb-3">Financial & Tax Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Tax ID / PAN" value={form.taxId} onChange={set('taxId')} />
            <Input label="Bank Name" value={form.bankName} onChange={set('bankName')} />
            <Input label="Account Number" value={form.accountNumber} onChange={set('accountNumber')} />
            <Input label="IFSC Code" value={form.ifscCode} onChange={set('ifscCode')} />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={() => navigate('/employees')}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Saving...' : 'Save Employee'}
          </Button>
        </div>
      </form>
    </div>
  );
}
