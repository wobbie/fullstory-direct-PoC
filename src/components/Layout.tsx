import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { ConsentBanner } from './ConsentBanner';
import { DebugPanel } from './DebugPanel';
import { usePageTracking } from './usePageTracking';

export function Layout() {
  usePageTracking();
  const { user, cart } = useAppState();
  const [consentOpen, setConsentOpen] = useState(false);

  return (
    <div className="app">
      <header>
        <Link to="/" className="brand">Leaf &amp; Bean</Link>
        <nav>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/checkout">Checkout ({cart.length})</NavLink>
          <NavLink to="/signals">Signals lab</NavLink>
          {user ? <NavLink to="/account">{user.displayName}</NavLink> : <NavLink to="/login">Log in</NavLink>}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <span>FullStory direct (no GTM) proof of concept</span>
        <button className="link" onClick={() => setConsentOpen(true)}>Privacy settings</button>
      </footer>
      <ConsentBanner forceOpen={consentOpen} onClose={() => setConsentOpen(false)} />
      <DebugPanel />
    </div>
  );
}
