import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import { appointmentApi, authApi } from '../lib/api';
import { Building2, Monitor } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface TimeBlock {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export default function BookAppointment() {
  const router = useRouter();
  const { t } = useI18n();
  const { doctorId, doctorName } = router.query;

  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<TimeBlock[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [careType, setCareType] = useState('IN_PERSON');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    if (!localStorage.getItem('token')) {
      router.replace(`/login?returnTo=${encodeURIComponent(router.asPath)}`);
      return;
    }
    // Obtener email del médico para incluirlo en la notificación
    if (doctorId) {
      authApi.get(`/auth/users/${doctorId}`)
        .then(({ data }) => setDoctorEmail(data.email || ''))
        .catch(() => setDoctorEmail(''));
    }
  }, [router.isReady, router.asPath, router, doctorId]);

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
      setError(t('book.availabilityError'));
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !doctorId) { setError(t('book.selectSlot')); return; }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const patientEmail = user.email || '';
    setLoading(true);
    setError('');
    try {
      await appointmentApi.post('/appointments', {
        patient_id: user.id || user.username || 'patient-1',
        doctor_id: doctorId,
        time_block_id: selectedSlot,
        care_type: careType,
        notes,
        patient_email: patientEmail,
        doctor_email: doctorEmail,
      });
      setSuccess(t('book.booked'));
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (e: any) {
      let msg = e.response?.data?.detail || t('book.bookFailed');
      if (Array.isArray(msg)) msg = msg.map((m: any) => m.msg || JSON.stringify(m)).join(', ');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Head><title>{t('book.title')} - Encuentra a tu medico</title></Head>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 animate-fade-up px-6 py-9 sm:px-8">
          <div className="mb-8 flex items-center gap-4">
            <button className="rounded-xl border border-brand-300/70 px-3.5 py-2 text-sm text-secondary-graphite transition-all duration-200 hover:border-brand-700/50 hover:text-brand-900" onClick={() => router.back()}>{t('book.back')}</button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-brand-900">{t('book.heading')}</h1>
              <p className="mt-1 text-secondary-graphite">{t('book.with', { name: String(doctorName || t('book.defaultDoctor')) })}</p>
            </div>
          </div>

          <div className="flex max-w-3xl flex-col gap-7 rounded-2xl border border-brand-300/60 bg-white/80 p-8 shadow-soft">
            <div className="flex flex-col gap-3">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-brand-700">{t('book.step1')}</div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="date"
                  className="rounded-xl border border-brand-300/60 bg-white/85 px-4 py-2.5 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)}
                />
                <Button variant="accent" onClick={fetchSlots} disabled={!date || loadingSlots}>
                  {loadingSlots ? t('book.loadingSlots') : t('book.checkAvailability')}
                </Button>
              </div>
            </div>

            {slots.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-brand-700">{t('book.step2')}</div>
                <div className="flex flex-wrap gap-2.5">
                  {slots.map(s => (
                    <button
                      key={s.id}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 ${selectedSlot === s.id ? 'border-brand-700 bg-brand-700/10 text-brand-800' : 'border-brand-300/70 bg-white/70 text-secondary-graphite hover:border-brand-700/60 hover:text-brand-900'}`}
                      onClick={() => setSelectedSlot(s.id)}
                    >
                      {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {slots.length === 0 && date && !loadingSlots && (
              <div className="text-sm text-secondary-graphite">{t('book.noSlots')}</div>
            )}

            <div className="flex flex-col gap-3">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-brand-700">{t('book.step3')}</div>
              <div className="flex flex-wrap gap-2.5">
                {['IN_PERSON', 'VIRTUAL', 'HYBRID'].map(ct => (
                  <button
                    key={ct}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 ${careType === ct ? 'border-secondary-amber bg-secondary-sand/35 text-brand-900' : 'border-brand-300/70 bg-white/70 text-secondary-graphite hover:border-secondary-amber/70 hover:text-brand-900'}`}
                    onClick={() => setCareType(ct)}
                  >
                    {ct === 'IN_PERSON'
                      ? <><Building2 size={18} /> {t('common.careType.IN_PERSON')}</>
                      : ct === 'VIRTUAL'
                        ? <><Monitor size={18} /> {t('common.careType.VIRTUAL')}</>
                        : t('common.careType.HYBRID')}
                  </button>
                ))}
              </div>
              <textarea
                className="w-full resize-y rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 placeholder:text-secondary-gray focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
                placeholder={t('book.notesPlaceholder')}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {error && <div className="rounded-xl border border-[#c53d3d]/35 bg-[#c53d3d]/10 px-4 py-3 text-sm text-[#8d2222]">{error}</div>}
            {success && <div className="rounded-xl border border-[#2f8e4e]/30 bg-[#2f8e4e]/10 px-4 py-3 text-sm text-[#236a3a]">{success}</div>}

            <Button full onClick={handleBook} disabled={loading || !selectedSlot}>
              {loading ? t('book.booking') : t('book.confirm')}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
