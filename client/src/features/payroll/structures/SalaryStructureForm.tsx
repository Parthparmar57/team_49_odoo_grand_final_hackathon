import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, Alert } from '../../../components/ui';
import { Loader2 } from 'lucide-react';
import api from '../../../api/client';

interface SalaryStructureFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  structure?: any;
}

export const SalaryStructureForm: React.FC<SalaryStructureFormProps> = ({
  open,
  onClose,
  onSuccess,
  structure,
}) => {
  const isEdit = Boolean(structure?.id);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (structure) {
      setFormData({
        name: structure.name || '',
        code: structure.code || '',
        description: structure.description || '',
        active: structure.active !== undefined ? structure.active : true,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        active: true,
      });
    }
    setError('');
  }, [structure, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Structure Name and Code are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        active: formData.active,
      };

      const res = isEdit
        ? await api.payroll.updateStructure(structure.id, payload)
        : await api.payroll.createStructure(payload);

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error?.message || 'Failed to save salary structure');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Salary Structure — ${structure?.code}` : 'Create New Salary Structure'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert message={error} variant="error" />}

        <Input
          label="Structure Name *"
          placeholder="e.g. Executive Full-Time Structure"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Structure Code *"
          placeholder="e.g. REG_IND_2026"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          required
        />

        <div className="space-y-1">
          <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">
            Description
          </label>
          <textarea
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#FF5E1E] focus:ring-1 focus:ring-[#FF5E1E] transition-colors"
            rows={3}
            placeholder="Detailed description of structure applicability, region, or employment type..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <Select
          label="Status"
          value={formData.active ? 'true' : 'false'}
          onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
        >
          <option value="true">Active (Available for Payruns & Contracts)</option>
          <option value="false">Inactive / Archived</option>
        </Select>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Structure'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
export default SalaryStructureForm;
