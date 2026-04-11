import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from './Navbar.module.css';
import { Building2, User } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setIsAuth(!!localStorage.getItem('token'));
    setUser(JSON.parse(localStorage.getItem('user') || 'null'));
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isActive = (path: string) => router.pathname === path;

  return (
    <nav className={styles.nav}>
      <Link href={isAuth ? '/dashboard' : '/'} className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Building2 size={24} /> MedPlatform
      </Link>

      <div className={styles.links}>
        {isAuth ? (
          <>
            {user && <span className={styles.user} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={16} /> {user.email || user.name}</span>}

            {user?.role === 'DOCTOR' ? (
              <>
                <Link href="/doctor/dashboard" className={`${styles.link} ${isActive('/doctor/dashboard') ? styles.linkActive : ''}`}>My Portal</Link>
                <Link href="/doctor/history" className={`${styles.link} ${isActive('/doctor/history') ? styles.linkActive : ''}`}>Appointment History</Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className={`${styles.link} ${isActive('/dashboard') ? styles.linkActive : ''}`}>Dashboard</Link>
                <Link href="/doctors" className={`${styles.link} ${isActive('/doctors') ? styles.linkActive : ''}`}>Doctors</Link>
              </>
            )}

            <button className={styles.logoutBtn} onClick={logout}>Logout</button>
          </>

        ) : (
          <>
            <Link href="/login" className={`${styles.link} ${isActive('/login') ? styles.linkActive : ''}`}>Login</Link>
            <Link href="/register" className={`${styles.link} ${isActive('/register') ? styles.linkActive : ''}`}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
