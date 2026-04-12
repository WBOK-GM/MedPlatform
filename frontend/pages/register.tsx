import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { authApi } from '../lib/api';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import { Building2 } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export default function Register() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await authApi.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password
      });
      setSuccess(t('register.created'));
      setTimeout(() => router.push('/login'), 1800);
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : (message || t('register.failed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>{t('register.title')} - Encuentra a tu medico</title></Head>
      <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
        <div className="pointer-events-none fixed -left-20 -top-20 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(115,53,139,0.18),transparent_72%)]" />

        <form className="glass-panel w-full max-w-md animate-fade-up p-10" onSubmit={handleSubmit}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-800 to-brand-700 text-white shadow-[0_8px_20px_rgba(115,53,139,0.28)]">
            <Building2 size={30} />
          </div>
          <h1 className="mb-1 text-center text-3xl font-extrabold tracking-[-0.02em] text-brand-900">{t('register.heading')}</h1>
          <p className="mb-8 text-center text-sm text-secondary-graphite">{t('register.subheading')}</p>

          <div className="mb-6 flex flex-col gap-4">
            <Input label={t('register.fullName')} name="name" value={form.name} onChange={onChange} placeholder={t('register.fullNamePlaceholder')} required />
            <Input label={t('register.email')} name="email" type="email" value={form.email} onChange={onChange} placeholder={t('register.emailPlaceholder')} required />
            <Input label={t('register.password')} name="password" type="password" value={form.password} onChange={onChange} placeholder={t('register.passwordPlaceholder')} required />
            <Input label={t('register.confirmPassword')} name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} placeholder={t('register.confirmPasswordPlaceholder')} required />
          </div>

          <Button type="submit" full disabled={loading}>{loading ? t('register.creating') : t('register.createAccount')}</Button>

          {error && <div className="mt-4 rounded-xl border border-[#c53d3d]/35 bg-[#c53d3d]/10 px-4 py-3 text-center text-sm text-[#8d2222]">{error}</div>}
          {success && <div className="mt-4 rounded-xl border border-[#2f8e4e]/30 bg-[#2f8e4e]/10 px-4 py-3 text-center text-sm text-[#236a3a]">{success}</div>}

          <p className="mt-6 text-center text-sm text-secondary-graphite">
            {t('register.alreadyHave')} <Link href="/login" className="font-semibold text-brand-700 hover:underline">{t('register.signIn')}</Link>
          </p>
          <p className="mt-1 text-center text-sm text-secondary-graphite">
            {t('register.areYouDoctor')} <Link href="/register-doctor" className="font-semibold text-brand-700 hover:underline">{t('register.joinDoctor')}</Link>
          </p>
        </form>
      </div>
    </>
  );
}
