/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETEASE_PROXY_URL?: string;
  readonly VITE_ITUNES_COUNTRY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
