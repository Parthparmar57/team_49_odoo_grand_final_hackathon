import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { Button, LoadingPage, Alert, Card, EmployeeStatusBadge, ContractStatusBadge, LeaveStatusBadge } from '../../components/ui';
import { ArrowLeft, Edit, FileText, Clock, CalendarX, User, MapPin } from 'lucide-react';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'overview' | 'contracts' | 'attendance' | 'leaves' | 'payslips'>('overview');

  useEffect(() => {
    api.employees.get(id!).then(res => {
      if (res.success) setEmployee(res.data);
      else setError(res.error?.message || 'Employee not found');
      setLoading(false);
    });
  }, [id]);

  if (loading) return <LoadingPage />;
  if (error) return <Alert message={error} />;

  const emp = employee;
  const tabs = ['overview', 'contracts', 'attendance', 'leaves', 'payslips'] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/employees')} className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded-xl transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5E1E] to-[#FF8038] flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-xl font-extrabold">{emp.firstName?.[0]}{emp.lastName?.[0]}</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{emp.firstName} {emp.lastName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-600 text-sm font-semibold">{emp.designation}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 text-sm font-semibold">{emp.department?.name}</span>
                <EmployeeStatusBadge status={emp.status} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate(`/employees/${id}/edit`)} variant="secondary">
            <Edit size={16} /> Edit Profile
          </Button>
        </div>
      </div>

      {/* Quick navigation links */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => navigate('/contracts?employeeId=' + id)} className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl text-xs font-bold text-slate-700 hover:text-[#FF5E1E] shadow-xs transition-all">
          <FileText size={14} className="text-[#FF5E1E]" /> View Contracts
        </button>
        <button onClick={() => navigate('/attendance?employeeId=' + id)} className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl text-xs font-bold text-slate-700 hover:text-[#FF5E1E] shadow-xs transition-all">
          <Clock size={14} className="text-teal-600" /> Attendance History
        </button>
        <button onClick={() => navigate('/leave?employeeId=' + id)} className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl text-xs font-bold text-slate-700 hover:text-[#FF5E1E] shadow-xs transition-all">
          <CalendarX size={14} className="text-purple-600" /> Time Off Requests
        </button>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200">
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider capitalize transition-all border-b-2 ${tab === t ? 'border-[#FF5E1E] text-[#FF5E1E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-slate-900 font-extrabold text-base mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User size={18} className="text-[#FF5E1E]" /> Personal Details
            </h3>
            <dl className="space-y-3.5">
              {[
                ['Email', emp.email],
                ['Phone', emp.phone || '—'],
                ['Employee #', emp.employeeNumber],
                ['Joining Date', new Date(emp.joiningDate).toLocaleDateString()],
                ['Employment Type', emp.employmentType?.replace('_', ' ')],
                ['Manager', emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : '—'],
                ['Schedule', emp.schedule?.name || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <dt className="text-slate-500 font-medium">{label}</dt>
                  <dd className="text-slate-900 font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-6">
            <h3 className="text-slate-900 font-extrabold text-base mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin size={18} className="text-[#FF5E1E]" /> Financial & Emergency Contact
            </h3>
            <dl className="space-y-3.5">
              {[
                ['Bank', emp.bankName || '—'],
                ['Account No.', emp.accountNumber || '—'],
                ['IFSC Code', emp.ifscCode || '—'],
                ['Tax ID', emp.taxId || '—'],
                ['Address', emp.address || '—'],
                ['Emergency Contact', emp.emergencyContact || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <dt className="text-slate-500 font-medium">{label}</dt>
                  <dd className="text-slate-900 font-bold max-w-xs text-right truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      )}

      {tab === 'contracts' && (
        <Card className="p-6">
          <h3 className="text-slate-900 font-extrabold text-base mb-4">Contracts ({emp.contracts?.length || 0})</h3>
          {emp.contracts?.length ? (
            <div className="space-y-3">
              {emp.contracts.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div>
                    <p className="text-slate-900 font-bold text-sm">{c.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{new Date(c.startDate).toLocaleDateString()} — {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Indefinite'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-900 font-extrabold text-sm">₹{c.wage?.toLocaleString()} / mo</span>
                    <ContractStatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-500 text-sm">No contracts found for this employee.</p>}
        </Card>
      )}

      {tab === 'attendance' && (
        <Card className="p-6">
          <h3 className="text-slate-900 font-extrabold text-base mb-4">Attendance Logs ({emp.attendances?.length || 0})</h3>
          {emp.attendances?.length ? (
            <div className="space-y-3">
              {emp.attendances.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div>
                    <p className="text-slate-900 font-bold text-sm">{a.date ? new Date(a.date).toLocaleDateString() : '—'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">In: {a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '—'} | Out: {a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '—'}</p>
                  </div>
                  <span className="text-slate-900 font-extrabold text-sm">{a.workedHours ? `${a.workedHours.toFixed(1)} hrs` : 'In Progress'}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-500 text-sm">No attendance records found.</p>}
        </Card>
      )}

      {tab === 'leaves' && (
        <Card className="p-6">
          <h3 className="text-slate-900 font-extrabold text-base mb-4">Time Off Requests ({emp.leaveRequests?.length || 0})</h3>
          {emp.leaveRequests?.length ? (
            <div className="space-y-3">
              {emp.leaveRequests.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div>
                    <p className="text-slate-900 font-bold text-sm">{l.leaveType?.name || 'Leave'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()} ({l.duration} days)</p>
                  </div>
                  <LeaveStatusBadge status={l.status} />
                </div>
              ))}
            </div>
          ) : <p className="text-slate-500 text-sm">No leave requests found.</p>}
        </Card>
      )}

      {tab === 'payslips' && (
        <Card className="p-6">
          <h3 className="text-slate-900 font-extrabold text-base mb-4">Payslips ({emp.payslips?.length || 0})</h3>
          {emp.payslips?.length ? (
            <div className="space-y-3">
              {emp.payslips.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div>
                    <p className="text-slate-900 font-bold text-sm">{p.number || 'Payslip'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{new Date(p.periodStart).toLocaleDateString()} — {new Date(p.periodEnd).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-900 font-extrabold text-sm">Net: ₹{p.netSalary?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-500 text-sm">No payslips generated yet.</p>}
        </Card>
      )}
    </div>
  );
}
