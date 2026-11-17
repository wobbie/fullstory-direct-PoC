import { describe, expect, it, vi } from 'vitest';
import { resolveConfig } from './config';

describe('resolveConfig', () => {
  it('uses build-time env values', () => {
    const cfg = resolveConfig(
      undefined,
      { VITE_APP_ENV: 'uat', VITE_FS_ORG_ID: 'o-ABC123-na1', VITE_FS_CAPTURE: 'true', VITE_DEBUG: 'true' },
      '1.2.3',
    );
    expect(cfg).toMatchObject({ appEnv: 'uat', fsOrgId: 'o-ABC123-na1', fsCapture: true, debug: true, appVersion: '1.2.3' });
  });

  it('runtime config overrides build-time values', () => {
    const cfg = resolveConfig({ appEnv: 'preprod', fsCapture: false, fsOrgId: 'o-PROD1-na1' }, { VITE_APP_ENV: 'test', VITE_FS_CAPTURE: 'true', VITE_FS_ORG_ID: 'o-TEST1-na1' });
    expect(cfg).toMatchObject({ appEnv: 'preprod', fsCapture: false, fsOrgId: 'o-PROD1-na1' });
  });

  it('defaults: local env, denied consent, FullStory off', () => {
    expect(resolveConfig(undefined, {})).toMatchObject({
      appEnv: 'local',
      consentDefault: 'denied',
      fsOrgId: '',
      fsCapture: false,
      fsDevMode: false,
      debug: false,
    });
  });

  it('accepts org IDs with and without a region suffix, rejects others', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveConfig(undefined, { VITE_FS_ORG_ID: 'o-ABC123-eu1' }).fsOrgId).toBe('o-ABC123-eu1');
    expect(resolveConfig(undefined, { VITE_FS_ORG_ID: 'ABC12' }).fsOrgId).toBe('ABC12');
    expect(resolveConfig(undefined, { VITE_FS_ORG_ID: 'GTM-ABC1234' }).fsOrgId).toBe('');
    warn.mockRestore();
  });

  it('warns if devMode is on in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resolveConfig(undefined, { VITE_APP_ENV: 'uat', VITE_FS_DEV_MODE: 'true' });
    expect(warn).not.toHaveBeenCalled();
    resolveConfig(undefined, { VITE_APP_ENV: 'production', VITE_FS_DEV_MODE: 'true' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('devMode'));
    warn.mockRestore();
  });
});
