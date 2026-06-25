import 'tailwind/style.css';
import '../custom.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  loadGoogleAnalytics,
  loadUIComponents,
  trackGoogleAnalyticsPageView,
} from 'ui';
import PlausibleProvider from 'next-plausible';

const BUILD_ENV = process.env.BUILD_ENV;

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    loadUIComponents();
    loadGoogleAnalytics(BUILD_ENV);
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      trackGoogleAnalyticsPageView(
        window.location.pathname + window.location.search,
        BUILD_ENV
      );
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <PlausibleProvider
      enabled={BUILD_ENV === 'PRODUCTION'}
      domain="bangkokvote69.bangkok.go.th"
      customDomain="https://analytics.punchup.world/js/plausible.js?origin="
    >
      <ui-navbar />
      <Component {...pageProps} />
      {router.pathname !== '/[id]' && <ui-footer />}
    </PlausibleProvider>
  );
}

export default MyApp;
