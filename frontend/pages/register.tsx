import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { authApi } from '../lib/api';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import styles from '../styles/Auth.module.css';
import { Building2 } from 'lucide-react';

export default function Register() {
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
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authApi.post('/auth/register', { 
        name: form.name, 
        email: form.email, 
        password: form.password 
      });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => router.push('/login'), 1800);
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : (message || 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Register — MedPlatform</title></Head>
      <div className={styles.page}>
        <div className={styles.blob} />
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.icon}>
            <Building2 size={32} />
          </div>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join MedPlatform and take control of your health</p>

          <div className={styles.fields}>
             <Input label="Full Name" name="name" value={form.name} onChange={onChange} placeholder="John Doe" required />
            <Input label="Email" name="email" type="email" value={form.email} onChange={onChange} placeholder="your@email.com" required />
            <Input label="Password" name="password" type="password" value={form.password} onChange={onChange} placeholder="Create a strong password" required />
            <Input label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} placeholder="Repeat password" required />
          </div>

          <Button type="submit" full disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</Button>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <p className={styles.footer}>
            Already have an account? <Link href="/login">Sign in →</Link>
          </p>
          <p className={styles.footer} style={{marginTop: '0'}}>
            Are you a medical professional? <Link href="/register-doctor">Join as a Doctor</Link>
          </p>
        </form>
      </div>
    </>
  );
}
