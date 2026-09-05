import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { PageHeader, Table, Tr, Td, Button, LoadingPage, Alert, Modal, Input, Select, Card, PayrunStatusBadge } from '../../components/ui';
import { Plus, Play, CheckCircle, DollarSign, Loader2, ChevronRight } from 'lucide-react';

export default function PayrollPage() {
  const navigate = useNavigate();
  const [payruns, setPayruns] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState({
    payrunRef: '', name: '', salaryStructureId: '', periodStart: '', periodEnd: '',
  });

  const load = async () => {
    const [prRes, strRes] = await Promise.all([api.payroll.payruns(), api.payroll.structures()]);
    if (prRes.success) setPayruns(prRes.data || []);
    if (strRes.success) setStructures(strRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    const payload: any = { ...newForm };
    if (!payload.salaryStructureId) delete payload.salaryStructureId;
    if (!payload.payrunRef) payload.payrunRef = `PR-${Date.now()}`;
    const res = await api.payroll.createPayrun(payload);
    setSaving(false);
    if (res.success) { setShowNew(false); load(); }
    else setError(res.error?.message || 'Failed to create payrun');
  };

  const handleAction = async (id: string, action: 'compute' | 'validate' | 'pay') => {
    const fns = { compute: api.payroll.computePayrun, validate: api.payroll.validatePayrun, pay: api.payroll.markPaid };
    const res = await fns[action](id);
    if (res.success) load();
    else setError(res.error?.message || `Failed to ${action}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll & Payruns" subtitle="Batch salary calculation, validation, and disbursement engine">
        <Button variant="secondary" onClick={() => navigate('/payroll/structures')}>
          Salary Structures & Rules
        </Button>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> New Payrun Batch
        </Button>
      </PageHeader>


      {/* Stats Summary */}
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

      {/* Salary Structures Panel */}
      {structures.length > 0 && (
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

      {/* Payruns Table */}
      {loading ? <LoadingPage /> : (
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">Payrun Batches</h2>
          <Table
            headers={['Payrun Ref', 'Period', 'Payslips', 'Total Gross', 'Total Net', 'Status', 'Actions']}
            empty={payruns.length === 0}
          >
            {payruns.map(pr => (
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
                      <button onClick={() => handleAction(pr.id, 'compute')} className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                        <Play size={12} /> Compute
                      </button>
                    )}
                    {pr.status === 'COMPUTED' && (
                      <button onClick={() => handleAction(pr.id, 'validate')} className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                        <CheckCircle size={12} /> Validate
                      </button>
                    )}
                    {pr.status === 'VALIDATED' && (
                      <button onClick={() => handleAction(pr.id, 'pay')} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                        <DollarSign size={12} /> Mark Paid
                      </button>
                    )}
                    <button onClick={() => navigate(`/payroll/payruns/${pr.id}`)} className="p-1.5 text-slate-400 hover:text-slate-900 rounded">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      )}

      {/* New Payrun Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Create Payrun Batch">
        <div className="space-y-4">
          <Input label="Payrun Name *" value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="e.g. October 2026 Payroll" required />
          <Input label="Reference Code" value={newForm.payrunRef} onChange={e => setNewForm({ ...newForm, payrunRef: e.target.value })} placeholder="PR-2026-10 (Auto-generated if blank)" />
          <Select label="Salary Structure Override" value={newForm.salaryStructureId} onChange={e => setNewForm({ ...newForm, salaryStructureId: e.target.value })}>
            <option value="">Default (From Employee Contracts)</option>
            {structures.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Period Start *" type="date" value={newForm.periodStart} onChange={e => setNewForm({ ...newForm, periodStart: e.target.value })} required />
            <Input label="Period End *" type="date" value={newForm.periodEnd} onChange={e => setNewForm({ ...newForm, periodEnd: e.target.value })} required />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !newForm.name || !newForm.periodStart || !newForm.periodEnd}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? 'Creating...' : 'Create Payrun'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
