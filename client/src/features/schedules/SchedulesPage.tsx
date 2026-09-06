import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { PageHeader, Button, LoadingPage, Alert, Modal, Input, Card, Table, Tr, Td } from '../../components/ui';
import { Plus, Clock, Check, Loader2, Calculator, Search, Filter, X, Users, ArrowLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function SchedulesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: routeScheduleId } = useParams();
  const isPayrollUser = user?.role === 'HR_PAYROLL_USER';

  const [schedules, setSchedules] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewScheduleModal, setViewScheduleModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [dailyHours, setDailyHours] = useState('8');

  // Search & Filter state for Schedules list
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftTypeFilter, setShiftTypeFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');

  // Search & Filter state for Full-Screen Assigned Employees view
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('');
  const [empDesgFilter, setEmpDesgFilter] = useState('');

  const [form, setForm] = useState({
    name: '', weeklyHours: '40', startTime: '09:00', endTime: '18:00', breakMinutes: '60',
    monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false,
  });

  const load = () => {
    Promise.all([
      api.schedules.list(),
      api.employees.list({ limit: '500' }),
    ]).then(([schedRes, empRes]) => {
      if (schedRes.success) setSchedules(schedRes.data || []);
      else {
        const msg = schedRes.error?.message || 'Failed to load schedules';
        setError(msg);
        toast.error(msg);
      }
      if (empRes.success) {
        setEmployees(empRes.data?.employees || empRes.data || []);
      }
      setLoading(false);
    }).catch(err => {
      setError(err?.message || 'Failed to load schedules');
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  // Determine active schedule for full-screen detail view
  const activeSchedule = useMemo(() => {
    if (routeScheduleId) return schedules.find(s => s.id === routeScheduleId) || null;
    return viewScheduleModal;
  }, [routeScheduleId, viewScheduleModal, schedules]);

  // Active days count
  const activeDaysCount = useMemo(() => {
    return days.filter(d => form[d]).length;
  }, [form.monday, form.tuesday, form.wednesday, form.thursday, form.friday, form.saturday, form.sunday]);

  // Automatic Net Daily Hours & Weekly Hours Calculation
  const computedDailyNetHours = useMemo(() => {
    if (!form.startTime || !form.endTime) return 8;
    const [startH, startM] = form.startTime.split(':').map(Number);
    const [endH, endM] = form.endTime.split(':').map(Number);
    const totalShiftMins = (endH * 60 + endM) - (startH * 60 + startM);
    const breakMins = parseInt(form.breakMinutes) || 0;
    const netMins = Math.max(0, totalShiftMins - breakMins);
    return Math.round((netMins / 60) * 100) / 100;
  }, [form.startTime, form.endTime, form.breakMinutes]);

  useEffect(() => {
    const computedWeekly = Math.round(computedDailyNetHours * activeDaysCount * 10) / 10;
    setForm(prev => ({ ...prev, weeklyHours: computedWeekly.toString() }));
  }, [computedDailyNetHours, activeDaysCount]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const isFullTime = (s.weeklyHours || 0) >= 35;
      const typeLabel = isFullTime ? 'FULL-TIME' : 'PART-TIME';

      const nameMatches = !q || s.name.toLowerCase().includes(q) || `${s.weeklyHours}h`.includes(q) || `${s.startTime} ${s.endTime}`.includes(q);
      const typeMatches = !shiftTypeFilter || typeLabel === shiftTypeFilter;
      const dayMatches = !dayFilter || Boolean(s[dayFilter]);

      return nameMatches && typeMatches && dayMatches;
    });
  }, [schedules, searchQuery, shiftTypeFilter, dayFilter]);

  const hasActiveFilters = Boolean(searchQuery || shiftTypeFilter || dayFilter);

  const clearFilters = () => {
    setSearchQuery('');
    setShiftTypeFilter('');
    setDayFilter('');
  };

  const handleSave = async () => {
    if (!form.name || !form.name.trim()) {
      const msg = 'Schedule name is required.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (activeDaysCount === 0) {
      const msg = 'Please select at least one working day for the schedule.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      const msg = 'End time must be strictly after start time.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (form.startTime && form.endTime) {
      const [startH, startM] = form.startTime.split(':').map(Number);
      const [endH, endM] = form.endTime.split(':').map(Number);
      const totalShiftMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      const breakMins = parseInt(form.breakMinutes) || 0;
      if (breakMins >= totalShiftMinutes) {
        const msg = 'Break duration cannot equal or exceed total shift duration.';
        setError(msg);
        toast.error(msg);
        return;
      }
    }

    setError('');
    setSaving(true);
    const res = await api.schedules.create({
      ...form,
      weeklyHours: parseFloat(form.weeklyHours),
      breakMinutes: parseInt(form.breakMinutes),
    });
    setSaving(false);
    if (res.success) {
      toast.success('Working schedule created successfully');
      setShowModal(false);
      load();
    } else {
      const msg = res.error?.message || 'Failed to create schedule';
      setError(msg);
      toast.error(msg);
    }
  };

  // All employees assigned to activeSchedule
  const allAssignedEmployees = useMemo(() => {
    if (!activeSchedule) return [];
    return employees.filter(e => e.scheduleId === activeSchedule.id || e.schedule?.id === activeSchedule.id);
  }, [activeSchedule, employees]);

  // Unique departments for activeSchedule employees
  const uniqueScheduleDepartments = useMemo(() => {
    const depts = new Set<string>();
    allAssignedEmployees.forEach(e => {
      const dName = e.department?.name || e.departmentId;
      if (dName) depts.add(dName);
    });
    return Array.from(depts);
  }, [allAssignedEmployees]);

  // Unique designations for activeSchedule employees
  const uniqueScheduleDesignations = useMemo(() => {
    const desgs = new Set<string>();
    allAssignedEmployees.forEach(e => {
      if (e.designation) desgs.add(e.designation);
    });
    return Array.from(desgs);
  }, [allAssignedEmployees]);

  // Filtered employees for Full-Screen View
  const filteredScheduleEmployees = useMemo(() => {
    return allAssignedEmployees.filter(e => {
      const q = empSearchQuery.toLowerCase().trim();
      const name = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase();
      const num = (e.employeeNumber || '').toLowerCase();
      const dept = (e.department?.name || e.departmentId || '').toLowerCase();
      const desg = (e.designation || '').toLowerCase();
      const email = (e.email || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || num.includes(q) || dept.includes(q) || desg.includes(q) || email.includes(q);
      const matchesDept = !empDeptFilter || e.department?.name === empDeptFilter || e.departmentId === empDeptFilter;
      const matchesDesg = !empDesgFilter || e.designation === empDesgFilter;

      return matchesSearch && matchesDept && matchesDesg;
    });
  }, [allAssignedEmployees, empSearchQuery, empDeptFilter, empDesgFilter]);

  const hasEmpActiveFilters = Boolean(empSearchQuery || empDeptFilter || empDesgFilter);

  const clearEmpFilters = () => {
    setEmpSearchQuery('');
    setEmpDeptFilter('');
    setEmpDesgFilter('');
  };

  // FULL-SCREEN DEDICATED VIEW FOR ASSIGNED EMPLOYEES
  if (activeSchedule) {
    const isFullTime = (activeSchedule.weeklyHours || 0) >= 35;
    const scheduleTypeLabel = isFullTime ? 'FULL-TIME' : 'PART-TIME / CUSTOM';

    return (
      <div className="space-y-6 font-sans">
        {/* Full Screen Header */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setViewScheduleModal(null);
                if (routeScheduleId) navigate('/schedules');
              }}
              className="p-2.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all cursor-pointer shadow-xs"
              title="Back to Working Schedules"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900">{activeSchedule.name}</h1>
                <span className={`px-2.5 py-0.5 text-xs font-extrabold uppercase rounded-full border ${
                  isFullTime ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {scheduleTypeLabel}
                </span>
              </div>
              <p className="text-slate-500 text-xs font-medium mt-1">
                <strong className="text-slate-900 font-bold">{activeSchedule.weeklyHours} hrs/week</strong> • Shift: {activeSchedule.startTime} — {activeSchedule.endTime} • Lunch Break: {activeSchedule.breakMinutes} mins
              </p>
            </div>
          </div>

          {/* Working Days Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {days.map(d => (
              <span
                key={d}
                className={`px-2.5 py-1 text-xs font-extrabold rounded-xl uppercase tracking-wider ${
                  activeSchedule[d] ? 'bg-orange-50 text-[#FF5E1E] border border-orange-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {d.slice(0, 3)}
              </span>
            ))}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search assigned employees by name, employee ID, department, or designation..."
                value={empSearchQuery}
                onChange={e => setEmpSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF5E1E] focus:bg-white transition-all placeholder:text-slate-400"
              />
              {empSearchQuery && (
                <button
                  onClick={() => setEmpSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Department Filter */}
              {uniqueScheduleDepartments.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Filter size={14} className="text-slate-400" />
                  <select
                    value={empDeptFilter}
                    onChange={e => setEmpDeptFilter(e.target.value)}
                    className="bg-transparent text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="">All Departments</option>
                    {uniqueScheduleDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Designation Filter */}
              {uniqueScheduleDesignations.length > 0 && (
                <select
                  value={empDesgFilter}
                  onChange={e => setEmpDesgFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">All Designations</option>
                  {uniqueScheduleDesignations.map(desg => (
                    <option key={desg} value={desg}>{desg}</option>
                  ))}
                </select>
              )}

              {/* Clear Button */}
              {hasEmpActiveFilters && (
                <button
                  onClick={clearEmpFilters}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-[#FF5E1E] bg-slate-100 hover:bg-orange-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Counter Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-3 border-t border-slate-100">
            <span>Showing <strong className="text-slate-900">{filteredScheduleEmployees.length}</strong> of <strong className="text-slate-900">{allAssignedEmployees.length}</strong> assigned employees operating under {activeSchedule.name}</span>
            {hasEmpActiveFilters && (
              <span className="text-[#FF5E1E] font-bold">Filtered Results</span>
            )}
          </div>
        </div>

        {/* Employees Table */}
        {loading ? <LoadingPage /> : (
          <Table
            headers={['Employee', 'Department', 'Designation', 'Contact & Email', 'Action']}
            empty={filteredScheduleEmployees.length === 0}
          >
            {filteredScheduleEmployees.map(emp => (
              <Tr key={emp.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5E1E] to-[#FF8038] flex items-center justify-center text-white text-xs font-black shadow-xs">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs font-mono font-bold text-slate-500">{emp.employeeNumber || 'EMP'}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {emp.department?.name || 'General'}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                    {emp.designation || 'Staff'}
                  </span>
                </Td>
                <Td className="text-xs text-slate-600 font-medium">
                  {emp.email || '—'}
                </Td>
                <Td>
                  <Button variant="secondary" onClick={() => navigate(`/employees/${emp.id}`)}>
                    View Profile
                  </Button>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader title="Working Schedules" subtitle={`${schedules.length} standard work schedules configured`}>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Schedule
        </Button>
      </PageHeader>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search schedule by name, shift hours, or timing..."
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
            {/* Shift Type Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Filter size={14} className="text-slate-400" />
              <select
                value={shiftTypeFilter}
                onChange={e => setShiftTypeFilter(e.target.value)}
                className="bg-transparent text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer"
              >
                <option value="">All Shift Types</option>
                <option value="FULL-TIME">Full-Time (35+ hrs)</option>
                <option value="PART-TIME">Part-Time / Custom</option>
              </select>
            </div>

            {/* Working Day Filter */}
            <select
              value={dayFilter}
              onChange={e => setDayFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer capitalize"
            >
              <option value="">All Working Days</option>
              {days.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
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
          <span>Showing <strong className="text-slate-900">{filteredSchedules.length}</strong> of <strong className="text-slate-900">{schedules.length}</strong> working schedules</span>
          {hasActiveFilters && (
            <span className="text-[#FF5E1E] font-bold">Filtered Results</span>
          )}
        </div>
      </div>

      {error && <Alert message={error} />}
      {loading ? <LoadingPage /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchedules.map(s => {
            const isFullTime = (s.weeklyHours || 0) >= 35;
            const scheduleTypeLabel = isFullTime ? 'FULL-TIME' : 'PART-TIME / CUSTOM';
            const assignedCount = s._count?.employees ?? employees.filter(e => e.scheduleId === s.id || e.schedule?.id === s.id).length;

            return (
              <Card key={s.id} className="p-6 hover:shadow-md transition-all border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-slate-900 font-extrabold text-base">{s.name}</h3>
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full border ${
                          isFullTime ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {scheduleTypeLabel}
                        </span>
                      </div>
                      <div className="text-slate-500 text-xs font-medium mt-0.5">
                        <strong className="text-slate-900 font-black">{s.weeklyHours} hrs/week</strong> • {s.startTime} — {s.endTime}
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF5E1E] shadow-xs">
                      <Clock size={18} />
                    </div>
                  </div>

                  {/* Working days pill grid */}
                  <div className="flex gap-1.5 flex-wrap my-4">
                    {days.map(d => (
                      <span
                        key={d}
                        className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg uppercase tracking-wider ${
                          s[d] ? 'bg-orange-50 text-[#FF5E1E] border border-orange-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {d.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Lunch Break: <strong className="text-slate-800">{s.breakMinutes} mins</strong></span>
                  <button
                    onClick={() => navigate(`/schedules/${s.id}`)}
                    className="flex items-center gap-1 text-xs font-extrabold text-[#FF5E1E] hover:underline cursor-pointer bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200/80 transition-all shadow-2xs"
                  >
                    <Users size={12} />
                    <span>Employees ({assignedCount})</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Schedule Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Working Schedule">
        <div className="space-y-4">
          <Input
            label="Schedule Name *"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Standard 40h Shift"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Daily Hours *"
              type="number"
              value={dailyHours}
              onChange={e => setDailyHours(e.target.value)}
              placeholder="e.g. 8"
            />

            <div>
              <div className="flex items-center justify-between mb-1.5 gap-1">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Weekly Hours</label>
                <span className="text-[10px] font-extrabold text-[#FF5E1E] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                  <Calculator size={10} /> Auto-Calculated
                </span>
              </div>
              <input
                type="number"
                readOnly
                value={form.weeklyHours}
                className="w-full px-3.5 py-2.5 bg-slate-100/90 border border-slate-200 rounded-xl text-slate-900 font-extrabold text-sm focus:outline-none cursor-not-allowed shadow-xs"
              />
              <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
                Calculated: {computedDailyNetHours} net hrs/day × {activeDaysCount} active days
              </span>
            </div>

            <Input
              label="Start Time *"
              type="time"
              value={form.startTime}
              onChange={e => setForm({ ...form, startTime: e.target.value })}
            />

            <Input
              label="End Time *"
              type="time"
              value={form.endTime}
              onChange={e => setForm({ ...form, endTime: e.target.value })}
            />

            <div className="sm:col-span-2">
              <Input
                label="Break Duration (mins)"
                type="number"
                value={form.breakMinutes}
                onChange={e => setForm({ ...form, breakMinutes: e.target.value })}
                placeholder="60"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">
                Working Days
              </label>
              <span className="text-xs font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                {activeDaysCount} Days Selected
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {days.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm({ ...form, [d]: !form[d] })}
                  className={`py-2 px-1 rounded-xl text-xs font-extrabold capitalize transition-all border flex flex-col items-center justify-center gap-1 ${form[d]
                    ? 'bg-orange-50 text-[#FF5E1E] border-orange-300 shadow-xs'
                    : 'bg-slate-50/70 text-slate-400 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{d.slice(0, 3)}</span>
                  {form[d] && <Check size={12} className="stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? 'Creating...' : 'Save Schedule'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
