import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) router.replace('/dashboard');
  }, []);

  return (
    <>
      <Head><title>MedPlatform — Smart Medical Appointments</title></Head>
      <div className={styles.hero}>
        <div className={styles.bgBlob1} />
        <div className={styles.bgBlob2} />

        <div className={`${styles.content} fade-up`}>
          <div className={styles.badge}>Microservice Architecture · Powered by Spring Boot & FastAPI</div>
          <h1 className={styles.title}>
            Your Health,<br/>
            <span className={styles.gradient}>Managed Smartly</span>
          </h1>
          <p className={styles.subtitle}>
            Book appointments with top specialists, manage your schedule, and receive real-time notifications — all in one place.
          </p>
          <div className={styles.actions}>
            <Link href="/register" className={styles.btnPrimary}>Get Started →</Link>
            <Link href="/login" className={styles.btnGhost}>Sign In</Link>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}><span>4</span> Microservices</div>
            <div className={styles.stat}><span>3</span> Databases</div>
            <div className={styles.stat}><span>∞</span> Appointments</div>
          </div>
        </div>
      </div>
    </>
  );
}
