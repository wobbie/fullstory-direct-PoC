/// <reference types="vite/client" />

/** Build-time variables from .env.<mode> files. All optional: src/config.ts applies defaults. */
interface ImportMetaEnv {
  readonly VITE_APP_ENV?: string;
  readonly VITE_FS_ORG_ID?: string;
  readonly VITE_FS_CAPTURE?: string;
  readonly VITE_FS_DEV_MODE?: string;
  readonly VITE_CONSENT_DEFAULT?: string;
  readonly VITE_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
