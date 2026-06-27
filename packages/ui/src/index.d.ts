declare module 'ui' {
  export const GOOGLE_ANALYTICS_ID: string;
  export function loadUIComponents(): void;
  export function isAnalyticsEnabled(buildEnv: string | undefined): boolean;
  export function hasAnalyticsConsent(): boolean;
  export function getAnalyticsConsent(): string | null;
  export function setAnalyticsConsent(isGranted: boolean): void;
  export function onAnalyticsConsentChange(
    callback: (isGranted: boolean) => void
  ): () => void;
  export function showAnalyticsConsentBanner(): void;
  export function showAnalyticsConsentPreferences(force?: boolean): void;
  export function loadAnalyticsWithConsent(
    buildEnv: string | undefined
  ): void | (() => void);
  export function loadGoogleAnalytics(buildEnv: string | undefined): void;
  export function trackGoogleAnalyticsPageView(
    path: string,
    buildEnv: string | undefined
  ): void;
}
