/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_STRIPE_PRICE_ID_PRO: string
  readonly VITE_STRIPE_PRICE_ID_ENTERPRISE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
