import { useState } from 'react';
import { analytics } from '../analytics';

/**
 * Deliberately broken UI so you can see FullStory's frustration signals
 * (rage clicks, dead clicks, error clicks) in a replay.
 */
export function Signals() {
  const [slowResult, setSlowResult] = useState('');

  return (
    <section>
      <h1>Frustration signals lab</h1>
      <p className="muted">Each button behaves badly in a different way. Afterwards, find this session in FullStory and look at the signals it flagged.</p>

      <div className="lab">
        <article className="card">
          <h3>Dead click</h3>
          <p>Looks like a button but does nothing.</p>
          <span className="fake-button" data-testid="dead-click">Apply discount</span>
        </article>

        <article className="card">
          <h3>Error click</h3>
          <p>Throws a JavaScript error when clicked.</p>
          <button
            onClick={() => {
              setTimeout(() => {
                throw new Error('PoC: simulated error from the Signals lab');
              });
            }}
          >
            Save preferences
          </button>
        </article>

        <article className="card">
          <h3>Rage click</h3>
          <p>Takes 4 seconds to respond. Click it repeatedly.</p>
          <button
            onClick={() => {
              setSlowResult('Working…');
              window.setTimeout(() => setSlowResult('Done (finally).'), 4000);
            }}
          >
            Refresh balance
          </button>
          <p>{slowResult}</p>
        </article>

        <article className="card">
          <h3>Custom event</h3>
          <p>Sends a <code>Feedback Submitted</code> event with properties.</p>
          <button onClick={() => analytics.track('Feedback Submitted', { rating: 2, area: 'checkout' })}>
            Send poor rating
          </button>
        </article>
      </div>
    </section>
  );
}
