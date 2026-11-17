import { useEffect, useRef } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { analytics } from '../analytics';

/**
 * Route pattern -> FullStory pageName.
 * Keep page names LOW-CARDINALITY: FullStory allows ~7,500 unique page names per
 * org, so never include IDs, search terms or other variable data.
 */
const PAGE_NAMES: Array<[pattern: string, name: string]> = [
  ['/', 'Home'],
  ['/products', 'Product List'],
  ['/products/:sku', 'Product Detail'],
  ['/checkout', 'Checkout'],
  ['/login', 'Login'],
  ['/account', 'Account'],
  ['/signals', 'Frustration Signals Lab'],
];

export function pageNameFor(pathname: string): string {
  return PAGE_NAMES.find(([pattern]) => matchPath(pattern, pathname))?.[1] ?? 'Not Found';
}

export function usePageTracking(): void {
  const { pathname } = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Guards against React StrictMode's double effect run in development.
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    analytics.pageView(pathname, pageNameFor(pathname));
  }, [pathname]);
}
