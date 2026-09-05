import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { Button, LoadingPage, Alert, Card, EmployeeStatusBadge, ContractStatusBadge, LeaveStatusBadge, Modal } from '../../components/ui';
import { ArrowLeft, Edit, FileText, Clock, CalendarX, User, MapPin, Award } from 'lucide-react';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'overview' | 'contracts' | 'attendance' | 'leaves' | 'payslips'>('overview');
  const [showAllocationModal, setShowAllocationModal] = useState(false);

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
  const allocations = emp.leaveAllocations || emp.allocations || [];
  const contractsCount = emp.contracts?.length || 0;
  const attendanceCount = emp.attendances?.length || 0;
  const leaveRequestsCount = emp.leaveRequests?.length || 0;
  const allocationsCount = allocations.length;

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

      {/* 4 Smart Buttons with exact live database counts */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          onClick={() => setTab('contracts')}
          className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-bold transition-all shadow-2xs ${
            tab === 'contracts'
              ? 'bg-orange-50 border-orange-300 text-[#FF5E1E]'
              : 'bg-white hover:bg-orange-50 border-slate-200 text-slate-700 hover:text-[#FF5E1E]'
          }`}
        >
          <FileText size={14} className="text-[#FF5E1E]" /> Contracts ({contractsCount})
        </button>
        <button
          onClick={() => setTab('attendance')}
          className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-bold transition-all shadow-2xs ${
            tab === 'attendance'
              ? 'bg-orange-50 border-orange-300 text-[#FF5E1E]'
              : 'bg-white hover:bg-orange-50 border-slate-200 text-slate-700 hover:text-[#FF5E1E]'
          }`}
        >
          <Clock size={14} className="text-teal-600" /> Attendance ({attendanceCount})
        </button>
        <button
          onClick={() => setTab('leaves')}
          className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-bold transition-all shadow-2xs ${
            tab === 'leaves'
              ? 'bg-orange-50 border-orange-300 text-[#FF5E1E]'
              : 'bg-white hover:bg-orange-50 border-slate-200 text-slate-700 hover:text-[#FF5E1E]'
          }`}
        >
          <CalendarX size={14} className="text-purple-600" /> Time Off Requests ({leaveRequestsCount})
        </button>
        <button
          onClick={() => setShowAllocationModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl text-xs font-bold text-slate-700 hover:text-[#FF5E1E] shadow-2xs transition-all"
        >
          <Award size={14} className="text-amber-500" /> Leave Allocations ({allocationsCount})
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

      {/* Leave Allocations Modal */}
      <Modal open={showAllocationModal} onClose={() => setShowAllocationModal(false)} title={`Leave Allocations — ${emp.firstName} ${emp.lastName}`}>
        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-medium">
            Active time off allowances and remaining leave balance for this employee.
          </p>
          {allocations.length > 0 ? (
            <div className="space-y-3">
              {allocations.map((alloc: any) => {
                const allocated = alloc.allocatedAmount ?? alloc.allocatedDays ?? 0;
                const used = alloc.usedAmount ?? alloc.usedDays ?? 0;
                const remaining = alloc.remainingAmount ?? (allocated - used);
                const leaveTypeName = alloc.leaveType?.name || 'Standard Leave';

                return (
                  <div key={alloc.id || leaveTypeName} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">{leaveTypeName}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Active Allocation
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 bg-white border border-slate-200/60 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Allocated</span>
                        <span className="text-sm font-black text-slate-900">{allocated} days</span>
                      </div>
                      <div className="p-2 bg-white border border-slate-200/60 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Used</span>
                        <span className="text-sm font-black text-amber-600">{used} days</span>
                      </div>
                      <div className="p-2 bg-white border border-slate-200/60 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Remaining</span>
                        <span className="text-sm font-black text-emerald-600">{remaining} days</span>
                      </div>
                    </div>
                    {alloc.periodStart && alloc.periodEnd && (
                      <p className="text-[10px] text-slate-400 font-medium text-right pt-1">
                        Validity: {new Date(alloc.periodStart).toLocaleDateString()} – {new Date(alloc.periodEnd).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No leave allocations configured for this employee.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
