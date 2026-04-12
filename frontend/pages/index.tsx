import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useI18n } from '../lib/i18n';

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) router.replace('/dashboard');
  }, []);

  return (
    <>
      <Head><title>Encuentra a tu medico - {t('home.titleSuffix')}</title></Head>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10 text-center">
        <div className="pointer-events-none absolute -left-28 -top-28 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(115,53,139,0.2),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(170,182,221,0.35),transparent_72%)]" />

        <div className="relative max-w-3xl animate-fade-up">
          <div className="mb-7 inline-block rounded-full border border-brand-700/30 bg-brand-700/10 px-4 py-1.5 text-xs font-semibold tracking-[0.03em] text-brand-700">
            {t('home.badge')}
          </div>

          <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-[-0.03em] text-brand-900 sm:text-6xl">
            {t('home.headingTop')}
            <br />
            <span className="bg-gradient-to-r from-brand-800 to-brand-700 bg-clip-text text-transparent">{t('home.headingGradient')}</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-secondary-graphite/90">
            {t('home.subtitle')}
          </p>

          <div className="mb-14 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-brand-800 to-brand-700 px-8 py-3.5 text-base font-bold text-white shadow-[0_10px_28px_rgba(60,32,82,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(60,32,82,0.35)]"
            >
              {t('home.getStarted')}
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-brand-300/75 bg-white/80 px-8 py-3.5 text-base font-semibold text-brand-900 transition-all duration-200 hover:bg-brand-300/20"
            >
              {t('home.signIn')}
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-secondary-graphite">
            <div className="text-center"><span className="mb-1 block bg-gradient-to-r from-brand-800 to-brand-700 bg-clip-text text-3xl font-extrabold text-transparent">4</span> {t('home.microservices')}</div>
            <div className="text-center"><span className="mb-1 block bg-gradient-to-r from-brand-800 to-brand-700 bg-clip-text text-3xl font-extrabold text-transparent">3</span> {t('home.databases')}</div>
            <div className="text-center"><span className="mb-1 block bg-gradient-to-r from-brand-800 to-brand-700 bg-clip-text text-3xl font-extrabold text-transparent">∞</span> {t('home.appointments')}</div>
          </div>
        </div>
      </div>
    </>
  );
}
