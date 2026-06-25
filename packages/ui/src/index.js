export function loadUIComponents() {
  if (customElements.get('ui-navbar') && customElements.get('ui-footer')) {
    return;
  }

  if (document.head.querySelector('#ui-webcomponent-script')) {
    return;
  }

  const externalScript = document.createElement('script');
  externalScript.setAttribute('id', 'ui-webcomponent-script');
  externalScript.setAttribute('src', '/ui/ui.umd.js');
  externalScript.setAttribute('async', true);
  document.head.appendChild(externalScript);
}

export const GOOGLE_ANALYTICS_ID = 'G-FG59FRR2CB';

export function isAnalyticsEnabled(buildEnv) {
  return buildEnv === 'PRODUCTION';
}

export function loadGoogleAnalytics(buildEnv) {
  if (!isAnalyticsEnabled(buildEnv) || document.getElementById('google-analytics-script')) {
    return;
  }

  window.dataLayer = window.dataLayer || [];

  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  const script = document.createElement('script');
  script.id = 'google-analytics-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  trackGoogleAnalyticsPageView(window.location.pathname + window.location.search, buildEnv);
}

export function trackGoogleAnalyticsPageView(path, buildEnv) {
  if (!isAnalyticsEnabled(buildEnv) || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('config', GOOGLE_ANALYTICS_ID, {
    page_path: path,
  });
}
