import { useEffect, useState } from 'react';
import api from '../../api/client';
import { StatCard, LoadingPage, Card, Alert } from '../../components/ui';
import { Users, FileText, Clock, CalendarX, DollarSign, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard.overview().then(res => {
      if (res.success) setStats(res.data);
      else setError(res.error?.message || 'Failed to load dashboard');
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6"><LoadingPage /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">HR & Payroll Overview</p>
      </div>

      {error && <Alert message={error} />}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={stats?.totalEmployees ?? '—'}
          icon={<Users size={24} />}
          color="blue"
        />
        <StatCard
          label="Active Contracts"
          value={stats?.activeContracts ?? '—'}
          icon={<FileText size={24} />}
          color="green"
        />
        <StatCard
          label="Pending Leave Requests"
          value={stats?.pendingLeaveRequests ?? '—'}
          icon={<CalendarX size={24} />}
          color="orange"
        />
        <StatCard
          label="This Month Payruns"
          value={stats?.monthPayruns ?? '—'}
          icon={<DollarSign size={24} />}
          color="purple"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Clock size={16} className="text-orange-400" />
            Recent Attendance
          </h2>
          {stats?.recentAttendance?.length > 0 ? (
            <div className="space-y-2">
              {stats.recentAttendance.slice(0, 5).map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div>
                    <div className="text-white text-sm font-medium">
                      {a.employee?.firstName} {a.employee?.lastName}
                    </div>
                    <div className="text-slate-500 text-xs">{new Date(a.date).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-md ${
                    a.status === 'PRESENT' ? 'bg-green-500/20 text-green-400' :
                    a.status === 'LATE' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{a.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No recent attendance records</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <CalendarX size={16} className="text-orange-400" />
            Pending Leave Requests
          </h2>
          {stats?.pendingLeaves?.length > 0 ? (
            <div className="space-y-2">
              {stats.pendingLeaves.slice(0, 5).map((l: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div>
                    <div className="text-white text-sm font-medium">
                      {l.employee?.firstName} {l.employee?.lastName}
                    </div>
                    <div className="text-slate-500 text-xs">{l.leaveType?.name} · {l.duration} days</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-400">PENDING</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No pending leave requests</p>
          )}
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle size={16} className="text-green-400" />
            </div>
            <span className="text-white font-medium">Active Employees</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.activeEmployees ?? '—'}</div>
          <div className="text-slate-500 text-xs mt-1">Currently working</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-blue-400" />
            </div>
            <span className="text-white font-medium">Departments</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.totalDepartments ?? '—'}</div>
          <div className="text-slate-500 text-xs mt-1">Organization units</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <AlertCircle size={16} className="text-orange-400" />
            </div>
            <span className="text-white font-medium">On Leave Today</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats?.onLeaveToday ?? '—'}</div>
          <div className="text-slate-500 text-xs mt-1">Approved leaves active</div>
        </Card>
      </div>
    </div>
  );
}
