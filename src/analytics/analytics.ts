import type { AppConfig, ConsentState } from '../config';
import { getStoredConsent, initConsent, updateConsent } from './consent';
import {
  anonymizeFullStory,
  fullStorySessionUrl,
  fullStoryStatus,
  identifyFullStory,
  prepareFullStory,
  setFullStoryConsent,
  setFullStoryPage,
  trackFullStoryEvent,
} from './fullstory';

/**
 * The ONLY analytics API the React app should use.
 *
 * In this direct version there is no GTM: the facade calls FullStory through
 * ./fullstory.ts, which loads it with the `@fullstory/browser` package
 * ("L2 + T2" in the original PoC's docs/05-integration-options.md).
 * Components never call FullStory themselves, so swapping the loader later
 * (e.g. to GTM) only touches this folder.
 */

export interface AnalyticsUser {
  /** Stable, non-PII internal ID. Never an email address. */
  id: string;
  displayName?: string;
  plan?: string;
}

export type EventProperties = Record<string, string | number | boolean | string[] | number[]>;

export const analytics = {
  /** Call once, before React renders. */
  init(cfg: AppConfig): ConsentState {
    const consent = initConsent(cfg.consentDefault);
    prepareFullStory(cfg);
    if (consent === 'granted') setFullStoryConsent(true);
    return consent;
  },

  /** SPA route change. `pageName` must be low-cardinality (no IDs). */
  pageView(_path: string, pageName: string): void {
    setFullStoryPage(pageName);
  },

  identify(user: AnalyticsUser): void {
    const { id, ...properties } = user;
    identifyFullStory({ id, properties });
  },

  /** Logout: stop associating further activity with the user. */
  reset(): void {
    anonymizeFullStory();
  },

  /** Business event, e.g. track('Product Added', { sku: 'A1', price: 9.99 }). */
  track(eventName: string, eventProperties: EventProperties = {}): void {
    trackFullStoryEvent(eventName, eventProperties);
  },

  /** The user's saved choice, or null if they haven't chosen yet (banner shows). */
  getStoredConsent(): ConsentState | null {
    return getStoredConsent();
  },

  setConsent(state: ConsentState): void {
    updateConsent(state);
    setFullStoryConsent(state === 'granted');
  },

  getFullStorySessionUrl(): string | null {
    return fullStorySessionUrl();
  },

  /** Read-only state for the debug panel. */
  debugStatus(): ReturnType<typeof fullStoryStatus> {
    return fullStoryStatus();
  },
};
