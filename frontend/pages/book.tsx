import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import styles from '../styles/Pages.module.css';
import { appointmentApi } from '../lib/api';
import { Building2, Monitor, RefreshCw } from 'lucide-react';

interface TimeBlock {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export default function BookAppointment() {
  const router = useRouter();
  const { doctorId, doctorName } = router.query;

  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<TimeBlock[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [careType, setCareType] = useState('PRESENTIAL');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.replace('/login'); return; }
  }, []);

  const fetchSlots = async () => {
    if (!date || !doctorId) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot('');
    try {
      const { data } = await appointmentApi.get<TimeBlock[]>(`/doctors/${doctorId}/availability`, {
        params: { schedule_date: date }
      });
      setSlots(data);
    } catch {
      setError('Could not load availability.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !doctorId) { setError('Please select a time slot.'); return; }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setLoading(true);
    setError('');
    try {
      await appointmentApi.post('/appointments', {
        patient_id: user.id || user.username || 'patient-1',
        doctor_id: doctorId,
        time_block_id: selectedSlot,
        care_type: careType,
        notes,
      });
      setSuccess('🎉 Appointment booked successfully!');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (e: any) {
      let msg = e.response?.data?.detail || 'Failed to book appointment.';
      if (Array.isArray(msg)) msg = msg.map((m: any) => m.msg || JSON.stringify(m)).join(', ');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Book Appointment — MedPlatform</title></Head>
      <div className={styles.layout}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.bookHeader}>
            <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
            <div>
              <h1>Book an Appointment</h1>
              <p className={styles.bookDoctor}>with <strong>{doctorName || 'your specialist'}</strong></p>
            </div>
          </div>

          <div className={styles.bookCard}>
            {/* Step 1: Date */}
            <div className={styles.bookStep}>
              <div className={styles.stepLabel}>1 — Select a date</div>
              <div className={styles.bookDateRow}>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)}
                />
                <Button variant="accent" onClick={fetchSlots} disabled={!date || loadingSlots}>
                  {loadingSlots ? 'Loading...' : 'Check availability'}
                </Button>
              </div>
            </div>

            {/* Step 2: Time Slots */}
            {slots.length > 0 && (
              <div className={styles.bookStep}>
                <div className={styles.stepLabel}>2 — Choose a time slot</div>
                <div className={styles.slotsGrid}>
                  {slots.map(s => (
                    <button
                      key={s.id}
                      className={`${styles.slot} ${selectedSlot === s.id ? styles.slotActive : ''}`}
                      onClick={() => setSelectedSlot(s.id)}
                    >
                      {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {slots.length === 0 && date && !loadingSlots && (
              <div className={styles.bookStep}>
                <p style={{ color: 'var(--text-muted)' }}>No available slots for this date.</p>
              </div>
            )}

            {/* Step 3: Details */}
            <div className={styles.bookStep}>
              <div className={styles.stepLabel}>3 — Appointment type</div>
              <div className={styles.careSelect}>
                {['IN_PERSON', 'VIRTUAL'].map(ct => (
                  <button
                    key={ct}
                    className={`${styles.careBtn} ${careType === ct ? styles.careBtnActive : ''}`}
                    onClick={() => setCareType(ct)}
                    style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'}}
                  >
                    {ct === 'IN_PERSON' ? <><Building2 size={18}/> In-person</> : <><Monitor size={18}/> Virtual</>}
                  </button>
                ))}
              </div>
              <textarea
                className={styles.notesInput}
                placeholder="Additional notes (symptoms, reason for visit)..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}
            {success && <div className={styles.successBanner}>{success}</div>}

            <Button full onClick={handleBook} disabled={loading || !selectedSlot}>
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
