import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useI18n } from '../../lib/i18n';

export default function OAuthCallback() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;

    const token = typeof router.query.token === 'string' ? router.query.token : '';
    const role = typeof router.query.role === 'string' ? router.query.role : '';
    const email = typeof router.query.email === 'string' ? router.query.email : '';

    if (!token) {
      setError(t('oauth.failed'));
      return;
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ email, role }));

    if (role === 'DOCTOR') {
      router.replace('/doctor/dashboard');
    } else {
      router.replace('/dashboard');
    }
  }, [router.isReady, router.query]);

  return (
    <>
      <Head><title>Google - Encuentra a tu medico</title></Head>
      <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
        <div className="glass-panel w-full max-w-md animate-fade-up p-10 text-center">
          {error ? (
            <p className="text-sm text-[#8d2222]">{error}</p>
          ) : (
            <p className="text-sm text-secondary-graphite">{t('oauth.connecting')}</p>
          )}
        </div>
      </div>
    </>
  );
}
