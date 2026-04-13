import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import { appointmentApi, doctorApi } from '../lib/api';
import { Calendar, Clock, Building2, Monitor, Stethoscope } from 'lucide-react';
import { useI18n } from '../lib/i18n';

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
  CONFIRMED: 'bg-[#2f8e4e]/10 text-[#236a3a] border-[#2f8e4e]/25',
  SCHEDULED: 'bg-[#2f8e4e]/10 text-[#236a3a] border-[#2f8e4e]/25',
  CANCELLED: 'bg-[#c53d3d]/10 text-[#8d2222] border-[#c53d3d]/25',
  COMPLETED: 'bg-brand-300/30 text-brand-800 border-brand-300/50',
};

function fmtTime(t?: string) { return t ? t.slice(0, 5) : '-'; }
function fmtDate(d?: string, locale = 'en-US') {
  if (!d) return '-';
  const iso = d.includes('T') ? d : d + 'T00:00:00';
  return new Date(iso).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

    setCurrentUser(storedUser);

    if (!token) {
      router.replace('/login');
      return;
    }

    if (storedUser?.role === 'DOCTOR') {
      router.replace('/doctor/dashboard');
      return;
    }

    fetchAppointments(storedUser?.id);
  }, []);

  const fetchAppointments = async (patientId?: string) => {
    setLoading(true);
    try {
      const { data } = await appointmentApi.get<Appointment[]>('/appointments', {
        params: { patient_id: patientId }
      });
      setAppointments(data);

      const ids = [...new Set(data.map((a: Appointment) => a.doctor_id))];
      const nameMap: Record<string, string> = {};
      await Promise.all(ids.map(async (did) => {
        try {
          const { data: doc } = await doctorApi.get(`/doctors/${did}`);
          nameMap[did] = doc.name || did.slice(0, 8);
        } catch {
          nameMap[did] = 'Dr. -';
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
    if (!confirm(t('dashboard.cancelConfirm'))) return;
    try {
      await appointmentApi.put(`/appointments/${id}/cancel`);
      fetchAppointments(currentUser?.id);
    } catch (e: any) {
      setError(e.response?.data?.detail || t('dashboard.cancelFailed'));
    }
  };

  return (
    <>
      <Head><title>{t('dashboard.title')} - Encuentra a tu medico</title></Head>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 animate-fade-up px-6 py-9 sm:px-8">
          <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-brand-900">{t('dashboard.greeting', { name: currentUser?.email?.split('@')[0] || t('dashboard.fallbackName') })}</h1>
              <p className="mt-1 text-secondary-graphite">{t('dashboard.upcoming')}</p>
            </div>
            <Button onClick={() => router.push('/doctors')}>{t('dashboard.book')}</Button>
          </div>

          {error && <div className="mb-4 rounded-xl border border-[#c53d3d]/35 bg-[#c53d3d]/10 px-4 py-3 text-sm text-[#8d2222]">{error}</div>}

          {loading ? (
            <div className="rounded-2xl border border-brand-300/60 bg-white/80 px-6 py-14 text-center text-secondary-graphite">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-300/40 border-t-brand-700" />
              <p>{t('dashboard.loading')}</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-300/70 bg-white/75 px-6 py-16 text-center text-secondary-graphite">
              <Calendar size={40} className="mx-auto mb-3 text-secondary-gray" />
              <p>{t('dashboard.empty')}</p>
              <div className="mt-5"><Button onClick={() => router.push('/doctors')}>{t('dashboard.browseDoctors')}</Button></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {appointments.map(apt => (
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

                  <div className="mb-3 mt-2 flex items-center gap-1.5 text-sm font-semibold text-secondary-graphite">
                    <Stethoscope size={14} />
                    <span>{doctorNames[apt.doctor_id] ? `Dr. ${doctorNames[apt.doctor_id]}` : t('dashboard.drFallback')}</span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-sm text-secondary-graphite">
                    <span className="flex items-center gap-1.5">
                      {apt.care_type === 'IN_PERSON' ? <><Building2 size={14} /> {t('common.careType.IN_PERSON')}</> : <><Monitor size={14} /> {t('common.careType.VIRTUAL')}</>}
                    </span>
                    {apt.notes && <span><strong className="text-brand-900">{t('dashboard.notes')}</strong> {apt.notes}</span>}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[apt.status] || 'bg-secondary-gray/10 text-secondary-graphite border-secondary-gray/35'}`}>
                      {t(`common.status.${apt.status}`)}
                    </span>
                    {apt.status === 'CONFIRMED' && (
                      <button className="rounded-full border border-[#c53d3d]/40 px-3 py-1 text-xs font-semibold text-[#9b2f2f] transition-all duration-200 hover:bg-[#c53d3d]/10" onClick={() => handleCancel(apt.id)}>{t('dashboard.cancel')}</button>
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
