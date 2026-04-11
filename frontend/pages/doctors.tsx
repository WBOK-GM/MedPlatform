import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import styles from '../styles/Pages.module.css';
import { doctorApi, appointmentApi } from '../lib/api';
import { 
  HeartPulse, Brain, Baby, Droplet, Stethoscope, 
  MapPin, CheckCircle, Search, Building2, Monitor, Contact
} from 'lucide-react';

interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  careType: string;
  averageRating: number | null;
  reviewCount: number;
  isVerified: boolean;
  location?: { city: string };
}

interface PageResponse {
  content: Doctor[];
  totalElements: number;
  totalPages: number;
  number: number;
}

const getSpecialtyIcon = (spec: string) => {
  const norm = spec.toLowerCase();
  if (norm.includes('cardio')) return <HeartPulse size={48} color="#ff4b4b" />;
  if (norm.includes('neuro')) return <Brain size={48} color="#b388ff" />;
  if (norm.includes('pediat')) return <Baby size={48} color="#ffb74d" />;
  if (norm.includes('derma')) return <Droplet size={48} color="#4fc3f7" />;
  return <Stethoscope size={48} color="#fff" />;
};

export default function Doctors() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [specialization, setSpecialization] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.replace('/login'); return; }
    fetchDoctors();
  }, [page, specialization]);

  const fetchDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, any> = { page, size: 8 };
      if (specialization) params.specialization = specialization;
      const { data } = await doctorApi.get<PageResponse>('/doctors', { params });
      setDoctors(data.content);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      setError('Could not load doctors. Is ms-doctor running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Medical Directory — MedPlatform</title></Head>
      <div className={styles.layout}>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.docHeader}>
            <h1>Medical Directory</h1>
            <p>Find and book a specialist that fits your needs</p>
          </div>

          {/* Search filter */}
          <div className={styles.filters}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: 18, color: '#666' }} />
              <input
                className={styles.searchInput}
                style={{ paddingLeft: 46 }}
                placeholder="Filter by specialization (e.g. Cardiología)..."
                value={specialization}
                onChange={e => { setSpecialization(e.target.value); setPage(0); }}
              />
            </div>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          {loading ? (
            <div className={styles.loading}><div className={styles.spinner} /><p>Loading specialists...</p></div>
          ) : doctors.length === 0 ? (
            <div className={styles.empty}>
              <Contact size={48} style={{ color: '#666', marginBottom: 16 }} />
              <p>No doctors found. Try adjusting your search.</p>
            </div>
          ) : (
            <>
              <div className={styles.docGrid}>
                {doctors.map(doc => (
                  <div key={doc.id} className={styles.docCard}>
                    <div className={styles.docAvatar} style={{display:'flex', alignItems:'center', justifyContent:'center', background:'transparent'}}>
                      {getSpecialtyIcon(doc.specialization)}
                    </div>
                    <div className={styles.docName}>{doc.name}</div>
                    <div className={styles.docSpec}>{doc.specialization}</div>
                    {doc.location?.city && <div className={styles.docCity} style={{display:'flex', alignItems:'center', gap:4, justifyContent:'center'}}>
                      <MapPin size={14}/> {doc.location.city}
                    </div>}
                    <div className={styles.docRating} style={{display:'flex', alignItems:'center', gap:8, justifyContent:'center'}}>
                       ★ {doc.averageRating?.toFixed(1) ?? 'New'} · {doc.reviewCount} reviews
                      {doc.isVerified && <span className={styles.verified} style={{display:'flex', alignItems:'center', gap:4}}><CheckCircle size={12}/> Verified</span>}
                    </div>
                    <div className={styles.docCare} style={{display:'flex', alignItems:'center', gap:6, justifyContent:'center'}}>
                      {doc.careType === 'PRESENTIAL' ? <><Building2 size={16}/> In-person</> : doc.careType === 'VIRTUAL' ? <><Monitor size={16}/> Virtual</> : '🔄 Both'}
                    </div>
                    <Button full onClick={() => router.push(`/book?doctorId=${doc.userId}&doctorName=${encodeURIComponent(doc.name)}`)}>
                      Book Appointment
                    </Button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <Button variant="ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                  <span className={styles.pageInfo}>Page {page + 1} / {totalPages}</span>
                  <Button variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
