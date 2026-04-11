import axios from 'axios';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001';
const DOCTOR_URL = process.env.NEXT_PUBLIC_DOCTOR_URL || 'http://localhost:3002';
const APPOINTMENT_URL = process.env.NEXT_PUBLIC_APPOINTMENT_URL || 'http://localhost:3003';

export const authApi = axios.create({ baseURL: AUTH_URL, headers: { 'Content-Type': 'application/json' } });
export const doctorApi = axios.create({ baseURL: DOCTOR_URL, headers: { 'Content-Type': 'application/json' } });
export const appointmentApi = axios.create({ baseURL: APPOINTMENT_URL, headers: { 'Content-Type': 'application/json' } });

const addToken = (config: any) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

authApi.interceptors.request.use(addToken);
doctorApi.interceptors.request.use(addToken);
appointmentApi.interceptors.request.use(addToken);
