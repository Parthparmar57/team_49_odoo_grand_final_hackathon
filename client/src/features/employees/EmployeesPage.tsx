import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  PageHeader, Table, Tr, Td, Button, Badge, LoadingPage, Alert,
  EmployeeStatusBadge
} from '../../components/ui';
import { Plus, Search, Eye, Edit, LayoutGrid, List } from 'lucide-react';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const load = async (searchVal = search, pageNum = page) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(pageNum), limit: '12' };
    if (searchVal) params.search = searchVal;
    const res = await api.employees.list(params);
    if (res.success) {
      setEmployees(res.data?.employees || res.data || []);
      setPagination(res.pagination);
    } else setError(res.error?.message || 'Failed to load employees');
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(search, 1);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" subtitle={`${pagination?.total ?? employees.length} total active & registered employees`}>
        <div className="flex items-center gap-1 border border-slate-200 bg-white rounded-xl p-1 shadow-xs">
          <button onClick={() => setView('list')} className={`p-2 rounded-lg font-bold transition-all ${view === 'list' ? 'bg-orange-50 text-[#FF5E1E]' : 'text-slate-500 hover:text-slate-800'}`}>
            <List size={16} />
          </button>
          <button onClick={() => setView('kanban')} className={`p-2 rounded-lg font-bold transition-all ${view === 'kanban' ? 'bg-orange-50 text-[#FF5E1E]' : 'text-slate-500 hover:text-slate-800'}`}>
            <LayoutGrid size={16} />
          </button>
        </div>
        <Button onClick={() => navigate('/employees/new')}>
          <Plus size={16} /> Add Employee
        </Button>
      </PageHeader>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, number..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#FF5E1E] focus:ring-1 focus:ring-[#FF5E1E] shadow-xs"
          />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {error && <Alert message={error} />}
      {loading ? <LoadingPage /> : view === 'list' ? (
        <Table
          headers={['Employee', 'Department', 'Designation', 'Type', 'Status', 'Actions']}
          empty={employees.length === 0}
        >
          {employees.map(emp => (
            <Tr key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)}>
              <Td>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5E1E] to-[#FF8038] flex items-center justify-center flex-shrink-0 shadow-xs">
                    <span className="text-white text-xs font-extrabold">{emp.firstName?.[0]}{emp.lastName?.[0]}</span>
                  </div>
                  <div>
                    <div className="text-slate-900 font-bold">{emp.firstName} {emp.lastName}</div>
                    <div className="text-slate-500 text-xs font-mono">{emp.employeeNumber} · {emp.email}</div>
                  </div>
                </div>
              </Td>
              <Td><span className="font-semibold text-slate-800">{emp.department?.name || '—'}</span></Td>
              <Td>{emp.designation}</Td>
              <Td><Badge variant="info">{emp.employmentType}</Badge></Td>
              <Td><EmployeeStatusBadge status={emp.status} /></Td>
              <Td>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => navigate(`/employees/${emp.id}`)} className="p-1.5 text-slate-500 hover:text-[#FF5E1E] hover:bg-orange-50 rounded-lg transition-colors">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => navigate(`/employees/${emp.id}/edit`)} className="p-1.5 text-slate-500 hover:text-[#FF5E1E] hover:bg-orange-50 rounded-lg transition-colors">
                    <Edit size={16} />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      ) : (
        /* Kanban / Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {employees.map(emp => (
            <div
              key={emp.id}
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-orange-300 cursor-pointer transition-all hover:shadow-md group"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF5E1E] to-[#FF8038] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white text-sm font-extrabold">{emp.firstName?.[0]}{emp.lastName?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-slate-900 font-extrabold text-sm truncate group-hover:text-[#FF5E1E] transition-colors">{emp.firstName} {emp.lastName}</h4>
                  <p className="text-slate-500 text-xs truncate font-medium">{emp.designation}</p>
                </div>
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-bold text-slate-800">{emp.department?.name || '—'}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span className="text-slate-400">Code:</span>
                  <span className="font-mono text-slate-700">{emp.employeeNumber}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <Badge variant="info">{emp.employmentType}</Badge>
                  <EmployeeStatusBadge status={emp.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => { setPage(p => p - 1); load(search, page - 1); }}
          >
            Previous
          </Button>
          <span className="text-xs text-slate-500 font-bold px-3">Page {page} of {pagination.pages}</span>
          <Button
            variant="secondary"
            disabled={page >= pagination.pages}
            onClick={() => { setPage(p => p + 1); load(search, page + 1); }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
