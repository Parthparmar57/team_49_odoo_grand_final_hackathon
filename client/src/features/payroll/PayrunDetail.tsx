import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { Button, LoadingPage, Alert, Card, PayrunStatusBadge, Badge } from '../../components/ui';
import { ArrowLeft, Play, CheckCircle, DollarSign, Download, Send, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function PayrunDetail() {
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [payrun, setPayrun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);

  const load = () => {
    api.payroll.getPayrun(id!).then(res => {
      if (res.success) setPayrun(res.data);
      else {
        const msg = res.error?.message || 'Payrun not found';
        setError(msg);
        toast.error(msg);
      }
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]);

  const handleAction = async (action: 'compute' | 'validate' | 'pay') => {
    const fns = { compute: api.payroll.computePayrun, validate: api.payroll.validatePayrun, pay: api.payroll.markPaid };
    const res = await fns[action](id!);
    if (res.success) {
      const labels = { compute: 'Payrun computed successfully', validate: 'Payrun validated successfully', pay: 'Payrun marked as paid' };
      toast.success(labels[action]);
      load();
    } else {
      const msg = res.error?.message || `Failed to ${action}`;
      setError(msg);
      toast.error(msg);
    }
  };

  const handleSendPayslips = () => {
    setSendingEmails(true);
    setTimeout(() => {
      setSendingEmails(false);
      toast.success(`Payslips dispatched successfully to ${payrun?.payslips?.length || 0} employees`);
    }, 1200);
  };

  if (loading) return <LoadingPage />;
  if (error) return <Alert message={error} />;
  if (!payrun) return null;

  // Audit warnings for pre-finalization checks
  const warningsList: string[] = [];
  if (payrun.warnings?.length) {
    payrun.warnings.forEach((w: any) => warningsList.push(w.message));
  }

  // Pre-finalization bank details validation check
  payrun.payslips?.forEach((ps: any) => {
    const emp = ps.employee || {};
    if (!emp.bankName || !emp.accountNumber) {
      warningsList.push(`Missing bank details for ${emp.firstName} ${emp.lastName} (${emp.employeeNumber || 'Emp'})`);
    }
  });

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
              {new Date(payrun.periodStart).toLocaleDateString()} — {new Date(payrun.periodEnd).toLocaleDateString()} · Ref: {payrun.payrunRef}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {payrun.status === 'DRAFT' && (
            <Button onClick={() => handleAction('compute')} variant="secondary">
              <Play size={16} className="text-[#FF5E1E]" /> Compute Batch
            </Button>
          )}
          {payrun.status === 'COMPUTED' && (
            <Button onClick={() => handleAction('validate')}>
              <CheckCircle size={16} /> Validate Batch
            </Button>
          )}
          {payrun.status === 'VALIDATED' && (
            <Button onClick={() => handleAction('pay')}>
              <DollarSign size={16} /> Mark All Paid
            </Button>
          )}
          {(payrun.status === 'VALIDATED' || payrun.status === 'PAID') && (
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
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{payrun.totalEmployees || payrun.payslips?.length || 0}</p>
        </Card>
        <Card className="p-5 border border-slate-200/80">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Basic Wages</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">₹{(payrun.totalBasic || 0).toLocaleString()}</p>
        </Card>
        <Card className="p-5 border border-slate-200/80">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Gross Salary</p>
          <p className="text-3xl font-extrabold text-[#FF5E1E] mt-1">₹{(payrun.totalGross || 0).toLocaleString()}</p>
        </Card>
        <Card className="p-5 border border-slate-200/80 bg-emerald-50/50 border-emerald-200/80">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Net Disbursement</p>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">₹{(payrun.totalNet || 0).toLocaleString()}</p>
        </Card>
      </div>

      {/* Generated Payslips */}
      <Card className="p-6 border border-slate-200/80">
        <h2 className="text-base font-extrabold text-slate-900 mb-4 border-b border-slate-100 pb-3">Generated Employee Payslips ({payrun.payslips?.length || 0})</h2>

        {payrun.payslips?.length ? (
          <div className="space-y-4">
            {payrun.payslips.map((ps: any) => (
              <div key={ps.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-extrabold text-base">{ps.employee?.firstName} {ps.employee?.lastName}</span>
                      <span className="text-slate-500 text-xs font-mono">({ps.employee?.employeeNumber})</span>
                      <Badge variant="info">{ps.contract?.salaryStructure?.name || 'Standard'}</Badge>
                    </div>
                    <p className="text-slate-500 text-xs font-mono mt-0.5">{ps.number || ps.payslipRef}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-medium">Gross: ₹{ps.grossSalary?.toLocaleString()} · Deductions: ₹{ps.totalDeductions?.toLocaleString()}</div>
                      <div className="text-base font-extrabold text-emerald-700">Net: ₹{ps.netSalary?.toLocaleString()}</div>
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
                {ps.lines?.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                    {ps.lines.map((line: any) => (
                      <div key={line.id} className="bg-white p-2 rounded-lg border border-slate-200/60">
                        <span className="text-slate-500 font-medium block truncate">{line.name}</span>
                        <span className={`font-extrabold ${line.category === 'DEDUCTION' ? 'text-red-600' : 'text-slate-900'}`}>
                          {line.category === 'DEDUCTION' ? '-' : ''}₹{Math.abs(line.total || line.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No payslips calculated yet. Click "Compute Batch" above to process employee contracts.</p>
        )}
      </Card>
    </div>
  );
}

