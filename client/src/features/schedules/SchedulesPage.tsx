import { useEffect, useState } from 'react';
import api from '../../api/client';
import { PageHeader, Button, LoadingPage, Alert, Modal, Input, Card } from '../../components/ui';
import { Plus, Clock, Check, Loader2 } from 'lucide-react';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', weeklyHours: '40', startTime: '09:00', endTime: '18:00', breakMinutes: '60',
    monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false,
  });

  const load = () => {
    api.schedules.list().then(res => {
      if (res.success) setSchedules(res.data || []);
      else setError(res.error?.message || 'Failed to load schedules');
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await api.schedules.create({
      ...form,
      weeklyHours: parseFloat(form.weeklyHours),
      breakMinutes: parseInt(form.breakMinutes),
    });
    setSaving(false);
    if (res.success) { setShowModal(false); load(); }
    else setError(res.error?.message || 'Failed to create schedule');
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  return (
    <div className="space-y-6">
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
          ))}
        </div>
      )}

      {/* New Schedule Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Working Schedule">
        <div className="space-y-4">
          <Input label="Schedule Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Standard 40h Shift" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Weekly Hours *" type="number" value={form.weeklyHours} onChange={e => setForm({ ...form, weeklyHours: e.target.value })} />
            <Input label="Break (mins)" type="number" value={form.breakMinutes} onChange={e => setForm({ ...form, breakMinutes: e.target.value })} />
            <Input label="Start Time" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            <Input label="End Time" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
          </div>

          <div>
            <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block mb-2">Working Days</label>
            <div className="grid grid-cols-4 gap-2">
              {days.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm({ ...form, [d]: !form[d] })}
                  className={`p-2 rounded-xl text-xs font-bold capitalize transition-all border flex items-center justify-between ${
                    form[d] ? 'bg-orange-50 text-[#FF5E1E] border-orange-200' : 'bg-slate-50 text-slate-500 border-slate-200'
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
