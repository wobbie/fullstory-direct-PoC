export {};

declare global {
  /** Injected by vite.config.ts from package.json. */
  const __APP_VERSION__: string;

  /**
   * Shape of window.__APP_CONFIG__, set by public/app-config.js at deploy time.
   * Values override the build-time VITE_* variables (see src/config.ts).
   * A `type` (not an interface) so it is assignable to resolveConfig's input.
   */
  type RuntimeConfig = {
    appEnv?: 'local' | 'test' | 'uat' | 'preprod' | 'production';
    /** FullStory Org ID, e.g. o-XXXXXX-na1. */
    fsOrgId?: string;
    fsCapture?: boolean;
    fsDevMode?: boolean;
    consentDefault?: 'granted' | 'denied';
    debug?: boolean;
  };

  interface Window {
    /** Optional runtime config, set by /app-config.js. */
    __APP_CONFIG__?: RuntimeConfig;
  }
}
