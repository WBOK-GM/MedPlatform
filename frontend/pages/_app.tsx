import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { I18nProvider } from '../lib/i18n';
import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    document.body.classList.add('route-entering');
    const timer = window.setTimeout(() => {
      document.body.classList.remove('route-entering');
    }, 500);

    return () => window.clearTimeout(timer);
  }, [router.asPath]);

  return (
    <I18nProvider>
      <Component {...pageProps} />
    </I18nProvider>
  );
}
