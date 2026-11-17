import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveConfig } from '../config';

const sdk = vi.hoisted(() => {
  let initialized = false;
  return {
    init: vi.fn((..._args: unknown[]) => {
      initialized = true;
    }),
    isInitialized: () => initialized,
    FullStory: vi.fn((_method: string, _args?: unknown): unknown => undefined),
    reset() {
      initialized = false;
    },
  };
});

vi.mock('@fullstory/browser', () => ({
  init: sdk.init,
  isInitialized: sdk.isInitialized,
  FullStory: sdk.FullStory,
}));

import { fullStoryStatus, resetFullStoryForTests } from './fullstory';
import { analytics } from './analytics';

const store = new Map<string, string>();

const cfg = (overrides: Record<string, string> = {}) =>
  resolveConfig(
    undefined,
    { VITE_APP_ENV: 'uat', VITE_FS_ORG_ID: 'o-TEST1-na1', VITE_FS_CAPTURE: 'true', ...overrides },
    '1.0.0',
  );

const calls = () => sdk.FullStory.mock.calls.map(([method, args]) => [method, args]);

beforeEach(() => {
  store.clear();
  resetFullStoryForTests();
  sdk.reset();
  sdk.init.mockClear();
  sdk.FullStory.mockClear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
});

describe('direct FullStory client', () => {
  it('loads nothing and sends nothing before consent', () => {
    analytics.init(cfg());
    analytics.pageView('/', 'Home');
    analytics.identify({ id: 'usr_1', plan: 'pro' });
    analytics.track('Product Added', { sku: 'A' });
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.FullStory).not.toHaveBeenCalled();
    expect(fullStoryStatus().scriptLoaded).toBe(false);
  });

  it('on consent: init with the org ID, then replays identity + page but not earlier events', () => {
    analytics.init(cfg());
    analytics.pageView('/', 'Home');
    analytics.identify({ id: 'usr_1', plan: 'pro' });
    analytics.track('Dropped Event');
    analytics.setConsent('granted');
    expect(sdk.init).toHaveBeenCalledTimes(1);
    expect(sdk.init.mock.calls[0][0]).toMatchObject({ orgId: 'o-TEST1-na1', devMode: false });
    expect(calls()).toEqual([
      ['setIdentity', { uid: 'usr_1', properties: { plan: 'pro' } }],
      ['setProperties', { type: 'page', properties: { pageName: 'Home', appEnv: 'uat', appVersion: '1.0.0' } }],
    ]);
  });

  it('loads immediately when consent was stored on a previous visit', () => {
    store.set('poc.consent.analytics', 'granted');
    analytics.init(cfg());
    expect(sdk.init).toHaveBeenCalledTimes(1);
  });

  it('shuts down on withdrawal and restarts on re-grant without a second init', () => {
    analytics.init(cfg());
    analytics.setConsent('granted');
    analytics.track('Product Added', { sku: 'A' });
    analytics.setConsent('denied');
    analytics.track('Ignored');
    analytics.setConsent('granted');
    expect(sdk.init).toHaveBeenCalledTimes(1);
    expect(calls().map(([m]) => m)).toEqual(['trackEvent', 'shutdown', 'restart']);
  });

  it('never loads when capture is disabled for the environment', () => {
    analytics.init(cfg({ VITE_APP_ENV: 'test', VITE_FS_CAPTURE: 'false' }));
    analytics.setConsent('granted');
    analytics.track('Product Added');
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.FullStory).not.toHaveBeenCalled();
  });

  it('never loads when no org ID is configured', () => {
    analytics.init(cfg({ VITE_FS_ORG_ID: '' }));
    analytics.setConsent('granted');
    expect(sdk.init).not.toHaveBeenCalled();
  });

  it('passes devMode through', () => {
    analytics.init(cfg({ VITE_FS_DEV_MODE: 'true' }));
    analytics.setConsent('granted');
    expect(sdk.init.mock.calls[0][0]).toMatchObject({ devMode: true });
  });

  it('logout anonymises', () => {
    analytics.init(cfg());
    analytics.setConsent('granted');
    analytics.reset();
    expect(calls().at(-1)).toEqual(['setIdentity', { anonymous: true }]);
  });
});
