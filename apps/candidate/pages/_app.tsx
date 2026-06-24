import 'tailwind/style.css';
import '../custom.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { loadUIComponents } from 'ui';
import PlausibleProvider from 'next-plausible';

const GA_TRACKING_ID = 'G-FG59FRR2CB';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    loadUIComponents();
  });

  useEffect(() => {
    const handleRouteChange = () => {
      const gtag = (window as any).gtag;

      if (typeof gtag === 'function') {
        gtag('config', GA_TRACKING_ID, {
          page_path: window.location.pathname + window.location.search,
        });
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <PlausibleProvider
      enabled={process.env.BUILD_ENV === 'PRODUCTION'}
      domain="bangkokvote69.bangkok.go.th"
      customDomain="https://analytics.punchup.world/js/plausible.js?origin="
    >
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}');
          `,
        }}
      />
      <ui-navbar />
      <Component {...pageProps} />
      {router.pathname !== '/[id]' && <ui-footer />}
    </PlausibleProvider>
  );
}

export default MyApp;
