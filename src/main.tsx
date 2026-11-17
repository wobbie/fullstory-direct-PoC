import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { analytics } from './analytics';
import { App } from './App';
import { config } from './config';
import './styles.css';

// Runs before React renders: reads stored consent and, only if the user has
// already opted in, loads FullStory straight away.
analytics.init(config);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
