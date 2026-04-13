import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import { doctorApi } from '../lib/api';
import { useI18n } from '../lib/i18n';
import {
  HeartPulse, Brain, Baby, Droplet, Stethoscope,
  MapPin, CheckCircle, Search, Building2, Monitor, Contact
} from 'lucide-react';

interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  careType: string;
  averageRating: number | null;
  reviewCount: number;
  isVerified: boolean;
  location?: { city: string };
}

interface PageResponse {
  content: Doctor[];
  totalElements: number;
  totalPages: number;
  number: number;
}

const getSpecialtyIcon = (spec: string) => {
  const norm = spec.toLowerCase();
  if (norm.includes('cardio')) return <HeartPulse size={44} color="#D89524" />;
  if (norm.includes('neuro')) return <Brain size={44} color="#73358B" />;
  if (norm.includes('pediat')) return <Baby size={44} color="#DDCC72" />;
  if (norm.includes('derma')) return <Droplet size={44} color="#AAB6DD" />;
  return <Stethoscope size={44} color="#3C2052" />;
};

export default function Doctors() {
  const router = useRouter();
  const { t } = useI18n();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [specialization, setSpecialization] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.replace('/login'); return; }
    fetchDoctors();
  }, [page, specialization]);

  const fetchDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, any> = { page, size: 8 };
      if (specialization) params.specialization = specialization;
      const { data } = await doctorApi.get<PageResponse>('/doctors', { params });
      setDoctors(data.content);
      setTotalPages(data.totalPages);
    } catch {
      setError(t('doctors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>{t('doctors.title')} - Encuentra a tu medico</title></Head>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 animate-fade-up px-6 py-9 sm:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-brand-900">{t('doctors.title')}</h1>
            <p className="mt-1 text-secondary-graphite">{t('doctors.subtitle')}</p>
          </div>

          <div className="mb-6">
            <div className="relative w-full">
              <Search size={18} className="absolute left-4 top-3.5 text-secondary-gray" />
              <input
                className="w-full rounded-xl border border-brand-300/60 bg-white/80 py-3 pl-11 pr-4 text-sm text-brand-900 outline-none transition-all duration-200 placeholder:text-secondary-gray focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
                placeholder={t('doctors.filterPlaceholder')}
                value={specialization}
                onChange={e => { setSpecialization(e.target.value); setPage(0); }}
              />
            </div>
          </div>

          {error && <div className="mb-4 rounded-xl border border-[#c53d3d]/35 bg-[#c53d3d]/10 px-4 py-3 text-sm text-[#8d2222]">{error}</div>}

          {loading ? (
            <div className="rounded-2xl border border-brand-300/60 bg-white/80 px-6 py-14 text-center text-secondary-graphite">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-300/40 border-t-brand-700" />
              <p>{t('doctors.loading')}</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-300/70 bg-white/75 px-6 py-16 text-center text-secondary-graphite">
              <Contact size={44} className="mx-auto mb-3 text-secondary-gray" />
              <p>{t('doctors.empty')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {doctors.map(doc => (
                  <div key={doc.id} className="rounded-2xl border border-brand-300/60 bg-white/80 p-6 text-center shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-glass">
                    <div className="mb-4 flex h-14 items-center justify-center">
                      {getSpecialtyIcon(doc.specialization)}
                    </div>
                    <div className="mb-1 text-lg font-bold text-brand-900">{doc.name}</div>
                    <div className="mb-3 text-sm font-semibold text-brand-700">{doc.specialization}</div>
                    {doc.location?.city && (
                      <div className="mb-2 flex items-center justify-center gap-1 text-xs text-secondary-graphite">
                        <MapPin size={13} /> {doc.location.city}
                      </div>
                    )}
                    <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-secondary-amber">
                      <span>★ {doc.averageRating?.toFixed(1) ?? t('doctors.new')} · {doc.reviewCount} {t('doctors.reviews')}</span>
                      {doc.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#2f8e4e]/30 bg-[#2f8e4e]/10 px-2 py-0.5 text-xs text-[#236a3a]">
                          <CheckCircle size={11} /> {t('doctors.verified')}
                        </span>
                      )}
                    </div>
                    <div className="mb-4 flex items-center justify-center gap-1.5 text-sm text-secondary-graphite">
                      {doc.careType === 'IN_PERSON' || doc.careType === 'PRESENTIAL'
                        ? <><Building2 size={15} /> {t('common.careType.IN_PERSON')}</>
                        : doc.careType === 'VIRTUAL'
                          ? <><Monitor size={15} /> {t('common.careType.VIRTUAL')}</>
                          : t('common.careType.HYBRID')}
                    </div>
                    <Button full onClick={() => router.push(`/book?doctorId=${doc.userId}&doctorName=${encodeURIComponent(doc.name)}`)}>
                      {t('doctors.book')}
                    </Button>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <Button variant="ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>{t('doctors.prev')}</Button>
                  <span className="text-sm text-secondary-graphite">{t('doctors.page', { current: page + 1, total: totalPages })}</span>
                  <Button variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>{t('doctors.next')}</Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
