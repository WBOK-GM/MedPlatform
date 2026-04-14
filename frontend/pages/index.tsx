import Head from 'next/head';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import { useI18n } from '../lib/i18n';
import { COLOMBIA_DEPARTMENTS, getCitiesByDepartment } from '../lib/colombia-locations';
import { CheckCircle, Search, ShieldCheck, Stethoscope, UsersRound } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();
  const [specialization, setSpecialization] = useState('');
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');
  const [careType, setCareType] = useState<'IN_PERSON' | 'VIRTUAL' | 'HYBRID'>('IN_PERSON');

  const cities = useMemo(() => getCitiesByDepartment(department), [department]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query: Record<string, string> = { page: '0' };
    if (specialization.trim()) query.specialization = specialization.trim();
    if (city) query.city = city;
    if (careType) query.careType = careType;

    router.push({ pathname: '/doctors', query });
  };

  const handleDepartmentChange = (value: string) => {
    setDepartment(value);
    setCity('');
  };

  return (
    <>
      <Head><title>Encuentra a tu medico - {t('home.titleSuffix')}</title></Head>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="relative flex-1 overflow-hidden px-6 py-10 sm:px-8">
          <div className="pointer-events-none absolute -left-28 -top-28 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(115,53,139,0.2),transparent_70%)]" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(170,182,221,0.35),transparent_72%)]" />

          <div className="mx-auto w-full max-w-7xl animate-fade-up">
            <section className="rounded-3xl border border-brand-300/60 bg-white/80 p-7 shadow-soft sm:p-10">
              <h1 className="mb-4 max-w-4xl text-4xl font-extrabold leading-tight tracking-[-0.03em] text-brand-900 sm:text-5xl lg:text-6xl">
                {t('home.headingTop')}
                <br />
                <span className="bg-gradient-to-r from-brand-800 to-brand-700 bg-clip-text text-transparent">{t('home.headingGradient')}</span>
              </h1>

              <p className="mb-8 max-w-3xl text-lg leading-relaxed text-secondary-graphite/90">
                {t('home.subtitle')}
              </p>

              <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 rounded-2xl border border-brand-300/60 bg-white/90 p-4 md:grid-cols-[1.3fr_1fr_1fr_1fr_auto] md:items-end">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('home.specializationLabel')}</label>
                  <input
                    className="w-full rounded-xl border border-brand-300/60 bg-white/90 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 placeholder:text-secondary-gray focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
                    placeholder={t('home.specializationPlaceholder')}
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('home.departmentLabel')}</label>
                  <select
                    value={department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full rounded-xl border border-brand-300/60 bg-white/90 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
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
                    className="w-full rounded-xl border border-brand-300/60 bg-white/90 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35 disabled:cursor-not-allowed disabled:opacity-65"
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
                    onChange={(e) => setCareType(e.target.value as 'IN_PERSON' | 'VIRTUAL' | 'HYBRID')}
                    className="w-full rounded-xl border border-brand-300/60 bg-white/90 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
                  >
                    <option value="IN_PERSON">{t('common.careType.IN_PERSON')}</option>
                    <option value="VIRTUAL">{t('common.careType.VIRTUAL')}</option>
                    <option value="HYBRID">{t('common.careType.HYBRID')}</option>
                  </select>
                </div>

                <Button type="submit" className="h-[46px] w-full md:w-auto">
                  <Search size={16} /> {t('home.searchCta')}
                </Button>
              </form>
            </section>

            <section className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              <article className="rounded-2xl border border-brand-300/60 bg-white/80 p-6 shadow-soft">
                <div className="mb-3 inline-flex rounded-xl bg-brand-300/20 p-2.5 text-brand-800"><Stethoscope size={20} /></div>
                <h2 className="mb-2 text-xl font-bold text-brand-900">{t('home.info1Title')}</h2>
                <p className="text-sm leading-relaxed text-secondary-graphite">{t('home.info1Text')}</p>
              </article>

              <article className="rounded-2xl border border-brand-300/60 bg-white/80 p-6 shadow-soft">
                <div className="mb-3 inline-flex rounded-xl bg-brand-300/20 p-2.5 text-brand-800"><UsersRound size={20} /></div>
                <h2 className="mb-2 text-xl font-bold text-brand-900">{t('home.info2Title')}</h2>
                <p className="text-sm leading-relaxed text-secondary-graphite">{t('home.info2Text')}</p>
              </article>

              <article className="rounded-2xl border border-brand-300/60 bg-white/80 p-6 shadow-soft">
                <div className="mb-3 inline-flex rounded-xl bg-brand-300/20 p-2.5 text-brand-800"><ShieldCheck size={20} /></div>
                <h2 className="mb-2 text-xl font-bold text-brand-900">{t('home.info3Title')}</h2>
                <p className="text-sm leading-relaxed text-secondary-graphite">{t('home.info3Text')}</p>
              </article>
            </section>

            <section className="mt-10 rounded-2xl border border-brand-300/60 bg-white/80 p-6 shadow-soft sm:p-8">
              <h2 className="mb-4 text-2xl font-extrabold tracking-[-0.02em] text-brand-900">{t('home.howTitle')}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-brand-300/55 bg-white/85 p-4">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">1</div>
                  <p className="text-sm text-secondary-graphite">{t('home.howStep1')}</p>
                </div>
                <div className="rounded-xl border border-brand-300/55 bg-white/85 p-4">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">2</div>
                  <p className="text-sm text-secondary-graphite">{t('home.howStep2')}</p>
                </div>
                <div className="rounded-xl border border-brand-300/55 bg-white/85 p-4">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">3</div>
                  <p className="text-sm text-secondary-graphite">{t('home.howStep3')}</p>
                </div>
              </div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#2f8e4e]/35 bg-[#2f8e4e]/10 px-4 py-2 text-sm text-[#236a3a]">
                <CheckCircle size={16} /> {t('home.howHint')}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
