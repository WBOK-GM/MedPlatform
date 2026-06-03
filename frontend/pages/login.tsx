import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { authApi } from '../lib/api';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import { Lock } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export default function Login() {
  const { t } = useI18n();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.post('/auth/login', form);
      localStorage.setItem('token', data.token || data.access_token || data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user || { email: form.email }));

      const returnTo = typeof router.query.returnTo === 'string' ? router.query.returnTo : '';
      const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '';
      if (safeReturnTo) {
        router.push(safeReturnTo);
        return;
      }

      if (data.user?.role === 'DOCTOR') {
        router.push('/doctor/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>{t('login.title')} - Encuentra a tu medico</title></Head>
      <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
        <div className="pointer-events-none fixed -left-20 -top-20 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(115,53,139,0.18),transparent_72%)]" />

        <form className="glass-panel w-full max-w-md animate-fade-up p-10" onSubmit={handleSubmit}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-800 to-brand-700 text-white shadow-[0_8px_20px_rgba(115,53,139,0.28)]">
            <Lock size={30} />
          </div>
          <h1 className="mb-1 text-center text-3xl font-extrabold tracking-[-0.02em] text-brand-900">{t('login.heading')}</h1>
          <p className="mb-8 text-center text-sm text-secondary-graphite">{t('login.subheading')}</p>

          <div className="mb-6 flex flex-col gap-4">
            <Input label={t('login.email')} name="email" type="email" value={form.email} onChange={onChange} placeholder={t('login.emailPlaceholder')} required />
            <Input label={t('login.password')} name="password" type="password" value={form.password} onChange={onChange} placeholder="••••••••" required />
          </div>

          <Button type="submit" full disabled={loading}>{loading ? t('login.signingIn') : t('login.signIn')}</Button>

          <div className="my-5 flex items-center gap-3 text-xs text-secondary-graphite">
            <span className="h-px flex-1 bg-brand-300/60" />
            {t('login.or')}
            <span className="h-px flex-1 bg-brand-300/60" />
          </div>

          <a
            href={`${process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001'}/auth/google`}
            className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-brand-300/80 bg-white/75 px-6 py-2.5 text-sm font-semibold text-brand-900 transition-all duration-200 hover:bg-brand-300/25"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            {t('login.continueWithGoogle')}
          </a>

          {error && <div className="mt-4 rounded-xl border border-[#c53d3d]/35 bg-[#c53d3d]/10 px-4 py-3 text-center text-sm text-[#8d2222]">{error}</div>}

          <p className="mt-6 text-center text-sm text-secondary-graphite">
            {t('login.noAccount')} <Link href="/register" className="font-semibold text-brand-700 hover:underline">{t('login.createOne')}</Link>
          </p>
        </form>
      </div>
    </>
  );
}
