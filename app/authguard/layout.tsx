import type { Metadata } from 'next'
import { authGuardMetadata, authGuardViewport } from '@/lib/authguard/metadata'

export const metadata: Metadata = { ...authGuardMetadata, title: { default: 'AuthGuard', template: '%s · AuthGuard' } }
export const viewport = authGuardViewport

// Applies the AuthGuard theme to the login page and every console page.
export default function AuthGuardLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-authguard min-h-dvh">{children}</div>
}
