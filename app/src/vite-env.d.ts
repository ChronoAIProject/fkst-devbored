/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_MODE?: 'fixture' | 'live'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
