import { useEffect, useState } from 'react';
import { analytics } from '../analytics';
import { config } from '../config';
import { useAppState } from '../state/AppState';

/** Non-production helper showing what the analytics stack is doing. */
export function DebugPanel() {
  const { consent, user } = useAppState();
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  if (!config.debug) return null;

  const fs = analytics.debugStatus();
  const sessionUrl = fs.scriptLoaded ? analytics.getFullStorySessionUrl() : null;

  return (
    <aside className={`debug ${open ? 'open' : ''}`}>
      <button className="debug-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? 'Close debug' : 'Analytics debug'}
      </button>
      {open && (
        <div className="debug-body">
          <table>
            <tbody>
              <tr><th>App env</th><td>{config.appEnv} (v{config.appVersion})</td></tr>
              <tr><th>FS Org ID</th><td>{config.fsOrgId || <em>not configured</em>}</td></tr>
              <tr><th>Consent</th><td>{consent ?? `not chosen (default ${config.consentDefault})`}</td></tr>
              <tr><th>FS script</th><td>{fs.scriptLoaded ? 'loaded' : 'not loaded'}{fs.devMode ? ' (devMode: not recording)' : ''}</td></tr>
              <tr><th>FS capture</th><td>{config.fsCapture && config.fsOrgId ? fs.capture : 'disabled for this env'}</td></tr>
              <tr><th>User</th><td>{user ? `${user.id} (${user.displayName})` : 'anonymous'}</td></tr>
              <tr>
                <th>Replay</th>
                <td>{sessionUrl ? <a href={sessionUrl} target="_blank" rel="noreferrer">Open session in FullStory</a> : '—'}</td>
              </tr>
            </tbody>
          </table>
          <h4>FullStory calls (latest first)</h4>
          <ol className="dl">
            {fs.log.map((e, i) => (
              <li key={i}><code>{e}</code></li>
            ))}
          </ol>
        </div>
      )}
    </aside>
  );
}
