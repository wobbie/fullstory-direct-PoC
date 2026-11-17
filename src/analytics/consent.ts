import type { ConsentState } from '../config';

/**
 * Consent storage for the direct (no GTM) integration.
 *
 * There is no GTM, so no Google Consent Mode: the app itself decides whether
 * FullStory may load (see ./fullstory.ts). In a real site this module would be
 * replaced by (or bridged to) your Consent Management Platform's JS API
 * (OneTrust, Cookiebot, etc.): read its current choice at startup and subscribe
 * to its change event. See the original PoC's docs/03-key-decisions.md.
 */

const STORAGE_KEY = 'poc.consent.analytics';

export function getStoredConsent(): ConsentState | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

/** Returns the effective consent state at startup. */
export function initConsent(defaultState: ConsentState): ConsentState {
  return getStoredConsent() ?? defaultState;
}

export function updateConsent(state: ConsentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, state);
  } catch {
    // Storage blocked (private mode etc.) - consent applies to this page view only.
  }
}
