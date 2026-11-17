/**
 * Application configuration.
 *
 * Resolution order (first non-empty wins):
 *   1. Runtime:    window.__APP_CONFIG__ (from /app-config.js, can be swapped per deployment)
 *   2. Build time: import.meta.env.VITE_* (from .env.<mode> files)
 *   3. Defaults
 */

export const APP_ENVS = ['local', 'test', 'uat', 'preprod', 'production'] as const;
export type AppEnv = (typeof APP_ENVS)[number];
export type ConsentState = 'granted' | 'denied';

export interface AppConfig {
  appEnv: AppEnv;
  appVersion: string;
  /**
   * FullStory Org ID, e.g. o-ABC123-na1. The region suffix (na1 / eu1) selects
   * the FullStory data centre automatically. Empty = FullStory off.
   * Can differ per environment (e.g. a non-prod org).
   */
  fsOrgId: string;
  /** Whether this environment may load and start FullStory (after consent). */
  fsCapture: boolean;
  /** FullStory devMode: the SDK loads but records nothing and warns on each call. */
  fsDevMode: boolean;
  /** Consent state applied before the user has made a choice. */
  consentDefault: ConsentState;
  /** Shows the debug panel and logs analytics calls to the console. */
  debug: boolean;
}

type RawValues = Record<string, string | boolean | undefined>;

// e.g. o-1A2B3C-na1 / o-1A2B3C-eu1. Older orgs may have no "o-" prefix or region suffix.
const FS_ORG_ID_PATTERN = /^(o-)?[A-Za-z0-9]+(-[a-z]+[0-9]+)?$/;

export function resolveConfig(runtime: RawValues | undefined, buildEnv: RawValues, appVersion = '0.0.0'): AppConfig {
  const pick = (runtimeKey: string, envKey: string): string => {
    const fromRuntime = runtime?.[runtimeKey];
    if (fromRuntime !== undefined && fromRuntime !== '') return String(fromRuntime).trim();
    const fromBuild = buildEnv[envKey];
    return fromBuild === undefined ? '' : String(fromBuild).trim();
  };

  const rawEnv = pick('appEnv', 'VITE_APP_ENV');
  const appEnv: AppEnv = (APP_ENVS as readonly string[]).includes(rawEnv) ? (rawEnv as AppEnv) : 'local';

  let fsOrgId = pick('fsOrgId', 'VITE_FS_ORG_ID');
  if (fsOrgId && !FS_ORG_ID_PATTERN.test(fsOrgId)) {
    console.warn(`[config] Ignoring invalid FullStory Org ID "${fsOrgId}". FullStory will not load.`);
    fsOrgId = '';
  }

  const fsDevMode = pick('fsDevMode', 'VITE_FS_DEV_MODE') === 'true';
  if (appEnv === 'production' && fsDevMode) {
    console.warn('[config] FullStory devMode is on in production: nothing will be recorded.');
  }

  return {
    appEnv,
    appVersion,
    fsOrgId,
    fsCapture: pick('fsCapture', 'VITE_FS_CAPTURE') === 'true',
    fsDevMode,
    consentDefault: pick('consentDefault', 'VITE_CONSENT_DEFAULT') === 'granted' ? 'granted' : 'denied',
    debug: pick('debug', 'VITE_DEBUG') === 'true',
  };
}

export const config: AppConfig = resolveConfig(
  typeof window !== 'undefined' ? window.__APP_CONFIG__ : undefined,
  import.meta.env,
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
);
