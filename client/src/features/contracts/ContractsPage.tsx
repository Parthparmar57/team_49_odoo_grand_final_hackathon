import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { PageHeader, Table, Tr, Td, Button, LoadingPage, Alert, ContractStatusBadge } from '../../components/ui';
import { Plus, Eye, Edit, Search, Filter, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ContractsPage() {
  const { user } = useAuth();
  const isPayrollUser = user?.role === 'HR_PAYROLL_USER';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [contracts, setContracts] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStructure, setSelectedStructure] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    const empId = searchParams.get('employeeId');
    if (empId) params.employeeId = empId;

    Promise.all([
      api.contracts.list(params),
      api.departments.list(),
      api.payroll.structures(),
    ]).then(([cntRes, deptRes, strRes]) => {
      if (cntRes.success) setContracts(cntRes.data || []);
      else setError(cntRes.error?.message || 'Failed to load contracts');

      if (deptRes.success) setDepartments(deptRes.data || []);
      if (strRes.success) setStructures(strRes.data || []);

      setLoading(false);
    }).catch(err => {
      setError(err?.message || 'Failed to load contract details');
      setLoading(false);
    });
  }, []);

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const empName = `${c.employee?.firstName || ''} ${c.employee?.lastName || ''}`.toLowerCase();
      const empNum = (c.employee?.employeeNumber || '').toLowerCase();
      const ref = (c.contractRef || '').toLowerCase();
      const deptName = (c.department?.name || '').toLowerCase();
      const structName = (c.salaryStructure?.name || '').toLowerCase();

      const matchesSearch =
        !q ||
        empName.includes(q) ||
        empNum.includes(q) ||
        ref.includes(q) ||
        deptName.includes(q) ||
        structName.includes(q);

      const matchesDept = !selectedDept || c.departmentId === selectedDept || c.department?.id === selectedDept || c.department?.name === selectedDept;

      const matchesStruct = !selectedStructure || c.salaryStructureId === selectedStructure || c.salaryStructure?.id === selectedStructure || c.salaryStructure?.name === selectedStructure;

      const matchesStatus = !selectedStatus || c.status === selectedStatus;

      return matchesSearch && matchesDept && matchesStruct && matchesStatus;
    });
  }, [contracts, searchQuery, selectedDept, selectedStructure, selectedStatus]);

  const hasActiveFilters = Boolean(searchQuery || selectedDept || selectedStructure || selectedStatus);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDept('');
    setSelectedStructure('');
    setSelectedStatus('');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Contracts" subtitle={`${contracts.length} active & historical contract records`}>
        {!isPayrollUser && (
          <Button onClick={() => navigate('/contracts/new')}>
            <Plus size={16} /> New Contract
          </Button>
        )}
      </PageHeader>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee name, EMP ID, contract ref, or structure..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF5E1E] focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Filter size={14} className="text-slate-400" />
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="bg-transparent text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Salary Structure Filter */}
            <select
              value={selectedStructure}
              onChange={e => setSelectedStructure(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">All Salary Structures</option>
              {structures.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Clear Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-[#FF5E1E] bg-slate-100 hover:bg-orange-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Counter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mt-3 pt-3 border-t border-slate-100">
          <span>Showing <strong className="text-slate-900">{filteredContracts.length}</strong> of <strong className="text-slate-900">{contracts.length}</strong> contracts</span>
          {hasActiveFilters && (
            <span className="text-[#FF5E1E] font-bold">Filtered Results</span>
          )}
        </div>
      </div>

      {error && <Alert message={error} />}
      {loading ? <LoadingPage /> : (
        <Table
          headers={['Contract Ref', 'Employee', 'Department', 'Wage', 'Period', 'Salary Structure', 'Status', 'Actions']}
          empty={filteredContracts.length === 0}
        >
          {filteredContracts.map(c => (
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
                  <button onClick={() => navigate(`/employees/${c.employeeId}`)} className="p-1.5 text-slate-500 hover:text-[#FF5E1E] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer" title="View Details">
                    <Eye size={16} />
                  </button>
                  {!isPayrollUser && (
                    <button onClick={() => navigate(`/contracts/${c.id}/edit`)} className="p-1.5 text-slate-500 hover:text-[#FF5E1E] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer" title="Edit Contract">
                      <Edit size={16} />
                    </button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </div>
  );
}

