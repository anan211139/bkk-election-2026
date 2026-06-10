import 'tailwind/style.css';
import '../custom.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { loadUIComponents } from 'ui';
import PlausibleProvider from 'next-plausible';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    loadUIComponents();
  });
  return (
    <PlausibleProvider
      enabled={process.env.BUILD_ENV === 'PRODUCTION'}
      domain="bkkelection2022.wevis.info"
      customDomain="https://analytics.punchup.world/js/plausible.js?origin="
    >
      <ui-navbar />
      <Component {...pageProps} />
      {router.pathname !== '/[id]' && <ui-footer />}
    </PlausibleProvider>
  );
}

export default MyApp;
