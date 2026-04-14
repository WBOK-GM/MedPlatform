import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import { doctorApi } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { COLOMBIA_DEPARTMENTS, getCitiesByDepartment } from '../lib/colombia-locations';
import {
  HeartPulse, Brain, Baby, Droplet, Stethoscope,
  MapPin, CheckCircle, Search, Building2, Monitor, Contact, Map
} from 'lucide-react';

const DoctorResultsMap = dynamic(
  () => import('../components/DoctorResultsMap/DoctorResultsMap'),
  { ssr: false }
);

interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  experienceYears: number;
  professionalDescription: string;
  careType: string;
  averageRating: number | null;
  reviewCount: number;
  isVerified: boolean;
  images?: Array<{
    url?: string;
  }>;
  location?: {
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

interface PageResponse {
  content: Doctor[];
  totalPages: number;
  totalElements: number;
}

const SPECIALIZATIONS = [
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Gastroenterologia',
  'Ginecologia',
  'Medicina General',
  'Neurologia',
  'Nutricion',
  'Oftalmologia',
  'Oncologia',
  'Ortopedia',
  'Otorrinolaringologia',
  'Pediatria',
  'Psicologia',
  'Psiquiatria',
  'Urologia',
];

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
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);

  const [specialization, setSpecialization] = useState('');
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');
  const [careType, setCareType] = useState<'IN_PERSON' | 'VIRTUAL' | 'HYBRID' | ''>('');

  const cities = useMemo(() => getCitiesByDepartment(department), [department]);

  useEffect(() => {
    if (!router.isReady) return;

    const specializationParam = typeof router.query.specialization === 'string' ? router.query.specialization : '';
    const cityParam = typeof router.query.city === 'string' ? router.query.city : '';
    const careTypeParam = typeof router.query.careType === 'string' ? router.query.careType : '';
    const pageParam = typeof router.query.page === 'string' ? Number(router.query.page) : 0;

    setSpecialization(specializationParam);
    setCity(cityParam);
    setCareType(careTypeParam === 'IN_PERSON' || careTypeParam === 'VIRTUAL' || careTypeParam === 'HYBRID' ? careTypeParam : '');
    setPage(Number.isFinite(pageParam) && pageParam >= 0 ? pageParam : 0);

    if (cityParam) {
      const matchedDepartment = COLOMBIA_DEPARTMENTS.find((dep) => getCitiesByDepartment(dep).includes(cityParam)) || '';
      setDepartment(matchedDepartment);
    } else {
      setDepartment('');
    }

    fetchDoctors({
      page: Number.isFinite(pageParam) && pageParam >= 0 ? pageParam : 0,
      specialization: specializationParam,
      city: cityParam,
      careType: careTypeParam,
    });
  }, [router.isReady, router.query]);

  const fetchDoctors = async ({
    page: pageArg,
    specialization: specializationArg,
    city: cityArg,
    careType: careTypeArg,
  }: {
    page: number;
    specialization?: string;
    city?: string;
    careType?: string;
  }) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page: pageArg, size: 10 };
      if (specializationArg?.trim()) params.specialization = specializationArg.trim();
      if (cityArg?.trim()) params.city = cityArg.trim();
      if (careTypeArg === 'IN_PERSON' || careTypeArg === 'VIRTUAL' || careTypeArg === 'HYBRID') params.careType = careTypeArg;

      const { data } = await doctorApi.get<PageResponse>('/doctors', { params });
      setDoctors(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setError(t('doctors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const updateQueryAndSearch = (nextPage: number) => {
    const query: Record<string, string> = { page: String(nextPage) };
    if (specialization.trim()) query.specialization = specialization.trim();
    if (city) query.city = city;
    if (careType) query.careType = careType;

    router.push({ pathname: '/doctors', query });
  };

  const mapDoctors = doctors
    .filter((doc) => Number.isFinite(doc.location?.latitude) && Number.isFinite(doc.location?.longitude))
    .map((doc) => ({
      id: doc.id,
      name: doc.name,
      specialization: doc.specialization,
      city: doc.location?.city,
      latitude: Number(doc.location?.latitude),
      longitude: Number(doc.location?.longitude),
    }));

  return (
    <>
      <Head><title>{t('doctors.title')} - Encuentra a tu medico</title></Head>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 animate-fade-up px-6 py-9 sm:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-brand-900">{t('doctors.title')}</h1>
            <p className="mt-1 text-secondary-graphite">{t('doctors.subtitle')}</p>
          </div>

          <section className="mb-6 rounded-2xl border border-brand-300/60 bg-white/85 p-4 shadow-soft">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.3fr_1fr_1fr_1fr_auto] md:items-end">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('home.specializationLabel')}</label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
                >
                  <option value="">{t('home.specializationPlaceholder')}</option>
                  {SPECIALIZATIONS.map((specializationItem) => (
                    <option key={specializationItem} value={specializationItem}>{specializationItem}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('home.departmentLabel')}</label>
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setCity('');
                  }}
                  className="w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
                >
                  <option value="">{t('home.departmentPlaceholder')}</option>
                  {COLOMBIA_DEPARTMENTS.map((departmentItem) => (
                    <option key={departmentItem} value={departmentItem}>{departmentItem}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('home.cityLabel')}</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!department}
                  className="w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35 disabled:cursor-not-allowed disabled:opacity-65"
                >
                  <option value="">{t('home.cityPlaceholder')}</option>
                  {cities.map((cityItem) => (
                    <option key={cityItem} value={cityItem}>{cityItem}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('home.careTypeLabel')}</label>
                <select
                  value={careType}
                  onChange={(e) => setCareType(e.target.value as 'IN_PERSON' | 'VIRTUAL' | 'HYBRID' | '')}
                  className="w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
                >
                  <option value="">{t('doctors.careTypeAny')}</option>
                  <option value="IN_PERSON">{t('common.careType.IN_PERSON')}</option>
                  <option value="VIRTUAL">{t('common.careType.VIRTUAL')}</option>
                  <option value="HYBRID">{t('common.careType.HYBRID')}</option>
                </select>
              </div>

              <Button onClick={() => updateQueryAndSearch(0)} className="h-[46px] w-full md:w-auto">
                <Search size={16} /> {t('home.searchCta')}
              </Button>
            </div>
          </section>

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
              <div className="mb-4 text-sm text-secondary-graphite">
                {t('doctors.resultsCount', { count: totalElements })}
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <div className="flex flex-col gap-4">
                  {doctors.map((doc) => (
                    <article key={doc.id} className="rounded-2xl border border-brand-300/60 bg-white/80 p-6 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        {doc.images?.[0]?.url ? (
                          <img
                            src={doc.images[0].url}
                            alt={doc.name}
                            className="h-16 w-16 shrink-0 rounded-2xl border border-brand-300/60 object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-brand-300/60 bg-brand-300/10">
                            {getSpecialtyIcon(doc.specialization)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 text-xl font-bold text-brand-900">{doc.name}</div>
                          <div className="mb-2 text-sm font-semibold text-brand-700">{doc.specialization}</div>

                          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-secondary-graphite">
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={13} /> {doc.location?.city || t('doctors.locationUnknown')}
                            </span>
                            {doc.isVerified && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#2f8e4e]/30 bg-[#2f8e4e]/10 px-2 py-0.5 text-xs text-[#236a3a]">
                                <CheckCircle size={11} /> {t('doctors.verified')}
                              </span>
                            )}
                          </div>

                          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-secondary-graphite">
                            <span className="font-semibold text-secondary-amber">★ {doc.averageRating?.toFixed(1) ?? t('doctors.new')} · {doc.reviewCount} {t('doctors.reviews')}</span>
                            <span>{doc.experienceYears ?? 0} {t('doctors.experienceYears')}</span>
                          </div>

                          <div className="mb-4 flex items-center gap-1.5 text-sm text-secondary-graphite">
                            {doc.careType === 'IN_PERSON' || doc.careType === 'PRESENTIAL'
                              ? <><Building2 size={15} /> {t('common.careType.IN_PERSON')}</>
                              : doc.careType === 'VIRTUAL'
                                ? <><Monitor size={15} /> {t('common.careType.VIRTUAL')}</>
                                : t('common.careType.HYBRID')}
                          </div>

                          <p className="mb-4 line-clamp-2 text-sm text-secondary-graphite">{doc.professionalDescription}</p>

                          <Button onClick={() => router.push(`/book?doctorId=${doc.userId}&doctorName=${encodeURIComponent(doc.name)}`)}>
                            {t('doctors.book')}
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <aside className="xl:sticky xl:top-20 xl:self-start">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-900">
                    <Map size={16} /> {t('doctors.mapTitle')}
                  </div>
                  <DoctorResultsMap doctors={mapDoctors} emptyText={t('doctors.mapEmpty')} />
                </aside>
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <Button variant="ghost" disabled={page === 0} onClick={() => updateQueryAndSearch(page - 1)}>{t('doctors.prev')}</Button>
                  <span className="text-sm text-secondary-graphite">{t('doctors.page', { current: page + 1, total: totalPages })}</span>
                  <Button variant="ghost" disabled={page >= totalPages - 1} onClick={() => updateQueryAndSearch(page + 1)}>{t('doctors.next')}</Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
