import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Image as ImageIcon, UserRoundPen } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import { doctorApi } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { COLOMBIA_DEPARTMENTS, getCitiesByDepartment } from '../../lib/colombia-locations';

interface DoctorImage {
  url?: string;
}

interface DoctorProfile {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  experienceYears: number;
  professionalDescription: string;
  careType: 'IN_PERSON' | 'VIRTUAL' | 'HYBRID';
  location?: {
    city?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    coordinates?: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  images?: DoctorImage[];
}

interface EditForm {
  name: string;
  specialization: string;
  experienceYears: string;
  professionalDescription: string;
  careType: 'IN_PERSON' | 'VIRTUAL' | 'HYBRID';
  department: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  imageUrl: string;
}

function findDepartmentByCity(city?: string): string {
  if (!city) return '';
  const normalized = city.trim().toLowerCase();
  const match = COLOMBIA_DEPARTMENTS.find((department) =>
    getCitiesByDepartment(department).some((departmentCity) => departmentCity.toLowerCase() === normalized)
  );

  return match || '';
}

function buildForm(profile: DoctorProfile): EditForm {
  const city = profile.location?.city || '';
  return {
    name: profile.name || '',
    specialization: profile.specialization || '',
    experienceYears: String(profile.experienceYears ?? 0),
    professionalDescription: profile.professionalDescription || '',
    careType: profile.careType || 'VIRTUAL',
    department: findDepartmentByCity(city),
    city,
    address: profile.location?.address || '',
    latitude: profile.location?.latitude != null ? String(profile.location.latitude) : '',
    longitude: profile.location?.longitude != null ? String(profile.location.longitude) : '',
    imageUrl: profile.images?.[0]?.url || '',
  };
}

export default function DoctorProfilePage() {
  const router = useRouter();
  const { t } = useI18n();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const citiesForDepartment = useMemo(() => {
    if (!form?.department) return [];
    return getCitiesByDepartment(form.department);
  }, [form?.department]);

  const selectableCities = useMemo(() => {
    if (!form) return [];
    if (form.careType === 'VIRTUAL') return ['Virtual'];
    if (!form.city || citiesForDepartment.includes(form.city)) return citiesForDepartment;
    return [form.city, ...citiesForDepartment];
  }, [citiesForDepartment, form]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token) {
      router.replace('/login');
      return;
    }

    if (storedUser?.role !== 'DOCTOR') {
      router.replace('/dashboard');
      return;
    }

    const fetchDoctorProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await doctorApi.get<DoctorProfile>(`/doctors/user/${storedUser.id}`);
        setDoctor(data);
        setForm(buildForm(data));
      } catch {
        setDoctor(null);
        setForm(null);
        setError(t('doctorProfile.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, [router]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!form) return;
    setForm((current) => current ? { ...current, [e.target.name]: e.target.value } : current);
  };

  const onTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!form) return;
    setForm((current) => current ? { ...current, [e.target.name]: e.target.value } : current);
  };

  const onCareTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!form) return;
    const nextCareType = e.target.value as EditForm['careType'];
    setForm((current) => {
      if (!current) return current;
      if (nextCareType === 'VIRTUAL') {
        return {
          ...current,
          careType: nextCareType,
          department: '',
          city: 'Virtual',
          address: t('registerDoctor.virtualAddressDefault'),
          latitude: '',
          longitude: '',
        };
      }
      return {
        ...current,
        careType: nextCareType,
        city: current.city === 'Virtual' ? '' : current.city,
      };
    });
  };

  const onDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!form) return;
    const nextDepartment = e.target.value;
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        department: nextDepartment,
        city: '',
      };
    });
  };

  const handleCancelEdit = () => {
    if (!doctor) return;
    setForm(buildForm(doctor));
    setEditing(false);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!doctor || !form) return;

    setSaving(true);
    setError('');
    setSuccess('');

    if (form.careType !== 'VIRTUAL' && (!form.department || !form.city || !form.address.trim())) {
      setError(t('registerDoctor.locationRequiredForInPerson'));
      setSaving(false);
      return;
    }

    const latitude = form.latitude ? Number(form.latitude) : null;
    const longitude = form.longitude ? Number(form.longitude) : null;
    const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
    const composedAddress = form.careType === 'VIRTUAL'
      ? t('registerDoctor.virtualAddressDefault')
      : [form.address.trim(), form.city.trim(), form.department.trim()].filter(Boolean).join(', ');

    try {
      await doctorApi.put(`/doctors/${doctor.id}`, {
        userId: doctor.userId,
        name: form.name,
        specialization: form.specialization,
        experienceYears: Number(form.experienceYears) || 0,
        professionalDescription: form.professionalDescription,
        careType: form.careType,
        location: {
          city: form.careType === 'VIRTUAL' ? 'Virtual' : form.city,
          address: composedAddress,
          latitude: hasCoords ? latitude : null,
          longitude: hasCoords ? longitude : null,
          ...(hasCoords ? { coordinates: { type: 'Point', coordinates: [longitude, latitude] } } : {})
        }
      });

      const previousImage = doctor.images?.[0]?.url || '';
      const nextImage = form.imageUrl.trim();
      if (nextImage && nextImage !== previousImage) {
        await doctorApi.post(`/doctors/${doctor.id}/images`, null, {
          params: {
            url: nextImage,
            title: 'Profile image',
            description: 'Main profile image'
          }
        });
      }

      const { data: refreshed } = await doctorApi.get<DoctorProfile>(`/doctors/user/${doctor.userId}`);
      setDoctor(refreshed);
      setForm(buildForm(refreshed));
      setEditing(false);
      setSuccess(t('doctorProfile.saved'));
    } catch {
      setError(t('doctorProfile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const displayName = doctor?.name || '-';
  const displayImage = doctor?.images?.[0]?.url;
  const fallbackInitial = displayName.trim().charAt(0).toUpperCase() || 'D';

  if (loading) {
    return (
      <>
        <Head><title>{t('doctorProfile.title')} - Encuentra a tu medico</title></Head>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-6 py-9 sm:px-8">
            <div className="rounded-2xl border border-brand-300/60 bg-white/80 px-6 py-14 text-center text-secondary-graphite">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-300/40 border-t-brand-700" />
              <p>{t('doctorProfile.loading')}</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>{t('doctorProfile.title')} - Encuentra a tu medico</title></Head>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 animate-fade-up px-6 py-9 sm:px-8">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-[-0.03em] text-brand-900">
                <UserRoundPen size={26} /> {t('doctorProfile.heading')}
              </h1>
              <p className="mt-1 text-secondary-graphite">{t('doctorProfile.subtitle')}</p>
            </div>

            {!editing ? (
              <Button onClick={() => setEditing(true)}>{t('doctorProfile.edit')}</Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={handleCancelEdit} disabled={saving}>{t('doctorProfile.cancel')}</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? t('doctorProfile.saving') : t('doctorProfile.save')}</Button>
              </div>
            )}
          </div>

          {error && <div className="mb-4 rounded-xl border border-[#c53d3d]/35 bg-[#c53d3d]/10 px-4 py-3 text-sm text-[#8d2222]">{error}</div>}
          {success && <div className="mb-4 rounded-xl border border-[#2f8e4e]/30 bg-[#2f8e4e]/10 px-4 py-3 text-sm text-[#236a3a]">{success}</div>}

          {!doctor || !form ? (
            <div className="rounded-2xl border border-dashed border-brand-300/70 bg-white/75 px-6 py-16 text-center text-secondary-graphite">
              <p>{t('doctorProfile.notFound')}</p>
            </div>
          ) : (
            <section className="rounded-2xl border border-brand-300/60 bg-white/80 p-6 shadow-soft">
              <div className="mb-6 flex flex-col items-start gap-4 border-b border-brand-300/60 pb-5 md:flex-row md:items-center">
                {displayImage ? (
                  <img src={displayImage} alt={displayName} className="h-20 w-20 rounded-2xl border border-brand-300/60 object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-brand-300/60 bg-brand-300/20 text-2xl font-bold text-brand-900">
                    {fallbackInitial}
                  </div>
                )}

                <div>
                  <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-brand-900">{displayName}</h2>
                  <p className="mt-1 text-secondary-graphite">{doctor.specialization}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label={t('doctorProfile.name')} name="name" value={form.name} onChange={onInputChange} required disabled={!editing} />
                <Input label={t('doctorProfile.specialization')} name="specialization" value={form.specialization} onChange={onInputChange} required disabled={!editing} />
                <Input label={t('doctorProfile.experienceYears')} name="experienceYears" type="number" value={form.experienceYears} onChange={onInputChange} required disabled={!editing} />

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('doctorProfile.careType')}</label>
                  <select
                    value={form.careType}
                    onChange={onCareTypeChange}
                    disabled={!editing}
                    className="w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <option value="IN_PERSON">{t('common.careType.IN_PERSON')}</option>
                    <option value="VIRTUAL">{t('common.careType.VIRTUAL')}</option>
                    <option value="HYBRID">{t('common.careType.HYBRID')}</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('doctorProfile.professionalDescription')}</label>
                  <textarea
                    name="professionalDescription"
                    value={form.professionalDescription}
                    onChange={onTextAreaChange}
                    disabled={!editing}
                    className="min-h-28 w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 placeholder:text-secondary-gray focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('registerDoctor.department')}</label>
                  <select
                    value={form.department}
                    onChange={onDepartmentChange}
                    disabled={!editing || form.careType === 'VIRTUAL'}
                    className="w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <option value="">{t('registerDoctor.departmentPlaceholder')}</option>
                    {COLOMBIA_DEPARTMENTS.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary-graphite/80">{t('doctorProfile.city')}</label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm((current) => current ? { ...current, city: e.target.value } : current)}
                    disabled={!editing || (form.careType !== 'VIRTUAL' && !form.department)}
                    className="w-full rounded-xl border border-brand-300/60 bg-white/80 px-4 py-3 text-sm text-brand-900 outline-none transition-all duration-200 focus:border-brand-700 focus:ring-4 focus:ring-brand-300/35 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {form.careType !== 'VIRTUAL' && <option value="">{t('registerDoctor.cityPlaceholder')}</option>}
                    {selectableCities.map((cityOption) => (
                      <option key={cityOption} value={cityOption}>{cityOption}</option>
                    ))}
                  </select>
                </div>

                <Input label={t('doctorProfile.address')} name="address" value={form.address} onChange={onInputChange} required disabled={!editing || form.careType === 'VIRTUAL'} />
                <Input label={t('doctorProfile.latitude')} name="latitude" value={form.latitude} onChange={onInputChange} disabled={!editing} />
                <Input label={t('doctorProfile.longitude')} name="longitude" value={form.longitude} onChange={onInputChange} disabled={!editing} />

                <div className="md:col-span-2">
                  <Input label={t('doctorProfile.imageUrl')} name="imageUrl" value={form.imageUrl} onChange={onInputChange} disabled={!editing} />
                  <div className="mt-1 flex items-center gap-2 text-xs text-secondary-graphite/80">
                    <ImageIcon size={14} />
                    <span>{t('doctorProfile.imageHint')}</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
