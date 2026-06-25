declare module 'ui' {
  export const GOOGLE_ANALYTICS_ID: string;
  export function loadUIComponents(): void;
  export function isAnalyticsEnabled(buildEnv: string | undefined): boolean;
  export function loadGoogleAnalytics(buildEnv: string | undefined): void;
  export function trackGoogleAnalyticsPageView(
    path: string,
    buildEnv: string | undefined
  ): void;
}
