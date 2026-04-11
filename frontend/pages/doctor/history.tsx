import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar/Navbar';
import styles from '../../styles/Pages.module.css';
import { appointmentApi, authApi } from '../../lib/api';
import { ClipboardList, Calendar, Clock, Building2, Monitor, User } from 'lucide-react';

interface TimeBlock {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
}

interface Appointment {
  id: string;
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
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DoctorHistory() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'>('ALL');

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.replace('/login'); return; }
    if (user?.role !== 'DOCTOR') { router.replace('/dashboard'); return; }
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await appointmentApi.get<Appointment[]>(`/doctors/${user.id}/appointments`);
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

  const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
  };

  return (
    <>
      <Head><title>Appointment History — MedPlatform</title></Head>
      <div className={styles.layout}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.welcome}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClipboardList size={26} /> Appointment History
            </h1>
            <p>Full record of all patient appointments</p>
          </div>

          {/* ─── Stats row ─── */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}><span className={styles.statNum}>{stats.total}</span><span className={styles.statLabel}>Total</span></div>
            <div className={styles.statCard}><span className={`${styles.statNum} ${styles.statGreen}`}>{stats.confirmed}</span><span className={styles.statLabel}>Confirmed</span></div>
            <div className={styles.statCard}><span className={`${styles.statNum} ${styles.statBlue}`}>{stats.completed}</span><span className={styles.statLabel}>Completed</span></div>
            <div className={styles.statCard}><span className={`${styles.statNum} ${styles.statRed}`}>{stats.cancelled}</span><span className={styles.statLabel}>Cancelled</span></div>
          </div>

          {/* ─── Filter tabs ─── */}
          <div className={styles.filterTabs}>
            {(['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map(f => (
              <button
                key={f}
                className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* ─── List ─── */}
          {loading ? (
            <div className={styles.loading}><div className={styles.spinner} /><p>Loading history...</p></div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <Calendar size={40} style={{ color: '#555', marginBottom: 12 }} />
              <p>No appointments in this category.</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {filtered.map(apt => (
                <div key={apt.id} className={styles.historyRow}>
                  {/* Date & Time */}
                  <div className={styles.historyDate}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={13} />
                      {apt.time_block ? fmtDate(apt.time_block.schedule_date) : fmtDate(apt.created_at)}
                    </span>
                    {apt.time_block && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--primary-light)', fontWeight: 700 }}>
                        <Clock size={13} />
                        {fmtTime(apt.time_block.start_time)} – {fmtTime(apt.time_block.end_time)}
                      </span>
                    )}
                  </div>

                  {/* Patient */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.88rem' }}>{patientNames[apt.patient_id] || apt.patient_id.slice(0, 8)}</span>
                  </div>

                  {/* Care type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {apt.care_type === 'IN_PERSON' ? <><Building2 size={13}/> In-person</> : <><Monitor size={13}/> Virtual</>}
                  </div>

                  {/* Notes */}
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', flex: 1 }}>
                    {apt.notes || '—'}
                  </div>

                  {/* Status */}
                  <span className={`${styles.badge} ${styles[STATUS_STYLES[apt.status] || 'pending']}`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
