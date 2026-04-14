import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { authApi, doctorApi } from '../lib/api';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import Navbar from '../components/Navbar/Navbar';
import { Stethoscope } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import {
  buildAddressFromNominatim,
  geocodeAddress,
  reverseGeocode
} from '../lib/geocoding';
import { COLOMBIA_DEPARTMENTS, getCitiesByDepartment } from '../lib/colombia-locations';

const SPECIALTIES = [
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

const LocationPickerMap = dynamic(
  () => import('../components/LocationPickerMap/LocationPickerMap'),
  { ssr: false }
);

export default function RegisterDoctor() {
  const { t, language } = useI18n();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phoneNumber: '', profileImageUrl: '',
    specialization: '', experienceYears: '', professionalDescription: '',
    careType: 'VIRTUAL',
    department: '', city: '',
    addressLine: '', addressComplement: '', mapAddress: '',
    latitude: '', longitude: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const router = useRouter();

  const citiesForDepartment = getCitiesByDepartment(form.department);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onCareTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCareType = e.target.value;
    setForm((f) => ({
      ...f,
      careType: nextCareType,
      ...(nextCareType === 'VIRTUAL'
        ? {
            department: '',
            city: '',
            addressLine: '',
            addressComplement: '',
            mapAddress: '',
            latitude: '',
            longitude: ''
          }
        : {})
    }));
  };

  const onDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextDepartment = e.target.value;
    setForm((f) => ({ ...f, department: nextDepartment, city: '' }));
  };

  const parseCoords = () => {
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    return { latitude, longitude, hasCoordinates };
  };

  const requireLocation = form.careType !== 'VIRTUAL';

  const buildComposedAddress = () => {
    const base = form.addressLine.trim();
    const complement = form.addressComplement.trim();
    const city = form.city.trim();
    const department = form.department.trim();

    const street = [base, complement].filter(Boolean).join(' ');
    return [street, city, department].filter(Boolean).join(', ');
  };

  const buildMapSearchAddress = () => {
    const base = form.addressLine.trim();
    const city = form.city.trim();
    const department = form.department.trim();

    return [base, city, department].filter(Boolean).join(', ');
  };

  const handleMapPick = async (latitude: number, longitude: number) => {
    setError('');
    setForm(f => ({
      ...f,
      latitude: String(latitude),
      longitude: String(longitude)
    }));

    setSearchingLocation(true);
    try {
      const result = await reverseGeocode(latitude, longitude, language);
      if (result) {
        setForm(f => ({
          ...f,
          latitude: String(latitude),
          longitude: String(longitude),
          mapAddress: buildAddressFromNominatim(result) || f.mapAddress
        }));
      }
    } catch {
      setError(t('registerDoctor.reverseFailed'));
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSearchLocation = async () => {
    const primaryAddress = form.addressLine.trim();
    const queryCandidates = [
      [primaryAddress, form.city, form.department].filter(Boolean).join(', '),
      [primaryAddress, form.city, form.department, 'Colombia'].filter(Boolean).join(', '),
      [primaryAddress, form.city].filter(Boolean).join(', '),
      [primaryAddress, form.department, 'Colombia'].filter(Boolean).join(', '),
      primaryAddress
    ].filter(Boolean);

    if (!primaryAddress) {
      setError(t('registerDoctor.locationSearchRequired'));
      return;
    }

    setError('');
    setSearchingLocation(true);
    try {
      let result = null;
      for (const query of queryCandidates) {
        result = await geocodeAddress(query, language);
        if (result) break;
      }

      if (!result) {
        setError(t('registerDoctor.locationSearchNoResults'));
        return;
      }

      setForm(f => ({
        ...f,
        mapAddress: buildAddressFromNominatim(result) || f.mapAddress,
        latitude: result.lat,
        longitude: result.lon
      }));
    } catch {
      setError(t('registerDoctor.locationSearchFailed'));
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }

    const { latitude, longitude, hasCoordinates } = parseCoords();
    if (requireLocation && (!form.department || !form.city || !form.addressLine.trim() || !hasCoordinates)) {
      setError(t('registerDoctor.locationRequiredForInPerson'));
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
        phoneNumber: form.phoneNumber || undefined,
        profileImageUrl: form.profileImageUrl || undefined,
        specialization: form.specialization,
        experienceYears: parseInt(form.experienceYears, 10) || 0,
        professionalDescription: form.professionalDescription,
        careType: form.careType,
        location: {
          city: requireLocation ? form.city : 'Virtual',
          address: requireLocation ? buildComposedAddress() : t('registerDoctor.virtualAddressDefault'),
          latitude: hasCoordinates ? latitude : null,
          longitude: hasCoordinates ? longitude : null,
          ...(hasCoordinates
            ? { coordinates: { type: 'Point', coordinates: [longitude, latitude] } }
            : {})
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
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="relative flex flex-1 items-center justify-center px-6 py-10">
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
            <Input label={t('registerDoctor.phoneNumber')} name="phoneNumber" value={form.phoneNumber} onChange={onChange} placeholder={t('registerDoctor.phoneNumberPlaceholder')} />
            <Input label={t('registerDoctor.profileImageUrl')} name="profileImageUrl" value={form.profileImageUrl} onChange={onChange} placeholder={t('registerDoctor.profileImageUrlPlaceholder')} />
            <Input label={t('register.password')} name="password" type="password" value={form.password} onChange={onChange} placeholder={t('register.passwordPlaceholder')} required />
            <Input label={t('register.confirmPassword')} name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} placeholder={t('register.confirmPasswordPlaceholder')} required />

            <div className="md:col-span-2 mt-2 border-b border-brand-300/60 pb-2 text-sm font-bold text-brand-800">{t('registerDoctor.profile')}</div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('registerDoctor.specialization')}</label>
              <select
                name="specialization"
                value={form.specialization}
                onChange={onChange}
                required
                className="w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
              >
                <option value="">{t('registerDoctor.specializationPlaceholder')}</option>
                {SPECIALTIES.map((specialty) => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>
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

            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('registerDoctor.careType')}</label>
              <select
                name="careType"
                value={form.careType}
                onChange={onCareTypeChange}
                className="w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
              >
                <option value="IN_PERSON">{t('common.careType.IN_PERSON')}</option>
                <option value="VIRTUAL">{t('common.careType.VIRTUAL')}</option>
                <option value="HYBRID">{t('common.careType.HYBRID')}</option>
              </select>
            </div>

            {requireLocation && (
              <>
                <div className="md:col-span-2 mt-2 border-b border-brand-300/60 pb-2 text-sm font-bold text-brand-800">{t('registerDoctor.locationSection')}</div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80" htmlFor="department">{t('registerDoctor.department')}</label>
                  <select
                    id="department"
                    value={form.department}
                    onChange={onDepartmentChange}
                    className="w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
                    required
                  >
                    <option value="">{t('registerDoctor.departmentPlaceholder')}</option>
                    {COLOMBIA_DEPARTMENTS.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80" htmlFor="city">{t('registerDoctor.city')}</label>
                  <select
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!form.department}
                    required
                  >
                    <option value="">{t('registerDoctor.cityPlaceholder')}</option>
                    {citiesForDepartment.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <Input
                    label={t('registerDoctor.addressLine')}
                    name="addressLine"
                    value={form.addressLine}
                    onChange={onChange}
                    placeholder={t('registerDoctor.addressLinePlaceholder')}
                    required
                  />
                  <span className="mt-1 block text-xs text-secondary-graphite/80">{t('registerDoctor.addressUsageHint')}</span>
                </div>

                <div className="md:col-span-2">
                  <Input
                    label={t('registerDoctor.addressComplement')}
                    name="addressComplement"
                    value={form.addressComplement}
                    onChange={onChange}
                    placeholder={t('registerDoctor.addressComplementPlaceholder')}
                  />
                </div>

                <div className="md:col-span-2 mt-2 border-b border-brand-300/60 pb-2 text-sm font-bold text-brand-800">{t('registerDoctor.mapSection')}</div>

                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('registerDoctor.locationSearch')}</label>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <input
                      className="w-full rounded-xl border border-brand-300/60 bg-gray-200 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 placeholder:text-secondary-gray focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35"
                      value={buildMapSearchAddress()}
                      readOnly
                      placeholder={t('registerDoctor.locationSearchPlaceholder')}
                    />
                    <Button type="button" variant="accent" onClick={handleSearchLocation} disabled={searchingLocation}>
                      {searchingLocation ? t('registerDoctor.searchingAddress') : t('registerDoctor.searchOnMap')}
                    </Button>
                  </div>
                  <span className="text-xs text-secondary-graphite/80">{t('registerDoctor.mapHint')}</span>
                </div>

                <div className="md:col-span-2">
                  <LocationPickerMap
                    latitude={form.latitude ? Number(form.latitude) : null}
                    longitude={form.longitude ? Number(form.longitude) : null}
                    onPick={handleMapPick}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80" htmlFor="latitude">{t('registerDoctor.latitude')}</label>
                  <input
                    id="latitude"
                    value={form.latitude}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-brand-300/60 bg-brand-300/10 px-4 py-3 text-sm text-brand-900 outline-none"
                    placeholder={t('registerDoctor.latitudePlaceholder')}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80" htmlFor="longitude">{t('registerDoctor.longitude')}</label>
                  <input
                    id="longitude"
                    value={form.longitude}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-brand-300/60 bg-brand-300/10 px-4 py-3 text-sm text-brand-900 outline-none"
                    placeholder={t('registerDoctor.longitudePlaceholder')}
                  />
                </div>
              </>
            )}
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
        </main>
      </div>
    </>
  );
}
