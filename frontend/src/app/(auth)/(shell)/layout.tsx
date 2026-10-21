import { AuthShell } from '@/features/auth/components/auth-shell';

/** Sign-in, sign-up and account-recovery screens share one frame. */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
