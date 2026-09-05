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

  // Automatic Weekly Hours Calculation: Daily Hours × Active Days
  useEffect(() => {
    const hrs = parseFloat(dailyHours) || 0;
    const computedWeekly = (hrs * activeDaysCount).toString();
    setForm(prev => ({ ...prev, weeklyHours: computedWeekly }));
  }, [dailyHours, activeDaysCount]);

  const handleSave = async () => {
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
          {schedules.map(s => (
            <Card key={s.id} className="p-6 hover:shadow-md transition-all border border-slate-200/80">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-slate-900 font-extrabold text-base">{s.name}</h3>
                  <div className="text-slate-500 text-xs font-medium mt-0.5">{s.weeklyHours} hrs/week • {s.startTime} — {s.endTime}</div>
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
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-lg uppercase tracking-wider ${s[d] ? 'bg-orange-50 text-[#FF5E1E] border border-orange-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
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
          ))}
        </div>
      )}

      {/* New Schedule Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Working Schedule">
        <div className="space-y-4">
          <Input label="Schedule Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Standard 40h Shift" />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Daily Hours *"
              type="number"
              value={dailyHours}
              onChange={e => setDailyHours(e.target.value)}
              placeholder="e.g. 8"
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">Weekly Hours (Auto)</label>
                <span className="text-[10px] text-orange-600 font-bold flex items-center gap-0.5">
                  <Calculator size={10} /> Auto-Calculated
                </span>
              </div>
              <input
                type="number"
                readOnly
                value={form.weeklyHours}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-extrabold text-sm focus:outline-none cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                Calculated: {dailyHours || 0} hrs × {activeDaysCount} active days
              </span>
            </div>

            <Input label="Break (mins)" type="number" value={form.breakMinutes} onChange={e => setForm({ ...form, breakMinutes: e.target.value })} />
            <Input label="Start Time" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            <Input label="End Time" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
          </div>

          <div>
            <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block mb-2">
              Working Days ({activeDaysCount} Days Selected)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {days.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm({ ...form, [d]: !form[d] })}
                  className={`p-2 rounded-xl text-xs font-bold capitalize transition-all border flex items-center justify-between ${form[d] ? 'bg-orange-50 text-[#FF5E1E] border-orange-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                >
                  {d.slice(0, 3)}
                  {form[d] && <Check size={12} />}
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
