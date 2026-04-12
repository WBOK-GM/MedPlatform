import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { authApi, doctorApi } from '../lib/api';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import { Stethoscope } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export default function RegisterDoctor() {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    specialization: '', experienceYears: '', professionalDescription: '',
    careType: 'VIRTUAL', city: '', address: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
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
      const authRes = await authApi.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'DOCTOR'
      });

      const userId = authRes.data.id;

      await doctorApi.post('/doctors', {
        userId,
        name: form.name,
        email: form.email,
        specialization: form.specialization,
        experienceYears: parseInt(form.experienceYears, 10) || 0,
        professionalDescription: form.professionalDescription,
        careType: form.careType,
        location: {
          city: form.city,
          address: form.address,
          latitude: 0,
          longitude: 0
        }
      });

      setSuccess(t('registerDoctor.created'));
      setTimeout(() => router.push('/login'), 1800);
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message || err.message;
      setError(Array.isArray(message) ? message.join(', ') : (message || t('registerDoctor.failed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>{t('registerDoctor.title')} - Encuentra a tu medico</title></Head>
      <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
        <div className="pointer-events-none fixed -left-20 -top-20 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(115,53,139,0.18),transparent_72%)]" />

        <form className="glass-panel w-full max-w-3xl animate-fade-up p-10" onSubmit={handleSubmit}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-800 to-brand-700 text-white shadow-[0_8px_20px_rgba(115,53,139,0.28)]">
            <Stethoscope size={30} />
          </div>
          <h1 className="mb-1 text-center text-3xl font-extrabold tracking-[-0.02em] text-brand-900">{t('registerDoctor.heading')}</h1>
          <p className="mb-8 text-center text-sm text-secondary-graphite">{t('registerDoctor.subheading')}</p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2 border-b border-brand-300/60 pb-2 text-sm font-bold text-brand-800">{t('registerDoctor.accountDetails')}</div>

            <Input label={t('register.fullName')} name="name" value={form.name} onChange={onChange} placeholder={t('register.fullNamePlaceholder')} required />
            <Input label={t('register.email')} name="email" type="email" value={form.email} onChange={onChange} placeholder={t('register.emailPlaceholder')} required />
            <Input label={t('register.password')} name="password" type="password" value={form.password} onChange={onChange} placeholder={t('register.passwordPlaceholder')} required />
            <Input label={t('register.confirmPassword')} name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} placeholder={t('register.confirmPasswordPlaceholder')} required />

            <div className="md:col-span-2 mt-2 border-b border-brand-300/60 pb-2 text-sm font-bold text-brand-800">{t('registerDoctor.profile')}</div>
            <Input label={t('registerDoctor.specialization')} name="specialization" value={form.specialization} onChange={onChange} placeholder={t('registerDoctor.specializationPlaceholder')} required />
            <Input label={t('registerDoctor.yearsExperience')} name="experienceYears" type="number" value={form.experienceYears} onChange={onChange} placeholder={t('registerDoctor.yearsExperiencePlaceholder')} required />

            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('registerDoctor.profDescription')}</label>
              <textarea
                name="professionalDescription"
                value={form.professionalDescription}
                onChange={onChange}
                placeholder={t('registerDoctor.profDescriptionPlaceholder')}
                required
                className="min-h-24 w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 placeholder:text-secondary-gray focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('registerDoctor.careType')}</label>
              <select
                name="careType"
                value={form.careType}
                onChange={onChange}
                className="w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
              >
                <option value="PRESENTIAL">{t('common.careType.PRESENTIAL')}</option>
                <option value="VIRTUAL">{t('common.careType.VIRTUAL')}</option>
                <option value="BOTH">{t('common.careType.BOTH')}</option>
              </select>
            </div>

            <Input label={t('registerDoctor.city')} name="city" value={form.city} onChange={onChange} placeholder={t('registerDoctor.cityPlaceholder')} required />
            <div className="md:col-span-2">
              <Input label={t('registerDoctor.address')} name="address" value={form.address} onChange={onChange} placeholder={t('registerDoctor.addressPlaceholder')} required />
            </div>
          </div>

          <div className="mt-6">
            <Button type="submit" full disabled={loading}>{loading ? t('registerDoctor.registering') : t('registerDoctor.submit')}</Button>
          </div>

          {error && <div className="mt-4 rounded-xl border border-[#c53d3d]/35 bg-[#c53d3d]/10 px-4 py-3 text-center text-sm text-[#8d2222]">{error}</div>}
          {success && <div className="mt-4 rounded-xl border border-[#2f8e4e]/30 bg-[#2f8e4e]/10 px-4 py-3 text-center text-sm text-[#236a3a]">{success}</div>}

          <p className="mt-6 text-center text-sm text-secondary-graphite">
            {t('registerDoctor.alreadyHave')} <Link href="/login" className="font-semibold text-brand-700 hover:underline">{t('registerDoctor.signIn')}</Link>
          </p>
          <p className="mt-1 text-center text-sm text-secondary-graphite">
            {t('registerDoctor.notDoctor')} <Link href="/register" className="font-semibold text-brand-700 hover:underline">{t('registerDoctor.registerPatient')}</Link>
          </p>
        </form>
      </div>
    </>
  );
}
