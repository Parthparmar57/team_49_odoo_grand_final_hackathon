import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { PageHeader, Table, Tr, Td, Button, LoadingPage, Alert, ContractStatusBadge } from '../../components/ui';
import { Plus, Eye, Edit } from 'lucide-react';

export default function ContractsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    const empId = searchParams.get('employeeId');
    if (empId) params.employeeId = empId;
    api.contracts.list(params).then(res => {
      if (res.success) setContracts(res.data || []);
      else setError(res.error?.message || 'Failed to load contracts');
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Contracts" subtitle={`${contracts.length} active & historical contract records`}>
        <Button onClick={() => navigate('/contracts/new')}>
          <Plus size={16} /> New Contract
        </Button>
      </PageHeader>

      {error && <Alert message={error} />}
      {loading ? <LoadingPage /> : (
        <Table
          headers={['Contract Ref', 'Employee', 'Department', 'Wage', 'Period', 'Salary Structure', 'Status', 'Actions']}
          empty={contracts.length === 0}
        >
          {contracts.map(c => (
            <Tr key={c.id}>
              <Td className="font-mono text-[#FF5E1E] font-bold text-xs">{c.contractRef}</Td>
              <Td>
                <div className="text-slate-900 font-bold">{c.employee?.firstName} {c.employee?.lastName}</div>
                <div className="text-slate-500 text-xs font-mono">{c.employee?.employeeNumber}</div>
              </Td>
              <Td><span className="font-semibold text-slate-800">{c.department?.name || '—'}</span></Td>
              <Td className="text-emerald-700 font-extrabold">₹{c.wage?.toLocaleString()}</Td>
              <Td className="text-xs font-medium text-slate-600">
                {new Date(c.startDate).toLocaleDateString()}
                {c.endDate ? ` — ${new Date(c.endDate).toLocaleDateString()}` : ' (Ongoing)'}
              </Td>
              <Td>{c.salaryStructure?.name || <span className="text-slate-400 font-medium">None</span>}</Td>
              <Td><ContractStatusBadge status={c.status} /></Td>
              <Td>
                <div className="flex gap-1">
                  <button onClick={() => navigate(`/employees/${c.employeeId}`)} className="p-1.5 text-slate-500 hover:text-[#FF5E1E] hover:bg-orange-50 rounded-lg transition-colors">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => navigate(`/contracts/${c.id}/edit`)} className="p-1.5 text-slate-500 hover:text-[#FF5E1E] hover:bg-orange-50 rounded-lg transition-colors">
                    <Edit size={16} />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}
