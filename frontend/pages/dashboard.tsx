import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import styles from '../styles/Pages.module.css';
import { appointmentApi, doctorApi } from '../lib/api';
import { Calendar, Clock, Building2, Monitor, Stethoscope } from 'lucide-react';

interface TimeBlock {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
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
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.replace('/login'); return; }
    if (user?.role === 'DOCTOR') { router.replace('/doctor/dashboard'); return; }
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await appointmentApi.get<Appointment[]>('/appointments', {
        params: { patient_id: user?.id }
      });
      setAppointments(data);

      // Fetch doctor names for unique doctor_ids
      const ids = [...new Set(data.map((a: Appointment) => a.doctor_id))];
      const nameMap: Record<string, string> = {};
      await Promise.all(ids.map(async (did) => {
        try {
          const { data: doc } = await doctorApi.get(`/doctors/${did}`);
          nameMap[did] = doc.name || did.slice(0, 8);
        } catch {
          nameMap[did] = 'Dr. —';
        }
      }));
      setDoctorNames(nameMap);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await appointmentApi.put(`/appointments/${id}/cancel`);
      fetchAppointments();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to cancel.');
    }
  };

  return (
    <>
      <Head><title>Dashboard — MedPlatform</title></Head>
      <div className={styles.layout}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.topBar}>
            <div className={styles.welcome}>
              <h1>Hey, <span>{user?.email?.split('@')[0] || 'there'}</span></h1>
              <p>Your upcoming appointments</p>
            </div>
            <Button onClick={() => router.push('/doctors')}>+ Book Appointment</Button>
          </div>

          {error && <div className={styles.errorBanner} style={{ marginBottom: 16 }}>{error}</div>}

          {loading ? (
            <div className={styles.loading}><div className={styles.spinner} /><p>Loading your appointments...</p></div>
          ) : appointments.length === 0 ? (
            <div className={styles.empty}>
              <Calendar size={40} style={{ color: '#555', marginBottom: 12 }} />
              <p>No appointments yet.</p>
              <div style={{ marginTop: 20 }}><Button onClick={() => router.push('/doctors')}>Browse Doctors</Button></div>
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {appointments.map(apt => (
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

                  {/* Doctor name */}
                  <div className={styles.aptDoc} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <Stethoscope size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {doctorNames[apt.doctor_id] ? `Dr. ${doctorNames[apt.doctor_id]}` : 'Dr. —'}
                    </span>
                  </div>

                  <div className={styles.aptInfo}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {apt.care_type === 'IN_PERSON' ? <><Building2 size={14}/> In-person</> : <><Monitor size={14}/> Virtual</>}
                    </span>
                    {apt.notes && <span><strong>Notes:</strong> {apt.notes}</span>}
                  </div>

                  <div className={styles.aptActions}>
                    <span className={`${styles.badge} ${styles[STATUS_STYLES[apt.status] || 'pending']}`}>
                      {apt.status}
                    </span>
                    {apt.status === 'CONFIRMED' && (
                      <button className={styles.cancelBtn} onClick={() => handleCancel(apt.id)}>Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
