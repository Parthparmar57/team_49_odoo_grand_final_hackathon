import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Table, Tr, Td, Button, LoadingPage, Alert, Card, Badge } from '../../../components/ui';
import { Plus, Edit3, Settings, Search, CheckCircle, Sliders, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import api from '../../../api/client';
import SalaryStructureForm from './SalaryStructureForm';
import SalaryRulesModal from './SalaryRulesModal';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export const SalaryStructuresPage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isPayrollUser = user?.role === 'HR_PAYROLL_USER';
  const navigate = useNavigate();
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal States
  const [showStructureForm, setShowStructureForm] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<any | null>(null);

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [ruleStructure, setRuleStructure] = useState<any | null>(null);

  const loadStructures = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.payroll.structures();
      if (res.success && res.data) {
        setStructures(res.data);
      } else {
        const msg = res.error?.message || 'Failed to fetch salary structures';
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err?.message || 'Error connecting to payroll server';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadStructures();
  }, []);

  const handleOpenCreate = () => {
    setSelectedStructure(null);
    setShowStructureForm(true);
  };

  const handleOpenEdit = (structure: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStructure(structure);
    setShowStructureForm(true);
  };

  const handleOpenRules = (structure: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRuleStructure(structure);
    setShowRulesModal(true);
  };

  const filteredStructures = structures.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));

    if (filterStatus === 'ACTIVE') return matchesSearch && s.active;
    if (filterStatus === 'INACTIVE') return matchesSearch && !s.active;
    return matchesSearch;
  });

  const totalRulesCount = structures.reduce(
    (acc, s) => acc + (s.rules?.length || s._count?.rules || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Salary Structures & Rules Engine"
        subtitle="Manage baseline payroll calculation schemas, rule categories, and execution order"
      >
        <Button variant="secondary" onClick={() => navigate('/payroll')}>
          <ArrowLeft size={16} /> Back to Payruns
        </Button>
        {!isPayrollUser && (
          <Button onClick={handleOpenCreate}>
            <Plus size={16} /> New Structure
          </Button>
        )}
      </PageHeader>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Salary Structures
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{structures.length}</p>
            </div>
            <div className="p-3 bg-orange-50 text-[#FF5E1E] rounded-2xl border border-orange-200">
              <FileSpreadsheet size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Structures
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                {structures.filter((s) => s.active).length}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200">
              <CheckCircle size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Configured Salary Rules
              </p>
              <p className="text-3xl font-extrabold text-purple-600 mt-1">{totalRulesCount}</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
              <Sliders size={20} />
            </div>
          </div>
        </Card>
      </div>

      {error && <Alert message={error} variant="error" />}

      {/* Filter & Search Bar */}
      <Card className="p-4 border border-slate-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by structure name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#FF5E1E] focus:ring-1 focus:ring-[#FF5E1E]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-[#FF5E1E] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </Card>

      {/* Salary Structures Table */}
      {loading ? (
        <LoadingPage />
      ) : (
        <Table
          headers={['Structure Code & Name', 'Description', 'Configured Rules', 'Active Status', 'Actions']}
          empty={filteredStructures.length === 0}
        >
          {filteredStructures.map((structure) => {
            const ruleCount = structure.rules?.length || structure._count?.rules || 0;

            return (
              <Tr key={structure.id} onClick={() => handleOpenRules(structure)}>
                <Td>
                  <div className="font-extrabold text-slate-900 text-base">{structure.name}</div>
                  <div className="inline-block mt-0.5 px-2 py-0.5 text-xs font-mono font-bold text-[#FF5E1E] bg-orange-50 rounded border border-orange-200">
                    {structure.code}
                  </div>
                </Td>
                <Td className="text-xs text-slate-600 max-w-xs">
                  {structure.description || <span className="text-slate-400 italic">No description</span>}
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 font-extrabold text-xs rounded-xl border border-purple-200">
                    <Sliders size={12} /> {ruleCount} Rules
                  </span>
                </Td>
                <Td>
                  <Badge variant={structure.active ? 'success' : 'default'}>
                    {structure.active ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleOpenRules(structure, e)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1 transition-all"
                    >
                      <Settings size={13} /> Rules
                    </button>
                    {!isPayrollUser && (
                      <button
                        onClick={(e) => handleOpenEdit(structure, e)}
                        className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                        title="Edit Structure Details"
                      >
                        <Edit3 size={15} />
                      </button>
                    )}
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
      )}

      {/* Salary Structure Creation/Edit Form Modal */}
      <SalaryStructureForm
        open={showStructureForm}
        onClose={() => setShowStructureForm(false)}
        onSuccess={loadStructures}
        structure={selectedStructure}
      />

      {/* Salary Rules Configuration Modal */}
      <SalaryRulesModal
        open={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        structure={ruleStructure}
        onRefresh={loadStructures}
      />
    </div>
  );
};
export default SalaryStructuresPage;
