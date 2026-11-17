import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { analytics, type AnalyticsUser } from '../analytics';
import type { ConsentState } from '../config';

export interface Product {
  sku: string;
  name: string;
  price: number;
  category: string;
}

export const PRODUCTS: Product[] = [
  { sku: 'TEA-001', name: 'Earl Grey Tea', price: 6.5, category: 'Tea' },
  { sku: 'TEA-002', name: 'Sencha Green Tea', price: 8.0, category: 'Tea' },
  { sku: 'COF-001', name: 'Colombian Coffee Beans', price: 11.25, category: 'Coffee' },
  { sku: 'MUG-001', name: 'Stoneware Mug', price: 14.0, category: 'Accessories' },
];

const USER_KEY = 'poc.user';

interface AppState {
  user: AnalyticsUser | null;
  login: (username: string, plan: string) => void;
  logout: () => void;
  cart: Product[];
  addToCart: (p: Product) => void;
  clearCart: () => void;
  consent: ConsentState | null;
  setConsent: (s: ConsentState) => void;
}

const Ctx = createContext<AppState | null>(null);

function loadUser(): AnalyticsUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsUser) : null;
  } catch {
    return null;
  }
}

/** Fake, deterministic, non-PII user id derived from the username. */
function userIdFor(username: string): string {
  let hash = 0;
  for (const ch of username.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `usr_${hash.toString(36)}`;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AnalyticsUser | null>(loadUser);
  const [cart, setCart] = useState<Product[]>([]);
  const [consent, setConsentState] = useState<ConsentState | null>(analytics.getStoredConsent);

  // Returning visitor who is already "logged in": re-identify on each page load.
  const identifiedOnLoad = useRef(false);
  useEffect(() => {
    if (user && !identifiedOnLoad.current) {
      identifiedOnLoad.current = true;
      analytics.identify(user);
    }
  }, [user]);

  const login = useCallback((username: string, plan: string) => {
    const u: AnalyticsUser = { id: userIdFor(username), displayName: username, plan };
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
    identifiedOnLoad.current = true;
    setUser(u);
    analytics.identify(u);
    analytics.track('Logged In', { plan });
  }, []);

  const logout = useCallback(() => {
    analytics.track('Logged Out');
    analytics.reset();
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  const addToCart = useCallback((p: Product) => {
    setCart((c) => [...c, p]);
    analytics.track('Product Added', { sku: p.sku, name: p.name, price: p.price, category: p.category });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const setConsent = useCallback((s: ConsentState) => {
    setConsentState(s);
    analytics.setConsent(s);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, cart, addToCart, clearCart, consent, setConsent }),
    [user, login, logout, cart, addToCart, clearCart, consent, setConsent],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
