import 'tailwind/style.css';
import '../custom.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  loadAnalyticsWithConsent,
  loadUIComponents,
  trackGoogleAnalyticsPageView,
} from 'ui';

const BUILD_ENV = process.env.BUILD_ENV;

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    loadUIComponents();
    return loadAnalyticsWithConsent(BUILD_ENV);
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      const pagePath = window.location.pathname + window.location.search;

      trackGoogleAnalyticsPageView(
        pagePath,
        BUILD_ENV
      );
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <ui-navbar />
      <Component {...pageProps} />
      {router.pathname !== '/[id]' && <ui-footer />}
    </>
  );
}

export default MyApp;
