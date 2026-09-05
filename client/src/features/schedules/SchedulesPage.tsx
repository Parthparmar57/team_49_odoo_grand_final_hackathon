import { useEffect, useState, useMemo } from 'react';
import api from '../../api/client';
import { PageHeader, Button, LoadingPage, Alert, Modal, Input, Card } from '../../components/ui';
import { Plus, Clock, Check, Loader2, Calculator } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function SchedulesPage() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dailyHours, setDailyHours] = useState('8');
  const [form, setForm] = useState({
    name: '', weeklyHours: '40', startTime: '09:00', endTime: '18:00', breakMinutes: '60',
    monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false,
  });

  const load = () => {
    api.schedules.list().then(res => {
      if (res.success) setSchedules(res.data || []);
      else {
        const msg = res.error?.message || 'Failed to load schedules';
        setError(msg);
        toast.error(msg);
      }
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

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

    // Validation 1: End time <= Start time check
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      const msg = 'End time must be strictly after start time.';
      setError(msg);
      toast.error(msg);
      return;
    }

    // Validation 2: Break duration >= shift duration check
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


  return (
    <div className="space-y-6 font-sans">
      <PageHeader title="Working Schedules" subtitle={`${schedules.length} standard work schedules configured`}>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Schedule
        </Button>
      </PageHeader>

      {error && <Alert message={error} />}
      {loading ? <LoadingPage /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map(s => {
            const isFullTime = (s.weeklyHours || 0) >= 35;
            const scheduleTypeLabel = isFullTime ? 'FULL-TIME' : 'PART-TIME / CUSTOM';

            return (
              <Card key={s.id} className="p-6 hover:shadow-md transition-all border border-slate-200/80">
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
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-lg uppercase tracking-wider ${
                        s[d] ? 'bg-orange-50 text-[#FF5E1E] border border-orange-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {d.slice(0, 3)}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500 font-medium">
                  <span>Lunch Break: <strong className="text-slate-800">{s.breakMinutes} mins</strong></span>
                  <span>Assigned Employees: <strong className="text-slate-800">{s._count?.employees ?? 0}</strong></span>
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
