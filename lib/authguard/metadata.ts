import type { Metadata, Viewport } from 'next'

// AuthGuard's own description, icon and theme colour, so "/" and /authguard/*
// never inherit Werkstatt's defaults from the root layout.
export const AUTHGUARD_DESCRIPTION = 'AuthGuard flags account-security issues in your app and explains them in plain language.'

export const authGuardMetadata: Metadata = {
  description: AUTHGUARD_DESCRIPTION,
  icons: { icon: [{ url: '/authguard/icon.svg', type: 'image/svg+xml' }] },
}

export const authGuardViewport: Viewport = { themeColor: '#2563EB' }
