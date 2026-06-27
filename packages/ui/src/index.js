export function loadUIComponents() {
  installAnalyticsConsentSettingsHandler();

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
export const PLAUSIBLE_SCRIPT_URL = 'https://plausible.io/js/pa-cXX45NtKK22gafkcYZwUj.js';
const ANALYTICS_CONSENT_KEY = 'bkk-election-analytics-consent';
const ANALYTICS_CONSENT_GRANTED = 'granted';
const ANALYTICS_CONSENT_DENIED = 'denied';
const ANALYTICS_CONSENT_EVENT = 'bkk-election:analytics-consent-changed';

export function isAnalyticsEnabled(buildEnv) {
  return buildEnv === 'PRODUCTION';
}

export function hasAnalyticsConsent() {
  return getAnalyticsConsent() === ANALYTICS_CONSENT_GRANTED;
}

export function getAnalyticsConsent() {
  try {
    return window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  } catch (error) {
    return null;
  }
}

export function setAnalyticsConsent(isGranted) {
  const value = isGranted ? ANALYTICS_CONSENT_GRANTED : ANALYTICS_CONSENT_DENIED;

  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch (error) {
    // If storage is unavailable, keep the choice for this page view only.
  }

  window.dispatchEvent(
    new CustomEvent(ANALYTICS_CONSENT_EVENT, {
      detail: { value },
    })
  );
}

export function onAnalyticsConsentChange(callback) {
  const handler = (event) => {
    callback(event.detail?.value === ANALYTICS_CONSENT_GRANTED);
  };

  window.addEventListener(ANALYTICS_CONSENT_EVENT, handler);

  return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, handler);
}

export function showAnalyticsConsentBanner() {
  showAnalyticsConsentPreferences(false);
}

export function showAnalyticsConsentPreferences(force = true) {
  if (
    (!force && getAnalyticsConsent()) ||
    document.getElementById('analytics-consent-banner')
  ) {
    return;
  }

  const banner = document.createElement('section');
  banner.id = 'analytics-consent-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', 'การยินยอมให้ใช้คุกกี้วิเคราะห์การใช้งาน');
  banner.innerHTML = `
    <div class="analytics-consent-banner__content">
      <strong>การใช้คุกกี้เพื่อวิเคราะห์การใช้งาน</strong>
      <p>
        เว็บไซต์นี้ขอใช้เครื่องมือวิเคราะห์การใช้งาน เช่น Google Analytics
        เพื่อดูสถิติการเข้าชมและปรับปรุงบริการ
        ระบบจะไม่เปิดใช้งานคุกกี้วิเคราะห์จนกว่าคุณจะกดยินยอม
        และคุณสามารถเปลี่ยนการตั้งค่านี้ได้ภายหลังจากส่วนท้ายของเว็บไซต์
      </p>
    </div>
    <div class="analytics-consent-banner__actions">
      <button type="button" data-consent-action="deny">ปฏิเสธ</button>
      <button type="button" data-consent-action="accept">ยินยอม</button>
    </div>
  `;

  const style = document.createElement('style');
  style.id = 'analytics-consent-banner-style';
  style.textContent = `
    #analytics-consent-banner {
      position: fixed;
      left: 16px;
      right: 16px;
      bottom: 16px;
      z-index: 2147483647;
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
      max-width: 880px;
      margin: 0 auto;
      padding: 16px;
      color: #111827;
      background: #ffffff;
      border: 1px solid rgba(17, 24, 39, 0.12);
      border-radius: 8px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
      font-family: "Anuphan", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    #analytics-consent-banner strong {
      display: block;
      margin-bottom: 4px;
      font-size: 16px;
      line-height: 1.35;
    }

    #analytics-consent-banner p {
      margin: 0;
      font-size: 14px;
      line-height: 1.55;
      color: #374151;
    }

    .analytics-consent-banner__actions {
      display: flex;
      flex-shrink: 0;
      gap: 8px;
    }

    #analytics-consent-banner button {
      min-width: 92px;
      padding: 10px 14px;
      border: 1px solid #111827;
      border-radius: 6px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }

    #analytics-consent-banner button[data-consent-action="deny"] {
      color: #111827;
      background: #ffffff;
    }

    #analytics-consent-banner button[data-consent-action="accept"] {
      color: #ffffff;
      background: #111827;
    }

    @media (max-width: 640px) {
      #analytics-consent-banner {
        flex-direction: column;
        align-items: stretch;
      }

      .analytics-consent-banner__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
    }
  `;

  banner.addEventListener('click', (event) => {
    const action = event.target?.getAttribute?.('data-consent-action');

    if (!action) return;

    setAnalyticsConsent(action === 'accept');
    banner.remove();
  });

  if (!document.getElementById(style.id)) {
    document.head.appendChild(style);
  }

  document.body.appendChild(banner);
}

export function loadAnalyticsWithConsent(buildEnv) {
  loadPlausibleAnalytics(buildEnv);

  if (!hasAnalyticsConsent()) {
    showAnalyticsConsentBanner();
  }

  if (!isAnalyticsEnabled(buildEnv)) {
    return;
  }

  if (hasAnalyticsConsent()) {
    loadGoogleAnalytics(buildEnv);
    return;
  }

  return onAnalyticsConsentChange((isGranted) => {
    if (isGranted) {
      loadGoogleAnalytics(buildEnv);
    }
  });
}

export function loadPlausibleAnalytics(buildEnv) {
  if (!isAnalyticsEnabled(buildEnv) || document.getElementById('plausible-script')) {
    return;
  }

  if (typeof window.plausible !== 'function') {
    window.plausible = function plausible() {
      window.plausible.q = window.plausible.q || [];
      window.plausible.q.push(arguments);
    };
  }

  window.plausible.init = window.plausible.init || function init(options) {
    window.plausible.o = options || {};
  };

  window.plausible.init();

  const script = document.createElement('script');
  script.id = 'plausible-script';
  script.async = true;
  script.src = PLAUSIBLE_SCRIPT_URL;
  document.head.appendChild(script);
}

export function loadGoogleAnalytics(buildEnv) {
  if (
    !isAnalyticsEnabled(buildEnv) ||
    !hasAnalyticsConsent() ||
    document.getElementById('google-analytics-script')
  ) {
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
  if (!isAnalyticsEnabled(buildEnv) || !hasAnalyticsConsent() || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('config', GOOGLE_ANALYTICS_ID, {
    page_path: path,
  });
}

function installAnalyticsConsentSettingsHandler() {
  if (document.documentElement.dataset.analyticsConsentSettingsHandler === 'ready') {
    return;
  }

  document.documentElement.dataset.analyticsConsentSettingsHandler = 'ready';
  document.addEventListener('click', (event) => {
    const settingsButton = event.target?.closest?.('[data-analytics-consent-settings]');

    if (settingsButton) {
      showAnalyticsConsentPreferences(true);
    }
  });
}
