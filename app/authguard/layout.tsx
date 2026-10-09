// Applies the AuthGuard theme to the login page and every console page.
export default function AuthGuardLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-authguard min-h-dvh">{children}</div>
}
