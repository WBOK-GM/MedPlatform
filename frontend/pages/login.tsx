import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { authApi } from '../lib/api';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import styles from '../styles/Auth.module.css';
import { Lock } from 'lucide-react';

export default function Login() {
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
      
      if (data.user?.role === 'DOCTOR') {
        router.push('/doctor/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Login — MedPlatform</title></Head>
      <div className={styles.page}>
        <div className={styles.blob} />
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.icon}>
            <Lock size={32} />
          </div>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to your account to continue</p>

          <div className={styles.fields}>
            <Input label="Email" name="email" type="email" value={form.email} onChange={onChange} placeholder="your@email.com" required />
            <Input label="Password" name="password" type="password" value={form.password} onChange={onChange} placeholder="••••••••" required />
          </div>

          <Button type="submit" full disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>

          {error && <div className={styles.error}>{error}</div>}

          <p className={styles.footer}>
            Don't have an account? <Link href="/register">Create one →</Link>
          </p>
        </form>
      </div>
    </>
  );
}
