import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar/Navbar';
import Button from '../../components/Button/Button';
import styles from '../../styles/Pages.module.css';
import { appointmentApi, authApi } from '../../lib/api';
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
  CONFIRMED: 'confirmed', SCHEDULED: 'confirmed',
  CANCELLED: 'cancelled', COMPLETED: 'confirmed',
};

function fmtTime(t?: string) { return t ? t.slice(0, 5) : '—'; }
function fmtDate(d?: string) {
  if (!d) return '—';
  const iso = d.includes('T') ? d : d + 'T00:00:00';
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });
}

/** Return array of 7 Date objects starting from Monday of the given week offset */
function getWeekDays(weekOffset: number): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon…
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [slots, setSlots] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  // Schedule form
  const [scheduleDate, setScheduleDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState({ text: '', type: '' });

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.replace('/login'); return; }
    if (user?.role !== 'DOCTOR') { router.replace('/dashboard'); return; }
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (user?.id) fetchWeekSlots();
  }, [weekOffset, user?.id]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await appointmentApi.get<Appointment[]>(`/doctors/${user.id}/appointments`);
      setAppointments(data);
      // Fetch patient emails for all unique patient_ids
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

  const fetchWeekSlots = useCallback(async () => {
    if (!user?.id) return;
    setSlotsLoading(true);
    const days = getWeekDays(weekOffset);
    const dateFrom = toISODate(days[0]);
    const dateTo = toISODate(days[6]);
    try {
      const { data } = await appointmentApi.get<TimeBlock[]>(`/doctors/${user.id}/schedules`, {
        params: { date_from: dateFrom, date_to: dateTo }
      });
      setSlots(data);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [weekOffset, user?.id]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleMsg({ text: '', type: '' });
    if (startTime >= endTime) {
      setScheduleMsg({ text: 'End time must be after start time', type: 'error' }); return;
    }
    setScheduleLoading(true);
    try {
      await appointmentApi.post(`/doctors/${user.id}/schedules`, {
        doctor_id: user.id,
        schedule_date: scheduleDate,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
      });
      setScheduleMsg({ text: 'Slot added!', type: 'success' });
      setStartTime(''); setEndTime('');
      fetchWeekSlots();
    } catch (err: any) {
      let msg = err.response?.data?.detail || 'Failed to add schedule';
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
      <Head><title>Doctor Portal — MedPlatform</title></Head>
      <div className={styles.layout}>
        <Navbar />
        <main className={styles.main}>

          <div className={styles.topBar}>
            <div className={styles.welcome}>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                Doctor Portal <Stethoscope size={26} />
              </h1>
              <p>Manage your schedule and view patient appointments</p>
            </div>
          </div>

          {/* ══════════ SECTION 1: Two-column header ══════════ */}
          <div className={styles.doctorGrid}>
            {/* ── Add Availability ── */}
            <div className={styles.bookCard} style={{ height: 'fit-content' }}>
              <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} /> Add Availability
              </h2>
              <form onSubmit={handleAddSchedule} className={styles.scheduleForm}>
                <div className={styles.bookStep}>
                  <label className={styles.stepLabel}>Date</label>
                  <input
                    type="date" className={styles.dateInput} value={scheduleDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setScheduleDate(e.target.value)} required
                  />
                </div>
                <div className={styles.bookDateRow}>
                  <div className={styles.bookStep} style={{ flex: 1 }}>
                    <label className={styles.stepLabel}>Start</label>
                    <input type="time" className={styles.dateInput} value={startTime} onChange={e => setStartTime(e.target.value)} required />
                  </div>
                  <div className={styles.bookStep} style={{ flex: 1 }}>
                    <label className={styles.stepLabel}>End</label>
                    <input type="time" className={styles.dateInput} value={endTime} onChange={e => setEndTime(e.target.value)} required />
                  </div>
                </div>
                <Button full type="submit" disabled={scheduleLoading}>
                  {scheduleLoading ? 'Adding...' : 'Add Slot'}
                </Button>
                {scheduleMsg.text && (
                  <div className={scheduleMsg.type === 'error' ? styles.errorBanner : styles.successBanner}>
                    {scheduleMsg.text}
                  </div>
                )}
              </form>
            </div>

            {/* ── Upcoming Appointments ── */}
            <div>
              <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={18} /> Upcoming Appointments ({upcoming.length})
              </h2>
              {loading ? (
                <div className={styles.loading}><div className={styles.spinner} /><p>Loading...</p></div>
              ) : upcoming.length === 0 ? (
                <div className={styles.empty}>
                  <Calendar size={40} style={{ color: '#555', marginBottom: 12 }} />
                  <p>No appointments scheduled yet.</p>
                </div>
              ) : (
                <div className={styles.cardGrid}>
                  {upcoming.map(apt => (
                    <div key={apt.id} className={styles.aptCard}>
                      {/* Date & Time */}
                      <div className={styles.aptTimeBlock}>
                        <span className={styles.aptDate} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Calendar size={14} />
                          {apt.time_block ? fmtDate(apt.time_block.schedule_date) : fmtDate(apt.created_at)}
                        </span>
                        {apt.time_block && (
                          <span className={styles.aptTime} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={14} style={{ flexShrink: 0, color: 'var(--primary-light)', WebkitTextFillColor: 'var(--primary-light)' }} />
                            {fmtTime(apt.time_block.start_time)} – {fmtTime(apt.time_block.end_time)}
                          </span>
                        )}
                      </div>

                      {/* Patient name/email */}
                      <div className={styles.aptDoc} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                        <User size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                          {patientNames[apt.patient_id] || '#' + apt.patient_id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>

                      <div className={styles.aptInfo}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {apt.care_type === 'IN_PERSON'
                            ? <><Building2 size={14} /> In-person</>
                            : <><Monitor size={14} /> Virtual</>}
                        </span>
                        {apt.notes && <span><strong>Notes:</strong> {apt.notes}</span>}
                      </div>

                      <div className={styles.aptActions}>
                        <span className={`${styles.badge} ${styles[STATUS_STYLES[apt.status] || 'pending']}`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ══════════ SECTION 2: Weekly Agenda ══════════ */}
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} /> Weekly Schedule
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <button className={styles.backBtn} onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={16} /></button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', minWidth: 180, textAlign: 'center' }}>
                  {toISODate(weekDays[0])} – {toISODate(weekDays[6])}
                </span>
                <button className={styles.backBtn} onClick={() => setWeekOffset(w => w + 1)}><ChevronRight size={16} /></button>
                <button className={styles.backBtn} onClick={() => setWeekOffset(0)}>Today</button>
              </div>
            </div>

            {slotsLoading ? (
              <div className={styles.loading}><div className={styles.spinner} /><p>Loading schedule...</p></div>
            ) : (
              <div className={styles.weekGrid}>
                {weekDays.map(day => {
                  const iso = toISODate(day);
                  const daySlots = slots.filter(s => s.schedule_date === iso);
                  const dayName = day.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });
                  const isToday = iso === toISODate(new Date());
                  return (
                    <div key={iso} className={`${styles.weekDay} ${isToday ? styles.weekDayToday : ''}`}>
                      <div className={styles.weekDayHeader}>{dayName}</div>
                      {daySlots.length === 0 ? (
                        <div className={styles.weekDayEmpty}>—</div>
                      ) : (
                        daySlots.map(slot => (
                          <div
                            key={slot.id}
                            className={`${styles.slotChip} ${slot.status === 'AVAILABLE' ? styles.slotAvailable : styles.slotOccupied}`}
                          >
                            {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                            <span className={styles.slotStatus}>
                              {slot.status === 'AVAILABLE' ? 'Free' : 'Booked'}
                            </span>
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
