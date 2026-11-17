import { useAppState } from '../state/AppState';

/**
 * Minimal stand-in for a real Consent Management Platform (CMP).
 * Renders until the user makes a choice, or when reopened from the footer.
 */
export function ConsentBanner({ forceOpen, onClose }: { forceOpen: boolean; onClose: () => void }) {
  const { consent, setConsent } = useAppState();
  if (consent && !forceOpen) return null;

  const choose = (state: 'granted' | 'denied') => {
    setConsent(state);
    onClose();
  };

  return (
    <div className="consent" role="dialog" aria-live="polite" aria-label="Cookie and session recording consent">
      <div>
        <strong>We'd like to record how you use this site.</strong>
        <p>
          With your permission we use FullStory to capture session replays and analytics that help us improve the
          site. Sensitive fields are never recorded. {consent && <em>Current choice: {consent}.</em>}
        </p>
      </div>
      <div className="consent-actions">
        <button className="secondary" onClick={() => choose('denied')}>
          Reject
        </button>
        <button onClick={() => choose('granted')}>Accept analytics</button>
      </div>
    </div>
  );
}
