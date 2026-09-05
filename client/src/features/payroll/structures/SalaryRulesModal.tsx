import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, Alert, Table, Tr, Td, Badge } from '../../../components/ui';
import { Plus, Edit2, Trash2, Loader2, ArrowUp, ArrowDown, Code, CheckCircle, HelpCircle } from 'lucide-react';
import api from '../../../api/client';

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
      setError('Rule Name and Code are required');
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
      payload.percentageBasedOn = ruleForm.percentageBasedOn;
    } else if (ruleForm.computationMethod === 'FORMULA') {
      payload.formula = ruleForm.formula;
    }

    try {
      const res = editingRule
        ? await api.payroll.updateRule(structure.id, editingRule.id, payload)
        : await api.payroll.createRule(structure.id, payload);

      if (res.success) {
        setSuccessMsg(editingRule ? 'Rule updated successfully' : 'Rule added successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
        setShowRuleForm(false);
        setEditingRule(null);
        await loadStructureDetails();
        onRefresh();
      } else {
        setError(res.error?.message || 'Failed to save salary rule');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred while saving rule');
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
        setSuccessMsg('Rule deleted successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
        await loadStructureDetails();
        onRefresh();
      } else {
        setError(res.error?.message || 'Failed to delete rule');
      }
    } catch (err: any) {
      setError(err?.message || 'Error deleting rule');
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
      title={`Rules Configuration — ${structure?.name || ''} (${structure?.code || ''})`}
    >
      <div className="space-y-4 max-w-2xl">
        {error && <Alert message={error} variant="error" />}
        {successMsg && <Alert message={successMsg} variant="success" />}

        {/* Action Header */}
        {!showRuleForm && (
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Execution Sequence Engine
              </p>
              <p className="text-xs text-slate-500">
                Rules execute in ascending sequence order. Higher numbers depend on lower numbers.
              </p>
            </div>
            <Button size="sm" onClick={handleOpenAddForm}>
              <Plus size={14} /> Add Rule
            </Button>
          </div>
        )}

        {/* Form View */}
        {showRuleForm ? (
          <form onSubmit={handleSaveRule} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                {editingRule ? `Edit Rule: ${editingRule.code}` : 'Add New Salary Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setShowRuleForm(false)}
                className="text-xs text-slate-500 hover:text-slate-900 font-bold"
              >
                Back to Rules List
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Category *"
                value={ruleForm.category}
                onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
              >
                <option value="BASIC">BASIC (Base Pay)</option>
                <option value="ALLOWANCE">ALLOWANCE (Addition)</option>
                <option value="GROSS">GROSS (Total Salary)</option>
                <option value="DEDUCTION">DEDUCTION (Subtractions)</option>
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

              <Select
                label="Computation Method *"
                value={ruleForm.computationMethod}
                onChange={(e) => setRuleForm({ ...ruleForm, computationMethod: e.target.value })}
              >
                <option value="FIXED">FIXED (Fixed Amount)</option>
                <option value="PERCENTAGE">PERCENTAGE (% of Base)</option>
                <option value="FORMULA">FORMULA (Dynamic Logic)</option>
              </Select>
            </div>

            {/* Computation Specific Dynamic Fields */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <Input
                  label="Percentage (%) *"
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  placeholder="e.g. 40 (for 40%)"
                  value={ruleForm.percentage}
                  onChange={(e) => setRuleForm({ ...ruleForm, percentage: e.target.value })}
                  required
                />
                <Input
                  label="Percentage Based On Code *"
                  placeholder="BASIC, GROSS, or Rule Code"
                  value={ruleForm.percentageBasedOn}
                  onChange={(e) => setRuleForm({ ...ruleForm, percentageBasedOn: e.target.value })}
                  required
                />
              </div>
            )}

            {ruleForm.computationMethod === 'FORMULA' && (
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <Input
                  label="Computation Formula *"
                  placeholder="e.g. BASIC * 0.40 or CONTRACT_WAGE * 0.50"
                  value={ruleForm.formula}
                  onChange={(e) => setRuleForm({ ...ruleForm, formula: e.target.value })}
                  required
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Helper Tokens:</span>
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

            <div className="flex justify-end gap-3 pt-2">
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
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-left font-bold text-slate-500 uppercase">
                      <th className="px-3 py-2.5">Seq</th>
                      <th className="px-3 py-2.5">Rule Name & Code</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5">Computation Method</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50/80">
                        <td className="px-3 py-3 font-mono font-bold text-slate-600">{rule.sequence}</td>
                        <td className="px-3 py-3">
                          <div className="font-bold text-slate-900">{rule.name}</div>
                          <div className="font-mono text-[10px] text-[#FF5E1E] font-bold">{rule.code}</div>
                        </td>
                        <td className="px-3 py-3">{getCategoryBadge(rule.category)}</td>
                        <td className="px-3 py-3 font-medium text-slate-700">
                          {rule.computationMethod === 'FIXED' && `Fixed ₹${(rule.amount || 0).toLocaleString()}`}
                          {rule.computationMethod === 'PERCENTAGE' && `${rule.percentage}% of ${rule.percentageBasedOn}`}
                          {rule.computationMethod === 'FORMULA' && (
                            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-purple-700">
                              {rule.formula}
                            </code>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditForm(rule)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                              title="Edit Rule"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                              title="Delete Rule"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Close Window
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default SalaryRulesModal;
