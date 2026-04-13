import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar/Navbar';
import { appointmentApi, authApi } from '../../lib/api';
import { ClipboardList, Calendar, Clock, Building2, Monitor, User } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

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

export default function DoctorHistory() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'>('ALL');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

    setCurrentUser(storedUser);

    if (!token) { router.replace('/login'); return; }
    if (storedUser?.role !== 'DOCTOR') { router.replace('/dashboard'); return; }
    fetchHistory(storedUser?.id);
  }, []);

  const fetchHistory = async (doctorId?: string) => {
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

  const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
  };

  return (
    <>
      <Head><title>{t('doctorHistory.title')} - Encuentra a tu medico</title></Head>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 animate-fade-up px-6 py-9 sm:px-8">
          <div className="mb-7">
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-[-0.03em] text-brand-900">
              <ClipboardList size={26} /> {t('doctorHistory.heading')}
            </h1>
            <p className="mt-1 text-secondary-graphite">{t('doctorHistory.subtitle')}</p>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            <div className="rounded-xl border border-brand-300/60 bg-white/80 px-5 py-3 text-center">
              <span className="block text-3xl font-extrabold text-brand-900">{stats.total}</span>
              <span className="text-xs uppercase tracking-[0.05em] text-secondary-graphite">{t('doctorHistory.total')}</span>
            </div>
            <div className="rounded-xl border border-brand-300/60 bg-white/80 px-5 py-3 text-center">
              <span className="block text-3xl font-extrabold text-[#236a3a]">{stats.confirmed}</span>
              <span className="text-xs uppercase tracking-[0.05em] text-secondary-graphite">{t('doctorHistory.confirmed')}</span>
            </div>
            <div className="rounded-xl border border-brand-300/60 bg-white/80 px-5 py-3 text-center">
              <span className="block text-3xl font-extrabold text-brand-800">{stats.completed}</span>
              <span className="text-xs uppercase tracking-[0.05em] text-secondary-graphite">{t('doctorHistory.completed')}</span>
            </div>
            <div className="rounded-xl border border-brand-300/60 bg-white/80 px-5 py-3 text-center">
              <span className="block text-3xl font-extrabold text-[#8d2222]">{stats.cancelled}</span>
              <span className="text-xs uppercase tracking-[0.05em] text-secondary-graphite">{t('doctorHistory.cancelled')}</span>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {(['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map(f => (
              <button
                key={f}
                className={`rounded-full border px-4 py-1.5 text-sm transition-all duration-200 ${filter === f ? 'border-brand-700 bg-brand-700/10 font-semibold text-brand-800' : 'border-brand-300/70 text-secondary-graphite hover:border-brand-700/55 hover:text-brand-900'}`}
                onClick={() => setFilter(f)}
              >
                {t(`common.status.${f}`)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-brand-300/60 bg-white/80 px-6 py-14 text-center text-secondary-graphite">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-300/40 border-t-brand-700" />
              <p>{t('doctorHistory.loading')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-300/70 bg-white/75 px-6 py-16 text-center text-secondary-graphite">
              <Calendar size={40} className="mx-auto mb-3 text-secondary-gray" />
              <p>{t('doctorHistory.empty')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(apt => (
                <div key={apt.id} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-brand-300/60 bg-white/80 p-4 md:grid-cols-[minmax(180px,_auto)_minmax(180px,_auto)_140px_1fr_auto] md:gap-4">
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="flex items-center gap-1.5 text-brand-900"><Calendar size={13} />{apt.time_block ? fmtDate(apt.time_block.schedule_date, locale) : fmtDate(apt.created_at, locale)}</span>
                    {apt.time_block && (
                      <span className="flex items-center gap-1.5 font-bold text-brand-700"><Clock size={13} />{fmtTime(apt.time_block.start_time)} - {fmtTime(apt.time_block.end_time)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-secondary-graphite">
                    <User size={14} />
                    <span>{patientNames[apt.patient_id] || apt.patient_id.slice(0, 8)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-secondary-graphite">
                    {apt.care_type === 'IN_PERSON' ? <><Building2 size={13} /> {t('common.careType.IN_PERSON')}</> : <><Monitor size={13} /> {t('common.careType.VIRTUAL')}</>}
                  </div>

                  <div className="text-sm text-secondary-graphite">{apt.notes || '-'}</div>

                  <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[apt.status] || 'bg-secondary-gray/10 text-secondary-graphite border-secondary-gray/35'}`}>
                    {t(`common.status.${apt.status}`)}
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
