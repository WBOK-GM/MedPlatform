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

          {error && <div className="mt-4 rounded-xl border border-[#c53d3d]/35 bg-[#c53d3d]/10 px-4 py-3 text-center text-sm text-[#8d2222]">{error}</div>}

          <p className="mt-6 text-center text-sm text-secondary-graphite">
            {t('login.noAccount')} <Link href="/register" className="font-semibold text-brand-700 hover:underline">{t('login.createOne')}</Link>
          </p>
        </form>
      </div>
    </>
  );
}
