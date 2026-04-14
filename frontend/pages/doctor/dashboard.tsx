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
  time_block_id?: string;
  care_type: string;
  status: string;
  created_at: string;
  updated_at?: string;
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

function fmtDateTime(d?: string, locale = 'en-US') {
  if (!d) return '-';
  return new Date(d).toLocaleString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isAppointmentPast(appointment: Appointment) {
  if (!appointment.time_block) return false;
  const endTime = appointment.time_block.end_time.length === 5
    ? `${appointment.time_block.end_time}:00`
    : appointment.time_block.end_time;
  const endDate = new Date(`${appointment.time_block.schedule_date}T${endTime}`);
  if (Number.isNaN(endDate.getTime())) return false;
  return endDate.getTime() <= Date.now();
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

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return NaN;
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

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
  const [workStartTime, setWorkStartTime] = useState('');
  const [workEndTime, setWorkEndTime] = useState('');
  const [slotDuration, setSlotDuration] = useState('20');
  const [hasBreak, setHasBreak] = useState(false);
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState({ text: '', type: '' });
  const [postVisitNotes, setPostVisitNotes] = useState<Record<string, string>>({});
  const [savingPostVisitId, setSavingPostVisitId] = useState<string | null>(null);
  const [postVisitMsg, setPostVisitMsg] = useState({ text: '', type: '' });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentDetailLoading, setAppointmentDetailLoading] = useState(false);
  const [appointmentDetailError, setAppointmentDetailError] = useState('');
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
      const initialNotes: Record<string, string> = {};
      data.forEach((appointment) => {
        initialNotes[appointment.id] = appointment.notes || '';
      });
      setPostVisitNotes(initialNotes);

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

  const handleCompleteAppointment = async (appointmentId: string) => {
    const notes = (postVisitNotes[appointmentId] || '').trim();
    if (!notes) {
      setPostVisitMsg({ text: t('doctorDashboard.postVisitRequired'), type: 'error' });
      return;
    }

    setSavingPostVisitId(appointmentId);
    setPostVisitMsg({ text: '', type: '' });
    try {
      await appointmentApi.patch(`/appointments/${appointmentId}/notes`, { notes });
      await appointmentApi.patch(`/appointments/${appointmentId}/status`, { status: 'COMPLETED' });
      setPostVisitMsg({ text: t('doctorDashboard.postVisitSaved'), type: 'success' });
      await fetchAppointments(currentUser?.id);
    } catch (err: any) {
      let msg = err.response?.data?.detail || t('doctorDashboard.postVisitFailed');
      if (Array.isArray(msg)) {
        msg = msg.map((m: any) => m.msg || JSON.stringify(m)).join(', ');
      }
      setPostVisitMsg({ text: msg, type: 'error' });
    } finally {
      setSavingPostVisitId(null);
    }
  };

  const openAppointmentDetail = async (appointmentId: string) => {
    setAppointmentDetailError('');
    setAppointmentDetailLoading(true);
    setSelectedAppointment(null);
    try {
      const { data } = await appointmentApi.get<Appointment>(`/appointments/${appointmentId}`);
      setSelectedAppointment(data);
    } catch (err: any) {
      let msg = err.response?.data?.detail || t('doctorDashboard.detailLoadFailed');
      if (Array.isArray(msg)) {
        msg = msg.map((m: any) => m.msg || JSON.stringify(m)).join(', ');
      }
      setAppointmentDetailError(msg);
    } finally {
      setAppointmentDetailLoading(false);
    }
  };

  const closeAppointmentDetail = () => {
    setSelectedAppointment(null);
    setAppointmentDetailError('');
    setAppointmentDetailLoading(false);
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

    const shiftStartMinutes = toMinutes(workStartTime);
    const shiftEndMinutes = toMinutes(workEndTime);
    const durationMinutes = Number(slotDuration);

    if (!Number.isFinite(shiftStartMinutes) || !Number.isFinite(shiftEndMinutes) || shiftStartMinutes >= shiftEndMinutes) {
      setScheduleMsg({ text: t('doctorDashboard.endAfterStart'), type: 'error' }); return;
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setScheduleMsg({ text: t('doctorDashboard.invalidDuration'), type: 'error' }); return;
    }

    let breakStartMinutes = NaN;
    let breakEndMinutes = NaN;

    if (hasBreak) {
      breakStartMinutes = toMinutes(breakStart);
      breakEndMinutes = toMinutes(breakEnd);

      if (!Number.isFinite(breakStartMinutes) || !Number.isFinite(breakEndMinutes) || breakStartMinutes >= breakEndMinutes) {
        setScheduleMsg({ text: t('doctorDashboard.breakAfterStart'), type: 'error' }); return;
      }

      if (breakStartMinutes < shiftStartMinutes || breakEndMinutes > shiftEndMinutes) {
        setScheduleMsg({ text: t('doctorDashboard.breakWithinShift'), type: 'error' }); return;
      }
    }

    const generatedSlots: Array<{ start: string; end: string }> = [];
    for (let cursor = shiftStartMinutes; cursor + durationMinutes <= shiftEndMinutes; cursor += durationMinutes) {
      const next = cursor + durationMinutes;
      if (hasBreak && overlaps(cursor, next, breakStartMinutes, breakEndMinutes)) continue;
      generatedSlots.push({ start: minutesToTime(cursor), end: minutesToTime(next) });
    }

    if (generatedSlots.length === 0) {
      setScheduleMsg({ text: t('doctorDashboard.noSlotsGenerated'), type: 'error' }); return;
    }

    setScheduleLoading(true);
    try {
      if (!currentUser?.id) {
        setScheduleMsg({ text: t('doctorDashboard.userNotLoaded'), type: 'error' });
        return;
      }

      let createdCount = 0;
      let failedCount = 0;
      let firstError = '';

      for (const slot of generatedSlots) {
        try {
          await appointmentApi.post(`/doctors/${currentUser.id}/schedules`, {
            doctor_id: currentUser.id,
            schedule_date: scheduleDate,
            start_time: `${slot.start}:00`,
            end_time: `${slot.end}:00`,
          });
          createdCount += 1;
        } catch (err: any) {
          failedCount += 1;
          if (!firstError) {
            let msg = err.response?.data?.detail || t('doctorDashboard.slotFailed');
            if (Array.isArray(msg)) msg = msg.map((m: any) => m.msg || JSON.stringify(m)).join(', ');
            firstError = msg;
          }
        }
      }

      if (createdCount > 0 && failedCount === 0) {
        setScheduleMsg({ text: t('doctorDashboard.slotsAdded', { count: createdCount }), type: 'success' });
      } else if (createdCount > 0 && failedCount > 0) {
        setScheduleMsg({ text: t('doctorDashboard.slotsPartial', { created: createdCount, failed: failedCount }) + ` ${firstError}`, type: 'error' });
      } else {
        setScheduleMsg({ text: firstError || t('doctorDashboard.slotFailed'), type: 'error' });
      }

      setWorkStartTime('');
      setWorkEndTime('');
      setBreakStart('');
      setBreakEnd('');
      setHasBreak(false);
      fetchWeekSlots(currentUser.id);
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
                    <label className="text-xs font-bold uppercase tracking-[0.08em] text-brand-700">{t('doctorDashboard.workStart')}</label>
                    <input type="time" className="rounded-xl border border-brand-300/60 bg-white/85 px-4 py-2.5 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35" value={workStartTime} onChange={e => setWorkStartTime(e.target.value)} required />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-[0.08em] text-brand-700">{t('doctorDashboard.workEnd')}</label>
                    <input type="time" className="rounded-xl border border-brand-300/60 bg-white/85 px-4 py-2.5 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35" value={workEndTime} onChange={e => setWorkEndTime(e.target.value)} required />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-brand-700">{t('doctorDashboard.slotDuration')}</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    className="rounded-xl border border-brand-300/60 bg-white/85 px-4 py-2.5 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
                    value={slotDuration}
                    onChange={e => setSlotDuration(e.target.value)}
                    required
                  />
                  <span className="text-xs text-secondary-graphite">{t('doctorDashboard.slotDurationHint')}</span>
                </div>

                <label className="inline-flex items-center gap-2 rounded-xl border border-brand-300/60 bg-white/85 px-3 py-2 text-sm text-secondary-graphite">
                  <input type="checkbox" checked={hasBreak} onChange={e => setHasBreak(e.target.checked)} />
                  {t('doctorDashboard.enableBreak')}
                </label>

                {hasBreak && (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-1 flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-[0.08em] text-brand-700">{t('doctorDashboard.breakStart')}</label>
                      <input type="time" className="rounded-xl border border-brand-300/60 bg-white/85 px-4 py-2.5 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35" value={breakStart} onChange={e => setBreakStart(e.target.value)} required />
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-[0.08em] text-brand-700">{t('doctorDashboard.breakEnd')}</label>
                      <input type="time" className="rounded-xl border border-brand-300/60 bg-white/85 px-4 py-2.5 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35" value={breakEnd} onChange={e => setBreakEnd(e.target.value)} required />
                    </div>
                  </div>
                )}
                <Button full type="submit" disabled={scheduleLoading}>
                  {scheduleLoading ? t('doctorDashboard.adding') : t('doctorDashboard.generateSlots')}
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
              {postVisitMsg.text && (
                <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${postVisitMsg.type === 'error' ? 'border-[#c53d3d]/35 bg-[#c53d3d]/10 text-[#8d2222]' : 'border-[#2f8e4e]/30 bg-[#2f8e4e]/10 text-[#236a3a]'}`}>
                  {postVisitMsg.text}
                </div>
              )}
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
                    <div
                      key={apt.id}
                      className="relative overflow-hidden rounded-2xl border border-brand-300/60 bg-white/80 p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-glass cursor-pointer"
                      onClick={() => openAppointmentDetail(apt.id)}
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-800 to-brand-700" />
                      {(() => {
                        const canComplete =
                          (apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED') &&
                          isAppointmentPast(apt);

                        return (
                          <>
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

                            {canComplete && (
                              <div className="mt-4 rounded-xl border border-brand-300/60 bg-white/85 p-3" onClick={(e) => e.stopPropagation()}>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-brand-700">
                                  {t('doctorDashboard.postVisitLabel')}
                                </label>
                                <textarea
                                  rows={3}
                                  value={postVisitNotes[apt.id] ?? ''}
                                  onChange={(e) => setPostVisitNotes((prev) => ({ ...prev, [apt.id]: e.target.value }))}
                                  placeholder={t('doctorDashboard.postVisitPlaceholder')}
                                  className="w-full resize-y rounded-xl border border-brand-300/60 bg-white/90 px-3 py-2 text-sm text-brand-900 outline-none transition-all duration-200 placeholder:text-secondary-gray focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
                                />
                                <div className="mt-3">
                                  <Button
                                    onClick={() => handleCompleteAppointment(apt.id)}
                                    disabled={savingPostVisitId === apt.id}
                                  >
                                    {savingPostVisitId === apt.id ? t('doctorDashboard.completing') : t('doctorDashboard.completeAppointment')}
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div className="mt-4 flex items-center justify-between gap-3">
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[apt.status] || 'bg-secondary-gray/10 text-secondary-graphite border-secondary-gray/35'}`}>
                                {t(`common.status.${apt.status}`)}
                              </span>
                              <span className="text-xs font-semibold text-brand-700">{t('doctorDashboard.viewDetails')}</span>
                            </div>
                          </>
                        );
                      })()}
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
                        <div className="max-h-36 overflow-y-auto pr-1">
                          {daySlots.map(slot => (
                            <div key={slot.id} className={`mb-1 flex flex-col rounded-lg border px-2 py-1 text-xs font-semibold ${slot.status === 'AVAILABLE' ? 'border-[#2f8e4e]/30 bg-[#2f8e4e]/10 text-[#236a3a]' : 'border-brand-300/60 bg-brand-300/25 text-brand-800'}`}>
                              {fmtTime(slot.start_time)} - {fmtTime(slot.end_time)}
                              <span className="text-[10px] font-normal opacity-80">{slot.status === 'AVAILABLE' ? t('doctorDashboard.free') : t('doctorDashboard.booked')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {(selectedAppointment || appointmentDetailLoading || appointmentDetailError) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6" onClick={closeAppointmentDetail}>
              <div className="w-full max-w-3xl rounded-2xl border border-brand-300/60 bg-white p-6 shadow-glass" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold tracking-[-0.02em] text-brand-900">{t('doctorDashboard.detailTitle')}</h3>
                    <p className="mt-1 text-sm text-secondary-graphite">{selectedAppointment?.id || '-'}</p>
                  </div>
                  <button
                    onClick={closeAppointmentDetail}
                    className="rounded-xl border border-brand-300/70 px-3 py-1.5 text-sm text-secondary-graphite transition-all duration-200 hover:border-brand-700/50 hover:text-brand-900"
                  >
                    {t('doctorDashboard.close')}
                  </button>
                </div>

                {appointmentDetailLoading ? (
                  <div className="rounded-xl border border-brand-300/60 bg-white/80 px-6 py-10 text-center text-secondary-graphite">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-300/40 border-t-brand-700" />
                    <p>{t('doctorDashboard.loadingDetail')}</p>
                  </div>
                ) : appointmentDetailError ? (
                  <div className="rounded-xl border border-[#c53d3d]/35 bg-[#c53d3d]/10 px-4 py-3 text-sm text-[#8d2222]">
                    {appointmentDetailError}
                  </div>
                ) : selectedAppointment ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-brand-300/60 bg-white/85 p-3 text-sm text-secondary-graphite"><strong className="text-brand-900">{t('doctorDashboard.patient')}</strong><br />{patientNames[selectedAppointment.patient_id] || selectedAppointment.patient_id}</div>
                    <div className="rounded-xl border border-brand-300/60 bg-white/85 p-3 text-sm text-secondary-graphite"><strong className="text-brand-900">{t('doctorDashboard.doctorId')}</strong><br />{selectedAppointment.doctor_id}</div>
                    <div className="rounded-xl border border-brand-300/60 bg-white/85 p-3 text-sm text-secondary-graphite"><strong className="text-brand-900">{t('doctorDashboard.careType')}</strong><br />{t(`common.careType.${selectedAppointment.care_type}`)}</div>
                    <div className="rounded-xl border border-brand-300/60 bg-white/85 p-3 text-sm text-secondary-graphite"><strong className="text-brand-900">{t('doctorDashboard.status')}</strong><br />{t(`common.status.${selectedAppointment.status}`)}</div>
                    <div className="rounded-xl border border-brand-300/60 bg-white/85 p-3 text-sm text-secondary-graphite"><strong className="text-brand-900">{t('doctorDashboard.createdAt')}</strong><br />{fmtDateTime(selectedAppointment.created_at, locale)}</div>
                    <div className="rounded-xl border border-brand-300/60 bg-white/85 p-3 text-sm text-secondary-graphite"><strong className="text-brand-900">{t('doctorDashboard.updatedAt')}</strong><br />{fmtDateTime(selectedAppointment.updated_at, locale)}</div>
                    <div className="rounded-xl border border-brand-300/60 bg-white/85 p-3 text-sm text-secondary-graphite md:col-span-2"><strong className="text-brand-900">{t('doctorDashboard.notes')}</strong><br />{selectedAppointment.notes || '-'}</div>

                    <div className="rounded-xl border border-brand-300/60 bg-white/85 p-3 text-sm text-secondary-graphite md:col-span-2">
                      <strong className="text-brand-900">{t('doctorDashboard.timeBlock')}</strong>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div><span className="font-semibold text-brand-900">ID:</span> {selectedAppointment.time_block?.id || selectedAppointment.time_block_id || '-'}</div>
                        <div><span className="font-semibold text-brand-900">{t('doctorDashboard.date')}:</span> {selectedAppointment.time_block?.schedule_date ? fmtDate(selectedAppointment.time_block.schedule_date, locale) : '-'}</div>
                        <div><span className="font-semibold text-brand-900">{t('doctorDashboard.start')}:</span> {fmtTime(selectedAppointment.time_block?.start_time)}</div>
                        <div><span className="font-semibold text-brand-900">{t('doctorDashboard.end')}:</span> {fmtTime(selectedAppointment.time_block?.end_time)}</div>
                        <div className="sm:col-span-2"><span className="font-semibold text-brand-900">{t('doctorDashboard.status')}:</span> {selectedAppointment.time_block?.status ? t(`common.status.${selectedAppointment.time_block.status}`) : '-'}</div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
