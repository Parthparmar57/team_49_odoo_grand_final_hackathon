import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { Button, Input, Select, Alert, LoadingPage, Card } from '../../components/ui';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function EmployeeForm() {
  const { toast } = useToast();
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
      if (deptRes.success && deptRes.data) {
        const depts = Array.isArray(deptRes.data) ? deptRes.data : [];
        setDepartments(depts);
        if (depts.length > 0 && !isEdit) {
          setForm(f => ({ ...f, departmentId: f.departmentId || depts[0].id }));
        }
      }
      if (schedRes.success) setSchedules(Array.isArray(schedRes.data) ? schedRes.data : []);
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
    setError(''); setSuccess('');

    // Real-world Constraint Validations
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      const msg = 'Please enter a valid work email address (e.g. employee@company.com)';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (form.accountNumber && !/^\d{9,18}$/.test(form.accountNumber.trim())) {
      const msg = 'Bank Account Number must contain only digits (9 to 18 numbers, no letters)';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (form.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifscCode.trim())) {
      const msg = 'IFSC Code must be an 11-character code (e.g. SBIN0001234)';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (form.phone && !/^\+?[0-9\s-]{8,15}$/.test(form.phone.trim())) {
      const msg = 'Phone number must be valid (8 to 15 digits)';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (form.taxId && !/^[A-Z0-9]{5,15}$/i.test(form.taxId.trim())) {
      const msg = 'Tax ID / PAN must be 5 to 15 alphanumeric characters';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    const payload = { ...form };
    if (!payload.scheduleId) delete (payload as any).scheduleId;
    if (!payload.managerId) delete (payload as any).managerId;

    const res = isEdit
      ? await api.employees.update(id!, payload)
      : await api.employees.create(payload);

    setLoading(false);
    if (res.success) {
      const msg = isEdit ? 'Employee updated successfully!' : 'Employee created successfully!';
      setSuccess(msg);
      toast.success(msg);
      setTimeout(() => navigate('/employees'), 1200);
    } else {
      const errMsg = res.error?.message || 'Failed to save employee';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  // Real-time inline field validation errors
  const emailErr = form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? 'Must be a valid email address (e.g. alex@company.com)' : '';
  const accountNoErr = form.accountNumber && !/^\d{9,18}$/.test(form.accountNumber.trim()) ? 'Digits only (9-18 numbers). No letters allowed' : '';
  const ifscErr = form.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifscCode.trim()) ? '11-character IFSC format required (e.g. SBIN0001234)' : '';
  const phoneErr = form.phone && !/^\+?[0-9\s-]{8,15}$/.test(form.phone.trim()) ? 'Must be 8 to 15 digits' : '';
  const taxIdErr = form.taxId && !/^[A-Z0-9]{5,15}$/i.test(form.taxId.trim()) ? '5 to 15 uppercase alphanumeric characters' : '';
  const empNumErr = form.employeeNumber && !/^[a-zA-Z0-9_-]{2,30}$/.test(form.employeeNumber.trim()) ? '2 to 30 alphanumeric characters' : '';

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
            <Input label="First Name *" value={form.firstName} onChange={set('firstName')} required hint="Legal given name" />
            <Input label="Last Name *" value={form.lastName} onChange={set('lastName')} required hint="Legal family name" />
            <Input
              label="Email *"
              type="email"
              value={form.email}
              onChange={set('email')}
              error={emailErr}
              hint="Primary work email address (e.g. employee@company.com)"
              required
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={set('phone')}
              error={phoneErr}
              placeholder="+91..."
              hint="Contact number (8-15 numeric digits)"
            />
            <Input label="Address" value={form.address} onChange={set('address')} hint="Residential address" />
            <Input label="Emergency Contact" value={form.emergencyContact} onChange={set('emergencyContact')} hint="Name & contact of emergency person" />
          </div>
        </Card>

        {/* Work Info */}
        <Card className="p-6">
          <h2 className="text-slate-900 font-extrabold text-base mb-4 border-b border-slate-100 pb-3">Work Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Employee Number *"
              value={form.employeeNumber}
              onChange={set('employeeNumber')}
              error={empNumErr}
              hint="Unique employee code (e.g. EMP-101)"
              required
            />
            <Input label="Designation *" value={form.designation} onChange={set('designation')} hint="Official job title" required />
            <Input label="Joining Date *" type="date" value={form.joiningDate} onChange={set('joiningDate')} hint="Official start date" required />
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
            <Input
              label="Tax ID / PAN"
              value={form.taxId}
              onChange={set('taxId')}
              error={taxIdErr}
              hint="5 to 15 uppercase alphanumeric characters"
            />
            <Input label="Bank Name" value={form.bankName} onChange={set('bankName')} hint="Name of banking institution" />
            <Input
              label="Account Number"
              value={form.accountNumber}
              onChange={set('accountNumber')}
              error={accountNoErr}
              hint="Numeric digits only (9 to 18 numbers, no letters)"
            />
            <Input
              label="IFSC Code"
              value={form.ifscCode}
              onChange={set('ifscCode')}
              error={ifscErr}
              hint="11-character Indian Financial Code (e.g. SBIN0001234)"
            />
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
