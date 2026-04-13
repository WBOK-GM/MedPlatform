import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar/Navbar';
import Button from '../../components/Button/Button';
import { appointmentApi, authApi } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import {
  Stethoscope, Calendar, Clock, Building2, Monitor,
  Plus, ClipboardList, User, ChevronLeft, ChevronRight
} from 'lucide-react';

interface TimeBlock {
  id: string;
  doctor_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CANCELLED';
}

interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  care_type: string;
  status: string;
  created_at: string;
  notes?: string;
  time_block?: TimeBlock;
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-[#2f8e4e]/10 text-[#236a3a] border-[#2f8e4e]/25',
  SCHEDULED: 'bg-[#2f8e4e]/10 text-[#236a3a] border-[#2f8e4e]/25',
  CANCELLED: 'bg-[#c53d3d]/10 text-[#8d2222] border-[#c53d3d]/25',
  COMPLETED: 'bg-brand-300/30 text-brand-800 border-brand-300/50',
};

function fmtTime(t?: string) { return t ? t.slice(0, 5) : '-'; }
function fmtDate(d?: string, locale = 'en-US') {
  if (!d) return '-';
  const iso = d.includes('T') ? d : d + 'T00:00:00';
  return new Date(iso).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short' });
}

function getWeekDays(weekOffset: number): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toISODate(d: Date) { return d.toISOString().split('T')[0]; }

export default function DoctorDashboard() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [slots, setSlots] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const [scheduleDate, setScheduleDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState({ text: '', type: '' });
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

    setCurrentUser(storedUser);

    if (!token) { router.replace('/login'); return; }
    if (storedUser?.role !== 'DOCTOR') { router.replace('/dashboard'); return; }
    fetchAppointments(storedUser?.id);
  }, []);

  useEffect(() => {
    if (currentUser?.id) fetchWeekSlots(currentUser.id);
  }, [weekOffset, currentUser?.id]);

  const fetchAppointments = async (doctorId?: string) => {
    setLoading(true);
    try {
      if (!doctorId) {
        setAppointments([]);
        return;
      }

      const { data } = await appointmentApi.get<Appointment[]>(`/doctors/${doctorId}/appointments`);
      setAppointments(data);
      const ids = [...new Set(data.map(a => a.patient_id))];
      const nameMap: Record<string, string> = {};
      await Promise.all(ids.map(async (pid) => {
        try {
          const { data: u } = await authApi.get(`/auth/users/${pid}`);
          nameMap[pid] = u.email || pid.slice(0, 8);
        } catch {
          nameMap[pid] = '#' + pid.slice(0, 8).toUpperCase();
        }
      }));
      setPatientNames(nameMap);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekSlots = useCallback(async (doctorId: string) => {
    setSlotsLoading(true);
    const days = getWeekDays(weekOffset);
    const dateFrom = toISODate(days[0]);
    const dateTo = toISODate(days[6]);
    try {
      const { data } = await appointmentApi.get<TimeBlock[]>(`/doctors/${doctorId}/schedules`, {
        params: { date_from: dateFrom, date_to: dateTo }
      });
      setSlots(data);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [weekOffset]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleMsg({ text: '', type: '' });
    if (startTime >= endTime) {
      setScheduleMsg({ text: t('doctorDashboard.endAfterStart'), type: 'error' }); return;
    }
    setScheduleLoading(true);
    try {
      if (!currentUser?.id) {
        setScheduleMsg({ text: t('doctorDashboard.userNotLoaded'), type: 'error' });
        return;
      }

      await appointmentApi.post(`/doctors/${currentUser.id}/schedules`, {
        doctor_id: currentUser.id,
        schedule_date: scheduleDate,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
      });
      setScheduleMsg({ text: t('doctorDashboard.slotAdded'), type: 'success' });
      setStartTime(''); setEndTime('');
      fetchWeekSlots(currentUser.id);
    } catch (err: any) {
      let msg = err.response?.data?.detail || t('doctorDashboard.slotFailed');
      if (Array.isArray(msg)) msg = msg.map((m: any) => m.msg || JSON.stringify(m)).join(', ');
      setScheduleMsg({ text: msg, type: 'error' });
    } finally {
      setScheduleLoading(false);
    }
  };

  const upcoming = appointments.filter(a => a.status !== 'CANCELLED');
  const weekDays = getWeekDays(weekOffset);

  return (
    <>
      <Head><title>{t('doctorDashboard.title')} - Encuentra a tu medico</title></Head>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 animate-fade-up px-6 py-9 sm:px-8">
          <div className="mb-7">
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-[-0.03em] text-brand-900">
              {t('doctorDashboard.heading')} <Stethoscope size={26} />
            </h1>
            <p className="mt-1 text-secondary-graphite">{t('doctorDashboard.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(280px,360px)_1fr]">
            <div className="rounded-2xl border border-brand-300/60 bg-white/80 p-6 shadow-soft">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-900">
                <Plus size={18} /> {t('doctorDashboard.addAvailability')}
              </h2>
              <form onSubmit={handleAddSchedule} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-brand-700">{t('doctorDashboard.date')}</label>
                  <input
                    type="date" className="rounded-xl border border-brand-300/60 bg-white/85 px-4 py-2.5 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
                    value={scheduleDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setScheduleDate(e.target.value)} required
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-1 flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-[0.08em] text-brand-700">{t('doctorDashboard.start')}</label>
                    <input type="time" className="rounded-xl border border-brand-300/60 bg-white/85 px-4 py-2.5 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-[0.08em] text-brand-700">{t('doctorDashboard.end')}</label>
                    <input type="time" className="rounded-xl border border-brand-300/60 bg-white/85 px-4 py-2.5 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                  </div>
                </div>
                <Button full type="submit" disabled={scheduleLoading}>
                  {scheduleLoading ? t('doctorDashboard.adding') : t('doctorDashboard.addSlot')}
                </Button>
                {scheduleMsg.text && (
                  <div className={`rounded-xl border px-4 py-3 text-sm ${scheduleMsg.type === 'error' ? 'border-[#c53d3d]/35 bg-[#c53d3d]/10 text-[#8d2222]' : 'border-[#2f8e4e]/30 bg-[#2f8e4e]/10 text-[#236a3a]'}`}>
                    {scheduleMsg.text}
                  </div>
                )}
              </form>
            </div>

            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-900">
                <ClipboardList size={18} /> {t('doctorDashboard.upcoming', { count: upcoming.length })}
              </h2>
              {loading ? (
                <div className="rounded-2xl border border-brand-300/60 bg-white/80 px-6 py-14 text-center text-secondary-graphite">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-300/40 border-t-brand-700" />
                  <p>{t('doctorDashboard.loadingAppointments')}</p>
                </div>
              ) : upcoming.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-brand-300/70 bg-white/75 px-6 py-16 text-center text-secondary-graphite">
                  <Calendar size={40} className="mx-auto mb-3 text-secondary-gray" />
                  <p>{t('doctorDashboard.noAppointments')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {upcoming.map(apt => (
                    <div key={apt.id} className="relative overflow-hidden rounded-2xl border border-brand-300/60 bg-white/80 p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-glass">
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-800 to-brand-700" />
                      <div className="mb-2 flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-900">
                          <Calendar size={14} />
                          {apt.time_block ? fmtDate(apt.time_block.schedule_date, locale) : fmtDate(apt.created_at, locale)}
                        </span>
                        {apt.time_block && (
                          <span className="flex items-center gap-1.5 text-lg font-extrabold tracking-[-0.02em] text-brand-700">
                            <Clock size={14} className="shrink-0" />
                            {fmtTime(apt.time_block.start_time)} - {fmtTime(apt.time_block.end_time)}
                          </span>
                        )}
                      </div>

                      <div className="mb-3 mt-2 flex items-center gap-1.5 text-sm text-secondary-graphite">
                        <User size={14} />
                        <span>{patientNames[apt.patient_id] || '#' + apt.patient_id.slice(0, 8).toUpperCase()}</span>
                      </div>

                      <div className="flex flex-col gap-1.5 text-sm text-secondary-graphite">
                        <span className="flex items-center gap-1.5">
                          {apt.care_type === 'IN_PERSON'
                            ? <><Building2 size={14} /> {t('common.careType.IN_PERSON')}</>
                            : <><Monitor size={14} /> {t('common.careType.VIRTUAL')}</>}
                        </span>
                        {apt.notes && <span><strong className="text-brand-900">{t('doctorDashboard.notes')}</strong> {apt.notes}</span>}
                      </div>

                      <div className="mt-4">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[apt.status] || 'bg-secondary-gray/10 text-secondary-graphite border-secondary-gray/35'}`}>
                          {t(`common.status.${apt.status}`)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-brand-900">
                <Calendar size={18} /> {t('doctorDashboard.weekly')}
              </h2>
              <div className="ml-auto flex items-center gap-2">
                <button className="rounded-xl border border-brand-300/70 px-2.5 py-2 text-secondary-graphite transition-all duration-200 hover:border-brand-700/50 hover:text-brand-900" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={16} /></button>
                <span className="min-w-[180px] text-center text-sm text-secondary-graphite">{toISODate(weekDays[0])} - {toISODate(weekDays[6])}</span>
                <button className="rounded-xl border border-brand-300/70 px-2.5 py-2 text-secondary-graphite transition-all duration-200 hover:border-brand-700/50 hover:text-brand-900" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight size={16} /></button>
                <button className="rounded-xl border border-brand-300/70 px-3 py-2 text-sm text-secondary-graphite transition-all duration-200 hover:border-brand-700/50 hover:text-brand-900" onClick={() => setWeekOffset(0)}>{t('common.today')}</button>
              </div>
            </div>

            {slotsLoading ? (
              <div className="rounded-2xl border border-brand-300/60 bg-white/80 px-6 py-14 text-center text-secondary-graphite">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-300/40 border-t-brand-700" />
                <p>{t('doctorDashboard.loadingSchedule')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
                {weekDays.map(day => {
                  const iso = toISODate(day);
                  const daySlots = slots.filter(s => s.schedule_date === iso);
                  const dayName = day.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short' });
                  const isToday = iso === toISODate(new Date());
                  return (
                    <div key={iso} className={`min-h-24 rounded-xl border p-2.5 ${isToday ? 'border-brand-700/70 bg-brand-700/5' : 'border-brand-300/60 bg-white/70'}`}>
                      <div className={`mb-1 text-xs font-bold uppercase tracking-[0.05em] ${isToday ? 'text-brand-700' : 'text-secondary-graphite'}`}>{dayName}</div>
                      {daySlots.length === 0 ? (
                        <div className="mt-2 text-center text-xs text-secondary-gray">-</div>
                      ) : (
                        daySlots.map(slot => (
                          <div key={slot.id} className={`mb-1 flex flex-col rounded-lg border px-2 py-1 text-xs font-semibold ${slot.status === 'AVAILABLE' ? 'border-[#2f8e4e]/30 bg-[#2f8e4e]/10 text-[#236a3a]' : 'border-brand-300/60 bg-brand-300/25 text-brand-800'}`}>
                            {fmtTime(slot.start_time)} - {fmtTime(slot.end_time)}
                            <span className="text-[10px] font-normal opacity-80">{slot.status === 'AVAILABLE' ? t('doctorDashboard.free') : t('doctorDashboard.booked')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
