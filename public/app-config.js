// @ts-check
// Runtime config override. Stays plain JavaScript: the browser loads it as-is and a
// deployment pipeline can replace it per environment WITHOUT rebuilding the app.
// It is still type-checked by `npm run typecheck` against RuntimeConfig (src/globals.d.ts).
//
// Example:
// window.__APP_CONFIG__ = {
//   appEnv: 'uat',
//   fsOrgId: 'o-XXXXXX-na1',
//   fsCapture: true,
//   consentDefault: 'denied',
//   debug: true,
// };
window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
