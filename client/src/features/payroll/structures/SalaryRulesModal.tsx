import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, Alert, Badge } from '../../../components/ui';
import { Plus, Edit2, Trash2, Loader2, Code, ArrowLeft } from 'lucide-react';
import api from '../../../api/client';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

interface SalaryRulesModalProps {
  open: boolean;
  onClose: () => void;
  structure: any;
  onRefresh: () => void;
}

export const SalaryRulesModal: React.FC<SalaryRulesModalProps> = ({
  open,
  onClose,
  structure,
  onRefresh,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isPayrollUser = user?.role === 'HR_PAYROLL_USER';
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);

  const [ruleForm, setRuleForm] = useState({
    name: '',
    code: '',
    category: 'ALLOWANCE',
    sequence: 10,
    computationMethod: 'FIXED',
    amount: '',
    percentage: '',
    percentageBasedOn: 'BASIC',
    formula: '',
    active: true,
  });

  const loadStructureDetails = async () => {
    if (!structure?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.payroll.getStructure(structure.id);
      if (res.success && res.data) {
        const sortedRules = (res.data.rules || []).sort((a: any, b: any) => a.sequence - b.sequence);
        setRules(sortedRules);
      } else {
        setError(res.error?.message || 'Failed to load structure rules');
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && structure?.id) {
      loadStructureDetails();
      setShowRuleForm(false);
      setEditingRule(null);
    }
  }, [open, structure]);

  const handleOpenAddForm = () => {
    const nextSeq = rules.length > 0 ? Math.max(...rules.map((r) => r.sequence)) + 10 : 10;
    setEditingRule(null);
    setRuleForm({
      name: '',
      code: '',
      category: 'ALLOWANCE',
      sequence: nextSeq,
      computationMethod: 'FIXED',
      amount: '',
      percentage: '',
      percentageBasedOn: 'BASIC',
      formula: '',
      active: true,
    });
    setShowRuleForm(true);
    setError('');
  };

  const handleOpenEditForm = (rule: any) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name || '',
      code: rule.code || '',
      category: rule.category || 'BASIC',
      sequence: rule.sequence || 10,
      computationMethod: rule.computationMethod || 'FIXED',
      amount: rule.amount !== null && rule.amount !== undefined ? String(rule.amount) : '',
      percentage: rule.percentage !== null && rule.percentage !== undefined ? String(rule.percentage) : '',
      percentageBasedOn: rule.percentageBasedOn || 'BASIC',
      formula: rule.formula || '',
      active: rule.active !== undefined ? rule.active : true,
    });
    setShowRuleForm(true);
    setError('');
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.name.trim() || !ruleForm.code.trim()) {
      const msg = 'Rule Name and Code are required';
      setError(msg);
      toast.error(msg);
      return;
    }

    setSaving(true);
    setError('');

    const payload: any = {
      name: ruleForm.name.trim(),
      code: ruleForm.code.trim().toUpperCase(),
      category: ruleForm.category,
      sequence: parseInt(String(ruleForm.sequence)) || 10,
      computationMethod: ruleForm.computationMethod,
      active: ruleForm.active,
    };

    if (ruleForm.computationMethod === 'FIXED') {
      payload.amount = parseFloat(ruleForm.amount) || 0;
    } else if (ruleForm.computationMethod === 'PERCENTAGE') {
      payload.percentage = parseFloat(ruleForm.percentage) || 0;
      payload.percentageBasedOn = ruleForm.percentageBasedOn || 'BASIC';
    } else if (ruleForm.computationMethod === 'FORMULA') {
      payload.formula = ruleForm.formula;
    }

    try {
      const res = editingRule
        ? await api.payroll.updateRule(structure.id, editingRule.id, payload)
        : await api.payroll.createRule(structure.id, payload);

      if (res.success) {
        const msg = editingRule ? 'Rule updated successfully' : 'Rule added successfully';
        setSuccessMsg(msg);
        toast.success(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
        setShowRuleForm(false);
        setEditingRule(null);
        await loadStructureDetails();
        onRefresh();
      } else {
        const msg = res.error?.message || 'Failed to save salary rule';
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err?.message || 'An error occurred while saving rule';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this salary rule?')) return;
    setSaving(true);
    try {
      const res = await api.payroll.deleteRule(structure.id, ruleId);
      if (res.success) {
        const msg = 'Rule deleted successfully';
        setSuccessMsg(msg);
        toast.success(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
        await loadStructureDetails();
        onRefresh();
      } else {
        const msg = res.error?.message || 'Failed to delete rule';
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err?.message || 'Error deleting rule';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'BASIC':
        return <Badge variant="info">BASIC</Badge>;
      case 'ALLOWANCE':
        return <Badge variant="success">ALLOWANCE</Badge>;
      case 'GROSS':
        return <Badge variant="purple">GROSS</Badge>;
      case 'DEDUCTION':
        return <Badge variant="danger">DEDUCTION</Badge>;
      case 'NET':
        return <Badge variant="orange">NET</Badge>;
      default:
        return <Badge>{cat}</Badge>;
    }
  };

  const insertFormulaChip = (chip: string) => {
    setRuleForm((prev) => ({
      ...prev,
      formula: prev.formula ? `${prev.formula} ${chip}` : chip,
    }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="max-w-4xl"
      title={`Rules Configuration — ${structure?.name || ''} (${structure?.code || ''})`}
    >
      <div className="space-y-5">
        {error && <Alert message={error} variant="error" />}
        {successMsg && <Alert message={successMsg} variant="success" />}

        {/* Action Header Banner */}
        {!showRuleForm && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-to-r from-slate-50 to-orange-50/40 p-4 rounded-2xl border border-slate-200/80 gap-3">
            <div>
              <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                Execution Sequence Engine
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Rules execute in ascending sequence order. Higher sequence numbers evaluate after lower numbers.
              </p>
            </div>
            {!isPayrollUser && (
              <Button size="sm" onClick={handleOpenAddForm} className="whitespace-nowrap flex-shrink-0">
                <Plus size={15} /> Add Rule
              </Button>
            )}
          </div>
        )}

        {/* Form View */}
        {showRuleForm ? (
          <form onSubmit={handleSaveRule} className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                {editingRule ? `Edit Salary Rule: ${editingRule.code}` : 'Add New Salary Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setShowRuleForm(false)}
                className="text-xs text-slate-500 hover:text-slate-900 font-extrabold flex items-center gap-1 hover:bg-slate-200/60 px-2.5 py-1 rounded-lg transition-all"
              >
                <ArrowLeft size={13} /> Back to Rules List
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Rule Name *"
                placeholder="e.g. Basic Salary, House Rent Allowance"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                required
              />
              <Input
                label="Rule Code *"
                placeholder="e.g. BASIC, HRA, DA, PF, TAX"
                value={ruleForm.code}
                onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value })}
                required
              />
              <Select
                label="Category *"
                value={ruleForm.category}
                onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
              >
                <option value="BASIC">BASIC (Base Pay)</option>
                <option value="ALLOWANCE">ALLOWANCE (Addition)</option>
                <option value="GROSS">GROSS (Total Salary)</option>
                <option value="DEDUCTION">DEDUCTION (Subtraction)</option>
                <option value="NET">NET (Take-home Pay)</option>
              </Select>
              <Input
                label="Sequence Order *"
                type="number"
                min={1}
                placeholder="10, 20, 30..."
                value={ruleForm.sequence}
                onChange={(e) => setRuleForm({ ...ruleForm, sequence: parseInt(e.target.value) || 10 })}
                required
              />
            </div>

            <div className="border-t border-slate-200/80 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Computation Method *"
                  value={ruleForm.computationMethod}
                  onChange={(e) => setRuleForm({ ...ruleForm, computationMethod: e.target.value })}
                >
                  <option value="FIXED">FIXED (Fixed Amount)</option>
                  <option value="PERCENTAGE">PERCENTAGE (% of Base)</option>
                  <option value="FORMULA">FORMULA (Dynamic Expression)</option>
                </Select>

                {ruleForm.computationMethod === 'FIXED' && (
                  <Input
                    label="Fixed Amount *"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 25000.00"
                    value={ruleForm.amount}
                    onChange={(e) => setRuleForm({ ...ruleForm, amount: e.target.value })}
                    required
                  />
                )}

                {ruleForm.computationMethod === 'PERCENTAGE' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Percentage (%) *"
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      placeholder="e.g. 40"
                      value={ruleForm.percentage}
                      onChange={(e) => setRuleForm({ ...ruleForm, percentage: e.target.value })}
                      required
                    />
                    <Input
                      label="Based On Code *"
                      placeholder="BASIC, GROSS..."
                      value={ruleForm.percentageBasedOn}
                      onChange={(e) => setRuleForm({ ...ruleForm, percentageBasedOn: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>

              {ruleForm.computationMethod === 'FORMULA' && (
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 mt-3">
                  <Input
                    label="Computation Formula *"
                    placeholder="e.g. BASIC * 0.40 or CONTRACT_WAGE * 0.50"
                    value={ruleForm.formula}
                    onChange={(e) => setRuleForm({ ...ruleForm, formula: e.target.value })}
                    required
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase">Helper Tokens:</span>
                    {['BASIC', 'GROSS', 'CONTRACT_WAGE', '0.12', '0.40', '*', '+', '-'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => insertFormulaChip(chip)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-orange-100 hover:text-[#FF5E1E] text-slate-700 rounded text-xs font-mono font-bold transition-all border border-slate-200"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button variant="secondary" size="sm" type="button" onClick={() => setShowRuleForm(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Save Rule'}
              </Button>
            </div>
          </form>
        ) : (
          /* Rules List Table */
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading rules...</div>
            ) : rules.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-300 rounded-2xl text-slate-500 space-y-2">
                <Code className="mx-auto w-8 h-8 text-slate-400" />
                <p className="text-xs font-bold">No Salary Rules configured yet</p>
                <Button size="sm" onClick={handleOpenAddForm}>
                  <Plus size={14} /> Add First Rule
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200/80 font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3 w-16">Seq</th>
                      <th className="px-4 py-3">Rule Name & Code</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Computation Method</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rules.map((rule) => {
                      let compText = '';
                      if (rule.computationMethod === 'FIXED') {
                        compText = `Fixed ₹${(rule.amount || 0).toLocaleString()}`;
                      } else if (rule.computationMethod === 'PERCENTAGE') {
                        const basedOn = rule.percentageBasedOn && rule.percentageBasedOn !== 'null' ? rule.percentageBasedOn : (rule.category === 'BASIC' ? 'Contract Wage' : 'BASIC');
                        compText = `${rule.percentage}% of ${basedOn}`;
                      }
                      return (
                        <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-600">{rule.sequence}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{rule.name}</div>
                            <div className="font-mono text-[11px] text-[#FF5E1E] font-extrabold">{rule.code}</div>
                          </td>
                          <td className="px-4 py-3">{getCategoryBadge(rule.category)}</td>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {rule.computationMethod === 'FORMULA' ? (
                              <code className="bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[11px] text-purple-700 font-bold">
                                {rule.formula}
                              </code>
                            ) : (
                              <span className="font-semibold">{compText}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!isPayrollUser ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEditForm(rule)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                                  title="Edit Rule"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Delete Rule"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default SalaryRulesModal;
