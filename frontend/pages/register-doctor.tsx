import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { authApi, doctorApi } from '../lib/api';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import styles from '../styles/Auth.module.css';
import { Stethoscope } from 'lucide-react';

export default function RegisterDoctor() {
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
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      // 1. Create Auth Account
      const authRes = await authApi.post('/auth/register', { 
        name: form.name, 
        email: form.email, 
        password: form.password,
        role: 'DOCTOR'
      });
      
      const userId = authRes.data.id;

      // 2. Create Doctor Profile
      await doctorApi.post('/doctors', {
        userId: userId,
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

      setSuccess('Doctor profile created! Redirecting to login...');
      setTimeout(() => router.push('/login'), 1800);
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message || err.message;
      setError(Array.isArray(message) ? message.join(', ') : (message || 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Register as a Doctor — MedPlatform</title></Head>
      <div className={styles.page}>
        <div className={styles.blob} />
        <form className={styles.form} style={{maxWidth: '600px'}} onSubmit={handleSubmit}>
          <div className={styles.icon}>
            <Stethoscope size={32} />
          </div>
          <h1 className={styles.title}>Join as a Doctor</h1>
          <p className={styles.subtitle}>Help patients and manage your appointments easily</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className={styles.fields}>
            <div style={{ gridColumn: '1 / -1' }}><h3 style={{color: 'white', borderBottom: '1px solid #333', paddingBottom: '0.5rem'}}>Account Details</h3></div>
            <Input label="Full Name" name="name" value={form.name} onChange={onChange} placeholder="Dr. John Doe" required />
            <Input label="Email" name="email" type="email" value={form.email} onChange={onChange} placeholder="doctor@email.com" required />
            <Input label="Password" name="password" type="password" value={form.password} onChange={onChange} placeholder="Strong password" required />
            <Input label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} placeholder="Repeat password" required />

            <div style={{ gridColumn: '1 / -1' }}><h3 style={{color: 'white', borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginTop: '1rem'}}>Professional Profile</h3></div>
            <Input label="Specialization" name="specialization" value={form.specialization} onChange={onChange} placeholder="e.g. Cardiology" required />
            <Input label="Years of Experience" name="experienceYears" type="number" value={form.experienceYears} onChange={onChange} placeholder="e.g. 10" required />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.85rem', color: '#999', fontWeight: 500 }}>Professional Description</label>
              <textarea 
                name="professionalDescription" 
                value={form.professionalDescription} 
                onChange={onChange} 
                placeholder="Briefly describe your experience and approach to care..."
                required
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white', minHeight: '80px', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.85rem', color: '#999', fontWeight: 500 }}>Care Type</label>
              <select name="careType" value={form.careType} onChange={onChange} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}>
                <option value="PRESENTIAL">Presential</option>
                <option value="VIRTUAL">Virtual</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            
            <Input label="City" name="city" value={form.city} onChange={onChange} placeholder="e.g. New York" required />
            <div style={{ gridColumn: '1 / -1' }}>
              <Input label="Address" name="address" value={form.address} onChange={onChange} placeholder="Clinic or Hospital Address" required />
            </div>
          </div>

          <div style={{marginTop: '1.5rem'}}>
            <Button type="submit" full disabled={loading}>{loading ? 'Registering...' : 'Register as Doctor'}</Button>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <p className={styles.footer}>
            Already have an account? <Link href="/login">Sign in →</Link>
          </p>
          <p className={styles.footer} style={{marginTop: '0'}}>
            Not a doctor? <Link href="/register">Register as Patient</Link>
          </p>
        </form>
      </div>
    </>
  );
}
