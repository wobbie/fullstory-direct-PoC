import { FullStory, init as initFullStorySdk, isInitialized } from '@fullstory/browser';
import type { AppConfig } from '../config';

/**
 * App-side FullStory client for the DIRECT integration (no GTM).
 *
 * FullStory is loaded by FullStory's official npm package `@fullstory/browser`,
 * which bundles the FullStory snippet into the app ("L2 + T2" in the original
 * PoC's docs/05-integration-options.md).
 *
 *  - Nothing FullStory-related runs until the user opts in AND this
 *    environment allows capture: `init()` is only called then. Before that the
 *    browser doesn't even download fs.js, and no FullStory cookies are set.
 *  - Withdrawal calls FS('shutdown'); a later opt-in calls FS('restart').
 *  - Nothing (identity, events, page names) is sent while not capturing. The
 *    latest identity and page name are replayed when capture starts.
 *  - The package queues calls made before fs.js has finished loading, so no
 *    polling is needed here.
 */

export type CaptureState = 'disabled' | 'waiting-for-consent' | 'capturing' | 'shut-down';

export interface FsUser {
  id: string;
  properties: Record<string, unknown>;
}

const LOG_SIZE = 15;

const state = {
  capture: 'disabled' as CaptureState,
  orgId: '',
  devMode: false,
  user: null as FsUser | null,
  page: null as Record<string, unknown> | null,
  appEnv: '',
  appVersion: '',
  debug: false,
  sessionUrl: null as string | null,
  /** Recent calls, for the debug panel. */
  log: [] as string[],
};

type FsMethod = Parameters<typeof FullStory>[0];

function send(method: FsMethod, args?: unknown): void {
  const entry = args === undefined ? method : `${method} ${JSON.stringify(args)}`;
  state.log = [entry, ...state.log].slice(0, LOG_SIZE);
  if (state.debug) console.debug('[fullstory]', method, args ?? '');
  try {
    // The package types each method's args; this wrapper is generic on purpose.
    (FullStory as (m: string, a?: unknown) => unknown)(method, args);
  } catch (err) {
    console.warn(`[fullstory] ${method} failed`, err);
  }
}

/** Call once at startup. Loads nothing. */
export function prepareFullStory(cfg: AppConfig): void {
  state.orgId = cfg.fsOrgId;
  state.devMode = cfg.fsDevMode;
  state.capture = cfg.fsCapture && cfg.fsOrgId ? 'waiting-for-consent' : 'disabled';
  state.appEnv = cfg.appEnv;
  state.appVersion = cfg.appVersion;
  state.debug = cfg.debug;
}

function start(): void {
  if (!isInitialized()) {
    state.log = ['init (load fs.js)', ...state.log].slice(0, LOG_SIZE);
    initFullStorySdk({ orgId: state.orgId, devMode: state.devMode, debug: false }, ({ sessionUrl }) => {
      state.sessionUrl = sessionUrl;
      if (state.debug) console.debug('[fullstory] session', sessionUrl);
    });
  } else {
    send('restart');
  }
}

export function setFullStoryConsent(granted: boolean): void {
  if (state.capture === 'disabled') return;

  if (granted && state.capture !== 'capturing') {
    start();
    state.capture = 'capturing';
    // Catch up on state that happened before capture began.
    if (state.user) send('setIdentity', { uid: state.user.id, properties: state.user.properties });
    if (state.page) send('setProperties', { type: 'page', properties: state.page });
  } else if (!granted && state.capture === 'capturing') {
    send('shutdown');
    state.capture = 'shut-down';
  }
}

export function identifyFullStory(user: FsUser): void {
  state.user = user;
  if (state.capture === 'capturing') send('setIdentity', { uid: user.id, properties: user.properties });
}

export function anonymizeFullStory(): void {
  state.user = null;
  if (state.capture === 'capturing') send('setIdentity', { anonymous: true });
}

export function setFullStoryPage(pageName: string): void {
  state.page = { pageName, appEnv: state.appEnv, appVersion: state.appVersion };
  if (state.capture === 'capturing') send('setProperties', { type: 'page', properties: state.page });
}

export function trackFullStoryEvent(name: string, properties: Record<string, unknown>): void {
  // No consent / capture off: drop the event (it must not be sent later either).
  if (state.capture === 'capturing') send('trackEvent', { name, properties });
}

export function fullStoryStatus(): {
  capture: CaptureState;
  scriptLoaded: boolean;
  devMode: boolean;
  log: readonly string[];
} {
  return { capture: state.capture, scriptLoaded: isInitialized(), devMode: state.devMode, log: state.log };
}

export function fullStorySessionUrl(): string | null {
  if (state.capture !== 'capturing') return null;
  if (state.sessionUrl) return state.sessionUrl;
  try {
    const url = (FullStory as (m: string, a?: unknown) => unknown)('getSession', { format: 'url' });
    return typeof url === 'string' ? url : null;
  } catch {
    return null;
  }
}

/** Test helper. */
export function resetFullStoryForTests(): void {
  Object.assign(state, {
    capture: 'disabled',
    orgId: '',
    devMode: false,
    user: null,
    page: null,
    appEnv: '',
    appVersion: '',
    debug: false,
    sessionUrl: null,
    log: [],
  });
}
